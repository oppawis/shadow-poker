import './Tutorial.css'

interface TutorialProps {
  onBack: () => void
}

const HAND_RANKINGS = [
  { rank: 'Royal Flush', desc: 'A, K, Q, J, 10 of the same suit', example: 'A♠ K♠ Q♠ J♠ 10♠', strength: 100 },
  { rank: 'Straight Flush', desc: '5 sequential cards of the same suit', example: '9♥ 8♥ 7♥ 6♥ 5♥', strength: 95 },
  { rank: 'Four of a Kind', desc: '4 cards of the same rank', example: 'K♠ K♥ K♦ K♣ 7♠', strength: 88 },
  { rank: 'Full House', desc: '3 of a kind + a pair', example: 'Q♠ Q♥ Q♦ 9♣ 9♥', strength: 80 },
  { rank: 'Flush', desc: '5 cards of the same suit', example: 'A♦ J♦ 8♦ 6♦ 3♦', strength: 72 },
  { rank: 'Straight', desc: '5 sequential cards', example: '10♣ 9♦ 8♠ 7♥ 6♣', strength: 64 },
  { rank: 'Three of a Kind', desc: '3 cards of the same rank', example: '8♠ 8♥ 8♦ K♣ 4♠', strength: 52 },
  { rank: 'Two Pair', desc: '2 different pairs', example: 'J♠ J♥ 5♦ 5♣ A♠', strength: 40 },
  { rank: 'One Pair', desc: '2 cards of the same rank', example: '10♠ 10♥ A♦ 8♣ 4♠', strength: 28 },
  { rank: 'High Card', desc: 'No combination', example: 'A♠ J♦ 8♣ 5♥ 2♠', strength: 12 },
]

export default function Tutorial({ onBack }: TutorialProps) {
  return (
    <div className="tutorial">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2 className="tutorial-title">How to Play Texas Hold'em</h2>

      <div className="tutorial-content">
        <div className="tutorial-section">
          <h3>Game Flow</h3>
          <div className="flow-steps">
            <div className="flow-step"><span className="step-num">1</span><span>Blinds are posted</span></div>
            <div className="flow-step"><span className="step-num">2</span><span>Each player gets 2 hole cards</span></div>
            <div className="flow-step"><span className="step-num">3</span><span><strong>Pre-Flop:</strong> First betting round</span></div>
            <div className="flow-step"><span className="step-num">4</span><span><strong>Flop:</strong> 3 community cards dealt</span></div>
            <div className="flow-step"><span className="step-num">5</span><span><strong>Turn:</strong> 4th community card</span></div>
            <div className="flow-step"><span className="step-num">6</span><span><strong>River:</strong> 5th community card</span></div>
            <div className="flow-step"><span className="step-num">7</span><span><strong>Showdown:</strong> Best hand wins!</span></div>
          </div>
        </div>

        <div className="tutorial-section">
          <h3>Actions</h3>
          <div className="actions-grid">
            <div className="action-item"><span className="action-name fold-text">Fold</span> Give up your hand</div>
            <div className="action-item"><span className="action-name check-text">Check</span> Pass without betting</div>
            <div className="action-item"><span className="action-name call-text">Call</span> Match the current bet</div>
            <div className="action-item"><span className="action-name raise-text">Raise</span> Increase the bet</div>
            <div className="action-item"><span className="action-name allin-text">All-In</span> Bet all your chips</div>
          </div>
        </div>

        <div className="tutorial-section">
          <h3>Hand Rankings</h3>
          <div className="hand-rankings">
            {HAND_RANKINGS.map((h, i) => (
              <div key={h.rank} className="ranking-row">
                <span className="ranking-num">#{i + 1}</span>
                <div className="ranking-info">
                  <span className="ranking-name">{h.rank}</span>
                  <span className="ranking-desc">{h.desc}</span>
                </div>
                <span className="ranking-example">{h.example}</span>
                <div className="ranking-bar">
                  <div className="ranking-fill" style={{ width: `${h.strength}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tutorial-section">
          <h3>Strategy Advisor</h3>
          <p className="tip-text">
            Press <kbd>A</kbd> during gameplay to toggle the Strategy Advisor overlay.
            It shows win probabilities for each action and recommends the statistically optimal play.
          </p>
        </div>
      </div>
    </div>
  )
}
