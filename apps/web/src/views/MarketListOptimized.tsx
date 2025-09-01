import { Link, useNavigate } from 'react-router-dom'
import { Fade } from 'react-awesome-reveal'
import Page from '../components/Page'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useListMarketsCursorQuery } from '../store/services/api'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'

export default function MarketListOptimized() {
  const user = useSelector((s: RootState) => s.auth.user)
  const navigate = useNavigate()
  const [allMarkets, setAllMarkets] = useState<any[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const { data, isLoading, isFetching } = useListMarketsCursorQuery({ 
    limit: 20, 
    cursor 
  })

  // Load data when query succeeds
  useEffect(() => {
    if (data?.items) {
      if (!cursor) {
        // First load - replace all markets
        setAllMarkets(data.items)
      } else {
        // Pagination - append new markets
        setAllMarkets(prev => [...prev, ...data.items])
      }
      setHasLoadedOnce(true)
    }
  }, [data, cursor])

  const loadMore = useCallback(() => {
    if (data?.hasMore && data?.nextCursor && !isFetching) {
      setCursor(data.nextCursor)
    }
  }, [data?.hasMore, data?.nextCursor, isFetching])

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 // Load when 1000px from bottom
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

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
      <Page title="Markets">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Join the betting action</h2>
          <p className="text-white/60 mb-6">Log in to see the latest dating markets and place your bets.</p>
          <button className="px-6 py-3 rounded-lg bg-brand-pink text-white font-medium" onClick={() => navigate('/login')}>
            Log in
          </button>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Markets">
      <div className="space-y-6">
        {/* Active bets banner */}
        <AnimatePresence>
          {activeBets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-4 border border-brand-green/30"
            >
              <h3 className="font-semibold text-brand-green mb-2">🎯 Active Bets</h3>
              <div className="space-y-2">
                {activeBets.map((bet, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-white/80">{bet.type === 'parlay' ? 'Parlay' : 'Single bet'}</span>
                    {bet.payoutUSD && <span className="text-brand-green ml-2">Potential: ${bet.payoutUSD.toFixed(0)}</span>}
                    {bet.text && <div className="text-white/60 text-xs mt-1">{bet.text}</div>}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  setActiveBets([])
                  sessionStorage.removeItem('activeBets')
                }}
                className="mt-2 text-xs text-white/50 hover:text-white/70"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Markets feed */}
        <div className="space-y-4">
          {(!hasLoadedOnce && isLoading) ? (
            // Initial loading state
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-24 mb-1" />
                      <div className="h-3 bg-white/10 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            // Actual markets
            <>
              {allMarkets.map((market, index) => (
                <Fade key={market._id} delay={index * 50} triggerOnce>
                  <Link 
                    to={`/markets/${market._id}`}
                    className="block glass rounded-2xl p-4 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={market.author?.avatarUrl || 'https://i.pravatar.cc/40'} 
                        alt="pfp" 
                        className="w-10 h-10 rounded-full ring-1 ring-white/10" 
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{market.author?.username || 'Anonymous'}</div>
                        <div className="text-xs text-white/60">{market.time || 'now'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-brand-green font-bold">
                          {market.topOdds ? `${Number(market.topOdds).toFixed(1)}x` : '—'}
                        </div>
                        <div className="text-xs text-white/60">top odds</div>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2 leading-tight">{market.title || market._id}</h3>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <span>💬</span>
                        <span>{market.comments || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>❤️</span>
                        <span>{market.likes || 0}</span>
                      </div>
                      <div className="ml-auto">
                        <span className={`px-2 py-1 rounded text-xs ${
                          market.status === 'open' ? 'bg-green-500/20 text-green-400' :
                          market.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {market.status || 'open'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </Fade>
              ))}

              {/* Load more indicator */}
              {isFetching && allMarkets.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 text-white/60">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading more markets...
                  </div>
                </div>
              )}

              {/* End of list indicator */}
              {hasLoadedOnce && !data?.hasMore && allMarkets.length > 0 && (
                <div className="text-center py-4 text-white/40 text-sm">
                  You've reached the end of the markets
                </div>
              )}

              {/* Empty state */}
              {hasLoadedOnce && allMarkets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60">No markets available yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  )
}
