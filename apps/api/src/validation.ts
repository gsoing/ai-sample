export interface NewQuote {
  text: string
  author: string
  context?: string
}

export type ValidationResult = { ok: true; value: NewQuote } | { ok: false; error: string }

const TEXT_MAX = 280
const AUTHOR_MAX = 60
const CONTEXT_MAX = 200

export function validateNewQuote(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }
  const { text, author, context } = body as Record<string, unknown>

  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, error: 'text is required' }
  }
  if (text.trim().length > TEXT_MAX) {
    return { ok: false, error: `text must be at most ${TEXT_MAX} characters` }
  }

  if (typeof author !== 'string' || author.trim() === '') {
    return { ok: false, error: 'author is required' }
  }
  if (author.trim().length > AUTHOR_MAX) {
    return { ok: false, error: `author must be at most ${AUTHOR_MAX} characters` }
  }

  const value: NewQuote = { text: text.trim(), author: author.trim() }

  if (context !== undefined && context !== null) {
    if (typeof context !== 'string') {
      return { ok: false, error: 'context must be a string' }
    }
    if (context.trim().length > CONTEXT_MAX) {
      return { ok: false, error: `context must be at most ${CONTEXT_MAX} characters` }
    }
    if (context.trim() !== '') {
      value.context = context.trim()
    }
  }

  return { ok: true, value }
}
