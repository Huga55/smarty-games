export interface VoiceOption {
  /** Системное имя голоса, его и храним в настройках. */
  name: string
  label: string
}

let allVoices: SpeechSynthesisVoice[] = []
let ready = false
let chosenName: string | null = null
let rate = 0.95
const PITCH = 1.12

/**
 * Голоса в Android и Windows сильно разные по приятности: где-то это живой
 * Google-голос, а где-то роботный eSpeak. Оцениваем, чтобы по умолчанию взять
 * лучший из доступных, а не первый попавшийся.
 */
function score(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase()
  let value = 0
  if (name.includes('espeak') || name.includes('compact')) value -= 100
  if (name.includes('google')) value += 30
  if (!voice.localService) value += 20 // сетевые голоса звучат живее
  if (name.includes('female') || name.includes('milena') || name.includes('alena')) value += 12
  if (name.includes('wavenet') || name.includes('neural') || name.includes('natural')) value += 25
  if (voice.lang?.toLowerCase() === 'ru-ru') value += 5
  if (voice.default) value += 1
  return value
}

function refresh(): void {
  const voices = window.speechSynthesis?.getVoices?.() ?? []
  allVoices = voices
    .filter((voice) => voice.lang?.toLowerCase().startsWith('ru'))
    .sort((a, b) => score(b) - score(a))
}

export function initSpeech(): void {
  if (!('speechSynthesis' in window)) return
  refresh()
  if (ready) return
  ready = true
  // Список голосов приходит асинхронно, иногда через секунду после старта.
  window.speechSynthesis.addEventListener('voiceschanged', refresh)
}

export function speechAvailable(): boolean {
  return 'speechSynthesis' in window
}

function prettyLabel(voice: SpeechSynthesisVoice, index: number): string {
  const name = voice.name.toLowerCase()
  const kind = name.includes('female') ? 'Женский' : name.includes('male') ? 'Мужской' : 'Голос'
  const quality = !voice.localService ? ' (из интернета)' : ''
  return `${kind} ${index + 1}${quality}`
}

export function russianVoices(): VoiceOption[] {
  initSpeech()
  return allVoices.map((voice, index) => ({
    name: voice.name,
    label: voice.name.includes('#') || /^[a-z-]+$/i.test(voice.name) ? prettyLabel(voice, index) : voice.name,
  }))
}

export function configureSpeech(options: { voiceName?: string | null; rate?: number }): void {
  if (options.voiceName !== undefined) chosenName = options.voiceName
  if (options.rate !== undefined) rate = options.rate
}

function currentVoice(): SpeechSynthesisVoice | null {
  if (allVoices.length === 0) refresh()
  if (chosenName) {
    const found = allVoices.find((voice) => voice.name === chosenName)
    if (found) return found
  }
  return allVoices[0] ?? null
}

export function speak(text: string): void {
  if (!speechAvailable() || !text) return
  initSpeech()
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ru-RU'
  utterance.rate = rate
  utterance.pitch = PITCH
  const voice = currentVoice()
  if (voice) utterance.voice = voice
  synth.speak(utterance)
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel()
}
