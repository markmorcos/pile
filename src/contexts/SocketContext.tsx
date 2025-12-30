'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

// Global socket instance - survives hot reloads
let socket: Socket | null = null
let currentRoom: string | null = null

function initSocket() {
  if (socket) return socket

  console.log('[Socket] Initializing...')

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
  
  socket = io(socketUrl, {
    path: '/socket.io',
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected:', socket?.id)
    // Auto-rejoin room on reconnect
    if (currentRoom) {
      console.log('[Socket] Auto-rejoining room:', currentRoom)
      socket?.emit('join:profile', currentRoom)
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] ❌ Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error)
  })

  return socket
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const s = initSocket()
    
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    
    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    
    setIsConnected(s.connected)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

// Simple hook to join a profile room
export function useProfileRoom(profileId: string | undefined) {
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (!socket || !isConnected || !profileId) return

    console.log('[Socket] Joining room:', profileId)
    currentRoom = profileId
    socket.emit('join:profile', profileId)

    return () => {
      console.log('[Socket] Leaving room:', profileId)
      socket.emit('leave:profile', profileId)
      if (currentRoom === profileId) {
        currentRoom = null
      }
    }
  }, [socket, isConnected, profileId])
}

