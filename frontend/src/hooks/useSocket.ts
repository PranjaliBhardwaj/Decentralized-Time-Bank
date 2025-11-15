import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { CONTRACTS } from '../lib/contracts'

const socketUrl = CONTRACTS.sepolia.backendBaseUrl || 'http://localhost:4000'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    })

    newSocket.on('connect', () => {
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    newSocket.on('reconnect', () => {
      setConnected(true)
    })

    newSocket.on('reconnect_attempt', () => {
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  return { socket, connected }
}

// Helper function to create room ID from two addresses
export function createRoomId(address1: string, address2: string): string {
  const sorted = [address1.toLowerCase(), address2.toLowerCase()].sort()
  return `${sorted[0]}_${sorted[1]}`
}

