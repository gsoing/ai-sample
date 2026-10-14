import express from 'express'
import { closeDb, connectDb, pingDb } from './db.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const db = await pingDb()
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db })
})

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
