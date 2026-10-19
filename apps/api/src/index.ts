import express, { type ErrorRequestHandler } from 'express'
import { closeDb, connectDb, pingDb } from './db.js'
import { problem } from './problem.js'
import { quotesRouter } from './routes/quotes.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const db = await pingDb()
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db })
})

app.use('/api/quotes', quotesRouter)

app.use('/api', (req, res) => {
  problem(res, 'not-found', `No route ${req.method} ${req.originalUrl}`)
})

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    problem(res, 'invalid-json-body', 'Request body is not valid JSON')
    return
  }
  if (err.type === 'entity.too.large') {
    problem(res, 'payload-too-large', 'Request body is too large')
    return
  }
  console.error(`${req.method} ${req.originalUrl}`, err)
  problem(res, 'internal', 'The server could not process the request')
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
