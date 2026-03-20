import './MainMenu.css'

interface MainMenuProps {
  onPlay: () => void
  onTutorial: () => void
  onStats: () => void
}

export default function MainMenu({ onPlay, onTutorial, onStats }: MainMenuProps) {
  return (
    <div className="main-menu">
      <div className="menu-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="menu-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 8}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          }} />
        ))}
      </div>

      <div className="menu-content">
        <div className="menu-logo">
          <h1 className="game-title">
            <span className="title-shadow">SHADOW</span>
            <span className="title-poker">POKER</span>
          </h1>
          <p className="game-subtitle">Texas Hold'em</p>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn play-btn" onClick={onPlay}>
            <span className="btn-icon">♠</span>
            <span>Play</span>
          </button>
          <button className="menu-btn tutorial-btn" onClick={onTutorial}>
            <span className="btn-icon">📖</span>
            <span>Tutorial</span>
          </button>
          <button className="menu-btn stats-btn" onClick={onStats}>
            <span className="btn-icon">📊</span>
            <span>Statistics</span>
          </button>
        </div>

        <div className="menu-footer">
          <span>Press A during game for Strategy Advisor</span>
        </div>
      </div>
    </div>
  )
}
