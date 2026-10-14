import { useEffect, useState } from 'react'
import { nextInCycle, type CycleState } from '../lib/cycle.ts'

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

  if (loading) return <p>Loading...</p>
  if (error) return <p role="alert">{error}</p>

  const { current } = cycle
  if (!current) return <p>No quotes yet</p>

  return (
    <section className="quote-card">
      <blockquote>{current.text}</blockquote>
      <p className="quote-author">{current.author}</p>
      {current.context && <p className="quote-context">{current.context}</p>}
      <button type="button" onClick={() => setCycle(nextInCycle(quotes, cycle))}>
        Next quote
      </button>
    </section>
  )
}
