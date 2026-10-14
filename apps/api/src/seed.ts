import { closeDb, connectDb, getDb } from './db.js'
import type { Quote } from './types.js'

type SeedQuote = Omit<Quote, '_id' | 'createdAt'>

const quotes: SeedQuote[] = [
  { text: 'Let us take this offline and put it online again.', author: 'Someone in Finance', context: 'During a budget review', status: 'approved' },
  { text: 'It works on my machine, so technically we can ship my machine.', author: 'A very tired developer', status: 'approved' },
  { text: 'I will send you a quick "5-minute" meeting invite & we will see.', author: 'A project manager', context: 'Invite lasted 90 minutes', status: 'approved' },
  { text: 'I did not break the build, the build broke itself while I was looking.', author: 'The intern', status: 'approved' },
  { text: 'Can we make the logo bigger, but also more subtle?', author: 'Marketing, 4:55 PM on a Friday', status: 'approved' },
  { text: 'This meeting could have been an email, and that email could have been silence.', author: 'The person next to the coffee machine', status: 'approved' },
  { text: 'We are not late, we are simply early for the next quarter.', author: 'Someone in Operations', context: 'At the project review', status: 'approved' },
  { text: 'Who has the "final_v3_REAL_final.docx"?', author: 'Everyone, at some point', status: 'approved' },
  { text: 'Please do not unmute yourself, we can all hear your dog already.', author: 'A patient colleague', context: 'Video call', status: 'approved' },
  { text: 'I only changed one line. Why is everything red?', author: 'A hopeful developer', status: 'pending' },
  { text: 'The printer knows when you are in a hurry.', author: 'The office manager', status: 'pending' },
  { text: 'This idea is so good that nobody understood it yet.', author: 'A visionary', status: 'rejected' },
]

const now = Date.now()

const documents = quotes.map((quote, index) => ({
  ...quote,
  createdAt: new Date(now - index * 60_000),
}))

await connectDb()
const collection = getDb().collection('quotes')
await collection.deleteMany({})
await collection.insertMany(documents)
console.log(`Seeded ${documents.length} quotes`)
await closeDb()
