// Card types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
}

// Player types
export type PlayerType = 'human' | 'ai'
export type AIDifficulty = 'easy' | 'medium' | 'hard'

export interface Player {
  id: string
  name: string
  type: PlayerType
  chips: number
  holeCards: Card[]
  isDealer: boolean
  isActive: boolean
  isFolded: boolean
  isAllIn: boolean
  currentBet: number
  avatar?: string
  difficulty?: AIDifficulty
}

// Game state types
export type GamePhase = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown'
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in'

export interface GameState {
  players: Player[]
  communityCards: Card[]
  pot: number
  sidePots: SidePot[]
  currentPhase: GamePhase
  dealerIndex: number
  activePlayerIndex: number
  smallBlind: number
  bigBlind: number
  handNumber: number
  minimumRaise: number
}

export interface SidePot {
  amount: number
  eligiblePlayerIds: string[]
}

// Hand evaluation
export type HandRank =
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'one-pair'
  | 'high-card'

export interface HandResult {
  rank: HandRank
  cards: Card[]
  description: string
  value: number // numeric value for comparison
}

// Game settings
export interface GameSettings {
  numberOfOpponents: number
  difficulty: AIDifficulty
  soundEnabled: boolean
  soundVolume: number
  gameSpeed: 'slow' | 'normal' | 'fast'
}

// Stats
export interface SessionStats {
  handsPlayed: number
  handsWon: number
  biggestPot: number
  bestHand: HandRank | null
  chipHistory: number[]
}

export interface LifetimeStats {
  totalSessions: number
  totalHandsPlayed: number
  totalHandsWon: number
  bestHand: HandRank | null
  longestWinStreak: number
}

// Hand history
export interface HandHistoryEntry {
  handNumber: number
  playerCards: Card[]
  communityCards: Card[]
  result: 'win' | 'loss' | 'tie'
  potSize: number
  handRank?: HandRank
}
