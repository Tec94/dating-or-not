import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, Navigate, Link, useLocation } from 'react-router-dom'
import Landing from '../views/Landing'
import Dashboard from '../views/Dashboard'
import SwipeDeck from '../views/SwipeDeck'
import Onboarding from '../views/Onboarding'
import DatingProfile from '../views/DatingProfile'
import Matches from '../views/Matches'
import MarketList from '../views/MarketList'
import MarketDetail from '../views/MarketDetail'
import Wallet from '../views/Wallet'
import Transactions from '../views/Transactions'
import Settings from '../views/Settings'
import MarketsAdmin from '../views/MarketsAdmin'
import BottomNav from '../components/BottomNav'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import Login from '../views/Login'

const App: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const location = useLocation()
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-dark to-black">
      <header className="sticky top-0 z-10 bg-transparent backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <Link to="/" className="text-xl font-bold text-white">Dating-or-Not</Link>
          {user && <UserMenu username={user.username} avatarUrl={user.avatarUrl} />}
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 pb-24">
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/dating" element={<SwipeDeck />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/profile" element={<DatingProfile />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/markets" element={<MarketList />} />
          <Route path="/markets/:id" element={<MarketDetail />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/markets" element={<RequireAdmin><MarketsAdmin /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </ErrorBoundary>
      </main>
      {/* Hide bottom nav on the home dashboard to feel like a welcome screen */}
      {location.pathname !== '/home' && <BottomNav />}
    </div>
  )
}

export default App

function UserMenu({ username, avatarUrl }: { username?: string; avatarUrl?: string }) {
  const [open, setOpen] = React.useState(false)
  const close = () => setOpen(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 text-sm rounded-full px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-pink/50 transition-colors">
        <img src={avatarUrl || 'https://i.pravatar.cc/40'} alt="pfp" className="w-8 h-8 rounded-full ring-1 ring-white/10 group-hover:ring-brand-pink/60 transition-colors" />
        <span className="text-white/90">{username}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="absolute right-0 mt-2 w-56 rounded-xl p-2 text-sm bg-black/80 border border-white/10 shadow-xl backdrop-blur-md"
          >
            <Link to="/dating" onClick={close} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">Dating</Link>
            <Link to="/matches" onClick={close} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">My Matches</Link>
            <Link to="/profile" onClick={close} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">Dating Profile</Link>
            <Link to="/markets" onClick={close} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">Bets</Link>
            <Link to="/wallet" onClick={close} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">Wallet</Link>
            <Link to="/transactions" onClick={close} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">Transactions</Link>
            <Link to="/settings" onClick={close} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">Settings</Link>
            <AdminMenuItem onClick={close} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AdminMenuItem({ onClick }: { onClick: () => void }) {
  const user = (window as any).store?.getState?.().auth.user as { id: string; username: string; role?: string } | undefined
  if (!user || user.role !== 'admin') return null
  return (
    <Link to="/admin/markets" onClick={onClick} className="block px-3 py-2 rounded hover:bg-white/10 transition-colors">Admin</Link>
  )
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  // Basic client-side guard; server enforces too
  try {
    const state = (window as any).store?.getState?.()
    const user = state?.auth?.user
    if (user?.role === 'admin') return children
  } catch {}
  return <Navigate to="/" />
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }>{
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err: any) { console.error(err) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-white/70 text-sm">Please refresh the page or try again.</p>
        </div>
      )
    }
    return this.props.children as any
  }
}


