import { Router } from 'express'
import { getDb } from '../db.js'
import type { Quote } from '../types.js'

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
