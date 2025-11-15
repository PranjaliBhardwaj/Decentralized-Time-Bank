import React from 'react'
import { useAccount } from 'wagmi'
import type { ListingRecord } from '../lib/types'
import { CONTRACTS } from '../lib/contracts'

export default function MyServices() {
  const { address, isConnected } = useAccount()
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [rate, setRate] = React.useState("1")
  const [contactMethod, setContactMethod] = React.useState("")
  const [skills, setSkills] = React.useState("")
  const [items, setItems] = React.useState<ListingRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const backend = CONTRACTS.sepolia.backendBaseUrl

  React.useEffect(() => {
    // Fetch user's listings from MongoDB instead of localStorage
    if (!address) {
      setItems([])
      return
    }

    const fetchMyListings = async () => {
      try {
        const response = await fetch(`${backend}/api/listings`)
        const data = await response.json()
        const myListings = (data.listings || []).filter(
          (l: ListingRecord) => l.owner?.toLowerCase() === address.toLowerCase()
        )
        setItems(myListings)
      } catch (err) {
        console.error('Failed to fetch listings:', err)
        setItems([])
      }
    }

    fetchMyListings()
  }, [address, backend])

  const add = () => {
    setLoading(true)
    fetch(`${backend}/api/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        ratePerHour: Number(rate),
        contactMethod,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        owner: address,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((res) => {
        if (!address) return
        const entry: ListingRecord = {
          ...res.listing,
          cid: res.cid,
          createdAt: res.listing.createdAt || new Date().toISOString(),
        }
        setItems((prev) => {
          const next = [entry, ...prev]
          return next
        })
        window.dispatchEvent(new Event("tb-listing-updated"))
        setTitle("")
        setDescription("")
        setCategory("")
        setRate("1")
        setContactMethod("")
        setSkills("")
      })
      .catch((err) => {
        console.error("Listing upload failed:", err)
        alert("Failed to save listing. Check backend logs.")
      })
      .finally(() => setLoading(false))
  }

  const [deleting, setDeleting] = React.useState<string | null>(null)

  const remove = async (cid: string, owner: string) => {
    if (!address) {
      alert('Please connect your wallet')
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

      // Remove from state
      setItems((prev) => {
        return prev.filter((i) => i.cid !== cid)
      })

      // Refresh global listings
      window.dispatchEvent(new Event("tb-listing-updated"))
      alert('Listing deleted successfully')
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert(err.message || 'Failed to delete listing')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Services</h2>
      {!isConnected ? (
        <div className="card text-neutral-400">Connect your wallet to manage services.</div>
      ) : (
        <>
          <div className="card space-y-3">
            <div className="text-sm text-neutral-400">Create a service listing (stored in MongoDB)</div>
            <input className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" placeholder="Title (e.g., Web Design)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" placeholder="Category (e.g., Design)" value={category} onChange={(e) => setCategory(e.target.value)} />
            <div className="flex flex-col gap-2">
              <label className="text-sm text-neutral-400">Rate (TTK/hour)</label>
              <input className="w-32 bg-transparent border border-neutral-700 rounded px-3 py-2" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <input className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" placeholder="Contact method (email or handle)" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} />
            <input className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" placeholder="Skills (comma-separated)" value={skills} onChange={(e) => setSkills(e.target.value)} />
            <button className="btn-primary" onClick={add} disabled={loading}>
              {loading ? "Saving..." : "Add Listing"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {items.length === 0 ? (
              <div className="card text-sm text-neutral-400">No listings yet. Create one above!</div>
            ) : (
              items.map((i) => (
                <div key={i.cid} className="card space-y-2 animate-scale-in">
                  <div className="font-semibold text-lg text-indigo-300">{i.title}</div>
                  <div className="text-sm text-neutral-400">{i.category}</div>
                  <div className="text-sm text-neutral-300">{i.description}</div>
                  <div className="text-sm">Rate: {i.ratePerHour} TTK/hour</div>
                  <div className="text-sm text-neutral-400">Contact: {i.contactMethod}</div>
                  {i.skills && i.skills.length > 0 && (
                    <div className="text-xs text-neutral-400">Skills: {i.skills.join(", ")}</div>
                  )}
                  <div className="flex justify-between items-center text-xs text-neutral-500">
                    <span>{new Date(i.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="pt-2">
                    <button
                      className="btn-primary bg-red-600 hover:bg-red-700 w-full"
                      onClick={() => remove(i.cid, i.owner)}
                      disabled={deleting === i.cid}
                    >
                      {deleting === i.cid ? 'Deleting...' : 'Delete Listing'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}



