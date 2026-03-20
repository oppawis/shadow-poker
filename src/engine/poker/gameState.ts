import { GameState, Player, Card, GamePhase, AIDifficulty, SidePot } from '../../types'
import { DeckManager } from './deck'
import { evaluateHand, compareHands } from './handEvaluator'

const AI_NAMES = [
  'The Phantom', 'Nightshade', 'Viper', 'Shadow', 'Raven',
  'Ghost', 'Cipher', 'Eclipse', 'Obsidian', 'Wraith'
]

export function createPlayers(numOpponents: number, difficulty: AIDifficulty, playerName?: string): Player[] {
  const players: Player[] = [{
    id: 'player',
    name: playerName || 'You',
    type: 'human',
    chips: 1000,
    holeCards: [],
    isDealer: false,
    isActive: true,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
  }]

  const shuffledNames = [...AI_NAMES].sort(() => Math.random() - 0.5)
  for (let i = 0; i < numOpponents; i++) {
    players.push({
      id: `ai-${i}`,
      name: shuffledNames[i],
      type: 'ai',
      chips: 1000,
      holeCards: [],
      isDealer: false,
      isActive: true,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      difficulty,
    })
  }
  return players
}

export function createInitialState(numOpponents: number, difficulty: AIDifficulty, playerName?: string): GameState {
  const players = createPlayers(numOpponents, difficulty, playerName)
  players[0].isDealer = true
  return {
    players,
    communityCards: [],
    pot: 0,
    sidePots: [],
    currentPhase: 'pre-flop',
    dealerIndex: 0,
    activePlayerIndex: 0,
    smallBlind: 5,
    bigBlind: 10,
    handNumber: 0,
    minimumRaise: 10,
    actedThisRound: new Set(),
  }
}

export function startNewHand(state: GameState, deck: DeckManager): GameState {
  deck.reset()

  const newState = { ...state }
  newState.handNumber++
  newState.communityCards = []
  newState.pot = 0
  newState.sidePots = []
  newState.currentPhase = 'pre-flop'
  newState.minimumRaise = newState.bigBlind
  newState.actedThisRound = new Set()

  // Reset players
  newState.players = state.players.map(p => ({
    ...p,
    holeCards: [],
    isFolded: p.chips <= 0,
    isAllIn: false,
    isActive: p.chips > 0,
    currentBet: 0,
    lastAction: undefined,
  }))

  // Rotate dealer
  newState.dealerIndex = findNextActive(newState.players, state.dealerIndex)
  newState.players.forEach(p => (p.isDealer = false))
  newState.players[newState.dealerIndex].isDealer = true

  // Deal hole cards
  const activePlayers = newState.players.filter(p => p.isActive)
  for (const p of activePlayers) {
    p.holeCards = deck.deal(2)
  }

  // Post blinds
  const sbIndex = findNextActive(newState.players, newState.dealerIndex)
  const bbIndex = findNextActive(newState.players, sbIndex)

  postBlind(newState, sbIndex, newState.smallBlind)
  postBlind(newState, bbIndex, newState.bigBlind)

  // First to act is after BB
  newState.activePlayerIndex = findNextActive(newState.players, bbIndex)

  return newState
}

function postBlind(state: GameState, playerIndex: number, amount: number) {
  const player = state.players[playerIndex]
  const blindAmount = Math.min(amount, player.chips)
  player.chips -= blindAmount
  player.currentBet = blindAmount
  state.pot += blindAmount
  if (player.chips === 0) player.isAllIn = true
}

export function findNextActive(players: Player[], fromIndex: number): number {
  let idx = (fromIndex + 1) % players.length
  while (idx !== fromIndex) {
    if (players[idx].isActive && !players[idx].isFolded && !players[idx].isAllIn) {
      return idx
    }
    idx = (idx + 1) % players.length
  }
  return fromIndex
}

export function advancePhase(state: GameState, deck: DeckManager): GameState {
  const newState = { ...state }

  // Reset bets and acted tracking
  newState.players = newState.players.map(p => ({ ...p, currentBet: 0 }))
  newState.minimumRaise = newState.bigBlind
  newState.actedThisRound = new Set()

  switch (state.currentPhase) {
    case 'pre-flop':
      deck.burn()
      newState.communityCards = [...state.communityCards, ...deck.deal(3)]
      newState.currentPhase = 'flop'
      break
    case 'flop':
      deck.burn()
      newState.communityCards = [...state.communityCards, ...deck.deal(1)]
      newState.currentPhase = 'turn'
      break
    case 'turn':
      deck.burn()
      newState.communityCards = [...state.communityCards, ...deck.deal(1)]
      newState.currentPhase = 'river'
      break
    case 'river':
      newState.currentPhase = 'showdown'
      break
  }

  // Set first active player after dealer
  if (newState.currentPhase !== 'showdown') {
    newState.activePlayerIndex = findNextActive(newState.players, newState.dealerIndex)
  }

  return newState
}

export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter(p => p.isActive && !p.isFolded)
}

export function getNonFoldedPlayers(state: GameState): Player[] {
  return state.players.filter(p => !p.isFolded && p.isActive)
}

export function isBettingComplete(state: GameState): boolean {
  const active = state.players.filter(p => p.isActive && !p.isFolded && !p.isAllIn)
  if (active.length <= 1) return true

  // All active players must have acted at least once this round
  const allActed = active.every(p => state.actedThisRound.has(p.id))
  if (!allActed) return false

  // And all bets must be equal
  const maxBet = Math.max(...state.players.filter(p => !p.isFolded).map(p => p.currentBet))
  return active.every(p => p.currentBet === maxBet)
}

export function determineWinners(state: GameState): { playerId: string; amount: number; hand: ReturnType<typeof evaluateHand> }[] {
  const nonFolded = getNonFoldedPlayers(state)
  if (nonFolded.length === 1) {
    return [{ playerId: nonFolded[0].id, amount: state.pot, hand: evaluateHand(nonFolded[0].holeCards, state.communityCards) }]
  }

  const hands = nonFolded.map(p => ({
    playerId: p.id,
    hand: evaluateHand(p.holeCards, state.communityCards),
  }))
  hands.sort((a, b) => compareHands(b.hand, a.hand))

  const bestValue = hands[0].hand.value
  const winners = hands.filter(h => h.hand.value === bestValue)
  const share = Math.floor(state.pot / winners.length)

  return winners.map(w => ({ ...w, amount: share }))
}

export function applyAction(
  state: GameState,
  playerIndex: number,
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
  raiseAmount?: number
): GameState {
  const newState = {
    ...state,
    players: state.players.map(p => ({ ...p })),
    actedThisRound: new Set(state.actedThisRound),
  }
  const player = newState.players[playerIndex]
  const maxBet = Math.max(...newState.players.filter(p => !p.isFolded).map(p => p.currentBet))

  // Mark player as having acted
  newState.actedThisRound.add(player.id)

  switch (action) {
    case 'fold':
      player.isFolded = true
      player.lastAction = 'Fold'
      break
    case 'check':
      player.lastAction = 'Check'
      break
    case 'call': {
      const callAmount = Math.min(maxBet - player.currentBet, player.chips)
      player.chips -= callAmount
      newState.pot += callAmount
      player.currentBet += callAmount
      if (player.chips === 0) player.isAllIn = true
      player.lastAction = `Call $${callAmount}`
      break
    }
    case 'raise': {
      const totalRaise = raiseAmount || newState.minimumRaise
      const toCall = maxBet - player.currentBet
      const totalCost = Math.min(toCall + totalRaise, player.chips)
      player.chips -= totalCost
      newState.pot += totalCost
      player.currentBet += totalCost
      newState.minimumRaise = totalRaise
      if (player.chips === 0) player.isAllIn = true
      player.lastAction = `Raise $${totalCost}`
      // A raise resets acted for everyone except the raiser
      newState.actedThisRound = new Set([player.id])
      break
    }
    case 'all-in': {
      const allInAmount = player.chips
      newState.pot += allInAmount
      player.currentBet += allInAmount
      player.chips = 0
      player.isAllIn = true
      player.lastAction = `All-In $${allInAmount}`
      // If all-in is effectively a raise, reset acted
      if (player.currentBet > maxBet) {
        newState.actedThisRound = new Set([player.id])
      }
      break
    }
  }

  // Move to next active player
  newState.activePlayerIndex = findNextActive(newState.players, playerIndex)

  return newState
}

export function getCallAmount(state: GameState, playerIndex: number): number {
  const maxBet = Math.max(...state.players.filter(p => !p.isFolded).map(p => p.currentBet))
  return Math.min(maxBet - state.players[playerIndex].currentBet, state.players[playerIndex].chips)
}

export function canCheck(state: GameState, playerIndex: number): boolean {
  const maxBet = Math.max(...state.players.filter(p => !p.isFolded).map(p => p.currentBet))
  return state.players[playerIndex].currentBet >= maxBet
}
