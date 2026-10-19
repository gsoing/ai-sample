import { useState, type FormEvent } from 'react'

export default function SubmitPage() {
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [context, setContext] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [thanks, setThanks] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setThanks(false)
    setError('')

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author, context }),
      })
      if (!response.ok) {
        const body = (await response.json()) as { detail?: string }
        setError(body.detail ?? 'Could not send the quote')
        return
      }
      setText('')
      setAuthor('')
      setContext('')
      setThanks(true)
    } catch {
      setError('Could not reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Submit a quote</h2>
      <label>
        Quote
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      </label>
      <label>
        Who said it?
        <input value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>
      <label>
        Context (optional)
        <input value={context} onChange={(e) => setContext(e.target.value)} />
      </label>
      <button type="submit" disabled={submitting}>
        Send
      </button>
      {thanks && <p className="form-success">Thank you! Your quote is waiting for moderation.</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
