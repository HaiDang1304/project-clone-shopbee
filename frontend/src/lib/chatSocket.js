import { io } from 'socket.io-client'

import { getAuthToken } from './auth'

const SOCKET_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

let socket = null

export function getChatSocket() {
  const token = getAuthToken()

  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token },
    })
  } else {
    socket.auth = { token }
  }

  if (token && !socket.connected) socket.connect()
  return socket
}

export function disconnectChatSocket() {
  if (!socket) return
  socket.disconnect()
}
