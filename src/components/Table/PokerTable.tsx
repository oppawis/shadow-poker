import { GameState } from '../../types'
import CardComponent from '../Cards/Card'
import PlayerSeat from '../Players/PlayerSeat'
import './PokerTable.css'

interface PokerTableProps {
  gameState: GameState
  showAllCards?: boolean
}

export default function PokerTable({ gameState, showAllCards }: PokerTableProps) {
  return (
    <div className="poker-table-container">
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
          }} />
        ))}
      </div>

      <div className="poker-table">
        <div className="table-felt">
          <div className="table-center">
            <div className="community-cards">
              {gameState.communityCards.map((card, i) => (
                <CardComponent key={`${card.rank}-${card.suit}`} card={card} glowing />
              ))}
              {Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
                <div key={`empty-${i}`} className="card-placeholder" />
              ))}
            </div>
            <div className="pot-display">
              <span className="pot-label">POT</span>
              <span className="pot-amount">${gameState.pot.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {gameState.players.map((player, index) => (
          <PlayerSeat
            key={player.id}
            player={player}
            isActive={index === gameState.activePlayerIndex && gameState.currentPhase !== 'showdown'}
            isHuman={player.type === 'human'}
            position={index}
            totalPlayers={gameState.players.length}
            showCards={showAllCards}
          />
        ))}
      </div>
    </div>
  )
}
