import { availableGames } from '../game/games'
import { sections } from '../game/types'

export default function Home() {
  const games = availableGames()

  return (
    <div className="screen home">
      <header className="home-header">
        <h1>Во что играем?</h1>
        <a className="icon-button" href="#/settings" aria-label="Настройки">
          ⚙️
        </a>
      </header>

      {sections.map((section) => {
        const sectionGames = games.filter((game) => game.section === section.id)
        if (sectionGames.length === 0) return null
        return (
          <section key={section.id} className="section">
            <h2>
              {section.title}
              <span className="section-hint">{section.hint}</span>
            </h2>
            <div className="grid">
              {sectionGames.map((game) => (
                <a key={game.id} className="game-card" href={`#/game/${game.id}`}>
                  <span className="game-card-emoji">{game.emoji}</span>
                  <span className="game-card-title">{game.title}</span>
                </a>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
