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
  const [copyButtonText, setCopyButtonText] = useState('Copy Code')

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
      console.log('Received createParty response:', data)
      if (data.status === "Success" && data.matchId) {
        console.log('Setting party code:', data.matchId)
        setPartyCode(data.matchId)
        setGameState('waiting')
      } else {
        console.error('Invalid createParty response:', data)
        setError('Failed to create game. Please try again.')
      }
    })

    newSocket.on('joinParty', (data) => {
      console.log('Received joinParty response:', data)
      if (data.status === "Success") {
        setGameState('ready')
      } else {
        setError('Failed to join game. Please check the code and try again.')
      }
    })

    newSocket.on('startRound', (data) => {
      console.log('Received startRound response:', data)
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
      console.log('Emitting tryCreateParty')
      socket.emit('tryCreateParty')
      setGameState('new')
    } else {
      setError('Not connected to server. Please refresh the page.')
    }
  }

  const handleJoinParty = () => {
    if (socket && joinCode) {
      console.log('Emitting tryJoinParty with code:', joinCode)
      socket.emit('tryJoinParty', joinCode.toUpperCase())
      setGameState('join')
    } else {
      setError('Please enter a valid party code.')
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

  const handleCopyCode = async () => {
    if (partyCode) {
      try {
        await navigator.clipboard.writeText(partyCode)
        setCopyButtonText('Copied!')
        setTimeout(() => setCopyButtonText('Copy Code'), 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
        setError('Failed to copy code. Please try again.')
      }
    } else {
      setError('No party code available. Please create a new game.')
    }
  }

  // Debug render for party code
  console.log('Current party code:', partyCode)
  console.log('Current game state:', gameState)

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
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
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
          {partyCode ? (
            <div className="party-code">
              <h3>Share this code with your opponent:</h3>
              <div className="code">{partyCode}</div>
              <button className="copy-button" onClick={handleCopyCode}>
                {copyButtonText}
              </button>
            </div>
          ) : (
            <p>Generating party code...</p>
          )}
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
          {partyCode ? (
            <div className="party-code">
              <h3>Your party code:</h3>
              <div className="code">{partyCode}</div>
              <button className="copy-button" onClick={handleCopyCode}>
                {copyButtonText}
              </button>
            </div>
          ) : (
            <p>No party code available. Please create a new game.</p>
          )}
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