import { useMemo, useState } from 'react'
import { useCreateParlayMutation } from '../store/services/api'
import { motion, LayoutGroup } from 'framer-motion'

type Leg = { betId: string; title: string; line?: number; selection: 'yes'|'no'|'over'|'under'; odds: number }

export default function ParlaySlip({ initialLegs = [], marketId }: { initialLegs?: Leg[]; marketId?: string }) {
  const [legs, setLegs] = useState<Leg[]>(initialLegs)
  const [stake, setStake] = useState(20)
  const [mode, setMode] = useState<'power'|'flex'>('power')
  const [createParlay, { isLoading }] = useCreateParlayMutation()
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function selectionMultiplier(l: Leg): number {
    switch (l.selection) {
      case 'no':
        return l.odds * 1.1
      case 'under':
        return l.odds * 1.15
      case 'over':
      case 'yes':
      default:
        return l.odds
    }
  }
  const baseMultiplier = useMemo(() => legs.reduce((acc, l) => acc * selectionMultiplier(l), 1), [legs])
  const tier = legs.length
  const tierMultiplier = useMemo(() => {
    const powerTable: Record<number, number> = { 2: 3.0, 3: 5.0, 4: 10.0, 5: 20.0 }
    const flexTable: Record<number, number> = { 2: 2.0, 3: 2.25, 4: 5.0, 5: 10.0 }
    const tierTarget = (mode === 'flex' ? flexTable[tier] : powerTable[tier])
    // Combine baseMultiplier (affected by selections) with tier target.
    // We take the max so that certain selections can push payout above the floor tier.
    const combined = Math.max(baseMultiplier, tierTarget ?? baseMultiplier)
    return combined
  }, [mode, tier, baseMultiplier])
  const payout = Math.round(stake * tierMultiplier * 100) / 100

  function setSelection(idx: number, sel: Leg['selection']) {
    setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, selection: sel } : l)))
  }

  async function submit() {
    setOk(null); setErr(null)
    try {
      await createParlay({ legs: legs.map(({ betId, selection }) => ({ betId, selection })), stakeUSD: stake }).unwrap()
      const payoutUSD = Math.round(stake * tierMultiplier * 100) / 100
      try {
        const existing = JSON.parse(sessionStorage.getItem('activeBets') || '[]')
        const active = [{ type: 'parlay' as const, payoutUSD, marketId }, ...existing]
        sessionStorage.setItem('activeBets', JSON.stringify(active))
      } catch {}
      setOk(`Parlay active · Stake $${stake} → Payout $${payoutUSD.toFixed(2)}`)
    } catch (e) {
      setErr('Failed to place parlay')
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="font-semibold mb-3 flex items-center justify-between">
        <span>Build Parlay ({legs.length})</span>
        <div className="bg-white/5 rounded-xl p-1 text-xs">
          <button className={`px-2 py-1 rounded-lg ${mode==='power'?'bg-brand-green text-black':''}`} onClick={()=>setMode('power')}>Power</button>
          <button className={`px-2 py-1 rounded-lg ${mode==='flex'?'bg-brand-green text-black':''}`} onClick={()=>setMode('flex')}>Flex</button>
        </div>
      </div>

      <div className="space-y-3">
        {legs.map((l, i) => (
          <div key={i} className="rounded-2xl bg-white/5 p-3 relative overflow-hidden">
            <button className="absolute right-2 top-2 text-white/60 hover:text-white" aria-label="Remove leg" onClick={()=>setLegs(prev=>prev.filter((_,idx)=>idx!==i))}>✕</button>
            <div className="text-sm text-white/80 font-medium">{l.title}{l.line != null ? ` • ${l.line}` : ''}</div>
            <LayoutGroup id={`leg-${i}`}>
              <div className="mt-2 flex gap-2 text-xs relative">
                {(['yes','no','over','under'] as const).map((opt) => {
                  const selected = l.selection === opt
                  return (
                    <button key={opt} onClick={() => setSelection(i, opt)} className={`relative px-3 py-1 rounded-full border overflow-hidden ${selected ? 'border-transparent' : 'border-white/20'}`}>
                      {selected && (
                        <motion.span layoutId={`chip-bg-${i}`} className="absolute inset-0 rounded-full bg-brand-green" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                      )}
                      <span className={`relative ${selected ? 'text-black font-semibold' : 'text-white/90 line-through decoration-white/30 decoration-2'}`}>{opt.toUpperCase()}</span>
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>
          </div>
        ))}
        {legs.length === 0 && <div className="text-white/60 text-sm">Add legs from the market to start a parlay.</div>}
      </div>

      <div className="mt-4 rounded-2xl bg-white/5 p-3">
        <div className="flex items-center justify-between text-sm">
          <span>Tier multiplier</span>
          <span className="font-semibold">× {tierMultiplier.toFixed(2)}</span>
        </div>
        <div className="mt-2">
          <label className="text-sm text-white/70" htmlFor="stake">Stake (USD)</label>
          <input id="stake" type="number" className="mt-1 w-full rounded bg-white/10 p-2" value={stake} onChange={(e)=>setStake(Number(e.target.value))} />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>Potential payout</span>
          <span className="font-semibold text-brand-green">${payout.toFixed(2)}</span>
        </div>
      </div>

      <button disabled={isLoading || legs.length < 2} onClick={submit} className="mt-4 w-full rounded-xl bg-brand-pink py-2 font-semibold disabled:opacity-60">{isLoading ? 'Placing…' : 'Place Parlay'}</button>
      <div aria-live="polite" className="mt-2 text-sm">
        {ok && <div className="rounded-lg border border-brand-green/40 bg-brand-green/15 text-brand-green px-3 py-2">{ok}</div>}
        {err && <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2">{err}</div>}
      </div>
    </div>
  )
}


