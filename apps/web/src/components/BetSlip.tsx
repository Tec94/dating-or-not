import { useState } from 'react'

export default function BetSlip({ odds, onPlace }: { odds: number; onPlace: (stake: number) => Promise<void> | void }) {
  const [stake, setStake] = useState<number>(25)
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const payout = Math.round(stake * odds * 100) / 100
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-white/80">Odds</span>
        <span className="font-semibold">{odds.toFixed(2)}</span>
      </div>
      <div className="mt-3">
        <label className="text-white/80 text-sm" htmlFor="stake-usd">Stake (USD)</label>
        <input
          id="stake-usd"
          type="number"
          value={stake}
          onChange={(e) => setStake(Number(e.target.value))}
          className="mt-1 w-full rounded-md bg-white/10 p-2 outline-none"
          placeholder="Enter amount"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-white/80">Potential payout</span>
        <span className="font-semibold text-brand-green">${payout.toFixed(2)}</span>
      </div>
      <button
        className={`mt-4 w-full rounded-md font-semibold py-2 pressable ${loading ? 'bg-white/20 text-white/70' : 'bg-brand-green text-black'}`}
        disabled={loading || !isFinite(stake) || stake <= 0}
        onClick={async () => {
          setLoading(true); setOk(null); setErr(null)
          try {
            await onPlace(stake)
            setOk(`Bet $${stake.toFixed(2)} placed`)
          } catch (e) {
            setErr('Failed to place bet')
          } finally { setLoading(false) }
        }}
      >
        {loading ? 'Placing…' : 'Place Bet'}
      </button>
      <div aria-live="polite" className="mt-2 text-sm">
        {ok && <div className="rounded-lg border border-brand-green/40 bg-brand-green/15 text-brand-green px-3 py-2">{ok}</div>}
        {err && <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2">{err}</div>}
      </div>
    </div>
  )
}


