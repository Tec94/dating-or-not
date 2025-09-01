import { Link, useNavigate } from 'react-router-dom'
import { Fade } from 'react-awesome-reveal'
import Page from '../components/Page'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useListMarketsQuery } from '../store/services/api'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'

// Social feed style items
const markets = [
  { id: 'm1', user: 'Jamie', avatar: '🧑‍🎤', title: 'Alex × Taylor — Will the date happen?', odds: 1.39, time: '2m', comments: 12, likes: 58 },
  { id: 'm2', user: 'Priya', avatar: '🧑‍💻', title: 'Sam × Chris — Drinks ≥ 2?', odds: 3.03, time: '10m', comments: 7, likes: 22 },
  { id: 'm3', user: 'Leo', avatar: '🧑‍🚀', title: 'Will there be a first kiss?', odds: 2.1, time: '1h', comments: 3, likes: 9 },
]

export default function MarketList() {
  const user = useSelector((s: RootState) => s.auth.user)
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, refetch } = useListMarketsQuery({ page, limit: 20 })
  const [feedItems, setFeedItems] = useState<any[]>([])
  useEffect(() => {
    if (data?.items) {
      setFeedItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]))
    }
  }, [data?.items, page])
  const feed = feedItems.length ? feedItems : markets
  const [activeBets, setActiveBets] = useState<{ type: 'bet'|'parlay'; payoutUSD?: number; text?: string; marketId?: string }[]>([])
  // Load banner from session (set after placing bet/parlay), then clear
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('activeBets')
      if (raw) {
        const parsed = (JSON.parse(raw) || []).filter((it: any) => it && typeof it === 'object' && typeof it.payoutUSD === 'number' && it.payoutUSD > 0)
        setActiveBets(parsed)
        // Write back cleaned list
        sessionStorage.setItem('activeBets', JSON.stringify(parsed))
      }
    } catch {}
  }, [])
  // If not logged in, show public feed only and CTA to login
  if (!user) {
    return (
      <Page>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Public Wins & Markets</h2>
          <button className="px-3 py-2 rounded bg-brand-pink" onClick={() => navigate('/login')}>Log in to bet</button>
        </div>
        <div className="space-y-4">
          <Fade cascade damping={0.1}>
            {feed.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">{m.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <span className="font-medium text-white">{(m as any).author?.username ?? (m as any).user ?? 'User'}</span>
                      <span>•</span>
                      <span>{(m as any).time ?? ''}</span>
                    </div>
                    <div className="font-semibold text-lg mt-1">{(m as any).title || `${(m as any).author?.username ?? 'User'} — Market`}</div>
                    <div className="mt-2 text-sm">Top odds: <span className="font-bold">{(m.topOdds ?? m.odds)?.toFixed ? (m.topOdds ?? m.odds).toFixed(2) : (m.topOdds ?? m.odds)}</span></div>
                  <div className="mt-3 flex items-center gap-6 text-white/70 text-sm">
                      <span className="flex items-center gap-1">💬 <span>{m.comments ?? 0}</span></span>
                      <span className="flex items-center gap-1">❤️ <span>{m.likes ?? 0}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Fade>
        </div>
      </Page>
    )
  }
  return (
    <Page>
      <div className="space-y-4">
        <AnimatePresence>
          {activeBets.length > 0 && (
             <motion.div
              initial={{ y: -12, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="rounded-2xl border border-brand-green/40 bg-brand-green/15 text-brand-green px-4 py-3"
            >
               <CollapsibleActiveBets items={activeBets} />
            </motion.div>
          )}
        </AnimatePresence>
        <Fade cascade damping={0.1}>
          {feed.map((m) => (
            <Link key={(m as any).id ?? (m as any)._id} to={`/markets/${(m as any).id ?? (m as any)._id}`} className="block glass rounded-2xl p-4 hover:bg-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">{m.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span className="font-medium text-white">{(m as any).author?.username ?? (m as any).user ?? 'User'}</span>
                    <span>•</span>
                    <span>{(m as any).time ?? ''}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="font-semibold text-lg flex-1">{(m as any).title || `${(m as any).author?.username ?? 'User'} — Market`}</div>
                    {!!(m as any).status && (
                      <span className={`text-xs px-2 py-1 rounded-full ${ (m as any).status==='open' ? 'bg-brand-green/20 text-brand-green' : (m as any).status==='closed' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-white/10 text-white/70' }`}>
                        {(m as any).status}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm">Top odds: <span className="font-bold">{(m.topOdds ?? m.odds)?.toFixed ? (m.topOdds ?? m.odds).toFixed(2) : (m.topOdds ?? m.odds)}</span></div>
                  <div className="mt-3 flex items-center gap-6 text-white/70 text-sm">
                    <span className="flex items-center gap-1">💬 <span>{m.comments ?? 0}</span></span>
                    <span className="flex items-center gap-1">❤️ <span>{m.likes ?? 0}</span></span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <div className="flex justify-center mt-2">
            <button className="px-4 py-2 rounded bg-white/10" onClick={()=> setPage((p)=> p + 1)}>Load more</button>
          </div>
        </Fade>
      </div>
    </Page>
  )
}

function CollapsibleActiveBets({ items }: { items: { type: 'bet'|'parlay'; payoutUSD?: number; text?: string; marketId?: string }[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button onClick={() => setOpen(v=>!v)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Active {items.length > 1 ? 'Bets' : items[0]?.type === 'parlay' ? 'Parlay' : 'Bet'}</div>
          <motion.span
            initial={false}
            animate={{ rotate: open ? 0 : 180, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="px-2 py-1 rounded bg-white/10 text-xs select-none pointer-events-none inline-flex items-center justify-center"
            aria-hidden
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6l6 10H6L12 6z" fill="#34d399"/>
            </svg>
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 grid gap-2">
              {items.map((it, idx) => {
                const label = `${it.type === 'parlay' ? 'Parlay' : 'Bet'} · Payout $${(Number(it.payoutUSD ?? 0)).toFixed(2)}`
                const to = it.marketId ? `/markets/${it.marketId}` : '#'
                return (
                  <Link key={idx} to={to} className="block rounded-lg bg-white/5 px-3 py-2 hover:bg-white/10">
                    <div className="text-sm">{label}</div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


