import { useGameEngine } from './hooks/useGameEngine'
import MainMenu from './components/Menu/MainMenu'
import GameSetup from './components/Menu/GameSetup'
import GameScreen from './components/Game/GameScreen'
import GameOver from './components/Game/GameOver'
import Tutorial from './components/Tutorial/Tutorial'

function App() {
  const {
    screen, setScreen, gameState, winners, isProcessing,
    sessionStats, showingResult, showdownInfo,
    startGame, handlePlayerAction, nextHand, handleMuckShow,
    callAmount, canCheckNow,
  } = useGameEngine()

  return (
    <div className="app">
      {screen === 'menu' && (
        <MainMenu
          onPlay={() => setScreen('setup')}
          onTutorial={() => setScreen('tutorial')}
          onStats={() => setScreen('stats')}
        />
      )}

      {screen === 'setup' && (
        <GameSetup
          onStart={startGame}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'game' && gameState && (
        <GameScreen
          gameState={gameState}
          winners={winners}
          isProcessing={isProcessing}
          showingResult={showingResult}
          showdownInfo={showdownInfo}
          callAmount={callAmount}
          canCheck={canCheckNow}
          onAction={handlePlayerAction}
          onNextHand={nextHand}
          onMuckShow={handleMuckShow}
          onQuit={() => setScreen('menu')}
        />
      )}

      {screen === 'gameover' && (
        <GameOver
          stats={sessionStats}
          playerChips={gameState?.players.find(p => p.id === 'player')?.chips || 0}
          onPlayAgain={() => setScreen('setup')}
          onMenu={() => setScreen('menu')}
        />
      )}

      {screen === 'tutorial' && (
        <Tutorial onBack={() => setScreen('menu')} />
      )}
    </div>
  )
}

export default App
