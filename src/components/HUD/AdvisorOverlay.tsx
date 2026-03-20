import { useState, useEffect } from 'react'
import { GameState } from '../../types'
import { getAdvisorAnalysis } from '../../engine/poker/advisor'
import './AdvisorOverlay.css'

interface AdvisorOverlayProps {
  gameState: GameState
}

export default function AdvisorOverlay({ gameState }: AdvisorOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [analysis, setAnalysis] = useState<ReturnType<typeof getAdvisorAnalysis> | null>(null)

  useEffect(() => {
    if (!visible) return
    const playerIndex = gameState.players.findIndex(p => p.id === 'player')
    if (playerIndex < 0) return
    const player = gameState.players[playerIndex]
    if (player.holeCards.length < 2) return

    // Run in a timeout so it doesn't block
    const timer = setTimeout(() => {
      const result = getAdvisorAnalysis(gameState, playerIndex)
      setAnalysis(result)
    }, 50)
    return () => clearTimeout(timer)
  }, [visible, gameState])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        if (!(e.target instanceof HTMLInputElement)) {
          setVisible(v => !v)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <button
        className={`advisor-toggle ${visible ? 'active' : ''}`}
        onClick={() => setVisible(v => !v)}
        title="Strategy Advisor (A)"
      >
        <span className="advisor-icon">🎯</span>
        <span>Advisor</span>
      </button>

      {visible && analysis && (
        <div className="advisor-panel">
          <div className="advisor-header">
            <span>Strategy Advisor</span>
            <button className="advisor-close" onClick={() => setVisible(false)}>×</button>
          </div>

          <div className="advisor-body">
            <div className="hand-strength-section">
              <span className="section-label">Hand Strength</span>
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${analysis.handStrength}%`,
                    background: analysis.handStrength > 65 ? '#4ade80' : analysis.handStrength > 35 ? '#facc15' : '#ef4444',
                  }}
                />
              </div>
              <div className="strength-info">
                <span className="hand-label">{analysis.handLabel}</span>
                <span className="strength-pct">{analysis.handStrength}%</span>
              </div>
            </div>

            {analysis.outs > 0 && (
              <div className="outs-section">
                <span className="outs-count">{analysis.outs} outs</span>
                <span className="outs-pct">({analysis.outsProbability}% to improve)</span>
              </div>
            )}

            <div className="actions-section">
              <span className="section-label">Win % by Action</span>
              <div className="action-stats">
                <ActionStat
                  label="Fold"
                  ev={analysis.actions.fold.expectedValue}
                  winPct={0}
                  recommended={analysis.recommendedAction === 'fold'}
                />
                <ActionStat
                  label={analysis.potOdds === 0 ? 'Check' : 'Call'}
                  ev={analysis.actions.checkCall.expectedValue}
                  winPct={analysis.actions.checkCall.winProbability}
                  recommended={analysis.recommendedAction === 'check' || analysis.recommendedAction === 'call'}
                />
                <ActionStat
                  label="Raise"
                  ev={analysis.actions.raise.expectedValue}
                  winPct={analysis.actions.raise.winProbability}
                  recommended={analysis.recommendedAction === 'raise'}
                />
                <ActionStat
                  label="All-In"
                  ev={analysis.actions.allIn.expectedValue}
                  winPct={analysis.actions.allIn.winProbability}
                  recommended={analysis.recommendedAction === 'all-in'}
                />
              </div>
            </div>

            <div className={`recommendation confidence-${analysis.confidence}`}>
              <span className="rec-badge">RECOMMENDED</span>
              <span className="rec-action">{analysis.recommendedAction.toUpperCase()}</span>
              <p className="rec-explanation">{analysis.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ActionStat({ label, ev, winPct, recommended }: { label: string; ev: number; winPct: number; recommended: boolean }) {
  return (
    <div className={`action-stat ${recommended ? 'recommended' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-win">{winPct}%</span>
      <span className={`stat-ev ${ev >= 0 ? 'positive' : 'negative'}`}>
        EV: {ev >= 0 ? '+' : ''}{Math.round(ev)}
      </span>
      {recommended && <span className="rec-marker">★</span>}
    </div>
  )
}
