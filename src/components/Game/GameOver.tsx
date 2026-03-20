import { SessionStats } from '../../types'
import { HAND_RANK_NAMES } from '../../engine/poker/handEvaluator'
import './GameOver.css'

interface GameOverProps {
  stats: SessionStats
  playerChips: number
  onPlayAgain: () => void
  onMenu: () => void
}

export default function GameOver({ stats, playerChips, onPlayAgain, onMenu }: GameOverProps) {
  const won = playerChips > 0
  const winRate = stats.handsPlayed > 0 ? Math.round(stats.handsWon / stats.handsPlayed * 100) : 0

  return (
    <div className="game-over">
      <div className="game-over-particles">
        {Array.from({ length: won ? 30 : 10 }).map((_, i) => (
          <div key={i} className={`go-particle ${won ? 'gold' : 'dark'}`} style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      <div className="game-over-content">
        <h1 className={`game-over-title ${won ? 'victory' : 'defeat'}`}>
          {won ? '🏆 VICTORY' : '💀 DEFEAT'}
        </h1>
        <p className="game-over-sub">
          {won ? 'You defeated all opponents!' : 'You ran out of chips.'}
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.handsPlayed}</span>
            <span className="stat-label">Hands Played</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{winRate}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">${stats.biggestPot.toLocaleString()}</span>
            <span className="stat-label">Biggest Pot</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.bestHand ? HAND_RANK_NAMES[stats.bestHand] : 'N/A'}</span>
            <span className="stat-label">Best Hand</span>
          </div>
        </div>

        <div className="game-over-buttons">
          <button className="go-btn play-again" onClick={onPlayAgain}>Play Again</button>
          <button className="go-btn to-menu" onClick={onMenu}>Main Menu</button>
        </div>
      </div>
    </div>
  )
}
