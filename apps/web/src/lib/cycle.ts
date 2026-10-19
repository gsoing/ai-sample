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

// Moves to a quote of the list.
export function nextInCycle<T extends { id: string }>(
  all: T[],
  state: CycleState<T>,
  random: () => number = Math.random,
): CycleState<T> {
  if (all.length === 0) {
    return { current: null, remaining: [] }
  }

  const current = all[Math.floor(random() * all.length)]
  return { current, remaining: state.remaining }
}
