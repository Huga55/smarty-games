/**
 * Эмодзи из Unicode 13 и новее не рисуются на Windows и на Android до 11:
 * вместо картинки получается пустой квадратик. Для приложения, где вся графика —
 * эмодзи, это дыра, поэтому берём только символы, которым уже много лет.
 */
const RISKY_RANGES: [number, number][] = [
  [0x1fa74, 0x1fa74],
  [0x1fa7b, 0x1fa7c],
  [0x1fa83, 0x1fa86],
  [0x1fa96, 0x1faff],
  [0x1f6d6, 0x1f6df],
  [0x1f9a3, 0x1f9a4],
  [0x1f9ab, 0x1f9ad],
  [0x1f972, 0x1f972],
  [0x1f977, 0x1f979],
  [0x1f9cb, 0x1f9cb],
  [0x1fa00, 0x1fa6f],
]

export function riskyCodePoints(text: string): string[] {
  const found: string[] = []
  for (const symbol of text) {
    const code = symbol.codePointAt(0)
    if (code === undefined) continue
    if (RISKY_RANGES.some(([from, to]) => code >= from && code <= to)) {
      found.push(`${symbol} (U+${code.toString(16).toUpperCase()})`)
    }
  }
  return found
}
