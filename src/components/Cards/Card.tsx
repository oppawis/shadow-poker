import { Card as CardType } from '../../types'
import './Card.css'

interface CardProps {
  card: CardType
  faceDown?: boolean
  glowing?: boolean
  small?: boolean
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
}

const SUIT_COLORS: Record<string, string> = {
  hearts: '#e53e3e', diamonds: '#e53e3e', clubs: '#e0e0e0', spades: '#e0e0e0',
}

export default function CardComponent({ card, faceDown, glowing, small }: CardProps) {
  const symbol = SUIT_SYMBOLS[card.suit]
  const color = SUIT_COLORS[card.suit]

  return (
    <div className={`card ${faceDown ? 'face-down' : 'face-up'} ${glowing ? 'glowing' : ''} ${small ? 'small' : ''}`}>
      {faceDown ? (
        <div className="card-back">
          <div className="card-back-pattern" />
        </div>
      ) : (
        <div className="card-face" style={{ color }}>
          <div className="card-corner top-left">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
          <div className="card-center">
            <span className="card-suit-large">{symbol}</span>
          </div>
          <div className="card-corner bottom-right">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
        </div>
      )}
    </div>
  )
}
