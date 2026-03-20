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
  const phase = state.currentPhase
  const stackToPot = chips / (state.pot || 1)
  const isPreFlop = phase === 'pre-flop'
  const isLatePosition = position > 0.6
  const callToPot = callAmount / (state.pot || 1)

  // Track how many players are still in
  const activePlayers = state.players.filter(p => p.isActive && !p.isFolded).length
  const isHeadsUp = activePlayers === 2
  const isMultiway = activePlayers > 3

  // --- PRE-FLOP: Play tight-aggressive with position awareness ---
  if (isPreFlop) {
    // Premium hands (AA, KK, QQ, AKs equivalent): strength > 85
    if (strength > 85) {
      // 3-bet / raise big
      const sizing = Math.floor(state.pot * (2.5 + Math.random() * 1.5))
      if (rand < 15 && callAmount > 0) return { action: 'call' } // Trap sometimes
      return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
    }
    // Strong hands (JJ, TT, AQ, AJs): strength 70-85
    if (strength > 70) {
      if (callAmount > chips * 0.3) {
        // Facing big raise - just call
        return rand < 30 ? { action: 'raise', raiseAmount: Math.floor(state.pot * 2) } : { action: 'call' }
      }
      const sizing = Math.floor(state.pot * (2 + Math.random()))
      if (rand < 60) return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
      return { action: 'call' }
    }
    // Playable hands in position (suited connectors, medium pairs): 50-70
    if (strength > 50) {
      if (isLatePosition) {
        if (canCheckNow) {
          return rand < 40 ? { action: 'raise', raiseAmount: Math.floor(state.pot * 2) } : { action: 'check' }
        }
        if (callToPot < 0.3) return { action: 'call' }
        if (rand < 20) return { action: 'call' } // Defend sometimes
        return { action: 'fold' }
      }
      if (canCheckNow) return { action: 'check' }
      if (callToPot < 0.15) return { action: 'call' }
      return { action: 'fold' }
    }
    // Speculative hands in late position only
    if (strength > 35 && isLatePosition) {
      if (canCheckNow) {
        return rand < 25 ? { action: 'raise', raiseAmount: Math.floor(state.pot * 2.5) } : { action: 'check' }
      }
      if (callToPot < 0.1) return { action: 'call' }
    }
    // Trash
    if (canCheckNow) return { action: 'check' }
    return { action: 'fold' }
  }

  // --- POST-FLOP: Aggressive, balanced play ---

  // Pot commitment check - if already invested > 40% of stack, don't fold strong
  const invested = 1000 - chips - (state.players.find(p => p.id === state.players[state.activePlayerIndex]?.id)?.currentBet || 0)
  const potCommitted = invested > chips * 0.4

  // Nuts / near-nuts
  if (strength > 90) {
    // Vary between value bets and traps
    if (canCheckNow && rand < 25 && phase === 'flop') {
      return { action: 'check' } // Check-raise trap on flop
    }
    // Bet big for value
    const sizing = Math.floor(state.pot * (0.65 + Math.random() * 0.45))
    if (rand < 10 && chips < state.pot * 2) return { action: 'all-in' }
    return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
  }

  // Strong made hand
  if (strength > 72) {
    if (canCheckNow) {
      // Bet for value most of the time
      const sizing = Math.floor(state.pot * (0.5 + Math.random() * 0.3))
      if (rand < 75) return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
      return { action: 'check' } // Occasionally slow play
    }
    // Facing a bet
    if (callToPot > 1.5 && strength < 80) {
      // Facing overbet with just a strong hand - be cautious
      return rand < 40 ? { action: 'call' } : { action: 'fold' }
    }
    if (rand < 35) {
      // Re-raise for value
      const sizing = Math.floor(callAmount * 2.5 + state.pot * 0.3)
      return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
    }
    return { action: 'call' }
  }

  // Medium strength / drawing hands
  if (strength > 50) {
    if (canCheckNow) {
      // Semi-bluff or probe bet with position
      if (isLatePosition && rand < 45) {
        const sizing = Math.floor(state.pot * (0.4 + Math.random() * 0.25))
        return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
      }
      // Check-call range
      return { action: 'check' }
    }
    // Facing a bet - use pot odds
    if (strength > potOdds + 5) return { action: 'call' }
    // Float with position (call to bluff later)
    if (isLatePosition && rand < 25 && phase === 'flop') return { action: 'call' }
    // Semi-bluff raise occasionally
    if (rand < 12 && isLatePosition) {
      return { action: 'raise', raiseAmount: Math.floor(state.pot * 0.7) }
    }
    if (potCommitted) return { action: 'call' }
    return { action: 'fold' }
  }

  // Weak hand / air
  if (strength > 30) {
    if (canCheckNow) {
      // Bluff with balanced frequency - more on dry boards, in position
      const bluffFreq = isLatePosition ? (isHeadsUp ? 35 : 18) : 8
      if (rand < bluffFreq) {
        const sizing = Math.floor(state.pot * (0.5 + Math.random() * 0.3))
        return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
      }
      return { action: 'check' }
    }
    if (potCommitted && callToPot < 0.3) return { action: 'call' }
    return { action: 'fold' }
  }

  // Total air
  if (canCheckNow) {
    // Pure bluff with good position, heads-up, on later streets
    const bluffFreq = isHeadsUp && isLatePosition ? (phase === 'river' ? 22 : 15) : 5
    if (rand < bluffFreq) {
      // Overbet bluff on river sometimes
      const sizing = phase === 'river'
        ? Math.floor(state.pot * (0.8 + Math.random() * 0.7))
        : Math.floor(state.pot * (0.5 + Math.random() * 0.2))
      return { action: 'raise', raiseAmount: Math.min(sizing, chips) }
    }
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
