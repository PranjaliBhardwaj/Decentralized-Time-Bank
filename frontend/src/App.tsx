import { Route, Routes, BrowserRouter } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
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


