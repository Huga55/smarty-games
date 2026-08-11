import { useEffect, useMemo, useState } from 'react'
import { games } from '../game/games'
import { russianVoices, speak, speechAvailable } from '../lib/speech'
import type { Settings } from '../lib/storage'
import { APK_URL, REPO_URL, currentVersion, isNewer, latestRelease } from '../lib/update'
import type { UpdateState } from '../lib/update'

const RATES: { value: number; label: string }[] = [
  { value: 0.8, label: 'медленно' },
  { value: 0.95, label: 'обычно' },
  { value: 1.1, label: 'быстро' },
]

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

export default function SettingsScreen({ settings, onChange }: Props) {
  const sleeping = games.filter((game) => game.isAvailable && !game.isAvailable())
  const [version, setVersion] = useState('…')
  const [update, setUpdate] = useState<UpdateState>({ kind: 'idle' })
  const [voicesTick, setVoicesTick] = useState(0)
  const voices = useMemo(() => (speechAvailable() ? russianVoices() : []), [voicesTick])

  useEffect(() => {
    void currentVersion().then(setVersion)
  }, [])

  // Список голосов система отдаёт не сразу, иногда через секунду после старта.
  useEffect(() => {
    if (!speechAvailable()) return
    const onChange = () => setVoicesTick((tick) => tick + 1)
    window.speechSynthesis.addEventListener('voiceschanged', onChange)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onChange)
  }, [])

  const patch = (part: Partial<Settings>) => onChange({ ...settings, ...part })

  const check = async () => {
    setUpdate({ kind: 'checking' })
    try {
      const release = await latestRelease()
      setUpdate(isNewer(release.version, version) ? { kind: 'found', release } : { kind: 'fresh' })
    } catch {
      setUpdate({ kind: 'offline' })
    }
  }

  return (
    <div className="screen settings">
      <header className="game-header">
        <a className="icon-button" href="#/" aria-label="В меню">
          ⬅️
        </a>
        <div className="game-title">
          <strong>Настройки</strong>
          <span className="game-howto">Для взрослого</span>
        </div>
      </header>

      <div className="setting">
        <div className="setting-label">Заданий в серии</div>
        <div className="chips">
          {[5, 10, 0].map((value) => (
            <button
              key={value}
              className={`chip ${settings.seriesLength === value ? 'on' : ''}`}
              onClick={() => patch({ seriesLength: value })}
            >
              {value === 0 ? 'без конца' : value}
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting-label">Картинок в играх на память</div>
        <div className="chips">
          {[3, 4, 5, 6, 7].map((value) => (
            <button
              key={value}
              className={`chip ${settings.memoryCount === value ? 'on' : ''}`}
              onClick={() => patch({ memoryCount: value })}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="setting-hint">Это значение предлагается перед началом игры, там же его можно поменять.</p>
      </div>

      <div className="setting">
        <div className="setting-label">Секунд на запоминание</div>
        <div className="chips">
          {[3, 5, 7, 10, 15].map((value) => (
            <button
              key={value}
              className={`chip ${settings.memorySeconds === value ? 'on' : ''}`}
              onClick={() => patch({ memorySeconds: value })}
            >
              {value} c
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting-label">Время в «Кто быстрее назовёт»</div>
        <div className="chips">
          {[20, 30, 45, 60].map((value) => (
            <button
              key={value}
              className={`chip ${settings.speedSeconds === value ? 'on' : ''}`}
              onClick={() => patch({ speedSeconds: value })}
            >
              {value} c
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting-label">Сложные буквы и категории</div>
        <div className="chips">
          <button className={`chip ${settings.hard ? '' : 'on'}`} onClick={() => patch({ hard: false })}>
            попроще
          </button>
          <button className={`chip ${settings.hard ? 'on' : ''}`} onClick={() => patch({ hard: true })}>
            посложнее
          </button>
        </div>
        <p className="setting-hint">
          «Попроще» убирает буквы Е, Ё, Ф, Ц, Щ, Э, Ю и трудные категории вроде профессий и городов.
          «Посложнее» добавляет народные загадки и факты потруднее.
        </p>
      </div>

      {speechAvailable() && (
        <div className="setting">
          <div className="setting-label">Читать задание голосом</div>
          <div className="chips">
            <button className={`chip ${settings.speak ? '' : 'on'}`} onClick={() => patch({ speak: false })}>
              нет
            </button>
            <button className={`chip ${settings.speak ? 'on' : ''}`} onClick={() => patch({ speak: true })}>
              да
            </button>
          </div>
          <p className="setting-hint">
            Удобно, когда играете в машине: телефон сам произносит задание, экран смотреть не нужно.
          </p>

          <div className="setting-label spaced">Скорость речи</div>
          <div className="chips">
            {RATES.map((rate) => (
              <button
                key={rate.value}
                className={`chip ${settings.speechRate === rate.value ? 'on' : ''}`}
                onClick={() => patch({ speechRate: rate.value })}
              >
                {rate.label}
              </button>
            ))}
          </div>

          <div className="setting-label spaced">Голос</div>
          <div className="chips">
            <button
              className={`chip ${settings.voiceName === null ? 'on' : ''}`}
              onClick={() => patch({ voiceName: null })}
            >
              лучший сам
            </button>
            {voices.map((voice) => (
              <button
                key={voice.name}
                className={`chip ${settings.voiceName === voice.name ? 'on' : ''}`}
                onClick={() => patch({ voiceName: voice.name })}
              >
                {voice.label}
              </button>
            ))}
          </div>
          <button
            className="big-button"
            onClick={() => speak('Привет! Назови животное на букву Б')}
          >
            🔊 Послушать
          </button>
          {voices.length === 0 && (
            <p className="setting-hint">
              Русских голосов в системе не нашлось. На Android они ставятся так: Настройки → Язык и ввод →
              Синтез речи → Google, и там скачать русский.
            </p>
          )}
        </div>
      )}

      {sleeping.length > 0 && (
        <div className="setting">
          <div className="setting-label">Спящие игры</div>
          {sleeping.map((game) => (
            <p key={game.id} className="setting-hint">
              {game.emoji} <strong>{game.title}</strong> — {game.missingHint}
            </p>
          ))}
        </div>
      )}

      <div className="setting">
        <div className="setting-label">Версия {version}</div>
        <button className="big-button" onClick={() => void check()} disabled={update.kind === 'checking'}>
          {update.kind === 'checking' ? 'Проверяю…' : 'Проверить обновление'}
        </button>

        {update.kind === 'fresh' && <p className="setting-hint">Установлена самая свежая версия.</p>}
        {update.kind === 'offline' && (
          <p className="setting-hint">Не получилось спросить у GitHub — похоже, нет интернета. Игры работают и без него.</p>
        )}
        {update.kind === 'found' && (
          <>
            <p className="setting-hint">Есть версия {update.release.version}. Скачается APK, установи его поверх.</p>
            <a className="big-button primary" href={APK_URL} target="_blank" rel="noreferrer">
              Скачать {update.release.version}
            </a>
            <a className="text-button" href={update.release.url} target="_blank" rel="noreferrer">
              Что изменилось
            </a>
          </>
        )}

        <p className="setting-hint">
          Исходники и все сборки:{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            github.com/Huga55/smarty-games
          </a>
        </p>
      </div>
    </div>
  )
}
