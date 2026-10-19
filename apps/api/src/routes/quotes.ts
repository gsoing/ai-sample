import { Router, type Response } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'
import { problem } from '../problem.js'
import type { Quote, QuoteStatus } from '../types.js'
import { validateNewQuote } from '../validation.js'

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
    })),
  )
})

// A moderation action is only valid on a pending quote.
async function moderate(id: string, status: QuoteStatus, res: Response) {
  if (!/^[0-9a-f]{24}$/i.test(id)) {
    problem(res, 'invalid-quote-id', 'Quote id must be a 24-character hex string')
    return
  }
  const _id = new ObjectId(id)
  const quotes = getDb().collection<Quote>('quotes')

  const { matchedCount } = await quotes.updateOne({ _id, status: 'pending' }, { $set: { status } })
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
