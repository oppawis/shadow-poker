import { GameState } from '../../types'
import PokerTable from '../Table/PokerTable'
import ActionBar from '../HUD/ActionBar'
import AdvisorOverlay from '../HUD/AdvisorOverlay'
import './GameScreen.css'

interface WinnerInfo {
  playerId: string
  amount: number
  handDescription: string
}

interface GameScreenProps {
  gameState: GameState
  winners: WinnerInfo[] | null
  isProcessing: boolean
  showingResult: boolean
  callAmount: number
  canCheck: boolean
  onAction: (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => void
  onNextHand: () => void
  onQuit: () => void
}

export default function GameScreen({
  gameState, winners, isProcessing, showingResult,
  callAmount, canCheck, onAction, onNextHand, onQuit,
}: GameScreenProps) {
  return (
    <div className="game-screen">
      <div className="game-header">
        <span className="game-logo">SHADOW POKER</span>
        <button className="quit-btn" onClick={onQuit}>✕ Quit</button>
      </div>

      <PokerTable
        gameState={gameState}
        showAllCards={gameState.currentPhase === 'showdown'}
      />

      <AdvisorOverlay gameState={gameState} />

      <ActionBar
        gameState={gameState}
        callAmount={callAmount}
        canCheck={canCheck}
        isProcessing={isProcessing}
        onAction={onAction}
      />

      {showingResult && winners && (
        <div className="result-overlay">
          <div className="result-card">
            <h2 className="result-title">
              {winners.some(w => w.playerId === 'player') ? '🏆 You Win!' : '💀 You Lose'}
            </h2>
            <div className="result-details">
              {winners.map(w => {
                const player = gameState.players.find(p => p.id === w.playerId)
                return (
                  <div key={w.playerId} className="winner-row">
                    <span className="winner-name">{player?.name}</span>
                    <span className="winner-hand">{w.handDescription}</span>
                    <span className="winner-amount">+${w.amount}</span>
                  </div>
                )
              })}
            </div>
            <button className="next-hand-btn" onClick={onNextHand}>
              Next Hand →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
