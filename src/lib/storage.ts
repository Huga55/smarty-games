export interface Settings {
  /** Включать сложные буквы и категории. */
  hard: boolean
  /** Сколько картинок в играх на память. */
  memoryCount: number
  /** Сколько секунд смотреть на картинки. */
  memorySeconds: number
  /** Сколько заданий в серии, 0 — без конца. */
  seriesLength: number
  /** Озвучивать задание голосом. */
  speak: boolean
  /** Выбранный голос; null — берём лучший из доступных. */
  voiceName: string | null
  /** Скорость речи. */
  speechRate: number
  /** Секунды на «Кто быстрее назовёт». */
  speedSeconds: number
}

export const defaultSettings: Settings = {
  hard: false,
  memoryCount: 4,
  memorySeconds: 5,
  seriesLength: 10,
  speak: false,
  voiceName: null,
  speechRate: 0.95,
  speedSeconds: 30,
}

const KEY = 'smarty.settings.v1'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSettings
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Записать не удалось — не страшно, поиграем с настройками по умолчанию.
  }
}
