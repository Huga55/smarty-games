const REPO = 'Huga55/smarty-games'
export const REPO_URL = `https://github.com/${REPO}`
export const APK_URL = `${REPO_URL}/releases/latest/download/igraem.apk`

export interface Release {
  version: string
  /** Страница релиза, откуда качается APK. */
  url: string
  notes: string
}

export type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'fresh' }
  | { kind: 'found'; release: Release }
  | { kind: 'offline' }

/** Версия установленного приложения; в браузере её нет, поэтому «для разработки». */
export async function currentVersion(): Promise<string> {
  try {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    return info.version
  } catch {
    return 'dev'
  }
}

function toNumbers(version: string): number[] {
  return version
    .replace(/^v/i, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0)
}

export function isNewer(candidate: string, installed: string): boolean {
  if (installed === 'dev') return true
  const left = toNumbers(candidate)
  const right = toNumbers(installed)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const a = left[i] ?? 0
    const b = right[i] ?? 0
    if (a !== b) return a > b
  }
  return false
}

export async function latestRelease(): Promise<Release> {
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) throw new Error(`GitHub ответил ${response.status}`)
  const data = (await response.json()) as { tag_name?: string; html_url?: string; body?: string }
  return {
    version: (data.tag_name ?? '').replace(/^v/i, ''),
    url: data.html_url ?? `${REPO_URL}/releases/latest`,
    notes: data.body?.trim() ?? '',
  }
}
