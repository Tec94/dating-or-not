import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLikeBetMutation } from '../store/services/api'

export default function LikeButton({ betId, initialLikes = 0, initialLiked = false, onLiked }: { betId: string; initialLikes?: number; initialLiked?: boolean; onLiked?: (newLikes: number, delta: number, liked: boolean) => void }) {
  const [likes, setLikes] = useState(initialLikes)
  const [justLiked, setJustLiked] = useState(false)
  const [optimisticLocked, setOptimisticLocked] = useState(false)
  const [liked, setLiked] = useState<boolean>(initialLiked)
  const [likeBet, { isLoading }] = useLikeBetMutation()

  useEffect(() => { setLikes(initialLikes) }, [initialLikes])
  // Initialize liked state once; avoid resetting on parent re-renders that don't carry per-user liked info
  useEffect(() => { setLiked(initialLiked) }, [])

  async function like() {
    if (isLoading || optimisticLocked) return
    // Instant optimistic toggle feedback
    setOptimisticLocked(true)
    setJustLiked(true)
    const prevLiked = liked
    const delta = prevLiked ? -1 : 1
    const prevLikes = likes
    const optimisticNext = Math.max(0, prevLikes + delta)
    setLiked(!prevLiked)
    setLikes(optimisticNext)
    onLiked?.(optimisticNext, delta, !prevLiked)
    setTimeout(() => setJustLiked(false), 350)

    try {
      const res = await likeBet({ betId }).unwrap()
      if (res?.likes != null) {
        setLikes(res.likes)
      }
      if (typeof res?.liked === 'boolean') setLiked(res.liked)
    } catch {
      // Keep optimistic state on failure for responsive UX; reconciliation will happen on next success
    } finally {
      // Re-enable after a short delay to avoid accidental spamming
      setTimeout(() => setOptimisticLocked(false), 300)
    }
  }

  return (
    <motion.button
      onClick={like}
      className={`px-3 py-1 rounded-full text-sm transition-colors ${justLiked ? 'bg-brand-green text-black' : 'bg-white/10 hover:bg-white/15'}`}
      disabled={isLoading || optimisticLocked}
      whileTap={{ scale: 0.95 }}
      animate={justLiked ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <span>{liked ? '💚' : '❤️'} {likes}</span>
    </motion.button>
  )
}


