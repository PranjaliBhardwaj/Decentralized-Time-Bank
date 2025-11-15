import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { CONTRACTS } from '../lib/contracts'
import { Chat } from '../components/Chat'
import { VideoCall } from '../components/VideoCall'

interface Conversation {
  roomId: string
  otherUser: string
  lastMessage: {
    message: string
    timestamp: string
    type?: string
  } | null
  lastUpdated: string
  messageCount: number
}

export default function ChatMenu() {
  const { address, isConnected } = useAccount()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<{ user: string; title?: string } | null>(null)
  const [selectedVideoCall, setSelectedVideoCall] = useState<{ user: string; title?: string } | null>(null)
  const backend = CONTRACTS.sepolia.backendBaseUrl

  const fetchConversations = React.useCallback(async (retryCount = 0, forceRefresh = false) => {
    if (!address) {
      setConversations([])
      setLoading(false)
      return
    }

    const maxRetries = 3
    setLoading(true)
    try {
      // Add cache-busting parameter if forcing refresh
      const url = forceRefresh 
        ? `${backend}/api/chat/conversations/${address}?t=${Date.now()}`
        : `${backend}/api/chat/conversations/${address}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch conversations`)
      }
      
      const data = await response.json()
      const conversationsCount = data.conversations?.length || 0
      console.log('[ChatMenu] Fetched conversations:', conversationsCount, 'items:', data.conversations ? `Array(${conversationsCount})` : 'null/undefined')
      
      // Ensure we always set an array
      const conversationsArray = Array.isArray(data.conversations) ? data.conversations : []
      setConversations(conversationsArray)
      setLoading(false)
      
      if (forceRefresh && conversationsArray.length === 0) {
        console.warn('[ChatMenu] Force refresh returned empty array - may indicate database fetch issue or no conversations exist')
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error)
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        setTimeout(() => {
          fetchConversations(retryCount + 1, forceRefresh)
        }, 1000 * (retryCount + 1))
      } else {
        setConversations([])
        setLoading(false)
      }
    }
  }, [address, backend])

  useEffect(() => {
    fetchConversations()
    
    // Only refresh when window regains focus (user returns to tab)
    const handleFocus = () => {
      fetchConversations()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchConversations])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const shorten = (addr: string) => {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Chat</h2>
        <div className="card text-neutral-400">Please connect your wallet to view your conversations.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold animate-fade-in">Chat</h2>
        <button
          className="btn-primary text-sm"
          onClick={() => fetchConversations(0, true)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="card text-neutral-400 animate-pulse-slow">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="card text-neutral-400">
          <p className="mb-2">No conversations yet.</p>
          <p className="text-sm text-neutral-500">Start chatting with service providers from the Marketplace!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv, idx) => (
            <div
              key={conv.roomId}
              className="card hover:border-indigo-500 transition-all duration-300 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => setSelectedChat({ user: conv.otherUser })}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {conv.otherUser.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{shorten(conv.otherUser)}</div>
                      {conv.lastMessage && (
                        <div className="text-sm text-neutral-400 truncate max-w-md">
                          {conv.lastMessage.type === 'video-call' && <span className="text-green-400">[Video Call] </span>}
                          {conv.lastMessage.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-neutral-500">
                    {conv.lastMessage ? formatTime(conv.lastMessage.timestamp) : formatTime(conv.lastUpdated)}
                  </div>
                  {conv.messageCount > 0 && (
                    <div className="text-xs text-neutral-400">
                      {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedVideoCall({ user: conv.otherUser })
                      }}
                      className="btn-primary text-xs px-3 py-1 bg-green-600 hover:bg-green-700"
                    >
                      Call
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {selectedChat && (
        <Chat
          otherUser={selectedChat.user}
          listingTitle={selectedChat.title}
          onClose={() => setSelectedChat(null)}
        />
      )}

      {/* Video Call Modal */}
      {selectedVideoCall && (
        <VideoCall
          otherUser={selectedVideoCall.user}
          listingTitle={selectedVideoCall.title}
          onClose={() => setSelectedVideoCall(null)}
        />
      )}
    </div>
  )
}

