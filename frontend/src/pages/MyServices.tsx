import React from 'react'

type Listing = { id: string; title: string; description: string; rate: number; category?: string }

const KEY = 'tb_my_listings_v1'

export default function MyServices() {
  const [items, setItems] = React.useState<Listing[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  })
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [rate, setRate] = React.useState('1')

  React.useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const add = () => {
    if (!title || !rate) return
    const listing: Listing = { id: crypto.randomUUID(), title, description, rate: Number(rate) }
    setItems((s) => [listing, ...s])
    setTitle(''); setDescription(''); setRate('1')
  }

  const remove = (id: string) => setItems((s) => s.filter(i => i.id !== id))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Services</h2>
      <div className="card space-y-3">
        <div className="text-sm text-neutral-400">Create a service listing (local only for now)</div>
        <input className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" placeholder="Title (e.g., Web Design)" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <textarea className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2" placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
        <div className="flex gap-2 items-center">
          <span className="text-sm text-neutral-400">Rate (TTK/hour)</span>
          <input className="w-24 bg-transparent border border-neutral-700 rounded px-3 py-2" value={rate} onChange={(e)=>setRate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={add}>Add Listing</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.length === 0 ? (
          <div className="card text-sm text-neutral-400">No listings yet.</div>
        ) : items.map((i)=> (
          <div key={i.id} className="card space-y-1">
            <div className="font-semibold">{i.title}</div>
            <div className="text-sm text-neutral-300">{i.description}</div>
            <div className="text-sm">Rate: {i.rate} TTK/hour</div>
            <div className="pt-2"><button className="btn-primary" onClick={()=>remove(i.id)}>Remove</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}


