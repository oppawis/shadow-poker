import { useState, useCallback, useRef } from 'react'
import { GameState, AIDifficulty, PlayerAction, HandHistoryEntry, SessionStats } from '../types'
import { DeckManager } from '../engine/poker/deck'
import {
  createInitialState, startNewHand, advancePhase,
  applyAction, getCallAmount, canCheck,
  isBettingComplete, determineWinners, getNonFoldedPlayers, findNextActive
} from '../engine/poker/gameState'
import { getAIDecision, getAIThinkingTime } from '../engine/ai/aiEngine'
import { evaluateHand } from '../engine/poker/handEvaluator'

export type GameScreen = 'menu' | 'setup' | 'game' | 'tutorial' | 'stats' | 'gameover'

interface WinnerInfo {
  playerId: string
  amount: number
  handDescription: string
}

export interface ShowdownInfo {
  [playerId: string]: {
    revealed: boolean
    handDescription: string
    isWinner: boolean
  }
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
  const [showdownInfo, setShowdownInfo] = useState<ShowdownInfo>({})

  const deckRef = useRef(new DeckManager())
  const processingRef = useRef(false)

  const resolveHand = useCallback((state: GameState) => {
    let finalState = { ...state, players: state.players.map(p => ({ ...p })), actedThisRound: new Set(state.actedThisRound) }
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

    for (const w of result) {
      const player = finalState.players.find(p => p.id === w.playerId)
      if (player) player.chips += w.amount
    }

    const playerWon = result.some(w => w.playerId === 'player')
    setSessionStats(prev => ({
      handsPlayed: prev.handsPlayed + 1,
      handsWon: prev.handsWon + (playerWon ? 1 : 0),
      biggestPot: Math.max(prev.biggestPot, state.pot),
      bestHand: result.find(w => w.playerId === 'player')?.hand.rank || prev.bestHand,
      chipHistory: [...prev.chipHistory, finalState.players.find(p => p.id === 'player')?.chips || 0],
    }))

    const playerData = finalState.players.find(p => p.id === 'player')!
    setHandHistory(prev => [...prev, {
      handNumber: finalState.handNumber,
      playerCards: playerData.holeCards,
      communityCards: finalState.communityCards,
      result: playerWon ? 'win' : 'loss',
      potSize: state.pot,
      handRank: result.find(w => w.playerId === 'player')?.hand.rank,
    }])

    // Build showdown info - who shows/mucks
    const winnerIds = new Set(result.map(w => w.playerId))
    const sdInfo: ShowdownInfo = {}
    const nonFolded = getNonFoldedPlayers(finalState)

    for (const p of nonFolded) {
      const hand = evaluateHand(p.holeCards, finalState.communityCards)
      if (winnerIds.has(p.id)) {
        // Winners always show
        sdInfo[p.id] = { revealed: true, handDescription: hand.description, isWinner: true }
      } else if (p.type === 'ai') {
        // AI losers: ~40% show, 60% muck
        const willShow = Math.random() < 0.4
        sdInfo[p.id] = { revealed: willShow, handDescription: hand.description, isWinner: false }
      } else {
        // Human loser: pending choice (default to not revealed)
        sdInfo[p.id] = { revealed: false, handDescription: hand.description, isWinner: false }
      }
    }

    setShowdownInfo(sdInfo)
    setGameState(finalState)
    setWinners(winnerInfos)
    setShowingResult(true)
  }, [])

  // Main game loop: processes AI turns, advances phases, until human's turn or hand ends
  const runGameLoop = useCallback(async (state: GameState): Promise<GameState> => {
    let currentState = state
    let iterations = 0

    while (iterations++ < 100) {
      // Check if only one player remains
      if (getNonFoldedPlayers(currentState).length <= 1) {
        resolveHand(currentState)
        return currentState
      }

      // Check if betting round is complete
      if (isBettingComplete(currentState)) {
        if (currentState.currentPhase === 'river') {
          resolveHand(currentState)
          return currentState
        }
        currentState = advancePhase(currentState, deckRef.current)
        setGameState({ ...currentState })
      }

      const activePlayer = currentState.players[currentState.activePlayerIndex]

      // If it's the human's turn, stop and wait for input
      if (activePlayer.type === 'human' && !activePlayer.isFolded && !activePlayer.isAllIn) {
        setGameState({ ...currentState })
        break
      }

      // If active player can't act, skip
      if (activePlayer.isFolded || activePlayer.isAllIn) {
        currentState = {
          ...currentState,
          activePlayerIndex: findNextActive(currentState.players, currentState.activePlayerIndex),
        }
        continue
      }

      // AI player's turn
      const decision = getAIDecision(currentState, currentState.activePlayerIndex)
      const thinkTime = getAIThinkingTime(activePlayer.difficulty || 'medium')
      await new Promise(resolve => setTimeout(resolve, thinkTime))

      currentState = applyAction(currentState, currentState.activePlayerIndex, decision.action, decision.raiseAmount)
      setGameState({ ...currentState })
    }

    return currentState
  }, [resolveHand])

  const startGame = useCallback(async (numOpponents: number, difficulty: AIDifficulty, playerName?: string) => {
    const state = createInitialState(numOpponents, difficulty, playerName)
    const newState = startNewHand(state, deckRef.current)
    setGameState(newState)
    setScreen('game')
    setWinners(null)
    setShowdownInfo({})
    setHandHistory([])
    setSessionStats({ handsPlayed: 0, handsWon: 0, biggestPot: 0, bestHand: null, chipHistory: [1000] })

    const firstPlayer = newState.players[newState.activePlayerIndex]
    if (firstPlayer && firstPlayer.type === 'ai') {
      processingRef.current = true
      setIsProcessing(true)
      try {
        await runGameLoop(newState)
      } finally {
        processingRef.current = false
        setIsProcessing(false)
      }
    }
  }, [runGameLoop])

  const handlePlayerAction = useCallback(async (action: PlayerAction, raiseAmount?: number) => {
    if (!gameState || processingRef.current) return

    processingRef.current = true
    setIsProcessing(true)

    try {
      const newState = applyAction(gameState, gameState.activePlayerIndex, action, raiseAmount)
      setGameState(newState)
      await runGameLoop(newState)
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [gameState, runGameLoop])

  const handleMuckShow = useCallback((show: boolean) => {
    setShowdownInfo(prev => ({
      ...prev,
      player: prev.player ? { ...prev.player, revealed: show } : prev.player,
    }))
  }, [])

  const nextHand = useCallback(async () => {
    if (!gameState) return
    setShowingResult(false)
    setWinners(null)
    setShowdownInfo({})

    const player = gameState.players.find(p => p.id === 'player')
    if (!player || player.chips <= 0) {
      setScreen('gameover')
      return
    }

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

    const firstPlayer = newState.players[newState.activePlayerIndex]
    if (firstPlayer && firstPlayer.type === 'ai') {
      processingRef.current = true
      setIsProcessing(true)
      try {
        await runGameLoop(newState)
      } finally {
        processingRef.current = false
        setIsProcessing(false)
      }
    }
  }, [gameState, runGameLoop])

  return {
    screen, setScreen, gameState, winners, isProcessing,
    handHistory, sessionStats, showingResult, showdownInfo,
    startGame, handlePlayerAction, nextHand, handleMuckShow,
    callAmount: gameState ? getCallAmount(gameState, gameState.activePlayerIndex) : 0,
    canCheckNow: gameState ? canCheck(gameState, gameState.activePlayerIndex) : false,
  }
}
