import { io } from 'socket.io-client'

// Use the current hostname for the server URL
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : 'https://battleship-q6f4.onrender.com'

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