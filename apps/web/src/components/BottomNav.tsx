import { Link, useLocation } from 'react-router-dom'

function NavButton({ to, label, emoji }: { to: string; label: string; emoji: string }) {
  const location = useLocation()
  const active = location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-6 py-3 pressable text-sm ${
        active ? 'bg-white/20' : 'bg-white/10'
      }`}
    >
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span className="text-sm">{label}</span>
    </Link>
  )
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/60 backdrop-blur-md">
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-3 p-3">
        <NavButton to="/dating" label="Dating" emoji="❤️" />
        <NavButton to="/markets" label="Bets" emoji="🎲" />
        <NavButton to="/wallet" label="Wallet" emoji="💵" />
      </div>
    </nav>
  )
}


