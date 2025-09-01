import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatPanel from './ChatPanel'

export default function CollapsibleChat({ marketId }: { marketId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left rounded-2xl px-4 py-3 bg-brand-green/20 border border-brand-green/40 text-white flex items-center justify-between"
      >
        <span className="font-semibold">Chatroom for this market</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ChatPanel marketId={marketId} active={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


