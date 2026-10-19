import { useEffect, useState } from 'react'
import { REPORT_REASON_LABELS, type QuoteReport } from '../lib/report.ts'

interface PendingQuote {
  id: string
  text: string
  author: string
  context?: string
  report?: QuoteReport
}

type Action = 'approve' | 'reject'

export default function ModeratePage() {
  const [quotes, setQuotes] = useState<PendingQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchPending(): Promise<PendingQuote[]> {
    const response = await fetch('/api/quotes/pending')
    if (!response.ok) throw new Error('Could not load pending quotes')
    return (await response.json()) as PendingQuote[]
  }

  useEffect(() => {
    fetchPending()
      .then(setQuotes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function moderate(id: string, action: Action) {
    setError('')
    try {
      const response = await fetch(`/api/quotes/${id}/${action}`, { method: 'PATCH' })
      if (!response.ok) {
        const body = (await response.json()) as { detail?: string }
        setError(body.detail ?? `Could not ${action} the quote`)
      }
    } catch {
      setError('Could not reach the server')
    }
    // Refresh in every case so the list always matches the server.
    try {
      setQuotes(await fetchPending())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the server')
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <section>
      <h2>Moderate quotes</h2>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {quotes.length === 0 ? (
        <p>Nothing to moderate.</p>
      ) : (
        <ul className="moderation-list">
          {quotes.map((quote) => (
            <li key={quote.id}>
              {quote.report && (
                <p className="reported-badge">
                  Reported: {REPORT_REASON_LABELS[quote.report.reason] ?? 'Unknown reason'}
                </p>
              )}
              <blockquote>{quote.text}</blockquote>
              <p className="quote-author">{quote.author}</p>
              {quote.context && <p className="quote-context">{quote.context}</p>}
              <div className="moderation-actions">
                <button type="button" onClick={() => void moderate(quote.id, 'approve')}>
                  Approve
                </button>
                <button type="button" onClick={() => void moderate(quote.id, 'reject')}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
