import express from 'express'
import { closeDb, connectDb, dbPath, pingDb } from './db.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json())

app.get('/api/health', (_req, res) => {
  const db = pingDb()
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db })
})

connectDb()
console.log(`Connected to SQLite (${dbPath})`)

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close()
    closeDb()
    process.exit(0)
  })
}
