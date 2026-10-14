import type { ObjectId } from 'mongodb'

export type QuoteStatus = 'pending' | 'approved' | 'rejected'

export interface Quote {
  _id: ObjectId
  text: string
  author: string
  context?: string
  status: QuoteStatus
  createdAt: Date
}
