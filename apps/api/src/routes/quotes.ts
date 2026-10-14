import { Router } from 'express'
import { getDb } from '../db.js'
import type { Quote } from '../types.js'
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
