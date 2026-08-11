import { useEffect, useState } from 'react'
import GameScreen from './components/GameScreen'
import Home from './components/Home'
import SettingsScreen from './components/SettingsScreen'
import { gameById } from './game/games'
import { initSpeech, stopSpeaking } from './lib/speech'
import { loadSettings, saveSettings } from './lib/storage'
import type { Settings } from './lib/storage'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export function go(path: string): void {
  window.location.hash = path
}

export default function App() {
  const hash = useHash()
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  useEffect(() => {
    initSpeech()
  }, [])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Уходя с экрана игры, обрываем недоговорённую фразу.
  useEffect(() => {
    stopSpeaking()
  }, [hash])

  const gameMatch = /^#\/game\/(.+)$/.exec(hash)
  if (gameMatch) {
    const game = gameById(gameMatch[1] as string)
    if (game)
      return <GameScreen key={game.id} game={game} settings={settings} onSettingsChange={setSettings} />
  }

  if (hash === '#/settings') {
    return <SettingsScreen settings={settings} onChange={setSettings} />
  }

  return <Home />
}
