import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const navigate = useNavigate()
  const tiles = [
    { title: 'Dating', desc: 'Swipe and match', to: '/dating', emoji: '❤️' },
    { title: 'Bets', desc: 'View markets & parlays', to: '/markets', emoji: '🎲' },
    { title: 'Wallet', desc: 'Balance & PnL', to: '/wallet', emoji: '💵' },
    { title: 'Settings', desc: 'Profile & privacy', to: '/settings', emoji: '⚙️' },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      {tiles.map((t, i) => (
        <motion.button
          key={t.title}
          onClick={() => navigate(t.to)}
          className="md:col-span-1 glass rounded-2xl p-6 h-full text-left cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-pink"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="text-2xl" aria-hidden>{t.emoji}</div>
          <h2 className="text-lg font-semibold mt-2">{t.title}</h2>
          <p className="text-white/70">{t.desc}</p>
        </motion.button>
      ))}
    </div>
  )
}


