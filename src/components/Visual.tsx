import type { Visual as VisualData } from '../game/types'

function emojiClass(count: number): string {
  if (count === 1) return 'emoji-wall single'
  if (count <= 4) return 'emoji-wall few'
  if (count <= 6) return 'emoji-wall some'
  return 'emoji-wall many'
}

/**
 * `silhouette` — режим подсказки: картинка видна только силуэтом, чтобы ребёнок
 * догадался по форме, но не увидел ответ целиком.
 */
export default function Visual({ visual, silhouette }: { visual: VisualData; silhouette?: boolean }) {
  if (visual.kind === 'none') return null
  const shade = silhouette ? 'shaded' : ''

  if (visual.kind === 'emoji') {
    return (
      <div className={`${emojiClass(visual.emojis.length)} ${shade}`}>
        {visual.emojis.map((emoji, index) => (
          <span key={index}>{emoji}</span>
        ))}
      </div>
    )
  }

  if (visual.kind === 'letter') {
    return (
      <div className="letter-block">
        <div className="big-letter">{visual.text}</div>
        {visual.badge && <div className="letter-badge">{visual.badge}</div>}
      </div>
    )
  }

  if (visual.kind === 'image') {
    return (
      <div className={`picture ${shade}`}>
        <img src={visual.src} alt="" />
      </div>
    )
  }

  if (visual.kind === 'rebus') {
    return (
      <div className="rebus">
        <span>{visual.left}</span>
        <span className="rebus-plus">+</span>
        <span>{visual.right}</span>
        <span className="rebus-plus">=</span>
        <span className="rebus-unknown">?</span>
      </div>
    )
  }

  return (
    <div className="sequence">
      {visual.steps.map((step, index) => (
        <span key={index} className="sequence-step">
          {step}
        </span>
      ))}
      <span className="sequence-step unknown">?</span>
    </div>
  )
}
