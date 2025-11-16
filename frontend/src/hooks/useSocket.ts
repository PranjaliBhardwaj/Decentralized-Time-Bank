import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { CONTRACTS } from '../lib/contracts'

const socketUrl = CONTRACTS.sepolia.backendBaseUrl || 'http://localhost:4000'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    console.log(`[Socket] 🔌 Connecting to: ${socketUrl}`)
    console.log(`[Socket] 📍 Backend URL from env: ${CONTRACTS.sepolia.backendBaseUrl}`)
    
    // Test backend connection first
    fetch(`${socketUrl}/health`)
      .then(res => res.json())
      .then(data => {
        console.log(`[Socket] ✅ Backend health check passed:`, data)
      })
      .catch(err => {
        console.error(`[Socket] ❌ Backend health check failed:`, err)
        console.error(`[Socket] ⚠️  Cannot reach backend at ${socketUrl}`)
        console.error(`[Socket] ⚠️  Make sure:`)
        console.error(`[Socket]    1. Backend server is running`)
        console.error(`[Socket]    2. Backend is listening on 0.0.0.0 (not just localhost)`)
        console.error(`[Socket]    3. Firewall allows connections on port 4000`)
        console.error(`[Socket]    4. VITE_BACKEND_URL is set correctly in frontend/.env`)
      })
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
    })

    newSocket.on('connect', () => {
      console.log(`[Socket] ✅ Connected! Socket ID: ${newSocket.id}`)
      setConnected(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log(`[Socket] ❌ Disconnected. Reason: ${reason}`)
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error(`[Socket] ❌ Connection error:`, error)
      setConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] ✅ Reconnected after ${attemptNumber} attempts`)
      setConnected(true)
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket] 🔄 Reconnection attempt ${attemptNumber}`)
      setConnected(false)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error(`[Socket] ❌ Reconnection error:`, error)
    })

    newSocket.on('reconnect_failed', () => {
      console.error(`[Socket] ❌ Reconnection failed!`)
      alert('Failed to connect to chat server. Please refresh the page.')
    })

    setSocket(newSocket)

    return () => {
      console.log(`[Socket] Cleaning up socket connection`)
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

