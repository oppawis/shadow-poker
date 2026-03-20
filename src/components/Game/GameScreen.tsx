import { useState } from 'react'
import { GameState } from '../../types'
import { ShowdownInfo } from '../../hooks/useGameEngine'
import PokerTable from '../Table/PokerTable'
import ActionBar from '../HUD/ActionBar'
import AdvisorOverlay from '../HUD/AdvisorOverlay'
import CardComponent from '../Cards/Card'
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
  showdownInfo: ShowdownInfo
  callAmount: number
  canCheck: boolean
  onAction: (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => void
  onNextHand: () => void
  onMuckShow: (show: boolean) => void
  onQuit: () => void
}

export default function GameScreen({
  gameState, winners, isProcessing, showingResult, showdownInfo,
  callAmount, canCheck, onAction, onNextHand, onMuckShow, onQuit,
}: GameScreenProps) {
  const [humanChosen, setHumanChosen] = useState(false)
  const humanIsLoser = showingResult && winners && !winners.some(w => w.playerId === 'player')
  const humanNeedsChoice = humanIsLoser && !humanChosen && showdownInfo.player && !showdownInfo.player.isWinner

  const handleNextHand = () => {
    setHumanChosen(false)
    onNextHand()
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <span className="game-logo">SHADOW POKER <span style={{ fontSize: '10px', color: '#888', fontWeight: 400 }}>by Op - Reg BD</span></span>
        <button className="quit-btn" onClick={onQuit}>✕ Quit</button>
      </div>

      <PokerTable
        gameState={gameState}
        showdownInfo={showdownInfo}
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
              {winners.some(w => w.playerId === 'player') ? 'You Win!' : 'You Lose'}
            </h2>

            {/* Winner cards display */}
            {winners.map(w => {
              const player = gameState.players.find(p => p.id === w.playerId)
              if (!player) return null
              return (
                <div key={w.playerId} className="showdown-winner">
                  <div className="showdown-winner-header">
                    <span className="winner-name">{player.name}</span>
                    <span className="winner-amount">+${w.amount}</span>
                  </div>
                  <div className="showdown-winner-cards">
                    {player.holeCards.map((card, i) => (
                      <CardComponent key={i} card={card} />
                    ))}
                  </div>
                  <span className="showdown-hand-desc">{w.handDescription}</span>
                </div>
              )
            })}

            {/* Other revealed players */}
            {Object.entries(showdownInfo)
              .filter(([id, info]) => !info.isWinner && info.revealed)
              .map(([id, info]) => {
                const player = gameState.players.find(p => p.id === id)
                if (!player) return null
                return (
                  <div key={id} className="showdown-loser">
                    <div className="showdown-loser-header">
                      <span className="loser-name">{player.name}</span>
                      <span className="loser-label">SHOWED</span>
                    </div>
                    <div className="showdown-loser-cards">
                      {player.holeCards.map((card, i) => (
                        <CardComponent key={i} card={card} small />
                      ))}
                    </div>
                    <span className="showdown-hand-desc-small">{info.handDescription}</span>
                  </div>
                )
              })}

            {/* Mucked players */}
            {Object.entries(showdownInfo)
              .filter(([id, info]) => !info.isWinner && !info.revealed && id !== 'player')
              .map(([id]) => {
                const player = gameState.players.find(p => p.id === id)
                if (!player) return null
                return (
                  <div key={id} className="showdown-muck">
                    <span className="muck-name">{player.name}</span>
                    <span className="muck-label">MUCKED</span>
                  </div>
                )
              })}

            {/* Human muck/show choice */}
            {humanNeedsChoice && (
              <div className="muck-show-choice">
                <span className="muck-show-label">Show your cards?</span>
                <div className="muck-show-buttons">
                  <button className="muck-btn" onClick={() => { onMuckShow(false); setHumanChosen(true) }}>
                    Muck
                  </button>
                  <button className="show-btn" onClick={() => { onMuckShow(true); setHumanChosen(true) }}>
                    Show
                  </button>
                </div>
              </div>
            )}

            <button className="next-hand-btn" onClick={handleNextHand}>
              Next Hand
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
