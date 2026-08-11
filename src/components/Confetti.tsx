const PIECES = ['🎉', '⭐', '✨', '🎊', '🌟', '🎈']

/** Короткий салют после правильного ответа. Живёт меньше секунды. */
export default function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2
        const distance = 110 + (index % 4) * 34
        return (
          <span
            key={index}
            style={
              {
                '--dx': `${Math.cos(angle) * distance}px`,
                '--dy': `${Math.sin(angle) * distance - 40}px`,
                '--delay': `${(index % 5) * 30}ms`,
              } as React.CSSProperties
            }
          >
            {PIECES[index % PIECES.length]}
          </span>
        )
      })}
    </div>
  )
}
