import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://battleship-q6f4.onrender.com'

// Create socket connection
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket']
})

// Make socket available globally
window.socket = socket

export default socket 