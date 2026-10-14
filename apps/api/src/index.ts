import express, { type ErrorRequestHandler } from 'express'
import { closeDb, connectDb, pingDb } from './db.js'
import { quotesRouter } from './routes/quotes.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const db = await pingDb()
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db })
})

app.use('/api/quotes', quotesRouter)

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err.status === 'number' ? err.status : 500
  res.status(status).json({ error: status === 400 ? 'Invalid JSON body' : 'Internal server error' })
}
app.use(errorHandler)

await connectDb()
console.log('Connected to MongoDB')

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close()
    void closeDb().finally(() => process.exit(0))
  })
}
