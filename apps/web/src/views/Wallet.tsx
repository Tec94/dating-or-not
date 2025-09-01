import PnLChart from '../components/PnLChart'
import StripeElementsModal from '../components/StripeElementsModal'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGetWalletSummaryQuery, useCreateDepositMutation, useCreateWithdrawMutation, useSendDemoWebhookMutation, useCreateSetupIntentMutation, useListPaymentMethodsQuery, useDeletePaymentMethodMutation } from '../store/services/api'
import { skipToken } from '@reduxjs/toolkit/query'

export default function Wallet() {
  const user = useSelector((s: RootState) => s.auth.user)
  const navigate = useNavigate()
  if (!user) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="text-sm text-white/60">USD balance</div>
          <div className="text-4xl font-extrabold">—</div>
          <div className="mt-6">
            <button className="px-4 py-2 rounded bg-brand-pink" onClick={() => navigate('/login')}>Log in to view wallet</button>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold">PnL</h3>
          <div className="text-white/60 text-sm">Log in to see your performance</div>
        </div>
      </div>
    )
  }
  const userId = user.id
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(userId)
  const { data: summary } = useGetWalletSummaryQuery(isObjectId ? userId : skipToken as any)
  const [createDeposit, { isLoading: depLoading }] = useCreateDepositMutation()
  const [createWithdraw, { isLoading: wLoading }] = useCreateWithdrawMutation()
  const [amount, setAmount] = useState<number>(50)
  const [modal, setModal] = useState<null | 'deposit' | 'withdraw'>(null)
  const [paymentMethodModal, setPaymentMethodModal] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [sendWebhook] = useSendDemoWebhookMutation()
  const [createSetupIntent] = useCreateSetupIntentMutation()
  const { data: pms, refetch: refetchPms } = useListPaymentMethodsQuery()
  const [deletePm] = useDeletePaymentMethodMutation()
  async function doDeposit(amount: number) {
    try {
      await createDeposit({ amountUSD: amount }).unwrap()
      // simulate webhook success in test mode
      await sendWebhook({ type: 'demo.deposit.completed', data: { userId, amountUSD: amount, id: `demo_${Date.now()}` } }).unwrap()
      // Invalidate cached wallet summary and PnL immediately
      try {
        const { api } = await import('../store/services/api')
        const { store } = await import('../store')
        store.dispatch(api.util.invalidateTags([{ type: 'Transaction', id: userId }]))
      } catch {}
    } catch {}
  }
  async function doWithdraw(amount: number) {
    try {
      await createWithdraw({ amountUSD: amount }).unwrap()
      // simulate webhook
      await sendWebhook({ type: 'demo.withdrawal.completed', data: { userId, amountUSD: amount, id: `demo_${Date.now()}` } }).unwrap()
      try {
        const { api } = await import('../store/services/api')
        const { store } = await import('../store')
        store.dispatch(api.util.invalidateTags([{ type: 'Transaction', id: userId }]))
      } catch {}
    } catch {}
  }

  async function handleAddPaymentMethod() {
    try {
      const si = await createSetupIntent().unwrap()
      setClientSecret(si.clientSecret)
      setPaymentMethodModal(true)
    } catch (error) {
      console.error('Failed to create setup intent:', error)
    }
  }

  function handlePaymentMethodSuccess() {
    refetchPms()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 lg:col-span-1">
        <div className="text-sm text-white/60">USD balance</div>
        <div className="text-4xl font-extrabold">${(summary?.balanceUSD ?? 125).toFixed(2)}</div>
        <div className="mt-6 grid grid-cols-2 gap-3 items-center">
          <button className="px-4 py-2 rounded bg-brand-green text-black font-semibold" onClick={() => setModal('deposit')}>Deposit</button>
          <button className="px-4 py-2 rounded bg-white/10" onClick={() => setModal('withdraw')}>Withdraw</button>
          <button 
            className="px-4 py-2 rounded bg-white/10 col-span-2 hover:bg-white/20 transition-colors font-medium" 
            onClick={handleAddPaymentMethod}
          >
            Add payment method
          </button>
        </div>
        <div className="mt-4 text-sm">
          <div className="text-white/70 mb-1">Saved payment methods</div>
          <div className="space-y-2">
            {(pms?.items || []).map((pm)=> (
              <div key={pm.id} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                <div>{pm.brand || 'card'} •••• {pm.last4}</div>
                <button className="px-2 py-1 rounded bg-white/10" onClick={async()=>{ await deletePm(pm.id).unwrap(); refetchPms() }}>Delete</button>
              </div>
            ))}
            {(pms?.items || []).length === 0 && <div className="text-white/50">No payment methods</div>}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-white/60">Total deposits</div>
            <div className="text-lg font-semibold">${(summary?.totalDepositsUSD ?? 400).toFixed(0)}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-white/60">Total withdrawals</div>
            <div className="text-lg font-semibold">${(summary?.totalWithdrawalsUSD ?? 275).toFixed(0)}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 col-span-2">
            <div className="text-white/60">Lifetime PnL</div>
            <div className="text-lg font-semibold text-brand-green">${(summary?.lifetimePnlUSD ?? 125).toFixed(0)}</div>
          </div>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/transactions')}
            className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
          >
            View transaction history
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold">PnL</h3>
        <PnLChart />
      </motion.div>

      <AnimatePresence>
        {!!modal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setModal(null)} />
            <motion.div
              initial={{ y: 30, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative glass rounded-2xl p-6 w-[min(92vw,420px)]"
            >
              <h3 className="text-lg font-semibold mb-3">{modal === 'deposit' ? 'Deposit funds' : 'Withdraw funds'}</h3>
              {modal === 'withdraw' && (
                <div className="text-xs text-white/70 mb-2">Minimum withdrawal is $10.</div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {[25, 50, 100, 250].map((v) => (
                  <button key={v} onClick={() => setAmount(v)} className={`px-3 py-1 rounded ${amount===v? 'bg-white/20':'bg-white/10'}`}>${v}</button>
                ))}
              </div>
              <input type="number" min={modal==='withdraw'?10:1} step={1} value={amount}
                     onChange={(e)=>setAmount(Math.max(modal==='withdraw'?10:1, Number(e.target.value)))}
                     className="w-full rounded bg-white/10 p-2 mb-4" placeholder="Amount (USD)" />
              <div className="flex gap-3 justify-end">
                <button className="px-4 py-2 rounded bg-white/10" onClick={() => setModal(null)}>Cancel</button>
                {modal === 'deposit' ? (
                  <button className="px-4 py-2 rounded bg-brand-green text-black font-semibold" disabled={depLoading || amount <= 0}
                          onClick={async ()=>{ await doDeposit(amount); setModal(null) }}>Deposit</button>
                ) : (
                  <button className="px-4 py-2 rounded bg-white/20" disabled={wLoading || amount < 10}
                          onClick={async ()=>{ await doWithdraw(amount); setModal(null) }}>Withdraw</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stripe Elements Modal */}
      <StripeElementsModal
        isOpen={paymentMethodModal}
        onClose={() => setPaymentMethodModal(false)}
        onSuccess={handlePaymentMethodSuccess}
        clientSecret={clientSecret}
      />
    </div>
  )
}


