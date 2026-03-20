import { Card, HandRank, HandResult, Rank } from '../../types'

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

const HAND_RANK_VALUES: Record<HandRank, number> = {
  'high-card': 1, 'one-pair': 2, 'two-pair': 3, 'three-of-a-kind': 4,
  'straight': 5, 'flush': 6, 'full-house': 7, 'four-of-a-kind': 8,
  'straight-flush': 9, 'royal-flush': 10,
}

const HAND_RANK_NAMES: Record<HandRank, string> = {
  'high-card': 'High Card', 'one-pair': 'One Pair', 'two-pair': 'Two Pair',
  'three-of-a-kind': 'Three of a Kind', 'straight': 'Straight', 'flush': 'Flush',
  'full-house': 'Full House', 'four-of-a-kind': 'Four of a Kind',
  'straight-flush': 'Straight Flush', 'royal-flush': 'Royal Flush',
}

function getRankValue(rank: Rank): number {
  return RANK_VALUES[rank]
}

function getCombinations(cards: Card[], size: number): Card[][] {
  const result: Card[][] = []
  function combine(start: number, combo: Card[]) {
    if (combo.length === size) {
      result.push([...combo])
      return
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i])
      combine(i + 1, combo)
      combo.pop()
    }
  }
  combine(0, [])
  return result
}

function evaluateFiveCards(cards: Card[]): HandResult {
  const sorted = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))
  const values = sorted.map(c => getRankValue(c.rank))
  const suits = sorted.map(c => c.suit)

  const isFlush = suits.every(s => s === suits[0])
  const isStraight = checkStraight(values)
  const isLowStraight = checkLowStraight(values)

  const rankCounts = new Map<number, number>()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }
  const counts = Array.from(rankCounts.entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0])

  if (isFlush && isStraight && values[0] === 14) {
    return { rank: 'royal-flush', cards: sorted, description: HAND_RANK_NAMES['royal-flush'], value: computeValue('royal-flush', values) }
  }
  if (isFlush && (isStraight || isLowStraight)) {
    const v = isLowStraight ? [5, 4, 3, 2, 1] : values
    return { rank: 'straight-flush', cards: sorted, description: HAND_RANK_NAMES['straight-flush'], value: computeValue('straight-flush', v) }
  }
  if (counts[0][1] === 4) {
    return { rank: 'four-of-a-kind', cards: sorted, description: HAND_RANK_NAMES['four-of-a-kind'], value: computeValue('four-of-a-kind', values) }
  }
  if (counts[0][1] === 3 && counts[1][1] === 2) {
    return { rank: 'full-house', cards: sorted, description: HAND_RANK_NAMES['full-house'], value: computeValue('full-house', values) }
  }
  if (isFlush) {
    return { rank: 'flush', cards: sorted, description: HAND_RANK_NAMES['flush'], value: computeValue('flush', values) }
  }
  if (isStraight || isLowStraight) {
    const v = isLowStraight ? [5, 4, 3, 2, 1] : values
    return { rank: 'straight', cards: sorted, description: HAND_RANK_NAMES['straight'], value: computeValue('straight', v) }
  }
  if (counts[0][1] === 3) {
    return { rank: 'three-of-a-kind', cards: sorted, description: HAND_RANK_NAMES['three-of-a-kind'], value: computeValue('three-of-a-kind', values) }
  }
  if (counts[0][1] === 2 && counts[1][1] === 2) {
    return { rank: 'two-pair', cards: sorted, description: HAND_RANK_NAMES['two-pair'], value: computeValue('two-pair', values) }
  }
  if (counts[0][1] === 2) {
    return { rank: 'one-pair', cards: sorted, description: HAND_RANK_NAMES['one-pair'], value: computeValue('one-pair', values) }
  }
  return { rank: 'high-card', cards: sorted, description: HAND_RANK_NAMES['high-card'], value: computeValue('high-card', values) }
}

function checkStraight(values: number[]): boolean {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) return false
  }
  return true
}

function checkLowStraight(values: number[]): boolean {
  const low = [...values].sort((a, b) => a - b)
  return low[0] === 2 && low[1] === 3 && low[2] === 4 && low[3] === 5 && low[4] === 14
}

function computeValue(rank: HandRank, values: number[]): number {
  let v = HAND_RANK_VALUES[rank] * 1000000
  for (let i = 0; i < values.length; i++) {
    v += values[i] * Math.pow(15, 4 - i)
  }
  return v
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards]
  const combos = getCombinations(allCards, 5)
  let best: HandResult | null = null
  for (const combo of combos) {
    const result = evaluateFiveCards(combo)
    if (!best || result.value > best.value) {
      best = result
    }
  }
  return best!
}

export function compareHands(a: HandResult, b: HandResult): number {
  return a.value - b.value
}

export function getHandStrengthPercent(holeCards: Card[], communityCards: Card[]): number {
  if (communityCards.length === 0) {
    return getPreFlopStrength(holeCards)
  }
  const hand = evaluateHand(holeCards, communityCards)
  return Math.min(100, Math.round((HAND_RANK_VALUES[hand.rank] / 10) * 100))
}

function getPreFlopStrength(holeCards: Card[]): number {
  const v1 = getRankValue(holeCards[0].rank)
  const v2 = getRankValue(holeCards[1].rank)
  const isPair = v1 === v2
  const isSuited = holeCards[0].suit === holeCards[1].suit
  const high = Math.max(v1, v2)
  const low = Math.min(v1, v2)

  let strength = (high + low) / 28 * 50
  if (isPair) strength += 30
  if (isSuited) strength += 5
  if (high - low <= 2 && !isPair) strength += 5
  return Math.min(100, Math.round(strength))
}

export { HAND_RANK_NAMES, HAND_RANK_VALUES, getRankValue }
