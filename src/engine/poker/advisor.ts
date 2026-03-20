import { Card, GameState } from '../../types'
import { createDeck } from './deck'
import { evaluateHand, compareHands, HAND_RANK_NAMES } from './handEvaluator'

interface ActionStats {
  winProbability: number
  expectedValue: number
}

interface AdvisorResult {
  handStrength: number
  handLabel: string
  outs: number
  outsProbability: number
  potOdds: number
  actions: {
    fold: ActionStats
    checkCall: ActionStats
    raise: ActionStats
    allIn: ActionStats
  }
  recommendedAction: 'fold' | 'check' | 'call' | 'raise' | 'all-in'
  confidence: 'high' | 'medium' | 'low'
  explanation: string
}

export function getAdvisorAnalysis(state: GameState, playerIndex: number): AdvisorResult {
  const player = state.players[playerIndex]
  const holeCards = player.holeCards
  const community = state.communityCards

  // Monte Carlo simulation
  const simResults = runSimulation(holeCards, community, state.players.filter(p => !p.isFolded && p.id !== player.id).length)

  const currentHand = community.length >= 3
    ? evaluateHand(holeCards, community)
    : null

  const handLabel = currentHand
    ? HAND_RANK_NAMES[currentHand.rank]
    : describeHoleCards(holeCards)

  const outs = community.length >= 3 ? countOuts(holeCards, community) : 0
  const cardsRemaining = 52 - 2 - community.length
  const outsProbability = community.length < 5 ? Math.round((1 - Math.pow((cardsRemaining - outs) / cardsRemaining, 5 - community.length)) * 100) : 0

  const maxBet = Math.max(...state.players.filter(p => !p.isFolded).map(p => p.currentBet))
  const callAmount = maxBet - player.currentBet
  const potOdds = callAmount > 0 ? Math.round(callAmount / (state.pot + callAmount) * 100) : 0

  // Action stats
  const actions = {
    fold: { winProbability: 0, expectedValue: -player.currentBet },
    checkCall: { winProbability: simResults.winRate, expectedValue: simResults.winRate / 100 * (state.pot + callAmount) - callAmount },
    raise: { winProbability: Math.min(100, simResults.winRate + 5), expectedValue: simResults.winRate / 100 * (state.pot + callAmount * 2) - callAmount * 2 },
    allIn: { winProbability: simResults.winRate, expectedValue: simResults.winRate / 100 * (state.pot + player.chips) - player.chips },
  }

  // Determine recommendation
  let recommendedAction: AdvisorResult['recommendedAction']
  let confidence: AdvisorResult['confidence']
  let explanation: string

  if (simResults.winRate > 75) {
    recommendedAction = 'raise'
    confidence = 'high'
    explanation = `Strong hand (${handLabel}). ${simResults.winRate}% win rate favors aggressive play.`
  } else if (simResults.winRate > 50) {
    if (callAmount === 0) {
      recommendedAction = 'check'
      confidence = 'medium'
      explanation = `Decent hand (${handLabel}). Check to see more cards for free.`
    } else if (simResults.winRate > potOdds + 10) {
      recommendedAction = 'call'
      confidence = 'medium'
      explanation = `${simResults.winRate}% equity vs ${potOdds}% pot odds. Pot odds favor a call.`
    } else {
      recommendedAction = 'call'
      confidence = 'low'
      explanation = `Marginal spot. ${simResults.winRate}% equity is close to ${potOdds}% pot odds.`
    }
  } else if (simResults.winRate > 30 && callAmount === 0) {
    recommendedAction = 'check'
    confidence = 'medium'
    explanation = `Weak hand but free to check. ${outs} outs to improve.`
  } else if (simResults.winRate > 30 && simResults.winRate > potOdds) {
    recommendedAction = 'call'
    confidence = 'low'
    explanation = `Drawing hand with ${outs} outs (${outsProbability}% to hit). Pot odds favor a call.`
  } else {
    recommendedAction = 'fold'
    confidence = 'high'
    explanation = `Weak hand (${handLabel}). ${simResults.winRate}% win rate doesn't justify the cost.`
  }

  return {
    handStrength: simResults.winRate,
    handLabel,
    outs,
    outsProbability,
    potOdds,
    actions,
    recommendedAction,
    confidence,
    explanation,
  }
}

function runSimulation(holeCards: Card[], community: Card[], numOpponents: number, iterations = 500): { winRate: number } {
  if (numOpponents === 0) return { winRate: 100 }

  const usedCards = new Set(
    [...holeCards, ...community].map(c => `${c.rank}-${c.suit}`)
  )
  const remainingDeck = createDeck().filter(c => !usedCards.has(`${c.rank}-${c.suit}`))

  let wins = 0
  let ties = 0

  for (let i = 0; i < iterations; i++) {
    const shuffled = [...remainingDeck].sort(() => Math.random() - 0.5)
    let idx = 0

    // Deal remaining community cards
    const fullCommunity = [...community]
    while (fullCommunity.length < 5) {
      fullCommunity.push(shuffled[idx++])
    }

    // Deal opponent hands
    const myHand = evaluateHand(holeCards, fullCommunity)
    let isBest = true
    let isTie = false

    for (let o = 0; o < numOpponents; o++) {
      const oppCards = [shuffled[idx++], shuffled[idx++]]
      const oppHand = evaluateHand(oppCards, fullCommunity)
      const cmp = compareHands(myHand, oppHand)
      if (cmp < 0) { isBest = false; break }
      if (cmp === 0) isTie = true
    }

    if (isBest && !isTie) wins++
    if (isBest && isTie) ties++
  }

  return { winRate: Math.round((wins + ties * 0.5) / iterations * 100) }
}

function countOuts(holeCards: Card[], community: Card[]): number {
  const currentHand = evaluateHand(holeCards, community)
  const usedCards = new Set([...holeCards, ...community].map(c => `${c.rank}-${c.suit}`))
  const remaining = createDeck().filter(c => !usedCards.has(`${c.rank}-${c.suit}`))

  let outs = 0
  for (const card of remaining) {
    const newHand = evaluateHand(holeCards, [...community, card])
    if (newHand.value > currentHand.value) outs++
  }
  return outs
}

function describeHoleCards(cards: Card[]): string {
  if (cards.length < 2) return 'Unknown'
  const suited = cards[0].suit === cards[1].suit ? 'suited' : 'offsuit'
  if (cards[0].rank === cards[1].rank) return `Pocket ${cards[0].rank}s`
  return `${cards[0].rank}-${cards[1].rank} ${suited}`
}
