import { useEffect, useState } from 'react'
import { nextInCycle, type CycleState } from '../lib/cycle.ts'
import { REPORT_REASON_LABELS, type ReportReason } from '../lib/report.ts'
import { loadReportedIds, rememberReportedId } from '../lib/reported.ts'

interface Quote {
  id: string
  text: string
  author: string
  context?: string
}

export default function DisplayPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [cycle, setCycle] = useState<CycleState<Quote>>({ current: null, remaining: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [sending, setSending] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [reportError, setReportError] = useState('')
  const [reportedIds, setReportedIds] = useState<string[]>(loadReportedIds)

  useEffect(() => {
    fetch('/api/quotes')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load quotes')
        return response.json() as Promise<Quote[]>
      })
      .then((data) => {
        setQuotes(data)
        setCycle(nextInCycle(data, { current: null, remaining: [] }))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function closeReport() {
    setReporting(false)
    setReason(null)
    setReportError('')
  }

  function showNext() {
    closeReport()
    setReportMessage('')
    setReportError('')
    setCycle(nextInCycle(quotes, cycle))
  }

  // Drops the reported quote from this page session and moves on.
  function removeFromRotation(id: string) {
    const rest = quotes.filter((quote) => quote.id !== id)
    const remaining = cycle.remaining.filter((quote) => quote.id !== id)
    setQuotes(rest)
    setCycle(nextInCycle(rest, { current: cycle.current, remaining }))
  }

  async function sendReport(id: string) {
    if (!reason) return
    setSending(true)
    setReportMessage('')
    setReportError('')
    try {
      const response = await fetch(`/api/quotes/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) {
        const body = (await response.json()) as { detail?: string }
        setReportError(body.detail ?? 'Could not report the quote')
        return
      }
      closeReport()
      rememberReportedId(id)
      setReportedIds((ids) => [...ids, id])
      removeFromRotation(id)
      setReportMessage('Thank you. The quote has been sent back to moderation.')
    } catch {
      setReportError('Could not reach the server')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p role="alert">{error}</p>

  const { current } = cycle

  return (
    <>
      {current ? (
        <section className="quote-card">
          <blockquote>{current.text}</blockquote>
          <p className="quote-author">{current.author}</p>
          {current.context && <p className="quote-context">{current.context}</p>}
          <div className="quote-actions">
            <button type="button" disabled={sending} onClick={showNext}>
              Next quote
            </button>
            {!reporting && !reportedIds.includes(current.id) && (
              <button
                type="button"
                className="secondary"
                aria-label={`Report the quote by ${current.author}`}
                onClick={() => {
                  setReporting(true)
                  setReportMessage('')
                  setReportError('')
                }}
              >
                Report
              </button>
            )}
          </div>
          {reporting && (
            <fieldset className="report-picker">
              <legend>Why are you reporting this quote?</legend>
              {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value as ReportReason)}
                  />
                  {label}
                </label>
              ))}
              <div className="report-actions">
                <button
                  type="button"
                  disabled={!reason || sending}
                  onClick={() => void sendReport(current.id)}
                >
                  Confirm
                </button>
                <button type="button" className="secondary" disabled={sending} onClick={closeReport}>
                  Cancel
                </button>
              </div>
            </fieldset>
          )}
        </section>
      ) : (
        <p>No quotes yet</p>
      )}
      {reportMessage && (
        <p className="form-success" role="status">
          {reportMessage}
        </p>
      )}
      {reportError && (
        <p className="form-error" role="alert">
          {reportError}
        </p>
      )}
    </>
  )
}
