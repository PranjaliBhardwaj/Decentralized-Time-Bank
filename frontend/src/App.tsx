import { Route, Routes, BrowserRouter } from 'react-router-dom'
import React from 'react'
import { useAccount } from 'wagmi'
import { useSocket, createRoomId } from './hooks/useSocket'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import Escrow from './pages/Escrow'
import EscrowHistory from './pages/EscrowHistory'
import MyServices from './pages/MyServices'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import ChatMenu from './pages/ChatMenu'
import { VideoCall } from './components/VideoCall'

function GlobalVideoCallListener() {
  const { address } = useAccount()
  const { socket } = useSocket()
  const [incomingCall, setIncomingCall] = React.useState<{ from: string; title: string } | null>(null)
  const [videoCallOpen, setVideoCallOpen] = React.useState<{ owner: string; title: string } | null>(null)

  // Listen for incoming video calls globally (works on all pages)
  React.useEffect(() => {
    if (!socket || !address) {
      console.log('[GlobalVideoCall] Cannot listen for calls:', { socket: !!socket, address: !!address })
      return
    }

    console.log('[GlobalVideoCall] Setting up global video call listener')

    const handleCallStatus = (data: { status: string; sender: string; roomId?: string }) => {
      console.log('[GlobalVideoCall] 📞 Received video-call-status:', data)
      const normalizedSender = data.sender?.toLowerCase()
      const normalizedAddress = address.toLowerCase()
      
      // Only handle calls meant for this user
      if (normalizedSender === normalizedAddress) {
        console.log('[GlobalVideoCall] Ignoring own call status update')
        return // Ignore own status updates
      }
      
      // If roomId is provided, verify we're in the same room
      if (data.roomId) {
        const expectedRoomId = createRoomId(address, normalizedSender)
        if (data.roomId !== expectedRoomId) {
          console.log(`[GlobalVideoCall] ⚠️ Ignoring call from different room: ${data.roomId} vs ${expectedRoomId}`)
          return
        }
        console.log(`[GlobalVideoCall] ✅ Room ID matches: ${data.roomId}`)
      }
      
      console.log(`[GlobalVideoCall] 📞 Processing call status: ${data.status} from ${normalizedSender}`)
      
      if (data.status === 'calling') {
        console.log('[GlobalVideoCall] 🔔 Incoming call detected!')
        setIncomingCall({
          from: normalizedSender,
          title: 'Incoming Video Call'
        })
        console.log('[GlobalVideoCall] Set incoming call state')
        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/Dej0AKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3o9AChRetOnrqFUUCkaf4PK+bCEFK4HO8tmJNggZaLvv559NE')
          audio.volume = 0.3
          audio.play().catch(() => {})
        } catch (e) {
          // Ignore audio errors
        }
      } else if (data.status === 'ended' || data.status === 'answered') {
        console.log('[GlobalVideoCall] Call ended or answered, clearing incoming call')
        setIncomingCall(null)
      }
    }

    socket.on('video-call-status', handleCallStatus)
    console.log('[GlobalVideoCall] ✅ Registered global video-call-status listener')

    return () => {
      console.log('[GlobalVideoCall] Cleaning up global video call listener')
      socket.off('video-call-status', handleCallStatus)
    }
  }, [socket, address])

  return (
    <>
      {/* Incoming Call Notification - Global */}
      {incomingCall && !videoCallOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-4">📞</div>
              <h3 className="text-xl font-semibold mb-2">Incoming Video Call</h3>
              <p className="text-neutral-400 mb-4">{incomingCall.title}</p>
              <p className="text-xs text-neutral-500 mb-6">
                From: {incomingCall.from.slice(0, 6)}...{incomingCall.from.slice(-4)}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setVideoCallOpen({ owner: incomingCall.from, title: incomingCall.title })
                    setIncomingCall(null)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full"
                >
                  Answer
                </button>
                <button
                  onClick={() => {
                    if (socket && address) {
                      const roomId = createRoomId(address, incomingCall.from)
                      socket.emit('video-call-status', { roomId, status: 'ended', sender: address.toLowerCase() })
                    }
                    setIncomingCall(null)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal - Global */}
      {videoCallOpen && (
        <VideoCall
          otherUser={videoCallOpen.owner}
          listingTitle={videoCallOpen.title}
          onClose={() => setVideoCallOpen(null)}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <GlobalVideoCallListener />
      <div className="container-page py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/escrow" element={<Escrow />} />
          <Route path="/escrow-history" element={<EscrowHistory />} />
          <Route path="/my-services" element={<MyServices />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<ChatMenu />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}


