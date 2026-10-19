// Must match REPORT_REASONS in apps/api/src/types.ts.
export const REPORT_REASON_LABELS = {
  offensive: 'Offensive',
  inaccurate: 'Inaccurate',
  'private-info': 'Private information',
  other: 'Other',
} as const

export type ReportReason = keyof typeof REPORT_REASON_LABELS

export interface QuoteReport {
  reason: ReportReason
  reportedAt: string
}
