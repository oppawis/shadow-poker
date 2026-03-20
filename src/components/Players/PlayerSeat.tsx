import { Player } from '../../types'
import CardComponent from '../Cards/Card'
import './PlayerSeat.css'

interface PlayerSeatProps {
  player: Player
  isActive: boolean
  isHuman: boolean
  position: number
  totalPlayers: number
  showCards?: boolean
  showdownHandDesc?: string
}

export default function PlayerSeat({ player, isActive, isHuman, position, totalPlayers, showCards, showdownHandDesc }: PlayerSeatProps) {
  const pos = getPosition(position, totalPlayers)

  return (
    <div
      className={`player-seat ${isActive ? 'active' : ''} ${player.isFolded ? 'folded' : ''} ${player.isAllIn ? 'all-in' : ''}`}
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="player-avatar">
        <div className="avatar-circle">
          {player.name[0]}
        </div>
        {isActive && <div className="active-indicator" />}
        {player.isAllIn && <div className="allin-badge">ALL IN</div>}
      </div>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-chips">${player.chips.toLocaleString()}</span>
        {player.currentBet > 0 && (
          <span className="player-bet">Bet: ${player.currentBet}</span>
        )}
      </div>
      {player.lastAction && (
        <div className={`last-action ${player.lastAction.startsWith('Fold') ? 'action-fold' : player.lastAction.startsWith('Raise') || player.lastAction.startsWith('All') ? 'action-raise' : 'action-neutral'}`}>
          {player.lastAction}
        </div>
      )}
      {!isHuman && player.holeCards.length > 0 && (
        <div className="player-cards">
          {player.holeCards.map((card, i) => (
            <CardComponent
              key={i}
              card={card}
              faceDown={!showCards}
              small
            />
          ))}
          {showdownHandDesc && (
            <div className="showdown-desc">{showdownHandDesc}</div>
          )}
        </div>
      )}
      {player.isDealer && <div className="dealer-button">D</div>}
    </div>
  )
}

function getPosition(index: number, total: number): { x: string; y: string } {
  // Player 0 (human) is at bottom center
  // AI players spread around the top semicircle
  if (index === 0) return { x: '50%', y: '72%' }

  const positions: Record<number, { x: string; y: string }[]> = {
    1: [{ x: '50%', y: '5%' }],
    2: [{ x: '25%', y: '10%' }, { x: '75%', y: '10%' }],
    3: [{ x: '15%', y: '30%' }, { x: '50%', y: '5%' }, { x: '85%', y: '30%' }],
    4: [{ x: '10%', y: '35%' }, { x: '30%', y: '5%' }, { x: '70%', y: '5%' }, { x: '90%', y: '35%' }],
    5: [{ x: '8%', y: '40%' }, { x: '22%', y: '10%' }, { x: '50%', y: '2%' }, { x: '78%', y: '10%' }, { x: '92%', y: '40%' }],
  }

  const aiIndex = index - 1
  return positions[total - 1]?.[aiIndex] || { x: '50%', y: '50%' }
}
