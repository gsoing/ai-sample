import { Router, type Response } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'
import type { Quote, QuoteStatus } from '../types.js'
import { validateNewQuote } from '../validation.js'

export const quotesRouter = Router()

function toPublicQuote(quote: Quote) {
  return {
    id: quote._id.toString(),
    text: quote.text,
    author: quote.author,
    context: quote.context,
  }
}

quotesRouter.get('/', async (_req, res) => {
  const quotes = await getDb().collection<Quote>('quotes').find({}).toArray()

  res.json(quotes.map(toPublicQuote))
})

quotesRouter.post('/', async (req, res) => {
  const result = validateNewQuote(req.body)
  if (!result.ok) {
    res.status(400).json({ error: result.error })
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

// Applies a moderation decision to a quote.
async function moderate(id: string, status: QuoteStatus, res: Response) {
  if (!/^[0-9a-f]{24}$/i.test(id)) {
    res.status(400).json({ error: 'Invalid quote id' })
    return
  }
  const _id = new ObjectId(id)
  const quotes = getDb().collection<Quote>('quotes')

  const { matchedCount } = await quotes.updateOne({ _id }, { $set: { status } })
  if (matchedCount === 1) {
    res.json({ id, status })
    return
  }

  res.status(404).json({ error: 'Quote not found' })
}

quotesRouter.patch('/:id/approve', (req, res) => moderate(req.params.id, 'approved', res))

quotesRouter.patch('/:id/reject', (req, res) => moderate(req.params.id, 'rejected', res))
