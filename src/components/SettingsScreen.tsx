import { games } from '../game/games'
import type { Settings } from '../lib/storage'
import { speechAvailable } from '../lib/speech'

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

export default function SettingsScreen({ settings, onChange }: Props) {
  const sleeping = games.filter((game) => game.isAvailable && !game.isAvailable())

  const patch = (part: Partial<Settings>) => onChange({ ...settings, ...part })

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
    </div>
  )
}
