import { Router, type Response } from 'express'
import { ObjectId, type UpdateFilter } from 'mongodb'
import { getDb } from '../db.js'
import { problem } from '../problem.js'
import type { Quote, QuoteStatus } from '../types.js'
import { validateNewQuote, validateReport } from '../validation.js'

export const quotesRouter = Router()

quotesRouter.get('/', async (_req, res) => {
  const quotes = await getDb()
    .collection<Quote>('quotes')
    .find({ status: 'approved' })
    .toArray()

  res.json(
    quotes.map((quote) => ({
      id: quote._id.toString(),
      text: quote.text,
      author: quote.author,
      context: quote.context,
    })),
  )
})

quotesRouter.post('/', async (req, res) => {
  const result = validateNewQuote(req.body)
  if (!result.ok) {
    problem(res, 'invalid-quote', result.error)
    return
  }

  const { insertedId } = await getDb()
    .collection<Omit<Quote, '_id'>>('quotes')
    .insertOne({
      ...result.value,
      status: 'pending',
      createdAt: new Date(),
    })

  res.status(201).json({ id: insertedId.toString() })
})

quotesRouter.get('/pending', async (_req, res) => {
  const quotes = await getDb()
    .collection<Quote>('quotes')
    .find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .toArray()

  res.json(
    quotes.map((quote) => ({
      id: quote._id.toString(),
      text: quote.text,
      author: quote.author,
      context: quote.context,
      createdAt: quote.createdAt,
      ...(quote.report && { report: quote.report }),
    })),
  )
})

const ID_PATTERN = /^[0-9a-f]{24}$/i

// A moderation action is only valid on a pending quote.
// Approving also clears a report: the moderator has reviewed it.
async function moderate(id: string, status: QuoteStatus, res: Response) {
  if (!ID_PATTERN.test(id)) {
    problem(res, 'invalid-quote-id', 'Quote id must be a 24-character hex string')
    return
  }
  const _id = new ObjectId(id)
  const quotes = getDb().collection<Quote>('quotes')

  const update: UpdateFilter<Quote> =
    status === 'approved' ? { $set: { status }, $unset: { report: '' } } : { $set: { status } }
  const { matchedCount } = await quotes.updateOne({ _id, status: 'pending' }, update)
  if (matchedCount === 1) {
    res.json({ id, status })
    return
  }

  const existing = await quotes.findOne({ _id })
  if (!existing) {
    problem(res, 'quote-not-found', `No quote with id ${id}`)
    return
  }
  problem(res, 'quote-already-moderated', `Quote is already ${existing.status}`)
}

quotesRouter.patch('/:id/approve', (req, res) => moderate(req.params.id, 'approved', res))

quotesRouter.patch('/:id/reject', (req, res) => moderate(req.params.id, 'rejected', res))

// A report sends an approved quote back to moderation. The status check and
// the write are one conditional update, so concurrent calls can't both win.
quotesRouter.post('/:id/report', async (req, res) => {
  const { id } = req.params
  if (!ID_PATTERN.test(id)) {
    problem(res, 'invalid-quote-id', 'Quote id must be a 24-character hex string')
    return
  }
  const result = validateReport(req.body)
  if (!result.ok) {
    problem(res, 'invalid-report', result.error)
    return
  }
  const _id = new ObjectId(id)
  const quotes = getDb().collection<Quote>('quotes')

  const { matchedCount } = await quotes.updateOne(
    { _id, status: 'approved' },
    { $set: { status: 'pending', report: { reason: result.value, reportedAt: new Date() } } },
  )
  if (matchedCount === 1) {
    res.json({ id, status: 'pending' })
    return
  }

  const existing = await quotes.findOne({ _id })
  if (!existing) {
    problem(res, 'quote-not-found', `No quote with id ${id}`)
    return
  }
  problem(
    res,
    'quote-not-reportable',
    `Quote is ${existing.status}, only approved quotes can be reported`,
  )
})
