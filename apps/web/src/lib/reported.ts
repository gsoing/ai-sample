// Ids of the quotes this browser has reported. A convenience only: the API is
// what refuses repeated reports. Storage can be blocked or hold anything, so
// every failure falls back to "nothing remembered".
const STORAGE_KEY = 'office-quotes:reported-ids'

export function loadReportedIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function rememberReportedId(id: string): void {
  try {
    const ids = loadReportedIds()
    if (!ids.includes(id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]))
    }
  } catch {
    // Storage unavailable or full: nothing to do.
  }
}
