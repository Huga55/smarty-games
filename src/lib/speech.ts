let voice: SpeechSynthesisVoice | null = null
let ready = false

function findRussianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices?.() ?? []
  return voices.find((v) => v.lang?.toLowerCase().startsWith('ru')) ?? null
}

export function initSpeech(): void {
  if (ready || !('speechSynthesis' in window)) return
  ready = true
  voice = findRussianVoice()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    voice = findRussianVoice()
  })
}

export function speechAvailable(): boolean {
  return 'speechSynthesis' in window
}

export function speak(text: string): void {
  if (!speechAvailable() || !text) return
  initSpeech()
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ru-RU'
  utterance.rate = 0.95
  utterance.pitch = 1.05
  if (voice) utterance.voice = voice
  synth.speak(utterance)
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel()
}
