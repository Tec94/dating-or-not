import { useEffect, useMemo, useState } from 'react'
import { useListMarketsQuery } from '../store/services/api'
import { motion } from 'framer-motion'

export default function MarketsAdmin() {
  const { data } = useListMarketsQuery({ page: 1, limit: 50 })
  const [selected, setSelected] = useState<any | null>(null)
  const [outcomes, setOutcomes] = useState<Record<string, 'win'|'lose'>>({})
  useEffect(()=>{ setOutcomes({}) }, [selected?._id])
  async function seedMarkets() {
    await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'}/seed/markets`, { method:'POST' })
  }
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin: Markets</h1>
        <button className="px-3 py-2 rounded bg-white/10" onClick={seedMarkets}>Seed demo markets</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-4">
          <h2 className="font-semibold mb-2">Open Markets</h2>
          <div className="space-y-2">
            {(data?.items || []).map((m:any) => (
              <button key={m._id} onClick={()=>setSelected(m)} className={`w-full text-left rounded-lg px-3 py-2 ${selected?._id===m._id?'bg-white/15':'bg-white/5'} hover:bg-white/10`}>
                <div className="font-medium">{m._id}</div>
                <div className="text-xs text-white/60">Top odds: {Number(m.topOdds || 0).toFixed(2)} · Likes: {m.likes||0}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          {!selected && <div className="text-white/70 text-sm">Select a market</div>}
          {selected && <MarketDetailAdmin market={selected} outcomes={outcomes} setOutcomes={setOutcomes} />}
        </div>
      </div>
    </div>
  )
}

function MarketDetailAdmin({ market, outcomes, setOutcomes }: { market: any; outcomes: Record<string,'win'|'lose'>; setOutcomes: (v:any)=>void }) {
  const [bets, setBets] = useState<any[]>([...(market.standardBets||[]), ...(market.customBets||[])])
  async function closeMarket() {
    await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'}/admin/market/${market._id}/close`, { method:'POST', credentials:'include', headers: withCsrf() })
  }
  async function settleMarket() {
    await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'}/admin/market/${market._id}/settle`, { method:'POST', credentials:'include', headers: { ...withCsrf(), 'content-type':'application/json' }, body: JSON.stringify({ outcomes }) })
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Market {market._id}</h3>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-white/10" onClick={closeMarket}>Close</button>
          <button className="px-3 py-2 rounded bg-brand-green text-black font-semibold" onClick={settleMarket}>Settle</button>
        </div>
      </div>
      <div className="space-y-2">
        {bets.map((b) => (
          <div key={b._id} className="rounded-lg bg-white/5 p-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{b.description}</div>
              <div className="text-xs text-white/60">Odds: {Number(b.odds).toFixed(2)}</div>
            </div>
            <div className="flex gap-2 text-sm">
              <button className={`px-3 py-1 rounded ${outcomes[b._id]==='win'?'bg-brand-green text-black':'bg-white/10'}`} onClick={()=>setOutcomes({ ...outcomes, [b._id]: 'win' })}>Win</button>
              <button className={`px-3 py-1 rounded ${outcomes[b._id]==='lose'?'bg-red-500/70':'bg-white/10'}`} onClick={()=>setOutcomes({ ...outcomes, [b._id]: 'lose' })}>Lose</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function withCsrf(): Record<string, string> {
  const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1]
  return csrf ? { 'x-csrf-token': csrf } : {}
}


