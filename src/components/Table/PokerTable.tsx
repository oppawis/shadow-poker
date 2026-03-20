import { GameState } from '../../types'
import { ShowdownInfo } from '../../hooks/useGameEngine'
import CardComponent from '../Cards/Card'
import PlayerSeat from '../Players/PlayerSeat'
import './PokerTable.css'

interface PokerTableProps {
  gameState: GameState
  showdownInfo?: ShowdownInfo
}

export default function PokerTable({ gameState, showdownInfo }: PokerTableProps) {
  const humanPlayer = gameState.players.find(p => p.type === 'human')
  const humanIndex = gameState.players.findIndex(p => p.type === 'human')
  const isHumanActive = humanIndex === gameState.activePlayerIndex && gameState.currentPhase !== 'showdown'

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
            showCards={showdownInfo?.[player.id]?.revealed}
            showdownHandDesc={showdownInfo?.[player.id]?.revealed ? showdownInfo[player.id].handDescription : undefined}
          />
        ))}

        {/* Human player's hand - side panel */}
        {humanPlayer && humanPlayer.holeCards.length > 0 && (
          <div className={`human-hand ${isHumanActive ? 'your-turn' : ''} ${humanPlayer.isFolded ? 'folded' : ''}`}>
            <span className="hand-label">YOUR HAND</span>
            <div className="human-hand-cards">
              {humanPlayer.holeCards.map((card, i) => (
                <CardComponent
                  key={i}
                  card={card}
                  glowing={isHumanActive}
                />
              ))}
            </div>
            {isHumanActive && <div className="your-turn-label">YOUR TURN</div>}
          </div>
        )}
      </div>
    </div>
  )
}
