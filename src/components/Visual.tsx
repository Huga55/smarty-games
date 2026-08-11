import type { Visual as VisualData } from '../game/types'

function emojiClass(count: number): string {
  if (count === 1) return 'emoji-wall single'
  if (count <= 4) return 'emoji-wall few'
  if (count <= 6) return 'emoji-wall some'
  return 'emoji-wall many'
}

export default function Visual({ visual }: { visual: VisualData }) {
  if (visual.kind === 'none') return null

  if (visual.kind === 'emoji') {
    return (
      <div className={emojiClass(visual.emojis.length)}>
        {visual.emojis.map((emoji, index) => (
          <span key={index}>{emoji}</span>
        ))}
      </div>
    )
  }

  if (visual.kind === 'letter') {
    return <div className="big-letter">{visual.text}</div>
  }

  if (visual.kind === 'image') {
    return (
      <div className="picture">
        <img src={visual.src} alt="" />
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
