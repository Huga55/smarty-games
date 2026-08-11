import type { Game } from '../game/types'
import { rules } from '../game/rules'

export default function HelpModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const points = rules[game.id] ?? [game.howTo]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>
          {game.emoji} {game.title}
        </h2>
        <ul className="modal-list">
          {points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
        <button className="big-button primary" onClick={onClose}>
          Понятно
        </button>
      </div>
    </div>
  )
}
