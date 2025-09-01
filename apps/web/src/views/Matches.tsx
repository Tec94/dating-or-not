import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetActiveMatchesQuery } from '../store/services/api'
import Page from '../components/Page'
import { useNavigate } from 'react-router-dom'

export default function Matches() {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: matchesData, isLoading, refetch } = useGetActiveMatchesQuery(undefined, { skip: !user })
  
  if (!user) {
    return (
      <Page title="Your Matches">
        <div className="glass rounded-2xl p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Please log in</h3>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors"
          >
            Log In
          </button>
        </div>
      </Page>
    )
  }
  
  if (isLoading) {
    return (
      <Page title="Your Matches">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading your matches...</p>
        </div>
      </Page>
    )
  }
  
  const matches = matchesData?.matches || []
  
  return (
    <Page title="Your Matches">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Your Matches</h1>
              <p className="text-white/70">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Matches Grid */}
        {matches.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
            <p className="text-white/70 mb-6">
              Start swiping to find your perfect matches!
            </p>
            <button
              onClick={() => navigate('/dating')}
              className="px-6 py-3 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors"
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <motion.div
                key={match.matchId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => {
                  // For now, just show an alert. In a real app, this would open a chat
                  alert(`Chat with ${match.user.username} - Coming soon!`)
                }}
              >
                {/* Profile Photo */}
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                  {match.user.photos && match.user.photos.length > 0 ? (
                    <img
                      src={match.user.photos[0]}
                      alt={match.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <span className="text-2xl text-white/50">👤</span>
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {match.user.username}
                  </h3>
                  {match.user.age && (
                    <p className="text-white/70 text-sm">{match.user.age} years old</p>
                  )}
                  {match.user.bio && (
                    <p className="text-white/60 text-xs mt-2 line-clamp-2">
                      {match.user.bio}
                    </p>
                  )}
                </div>
                
                {/* Match Info */}
                <div className="space-y-2 text-xs text-white/60">
                  <div className="flex items-center justify-between">
                    <span>Matched:</span>
                    <span>{new Date(match.matchedAt).toLocaleDateString()}</span>
                  </div>
                  {match.hasMarket && (
                    <div className="bg-brand-pink/20 text-brand-pink text-center py-1 px-2 rounded">
                      Betting Market Available
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      alert('Chat feature coming soon!')
                    }}
                    className="flex-1 px-3 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors text-white text-sm"
                  >
                    💬 Chat
                  </button>
                  {match.hasMarket && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/markets')
                      }}
                      className="flex-1 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white text-sm"
                    >
                      🎯 Bet
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dating')}
            className="glass rounded-xl p-4 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💖</div>
            <div className="font-medium text-white">Find More Matches</div>
            <div className="text-white/60 text-sm">Keep swiping</div>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="glass rounded-xl p-4 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-white">Edit Profile</div>
            <div className="text-white/60 text-sm">Update your info</div>
          </button>
          
          <button
            onClick={() => navigate('/markets')}
            className="glass rounded-xl p-4 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium text-white">Browse Markets</div>
            <div className="text-white/60 text-sm">Place some bets</div>
          </button>
        </div>
      </div>
    </Page>
  )
}
