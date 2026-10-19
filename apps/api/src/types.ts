import type { ObjectId } from 'mongodb'

export type QuoteStatus = 'pending' | 'approved' | 'rejected'

export const REPORT_REASONS = ['offensive', 'inaccurate', 'private-info', 'other'] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

export interface QuoteReport {
  reason: ReportReason
  reportedAt: Date
}

export interface Quote {
  _id: ObjectId
  text: string
  author: string
  context?: string
  status: QuoteStatus
  createdAt: Date
  report?: QuoteReport
}
