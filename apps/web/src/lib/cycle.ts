export interface CycleState<T> {
  current: T | null
  remaining: T[]
}

// Fisher-Yates: returns a shuffled copy, the input is left untouched.
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Moves to the next item of the cycle.
// - No repeat until every item was shown, then everything is reshuffled.
// - The first item of a new cycle differs from the last one of the previous cycle.
export function nextInCycle<T extends { id: string }>(
  all: T[],
  state: CycleState<T>,
  random: () => number = Math.random,
): CycleState<T> {
  if (all.length === 0) {
    return { current: null, remaining: [] }
  }

  let queue = state.remaining
  if (queue.length === 0) {
    queue = shuffle(all, random)
    if (queue.length > 1 && queue[0].id === state.current?.id) {
      ;[queue[0], queue[1]] = [queue[1], queue[0]]
    }
  }

  const [current, ...remaining] = queue
  return { current, remaining }
}
