import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://battleship-q6f4.onrender.com'

// Create socket connection with error handling
let socket

try {
  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
    autoConnect: true
  })

  // Add connection event listeners
  socket.on('connect', () => {
    console.log('Socket connected successfully')
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })

  // Make socket available globally
  window.socket = socket
} catch (error) {
  console.error('Failed to initialize socket:', error)
}

export default socket 