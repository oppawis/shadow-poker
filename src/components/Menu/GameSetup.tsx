import { useState } from 'react'
import { AIDifficulty } from '../../types'
import './GameSetup.css'

interface GameSetupProps {
  onStart: (opponents: number, difficulty: AIDifficulty) => void
  onBack: () => void
}

export default function GameSetup({ onStart, onBack }: GameSetupProps) {
  const [opponents, setOpponents] = useState(3)
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium')

  return (
    <div className="game-setup">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <h2 className="setup-title">Game Setup</h2>

      <div className="setup-section">
        <label className="setup-label">Number of Opponents</label>
        <div className="opponent-selector">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              className={`opponent-btn ${opponents === n ? 'selected' : ''}`}
              onClick={() => setOpponents(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <label className="setup-label">AI Difficulty</label>
        <div className="difficulty-selector">
          {(['easy', 'medium', 'hard'] as AIDifficulty[]).map(d => (
            <button
              key={d}
              className={`difficulty-btn ${difficulty === d ? 'selected' : ''} ${d}`}
              onClick={() => setDifficulty(d)}
            >
              <span className="diff-name">{d}</span>
              <span className="diff-desc">
                {d === 'easy' && 'Passive play, good for beginners'}
                {d === 'medium' && 'Balanced play with occasional bluffs'}
                {d === 'hard' && 'Aggressive, strategic, reads patterns'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="setup-info">
        <p>Starting chips: $1,000</p>
        <p>Blinds: $5 / $10</p>
      </div>

      <button className="start-btn" onClick={() => onStart(opponents, difficulty)}>
        ♠ Start Game
      </button>
    </div>
  )
}
