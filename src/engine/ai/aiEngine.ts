import { GameState, AIDifficulty, PlayerAction } from '../../types'
import { evaluateHand, getHandStrengthPercent, HAND_RANK_VALUES } from '../poker/handEvaluator'
import { getCallAmount, canCheck } from '../poker/gameState'

interface AIDecision {
  action: PlayerAction
  raiseAmount?: number
}

export function getAIDecision(state: GameState, playerIndex: number): AIDecision {
  const player = state.players[playerIndex]
  const difficulty = player.difficulty || 'medium'
  const strength = getHandStrengthPercent(player.holeCards, state.communityCards)
  const callAmount = getCallAmount(state, playerIndex)
  const canCheckNow = canCheck(state, playerIndex)
  const potOdds = callAmount > 0 ? callAmount / (state.pot + callAmount) * 100 : 0

  switch (difficulty) {
    case 'easy': return easyDecision(strength, canCheckNow, callAmount, player.chips)
    case 'medium': return mediumDecision(strength, canCheckNow, callAmount, potOdds, player.chips, state)
    case 'hard': return hardDecision(strength, canCheckNow, callAmount, potOdds, player.chips, state)
  }
}

function easyDecision(strength: number, canCheckNow: boolean, callAmount: number, chips: number): AIDecision {
  const rand = Math.random() * 100

  if (strength > 70) {
    if (rand < 30) return { action: 'raise', raiseAmount: Math.floor(chips * 0.1) }
    return { action: 'call' }
  }
  if (strength > 40) {
    if (canCheckNow) return { action: 'check' }
    if (rand < 70) return { action: 'call' }
    return { action: 'fold' }
  }
  if (canCheckNow) return { action: 'check' }
  if (rand < 30) return { action: 'call' }
  return { action: 'fold' }
}

function mediumDecision(strength: number, canCheckNow: boolean, callAmount: number, potOdds: number, chips: number, state: GameState): AIDecision {
  const rand = Math.random() * 100
  const position = getPositionStrength(state)

  if (strength > 80) {
    if (rand < 50) return { action: 'raise', raiseAmount: Math.floor(chips * 0.2) }
    return { action: 'call' }
  }
  if (strength > 55) {
    if (canCheckNow) {
      if (rand < 20) return { action: 'raise', raiseAmount: Math.floor(chips * 0.1) }
      return { action: 'check' }
    }
    if (strength > potOdds + 10) return { action: 'call' }
    if (rand < 40) return { action: 'call' }
    return { action: 'fold' }
  }
  if (strength > 35) {
    if (canCheckNow) return { action: 'check' }
    // Bluff occasionally
    if (rand < 10 && position > 0.6) return { action: 'raise', raiseAmount: Math.floor(chips * 0.15) }
    if (callAmount < chips * 0.05) return { action: 'call' }
    return { action: 'fold' }
  }
  if (canCheckNow) return { action: 'check' }
  return { action: 'fold' }
}

function hardDecision(strength: number, canCheckNow: boolean, callAmount: number, potOdds: number, chips: number, state: GameState): AIDecision {
  const rand = Math.random() * 100
  const position = getPositionStrength(state)
  const aggression = 0.3 + position * 0.4

  // Monster hand
  if (strength > 85) {
    // Slow play sometimes
    if (rand < 20 && canCheckNow) return { action: 'check' }
    if (rand < 60) return { action: 'raise', raiseAmount: Math.floor(state.pot * (0.5 + Math.random() * 0.5)) }
    return { action: 'call' }
  }

  // Strong hand
  if (strength > 65) {
    if (rand < aggression * 100) {
      return { action: 'raise', raiseAmount: Math.floor(state.pot * (0.4 + Math.random() * 0.3)) }
    }
    if (canCheckNow) return { action: 'check' }
    return { action: 'call' }
  }

  // Drawing hand / marginal
  if (strength > 45) {
    if (canCheckNow) {
      // Semi-bluff
      if (rand < aggression * 40) return { action: 'raise', raiseAmount: Math.floor(state.pot * 0.5) }
      return { action: 'check' }
    }
    if (strength > potOdds) return { action: 'call' }
    // Bluff sometimes with position
    if (rand < 15 && position > 0.7) return { action: 'raise', raiseAmount: Math.floor(state.pot * 0.6) }
    return { action: 'fold' }
  }

  // Weak hand
  if (canCheckNow) {
    // Pure bluff rarely
    if (rand < 8 && position > 0.8) return { action: 'raise', raiseAmount: Math.floor(state.pot * 0.7) }
    return { action: 'check' }
  }
  return { action: 'fold' }
}

function getPositionStrength(state: GameState): number {
  const active = state.players.filter(p => p.isActive && !p.isFolded)
  const idx = state.players.findIndex(p => p.id === state.players[state.activePlayerIndex]?.id)
  const dealerDist = (idx - state.dealerIndex + state.players.length) % state.players.length
  return dealerDist / (active.length || 1)
}

export function getAIThinkingTime(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy': return 500 + Math.random() * 1000
    case 'medium': return 800 + Math.random() * 1500
    case 'hard': return 1000 + Math.random() * 2500
  }
}
