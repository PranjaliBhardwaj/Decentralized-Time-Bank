import { Link, useLocation } from 'react-router-dom'
// Removed ConnectButton here; we keep the one in the page header

export default function Navbar() {
  const { pathname } = useLocation()
  const isActive = (path: string) => pathname === path
  return (
    <header className="border-b border-neutral-800 sticky top-0 z-40 bg-neutral-950/80 backdrop-blur">
      <div className="container-page h-16" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Left: Brand */}
        <Link to="/" className="text-xl font-semibold" style={{ whiteSpace: 'nowrap' }}>Time-Banked</Link>
        {/* Center: Nav links */}
        <nav className="flex items-center gap-1" style={{ flex: 1, justifyContent: 'center' }}>
          <Link className={`link-nav ${isActive('/') ? 'bg-neutral-800 text-white' : ''}`} to="/">Home</Link>
          <Link className={`link-nav ${isActive('/marketplace') ? 'bg-neutral-800 text-white' : ''}`} to="/marketplace">Marketplace</Link>
          <Link className={`link-nav ${isActive('/chat') ? 'bg-neutral-800 text-white' : ''}`} to="/chat">Chat</Link>
          <Link className={`link-nav ${isActive('/escrow') ? 'bg-neutral-800 text-white' : ''}`} to="/escrow">Escrow</Link>
          <Link className={`link-nav ${isActive('/escrow-history') ? 'bg-neutral-800 text-white' : ''}`} to="/escrow-history">History</Link>
          <Link className={`link-nav ${isActive('/my-services') ? 'bg-neutral-800 text-white' : ''}`} to="/my-services">My Services</Link>
          <Link className={`link-nav ${isActive('/analytics') ? 'bg-neutral-800 text-white' : ''}`} to="/analytics">Analytics</Link>
          <Link className={`link-nav ${isActive('/profile') ? 'bg-neutral-800 text-white' : ''}`} to="/profile">Profile</Link>
          <Link className={`link-nav ${isActive('/dashboard') ? 'bg-neutral-800 text-white' : ''}`} to="/dashboard">Dashboard</Link>
        </nav>
        {/* Right: Spacer to balance layout with header Connect button width */}
        <div style={{ width: 180 }} />
      </div>
    </header>
  )
}


