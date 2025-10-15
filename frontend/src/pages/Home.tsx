import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="py-10">
        <div className="container-page">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Time-Banked Marketplace</h1>
          <p className="text-neutral-300 max-w-2xl mb-6">Exchange skills and services using TimeToken (TTK). 1 hour = 1 TTK. Trustless escrow ensures fair payments.</p>
          <div className="flex gap-3">
            <Link to="/marketplace" className="btn-primary">Explore Marketplace</Link>
            <Link to="/dashboard" className="link-nav">Go to Dashboard</Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-1">Wallet-first</h3>
          <p className="text-sm text-neutral-300">Connect with MetaMask or any WalletConnect wallet. No passwords.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-1">TimeToken (TTK)</h3>
          <p className="text-sm text-neutral-300">1 TTK represents 1 hour of service. Simple and fair.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-1">Secure Escrow</h3>
          <p className="text-sm text-neutral-300">Funds are locked until both parties confirm completion.</p>
        </div>
      </section>
    </div>
  )
}


