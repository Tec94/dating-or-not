import TinderCard from 'react-tinder-card'
import { useMemo, useState, useEffect } from 'react'
import Page from '../components/Page'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGetDiscoveryFeedQuery, useSwipeMutation } from '../store/services/api'

type DiscoveryUser = {
  id: string
  username: string
  age: number
  photos: string[]
  bio: string
  interests: string[]
  location: {
    city: string
    distance: number
  }
  compatibility: {
    score: number
    confidence: number
  }
}

export default function SwipeDeck() {
  const user = useSelector((s: RootState) => s.auth.user)
  const navigate = useNavigate()
  const [people, setPeople] = useState<DiscoveryUser[]>([])
  const [lastDirection, setLastDirection] = useState<string>('')
  const [showMatch, setShowMatch] = useState(false)
  const [matchUser, setMatchUser] = useState<DiscoveryUser | null>(null)
  
  // Fetch discovery feed
  const { data: discoveryData, isLoading, refetch, error } = useGetDiscoveryFeedQuery({
    limit: 20,
    maxDistance: 50
  }, {
    skip: !user
  })
  
  const [swipe] = useSwipeMutation()
  
  // Load cards from discovery feed
  useEffect(() => {
    if (discoveryData?.users) {
      setPeople(discoveryData.users)
    }
  }, [discoveryData])
  
  if (!user) {
    return (
      <Page>
        <div className="glass rounded-2xl p-6 text-center">
          <h3 className="text-lg font-semibold">Please log in to start swiping</h3>
          <button className="mt-4 px-4 py-2 rounded bg-brand-pink" onClick={() => navigate('/login')}>Log in</button>
        </div>
      </Page>
    )
  }

  const handleSwipe = async (direction: string, swipedUser: DiscoveryUser) => {
    setLastDirection(direction)
    
    try {
      const action = direction === 'right' ? 'like' : 'pass'
      const result = await swipe({
        targetUserId: swipedUser.id,
        action
      }).unwrap()
      
      if (result.matched) {
        setMatchUser(swipedUser)
        setShowMatch(true)
      }
    } catch (error) {
      console.error('Swipe error:', error)
    }
  }

  function onSwipe(direction: string, username: string) {
    const swipedUser = people.find(p => p.username === username)
    if (swipedUser) {
      handleSwipe(direction, swipedUser)
    }
    // Remove the top card on swipe to avoid sticky behavior
    setPeople((prev) => prev.filter((p) => p.username !== username))
    
    // Load more cards when running low
    if (people.length <= 3) {
      refetch()
    }
  }

  function onCardLeftScreen(username: string) {
    console.log(username + ' left the screen')
  }
  
  const closeMatchModal = () => {
    setShowMatch(false)
    setMatchUser(null)
  }

  if (isLoading && people.length === 0) {
    return (
      <Page>
        <div className="flex flex-col items-center">
          <div className="w-[340px] h-[520px] md:w-[420px] md:h-[620px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/70">Finding your perfect matches...</p>
            </div>
          </div>
        </div>
      </Page>
    )
  }

  if (error) {
    return (
      <Page>
        <div className="glass rounded-2xl p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Oops! Something went wrong</h3>
          <p className="text-white/70 mb-4">Unable to load potential matches</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 rounded bg-brand-pink hover:bg-brand-pink/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <div className="flex flex-col items-center">
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-[340px] h-[520px] md:w-[420px] md:h-[620px]">
          {people.map((person, index) => (
            <TinderCard
              key={person.id}
              onSwipe={(dir) => onSwipe(dir, person.username)}
              onCardLeftScreen={() => onCardLeftScreen(person.username)}
              preventSwipe={['up', 'down']}
              className="absolute"
              swipeRequirementType="position"
              flickOnSwipe={true}
              swipeThreshold={80}
            >
              <div className="w-[340px] h-[520px] md:w-[420px] md:h-[620px] rounded-3xl overflow-hidden shadow-xl relative">
                {person.photos.length > 0 ? (
                  <img src={person.photos[0]} alt={person.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <span className="text-6xl text-white/30">👤</span>
                  </div>
                )}
                
                {/* Compatibility indicator */}
                <div className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    {person.compatibility.score}% match
                  </span>
                </div>
                
                {/* Photo counter */}
                {person.photos.length > 1 && (
                  <div className="absolute top-4 left-4 bg-black/60 rounded-full px-2 py-1">
                    <span className="text-white text-xs">
                      1/{person.photos.length}
                    </span>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold">{person.username}</h3>
                    <span className="text-xl">{person.age}</span>
                  </div>
                  <div className="text-white/80 text-sm mb-2">
                    {person.location.city} • {person.location.distance} miles away
                  </div>
                  
                  {person.bio && (
                    <p className="text-white/90 mb-2 text-sm line-clamp-2">
                      {person.bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {person.interests.slice(0, 3).map((interest) => (
                      <span key={interest} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                        {interest}
                      </span>
                    ))}
                    {person.interests.length > 3 && (
                      <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                        +{person.interests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </TinderCard>
          ))}
          
          {people.length === 0 && !isLoading && (
            <div className="w-[340px] h-[520px] md:w-[420px] md:h-[620px] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="text-6xl mb-4">💫</div>
                <h3 className="text-xl font-semibold mb-2">No more profiles!</h3>
                <p className="text-white/70 mb-4">Check back later for more potential matches.</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </motion.div>
        
        <div className="mt-6 flex gap-6">
          <button 
            className="w-14 h-14 rounded-full bg-white/10 pressable border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => {
              if (people.length > 0) {
                onSwipe('left', people[0].username)
              }
            }}
            disabled={people.length === 0}
            aria-label="Pass on this profile"
          >
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button 
            className="w-14 h-14 rounded-full bg-brand-pink/80 text-white pressable border-2 border-white/80 shadow-lg hover:bg-brand-pink transition-colors flex items-center justify-center"
            onClick={() => {
              if (people.length > 0) {
                onSwipe('right', people[0].username)
              }
            }}
            disabled={people.length === 0}
            aria-label="Like this profile"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          
          <button 
            className="w-14 h-14 rounded-full bg-white/10 pressable border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => navigate('/matches')}
            aria-label="View your matches"
          >
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </button>
        </div>
        
        {/* Swipe feedback */}
        <AnimatePresence>
          {lastDirection && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-brand-pink px-4 py-2 rounded-full z-10"
              onAnimationComplete={() => {
                setTimeout(() => setLastDirection(''), 1000)
              }}
            >
              <span className="text-white font-medium">
                {lastDirection === 'right' ? '💖 Liked!' : '👋 Passed'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Match Modal */}
      <AnimatePresence>
        {showMatch && matchUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={closeMatchModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass rounded-2xl p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-brand-pink mb-2">It's a Match!</h2>
              <p className="text-white/80 mb-2">
                You and {matchUser.username} liked each other
              </p>
              <p className="text-white/60 text-sm mb-6">
                {matchUser.compatibility.score}% compatibility • {matchUser.location.distance} miles away
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={closeMatchModal}
                  className="flex-1 px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Keep Swiping
                </button>
                <button
                  onClick={() => {
                    closeMatchModal()
                    navigate('/matches')
                  }}
                  className="flex-1 px-4 py-3 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors"
                >
                  Say Hello
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  )
}
