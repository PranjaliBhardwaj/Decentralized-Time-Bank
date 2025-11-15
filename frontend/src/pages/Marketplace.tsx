import React from 'react'
import { useAccount } from 'wagmi'
import { useListingsFeed } from '../state/listings'
import { CONTRACTS } from '../lib/contracts'
import { Chat } from '../components/Chat'
import { VideoCall } from '../components/VideoCall'

export default function Marketplace() {
  const { address } = useAccount()
  const { listings, loading, error, refresh } = useListingsFeed()
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [chatOpen, setChatOpen] = React.useState<{ owner: string; title: string } | null>(null)
  const [videoCallOpen, setVideoCallOpen] = React.useState<{ owner: string; title: string } | null>(null)
  const backend = CONTRACTS.sepolia.backendBaseUrl

  const handleDelete = async (cid: string, owner: string) => {
    if (!address) {
      alert('Please connect your wallet to delete listings')
      return
    }

    if (address.toLowerCase() !== owner.toLowerCase()) {
      alert('You can only delete your own listings')
      return
    }

    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    setDeleting(cid)
    try {
      const response = await fetch(`${backend}/api/listings/${cid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: address }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete listing')
      }

      // Refresh listings
      window.dispatchEvent(new Event('tb-listing-updated'))
      alert('Listing deleted successfully')
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert(err.message || 'Failed to delete listing')
    } finally {
      setDeleting(null)
    }
  }

  const handleRefresh = async () => {
    console.log('[Marketplace] Refresh button clicked')
    // Call the refresh function which will force a fresh fetch with cache-busting
    // This will trigger a GET with ?t=timestamp which forces backend refresh
    // The refresh function handles all errors gracefully and sets error state
    await refresh()
    console.log('[Marketplace] Refresh completed')
  }

  return (
    <div className="space-y-4 page-enter">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold animate-fade-in">Skill Marketplace</h2>
        <button 
          className="btn-primary text-sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Listings'}
        </button>
      </div>
      {loading ? (
        <div className="card text-neutral-400 text-sm animate-pulse-slow">
          <div className="flex items-center gap-2">
            <span>Loading listings...</span>
            <span className="text-xs text-neutral-500">(Fetching from database)</span>
          </div>
        </div>
      ) : error ? (
        <div className="card text-red-400 text-sm">
          <p>Error: {error}</p>
          <p className="text-xs text-neutral-500 mt-2">Check backend logs and ensure MongoDB is connected.</p>
          <button className="btn-primary mt-2 text-sm" onClick={refresh}>Retry</button>
          <a 
            href={`${backend}/api/test-db`} 
            target="_blank"
            rel="noreferrer"
            className="block mt-2 text-xs text-indigo-400 hover:underline"
          >
            Test Database Connection
          </a>
        </div>
      ) : listings.length === 0 ? (
        <div className="card text-neutral-400 text-sm animate-fade-in">
          <p>No listings published yet.</p>
          <p className="text-xs text-neutral-500 mt-2">Create a listing in "My Services" to get started.</p>
          <p className="text-xs text-neutral-500 mt-2">Click "Refresh Listings" if you just created a new listing.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {listings.map((listing, idx) => {
            const isOwner = address && listing.owner && address.toLowerCase() === listing.owner.toLowerCase()
            return (
              <div
                key={listing.cid}
                className="card space-y-2 animate-scale-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-semibold text-indigo-300">{listing.title}</div>
                    <div className="text-xs text-neutral-400">{listing.category}</div>
                  </div>
                  <div className="text-sm text-indigo-300 font-semibold">{listing.ratePerHour} TTK/hour</div>
                </div>
                <div className="text-sm text-neutral-300">{listing.description}</div>
                {listing.skills && listing.skills.length > 0 && (
                  <div className="text-xs text-neutral-400">Skills: {listing.skills.join(', ')}</div>
                )}
                <div className="text-xs text-neutral-400">Contact: {listing.contactMethod}</div>
                <div className="flex justify-between items-center text-xs text-neutral-500">
                  <span>Owner: {shorten(listing.owner)}</span>
                </div>
                {!isOwner && address && (
                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn-primary flex-1 text-sm"
                      onClick={() => setChatOpen({ owner: listing.owner, title: listing.title })}
                    >
                      Chat
                    </button>
                    <button
                      className="btn-primary flex-1 text-sm bg-green-600 hover:bg-green-700"
                      onClick={() => setVideoCallOpen({ owner: listing.owner, title: listing.title })}
                    >
                      Video Call
                    </button>
                  </div>
                )}
                {isOwner && (
                  <button
                    className="btn-primary bg-red-600 hover:bg-red-700 text-sm w-full"
                    onClick={() => handleDelete(listing.cid, listing.owner)}
                    disabled={deleting === listing.cid}
                  >
                    {deleting === listing.cid ? 'Deleting...' : 'Delete Listing'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && (
        <Chat
          otherUser={chatOpen.owner}
          listingTitle={chatOpen.title}
          onClose={() => setChatOpen(null)}
        />
      )}

      {/* Video Call Modal */}
      {videoCallOpen && (
        <VideoCall
          otherUser={videoCallOpen.owner}
          listingTitle={videoCallOpen.title}
          onClose={() => setVideoCallOpen(null)}
        />
      )}
    </div>
  )
}

function shorten(address?: string) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}


