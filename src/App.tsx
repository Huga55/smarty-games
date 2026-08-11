import { useEffect, useRef, useState } from 'react'
import GameScreen from './components/GameScreen'
import Home from './components/Home'
import SettingsScreen from './components/SettingsScreen'
import { gameById } from './game/games'
import { exitApp, listenBack } from './lib/back'
import { configureSpeech, initSpeech, stopSpeaking } from './lib/speech'
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
  const [exitHint, setExitHint] = useState(false)
  const lastBackPress = useRef(0)

  useEffect(() => {
    initSpeech()
  }, [])

  useEffect(() => {
    saveSettings(settings)
    configureSpeech({ voiceName: settings.voiceName, rate: settings.speechRate })
  }, [settings])

  // Уходя с экрана игры, обрываем недоговорённую фразу.
  useEffect(() => {
    stopSpeaking()
  }, [hash])

  useEffect(() => {
    return listenBack(() => {
      const onHome = window.location.hash === '' || window.location.hash === '#/'
      if (!onHome) {
        go('/')
        return
      }
      const now = Date.now()
      if (now - lastBackPress.current < 2000) {
        void exitApp()
        return
      }
      lastBackPress.current = now
      setExitHint(true)
      window.setTimeout(() => setExitHint(false), 2000)
    })
  }, [])

  const gameMatch = /^#\/game\/(.+)$/.exec(hash)
  const game = gameMatch ? gameById(gameMatch[1] as string) : undefined

  let screen
  if (game) {
    screen = <GameScreen key={game.id} game={game} settings={settings} onSettingsChange={setSettings} />
  } else if (hash === '#/settings') {
    screen = <SettingsScreen settings={settings} onChange={setSettings} />
  } else {
    screen = <Home />
  }

  return (
    <>
      {screen}
      {exitHint && <div className="toast">Нажми ещё раз, чтобы выйти</div>}
    </>
  )
}
