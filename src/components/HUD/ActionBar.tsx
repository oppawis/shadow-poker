import { useState } from 'react'
import { GameState } from '../../types'
import './ActionBar.css'

interface ActionBarProps {
  gameState: GameState
  callAmount: number
  canCheck: boolean
  isProcessing: boolean
  onAction: (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => void
}

export default function ActionBar({ gameState, callAmount, canCheck, isProcessing, onAction }: ActionBarProps) {
  const [raiseAmount, setRaiseAmount] = useState(gameState.bigBlind * 2)
  const player = gameState.players.find(p => p.id === 'player')
  const isPlayerTurn = gameState.players[gameState.activePlayerIndex]?.id === 'player'
  const disabled = !isPlayerTurn || isProcessing || gameState.currentPhase === 'showdown'

  const minRaise = gameState.minimumRaise
  const maxRaise = player?.chips || 0

  return (
    <div className={`action-bar ${disabled ? 'disabled' : ''}`}>
      <div className="action-info">
        <div className="info-item">
          <span className="info-label">Your Chips</span>
          <span className="info-value">${player?.chips.toLocaleString()}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Hand #{gameState.handNumber}</span>
          <span className="info-value phase">{gameState.currentPhase.toUpperCase()}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Blinds</span>
          <span className="info-value">${gameState.smallBlind}/${gameState.bigBlind}</span>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="action-btn fold"
          onClick={() => onAction('fold')}
          disabled={disabled}
        >
          Fold
        </button>

        {canCheck ? (
          <button
            className="action-btn check"
            onClick={() => onAction('check')}
            disabled={disabled}
          >
            Check
          </button>
        ) : (
          <button
            className="action-btn call"
            onClick={() => onAction('call')}
            disabled={disabled}
          >
            Call ${callAmount}
          </button>
        )}

        <div className="raise-group">
          <div className="quick-raise-row">
            <button
              className="quick-raise-btn"
              onClick={() => setRaiseAmount(Math.max(minRaise, Math.floor(gameState.pot * 0.25)))}
              disabled={disabled}
            >
              25%
            </button>
            <button
              className="quick-raise-btn"
              onClick={() => setRaiseAmount(Math.max(minRaise, Math.floor(gameState.pot * 0.33)))}
              disabled={disabled}
            >
              33%
            </button>
            <button
              className="quick-raise-btn"
              onClick={() => setRaiseAmount(Math.max(minRaise, Math.floor(gameState.pot * 0.5)))}
              disabled={disabled}
            >
              50%
            </button>
            <button
              className="quick-raise-btn"
              onClick={() => setRaiseAmount(Math.max(minRaise, gameState.pot))}
              disabled={disabled}
            >
              Pot
            </button>
          </div>
          <div className="raise-input-row">
            <input
              type="number"
              className="raise-input"
              min={minRaise}
              max={maxRaise}
              value={raiseAmount}
              onChange={e => {
                const val = Number(e.target.value)
                if (!isNaN(val)) setRaiseAmount(Math.min(Math.max(val, 0), maxRaise))
              }}
              disabled={disabled}
            />
            <button
              className="action-btn raise"
              onClick={() => onAction('raise', raiseAmount)}
              disabled={disabled || raiseAmount < minRaise || raiseAmount > maxRaise}
            >
              Raise
            </button>
          </div>
        </div>

        <button
          className="action-btn all-in"
          onClick={() => onAction('all-in')}
          disabled={disabled}
        >
          All In ${player?.chips}
        </button>
      </div>

      {isProcessing && (
        <div className="thinking-indicator">
          <div className="thinking-dots">
            <span /><span /><span />
          </div>
          <span>Opponent thinking...</span>
        </div>
      )}
    </div>
  )
}
