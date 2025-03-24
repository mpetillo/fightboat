import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://battleship-q6f4.onrender.com'

function App() {
  const [socket, setSocket] = useState(null)
  const [gameState, setGameState] = useState('initial') // initial, new, join, waiting, ready
  const [error, setError] = useState(null)
  const [partyCode, setPartyCode] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [shipCount, setShipCount] = useState(5)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
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

  return (
    <div className="app">
      <h1>Fightboat</h1>
      
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
          <h2>Game Started!</h2>
          {/* Game components will go here */}
        </div>
      )}
    </div>
  )
}

export default App 