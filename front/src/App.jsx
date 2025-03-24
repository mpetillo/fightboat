import React, { useState, useEffect } from 'react'
import GameBoard from './components/GameBoard'
import './App.css'
import socket from './connection'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://battleship-q6f4.onrender.com'

function App() {
  const [gameState, setGameState] = useState('menu')
  const [error, setError] = useState('')
  const [partyCode, setPartyCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isPlayerTurn, setIsPlayerTurn] = useState(false)
  const [playerBoard, setPlayerBoard] = useState(Array(10).fill().map(() => Array(10).fill(null)))
  const [opponentBoard, setOpponentBoard] = useState(Array(10).fill().map(() => Array(10).fill(null)))
  const [isConnected, setIsConnected] = useState(false)
  const [isSetupPhase, setIsSetupPhase] = useState(false)
  const [placedShips, setPlacedShips] = useState(0)
  const [copyButtonText, setCopyButtonText] = useState('Copy Code')

  useEffect(() => {
    // Wait for socket to be ready
    const waitForSocket = () => {
      return new Promise((resolve) => {
        if (window.socket) {
          resolve(window.socket)
        } else {
          const checkSocket = setInterval(() => {
            if (window.socket) {
              clearInterval(checkSocket)
              resolve(window.socket)
            }
          }, 100)
        }
      })
    }

    const setupSocket = async () => {
      try {
        const socket = await waitForSocket()
        
        socket.on('connect', () => {
          console.log('Connected to server with socket ID:', socket.id)
          setIsConnected(true)
          setError(null)
        })

        socket.on('disconnect', () => {
          console.log('Disconnected from server')
          setIsConnected(false)
        })

        socket.on('partyCreated', (code) => {
          console.log('Party created with code:', code)
          setPartyCode(code)
          setGameState('waiting')
        })

        socket.on('partyJoined', (code) => {
          console.log('Successfully joined party:', code)
          setPartyCode(code)
          setGameState('setup')
        })

        socket.on('gameStart', () => {
          console.log('Game started')
          setGameState('playing')
        })

        socket.on('turnUpdate', ({ isPlayerTurn }) => {
          console.log('Turn updated:', isPlayerTurn)
          setIsPlayerTurn(isPlayerTurn)
        })

        socket.on('boardUpdate', ({ playerBoard, opponentBoard }) => {
          console.log('Board updated')
          setPlayerBoard(playerBoard)
          setOpponentBoard(opponentBoard)
        })

        socket.on('error', (error) => {
          console.error('Socket error:', error)
          setError(error)
        })
      } catch (error) {
        console.error('Error setting up socket:', error)
        setError('Failed to connect to server')
      }
    }

    setupSocket()

    return () => {
      if (window.socket) {
        window.socket.disconnect()
      }
    }
  }, [])

  const handleCreateParty = async () => {
    try {
      console.log('Creating party...')
      window.socket.emit('createParty')
    } catch (error) {
      console.error('Error creating party:', error)
      setError('Failed to create party')
    }
  }

  const handleJoinParty = async (code) => {
    try {
      console.log('Attempting to join party:', code)
      window.socket.emit('tryJoinParty', code)
    } catch (error) {
      console.error('Error joining party:', error)
      setError('Failed to join party')
    }
  }

  const handleCellClick = (row, col, isPlayerBoard) => {
    if (!isPlayerTurn) return
    
    window.socket.emit('makeMove', { row, col })
  }

  const handleShipPlacement = (ships) => {
    window.socket.emit('shipsPlaced', ships)
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
      
      {gameState === 'menu' && (
        <div className="menu">
          <button onClick={handleCreateParty}>Create New Game</button>
          <div className="join-game">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.trim())}
              placeholder="Enter Party Code"
              maxLength={6}
              autoComplete="off"
            />
            <button onClick={() => handleJoinParty(joinCode)}>Join Game</button>
          </div>
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

      {gameState === 'setup' && (
        <div className="setup">
          <h2>Setup Your Ships</h2>
          <GameBoard
            isPlayerBoard={true}
            board={playerBoard}
            isSetupPhase={true}
            onShipPlacement={handleShipPlacement}
            onCellClick={(row, col) => handleCellClick(row, col, true)}
          />
          <p>Placed Ships: {placedShips}/5</p>
          <button onClick={() => setGameState('playing')}>Start Game</button>
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
              onCellClick={(row, col) => handleCellClick(row, col, true)}
            />
            <GameBoard
              isPlayerBoard={false}
              board={opponentBoard}
              isSetupPhase={false}
              onCellClick={(row, col) => handleCellClick(row, col, false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App 