import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import GameBoard from './components/GameBoard'
import './App.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://battleship-q6f4.onrender.com'

function App() {
  const [socket, setSocket] = useState(null)
  const [gameState, setGameState] = useState('initial')
  const [error, setError] = useState(null)
  const [partyCode, setPartyCode] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [isPlayerTurn, setIsPlayerTurn] = useState(false)
  const [playerBoard, setPlayerBoard] = useState([])
  const [opponentBoard, setOpponentBoard] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isSetupPhase, setIsSetupPhase] = useState(false)
  const [placedShips, setPlacedShips] = useState(0)

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket']
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('createParty', (data) => {
      if (data.status === "Success") {
        setPartyCode(data.matchId)
        setGameState('waiting')
      }
    })

    newSocket.on('joinParty', (data) => {
      if (data.status === "Success") {
        setGameState('ready')
      }
    })

    newSocket.on('startRound', (data) => {
      if (data.status === "Success") {
        setGameState('playing')
        setIsSetupPhase(true)
        // Initialize empty boards
        setPlayerBoard(Array(10).fill().map(() => Array(10).fill('empty')))
        setOpponentBoard(Array(10).fill().map(() => Array(10).fill('empty')))
      }
    })

    newSocket.on('turnUpdate', (data) => {
      if (data.status === "Success") {
        setIsPlayerTurn(data.isPlayerTurn)
        if (data.playerBoard) setPlayerBoard(data.playerBoard)
        if (data.opponentBoard) setOpponentBoard(data.opponentBoard)
      }
    })

    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  const handleCreateParty = () => {
    if (socket) {
      socket.emit('tryCreateParty')
      setGameState('new')
    }
  }

  const handleJoinParty = () => {
    if (socket && joinCode) {
      socket.emit('tryJoinParty', joinCode.toUpperCase())
      setGameState('join')
    }
  }

  const handleStartGame = () => {
    if (socket) {
      socket.emit('tryStartRound')
    }
  }

  const handleCellClick = (row, col) => {
    if (socket && isPlayerTurn) {
      socket.emit('makeMove', { row, col })
    }
  }

  const handleShipPlacement = (newBoard, shipName) => {
    setPlayerBoard(newBoard)
    setPlacedShips(prev => prev + 1)
    
    // If all ships are placed (5 ships), end setup phase
    if (placedShips + 1 === 5) {
      setIsSetupPhase(false)
      socket.emit('shipsPlaced', { board: newBoard })
    }
  }

  return (
    <div className="app">
      <h1>FightBoat</h1>
      
      {error && <div className="error">{error}</div>}
      
      {gameState === 'initial' && (
        <div className="menu">
          <button onClick={handleCreateParty}>Create New Game</button>
          <div className="join-game">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter Party Code"
              maxLength={6}
            />
            <button onClick={handleJoinParty}>Join Game</button>
          </div>
        </div>
      )}

      {gameState === 'new' && (
        <div className="waiting">
          <h2>Game Created!</h2>
          <p>Share this code with your opponent: <strong>{partyCode}</strong></p>
          <p>Waiting for opponent to join...</p>
        </div>
      )}

      {gameState === 'join' && (
        <div className="waiting">
          <h2>Joining Game...</h2>
          <p>Please wait while we connect you to the game.</p>
        </div>
      )}

      {gameState === 'waiting' && (
        <div className="waiting">
          <h2>Waiting for Opponent</h2>
          <p>Your party code: <strong>{partyCode}</strong></p>
          <p>Waiting for opponent to join...</p>
        </div>
      )}

      {gameState === 'ready' && (
        <div className="ready">
          <h2>Game Ready!</h2>
          <button onClick={handleStartGame}>Start Game</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game">
          <div className="game-status">
            <h2>
              {isSetupPhase 
                ? `Place Your Ships (${placedShips}/5)`
                : isPlayerTurn 
                  ? "Your Turn!" 
                  : "Opponent's Turn"}
            </h2>
          </div>
          <div className="game-boards">
            <GameBoard
              isPlayerBoard={true}
              board={playerBoard}
              isSetupPhase={isSetupPhase}
              onShipPlacement={handleShipPlacement}
              onCellClick={() => {}}
            />
            <GameBoard
              isPlayerBoard={false}
              board={opponentBoard}
              isSetupPhase={false}
              onCellClick={handleCellClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App 