import { useState, useCallback, useRef, useEffect } from 'react'
import { GameState, AIDifficulty, PlayerAction, HandHistoryEntry, SessionStats } from '../types'
import { DeckManager } from '../engine/poker/deck'
import {
  createInitialState, startNewHand, advancePhase,
  applyAction, getCallAmount, canCheck,
  isBettingComplete, determineWinners, getNonFoldedPlayers, findNextActive
} from '../engine/poker/gameState'
import { getAIDecision, getAIThinkingTime } from '../engine/ai/aiEngine'

export type GameScreen = 'menu' | 'setup' | 'game' | 'tutorial' | 'stats' | 'gameover'

interface WinnerInfo {
  playerId: string
  amount: number
  handDescription: string
}

export function useGameEngine() {
  const [screen, setScreen] = useState<GameScreen>('menu')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [winners, setWinners] = useState<WinnerInfo[] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [handHistory, setHandHistory] = useState<HandHistoryEntry[]>([])
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    handsPlayed: 0, handsWon: 0, biggestPot: 0, bestHand: null, chipHistory: [1000],
  })
  const [showingResult, setShowingResult] = useState(false)

  const deckRef = useRef(new DeckManager())
  const processingRef = useRef(false)

  const startGame = useCallback((numOpponents: number, difficulty: AIDifficulty) => {
    const state = createInitialState(numOpponents, difficulty)
    const newState = startNewHand(state, deckRef.current)
    setGameState(newState)
    setScreen('game')
    setWinners(null)
    setHandHistory([])
    setSessionStats({ handsPlayed: 0, handsWon: 0, biggestPot: 0, bestHand: null, chipHistory: [1000] })
  }, [])

  const processAITurns = useCallback(async (state: GameState) => {
    if (processingRef.current) return state
    processingRef.current = true
    setIsProcessing(true)

    let currentState = { ...state, players: state.players.map(p => ({ ...p })) }

    while (true) {
      const activePlayer = currentState.players[currentState.activePlayerIndex]
      if (!activePlayer || activePlayer.type === 'human' || activePlayer.isFolded || activePlayer.isAllIn) break

      // Check if only one non-folded player
      const nonFolded = getNonFoldedPlayers(currentState)
      if (nonFolded.length <= 1) break

      // Check if betting is complete
      if (isBettingComplete(currentState) && currentState.activePlayerIndex === findNextActive(currentState.players, currentState.dealerIndex)) break

      const decision = getAIDecision(currentState, currentState.activePlayerIndex)
      const thinkTime = getAIThinkingTime(activePlayer.difficulty || 'medium')
      await new Promise(resolve => setTimeout(resolve, thinkTime))

      currentState = applyAction(currentState, currentState.activePlayerIndex, decision.action, decision.raiseAmount)
      setGameState({ ...currentState })

      // Check if only one non-folded remains
      if (getNonFoldedPlayers(currentState).length <= 1) break

      // Check if we've come back around and betting is complete
      if (isBettingComplete(currentState)) break
    }

    processingRef.current = false
    setIsProcessing(false)
    return currentState
  }, [])

  const handlePlayerAction = useCallback(async (action: PlayerAction, raiseAmount?: number) => {
    if (!gameState || isProcessing) return

    let newState = applyAction(gameState, gameState.activePlayerIndex, action, raiseAmount)
    setGameState(newState)

    // Check if only one player remains
    const nonFolded = getNonFoldedPlayers(newState)
    if (nonFolded.length <= 1) {
      resolveHand(newState)
      return
    }

    // Process AI turns
    newState = await processAITurns(newState)

    // Check again after AI
    if (getNonFoldedPlayers(newState).length <= 1) {
      resolveHand(newState)
      return
    }

    // Check if betting round is complete
    if (isBettingComplete(newState)) {
      if (newState.currentPhase === 'river') {
        resolveHand(newState)
      } else {
        newState = advancePhase(newState, deckRef.current)
        setGameState(newState)

        // Process AI if they go first in new round
        const nextPlayer = newState.players[newState.activePlayerIndex]
        if (nextPlayer && nextPlayer.type === 'ai' && !nextPlayer.isFolded && !nextPlayer.isAllIn) {
          newState = await processAITurns(newState)
          if (getNonFoldedPlayers(newState).length <= 1) {
            resolveHand(newState)
            return
          }
          if (isBettingComplete(newState)) {
            if (newState.currentPhase === 'river') {
              resolveHand(newState)
            } else {
              newState = advancePhase(newState, deckRef.current)
              setGameState(newState)
            }
          }
        }
      }
    }
  }, [gameState, isProcessing, processAITurns])

  const resolveHand = useCallback((state: GameState) => {
    // If we haven't dealt all community cards, do it now for showdown
    let finalState = { ...state, players: state.players.map(p => ({ ...p })) }
    while (finalState.communityCards.length < 5 && getNonFoldedPlayers(finalState).length > 1) {
      finalState = advancePhase(finalState, deckRef.current)
    }
    finalState.currentPhase = 'showdown'

    const result = determineWinners(finalState)
    const winnerInfos: WinnerInfo[] = result.map(w => ({
      playerId: w.playerId,
      amount: w.amount,
      handDescription: w.hand.description,
    }))

    // Apply winnings
    for (const w of result) {
      const player = finalState.players.find(p => p.id === w.playerId)
      if (player) player.chips += w.amount
    }

    // Update stats
    const playerWon = result.some(w => w.playerId === 'player')
    setSessionStats(prev => ({
      handsPlayed: prev.handsPlayed + 1,
      handsWon: prev.handsWon + (playerWon ? 1 : 0),
      biggestPot: Math.max(prev.biggestPot, state.pot),
      bestHand: result.find(w => w.playerId === 'player')?.hand.rank || prev.bestHand,
      chipHistory: [...prev.chipHistory, finalState.players.find(p => p.id === 'player')?.chips || 0],
    }))

    // Add to history
    const playerData = finalState.players.find(p => p.id === 'player')!
    setHandHistory(prev => [...prev, {
      handNumber: finalState.handNumber,
      playerCards: playerData.holeCards,
      communityCards: finalState.communityCards,
      result: playerWon ? 'win' : 'loss',
      potSize: state.pot,
      handRank: result.find(w => w.playerId === 'player')?.hand.rank,
    }])

    setGameState(finalState)
    setWinners(winnerInfos)
    setShowingResult(true)
  }, [])

  const nextHand = useCallback(() => {
    if (!gameState) return
    setShowingResult(false)
    setWinners(null)

    // Check if player is out
    const player = gameState.players.find(p => p.id === 'player')
    if (!player || player.chips <= 0) {
      setScreen('gameover')
      return
    }

    // Remove eliminated AI players
    const activePlayers = gameState.players.filter(p => p.chips > 0)
    if (activePlayers.length <= 1) {
      setScreen('gameover')
      return
    }

    const newState = startNewHand(
      { ...gameState, players: activePlayers },
      deckRef.current
    )
    setGameState(newState)

    // If first to act is AI, process
    const firstPlayer = newState.players[newState.activePlayerIndex]
    if (firstPlayer && firstPlayer.type === 'ai') {
      processAITurns(newState)
    }
  }, [gameState, processAITurns])

  return {
    screen, setScreen, gameState, winners, isProcessing,
    handHistory, sessionStats, showingResult,
    startGame, handlePlayerAction, nextHand,
    callAmount: gameState ? getCallAmount(gameState, gameState.activePlayerIndex) : 0,
    canCheckNow: gameState ? canCheck(gameState, gameState.activePlayerIndex) : false,
  }
}
