import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// Relative to the api package directory (where `pnpm dev` runs): apps/api/data/app.db
export const dbPath = 'data/app.db'

let db: DatabaseSync | undefined

export function connectDb(): DatabaseSync {
  mkdirSync(dirname(dbPath), { recursive: true })
  db = new DatabaseSync(dbPath)
  return db
}

export function getDb(): DatabaseSync {
  if (!db) throw new Error('Database not connected, call connectDb() first')
  return db
}

export function pingDb(): boolean {
  try {
    getDb().prepare('SELECT 1').get()
    return true
  } catch {
    return false
  }
}

export function closeDb(): void {
  db?.close()
  db = undefined
}
