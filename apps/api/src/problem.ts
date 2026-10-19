import type { Response } from 'express'

const PROBLEMS = {
  'invalid-json-body': { status: 400, title: 'Invalid JSON body' },
  'invalid-quote': { status: 400, title: 'Invalid quote' },
  'invalid-quote-id': { status: 400, title: 'Invalid quote id' },
  'quote-not-found': { status: 404, title: 'Quote not found' },
  'quote-already-moderated': { status: 409, title: 'Quote already moderated' },
  'payload-too-large': { status: 413, title: 'Payload too large' },
  'not-found': { status: 404, title: 'Route not found' },
  internal: { status: 500, title: 'Internal server error' },
} as const

export type ProblemKind = keyof typeof PROBLEMS

// RFC 9457 Problem Details (standard code/error-shape).
export function problem(res: Response, kind: ProblemKind, detail: string) {
  const { status, title } = PROBLEMS[kind]
  res
    .status(status)
    .type('application/problem+json')
    .json({ type: `/errors/${kind}`, title, status, detail, instance: res.req.originalUrl })
}
