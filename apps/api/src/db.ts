import { MongoClient, type Db } from 'mongodb'

const uri =
  process.env.MONGODB_URI ?? 'mongodb://root:root@localhost:27017/app?authSource=admin'

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })

export async function connectDb(): Promise<Db> {
  await client.connect()
  return client.db()
}

export async function pingDb(): Promise<boolean> {
  try {
    await client.db().command({ ping: 1 })
    return true
  } catch {
    return false
  }
}

export function closeDb(): Promise<void> {
  return client.close()
}
