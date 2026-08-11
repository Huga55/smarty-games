export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function pick<T>(list: readonly T[]): T {
  return list[randomInt(0, list.length - 1)] as T
}

export function shuffle<T>(list: readonly T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    const a = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = a
  }
  return copy
}

export function sample<T>(list: readonly T[], count: number): T[] {
  return shuffle(list).slice(0, count)
}

const decks = new Map<string, unknown[]>()

/**
 * Выдаёт элементы по одному, как карты из перемешанной колоды: пока колода
 * не кончится, повторов не будет. Без этого случайность быстро надоедает —
 * одна и та же марка машины выпадает три раза подряд.
 */
export function nextFrom<T>(key: string, list: readonly T[]): T {
  if (list.length === 0) throw new Error(`Пустой список для колоды «${key}»`)
  let deck = decks.get(key) as T[] | undefined
  if (!deck || deck.length === 0) {
    deck = shuffle(list)
    // Чтобы на стыке колод не получилось два одинаковых подряд.
    decks.set(key, deck)
  }
  const item = deck.pop() as T
  return item
}
