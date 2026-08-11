import type { Settings } from '../lib/storage'

export type Visual =
  | { kind: 'none' }
  | { kind: 'emoji'; emojis: string[] }
  | { kind: 'letter'; text: string }
  | { kind: 'image'; src: string }
  | { kind: 'sequence'; steps: string[] }

interface RoundBase {
  /** Задание словами — его читает или произносит взрослый. */
  prompt: string
  /** Что произносит озвучка, если нужен другой текст. */
  speech?: string
  /** Подпись к картинке для взрослого. */
  subject?: string
  answer?: string
  answerEmoji?: string
  /** Наводящие вопросы и приметы для взрослого. */
  hints?: string[]
  /** Пояснение взрослому: какие ответы принимать. */
  note?: string
  /** Экран нельзя показывать ребёнку — задание прячется под заглушку. */
  adultOnly?: boolean
}

export interface CardRound extends RoundBase {
  mode: 'card'
  visual: Visual
}

export interface MemoryRound extends RoundBase {
  mode: 'memory'
  emojis: string[]
  labels: string[]
  showSeconds: number
}

export interface ChangedRound extends RoundBase {
  mode: 'changed'
  before: string[]
  after: string[]
  showSeconds: number
}

export interface TimerRound extends RoundBase {
  mode: 'timer'
  seconds: number
}

/** История, которая открывается по одному шагу, с обязательной доброй развязкой. */
export interface ChainRound extends RoundBase {
  mode: 'chain'
  steps: { emoji: string; text: string }[]
  ending: { emoji: string; text: string }
}

export type Round = CardRound | MemoryRound | ChangedRound | TimerRound | ChainRound

export type SectionId = 'look' | 'listen' | 'together' | 'scary'

export interface Section {
  id: SectionId
  title: string
  hint: string
}

export const sections: Section[] = [
  { id: 'look', title: 'Смотри и называй', hint: 'Экран показываем ребёнку' },
  { id: 'listen', title: 'Слушай и отвечай', hint: 'Экран нужен только взрослому' },
  { id: 'together', title: 'Играем вместе', hint: 'Тут играют оба' },
  { id: 'scary', title: 'Страшилки', hint: 'Пугаемся и смеёмся' },
]

export interface Game {
  id: string
  title: string
  emoji: string
  section: SectionId
  /** Одна строка для взрослого: как в это играть. */
  howTo: string
  /** Показывать кнопки «Угадал / Мимо» и считать счёт. */
  scoring: boolean
  /** Игра появляется в меню только если данные для неё есть. */
  isAvailable?: () => boolean
  /** Что показать, если данных нет. */
  missingHint?: string
  next: (settings: Settings) => Round
}
