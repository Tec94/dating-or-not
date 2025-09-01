import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetUserQuery, useUpdateUserMutation, useUploadPhotoMutation } from '../store/services/api'
import Page from '../components/Page'
import { useNavigate } from 'react-router-dom'

const INTEREST_OPTIONS = [
  'Coffee', 'Wine', 'Travel', 'Hiking', 'Fitness', 'Music', 'Art', 'Reading',
  'Cooking', 'Dancing', 'Sports', 'Gaming', 'Photography', 'Movies', 'Theater',
  'Tech', 'Fashion', 'Yoga', 'Dogs', 'Cats', 'Concerts', 'Beaches', 'Mountains'
]

export default function DatingProfile() {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: fullUser, isLoading } = useGetUserQuery(user?.id || '', { skip: !user })
  const [updateUser] = useUpdateUserMutation()
  const [uploadPhoto] = useUploadPhotoMutation()
  
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    bio: '',
    age: 25,
    photos: [] as string[],
    interests: [] as string[],
    location: { city: '', lat: 0, lng: 0 },
    preferences: {
      ageRange: [22, 35] as [number, number],
      distance: 25,
      interests: [] as string[]
    },
    privacy: {
      hideFromBetting: false,
      consentBetAnalysis: false
    }
  })
  
  // Load user data when available
  useEffect(() => {
    if (fullUser) {
      setFormData({
        bio: fullUser.bio || '',
        age: fullUser.age || 25,
        photos: fullUser.photos || [],
        interests: fullUser.preferences?.interests || [],
        location: fullUser.location || { city: '', lat: 0, lng: 0 },
        preferences: {
          ageRange: fullUser.preferences?.ageRange || [22, 35],
          distance: fullUser.preferences?.distance || 25,
          interests: fullUser.preferences?.interests || []
        },
        privacy: {
          hideFromBetting: fullUser.privacy?.hideFromBetting || false,
          consentBetAnalysis: fullUser.privacy?.consentBetAnalysis || false
        }
      })
    }
  }, [fullUser])
  
  const handlePhotoUpload = async (file: File) => {
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('photo', file)
      const result = await uploadPhoto(formDataUpload).unwrap()
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, result.url]
      }))
    } catch (error) {
      setError('Failed to upload photo. Please try again.')
    }
  }
  
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }
  
  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(interest)
      const newInterests = isSelected 
        ? prev.interests.filter(i => i !== interest)
        : prev.interests.length < 10 
          ? [...prev.interests, interest]
          : prev.interests
      
      return {
        ...prev,
        interests: newInterests,
        preferences: {
          ...prev.preferences,
          interests: newInterests
        }
      }
    })
  }
  
  const handleSave = async () => {
    if (!user) return
    
    setLoading(true)
    setError('')
    
    try {
      await updateUser({
        id: user.id,
        bio: formData.bio,
        age: formData.age,
        photos: formData.photos,
        location: formData.location,
        preferences: formData.preferences,
        'privacy.hideFromBetting': formData.privacy.hideFromBetting,
        'privacy.consentBetAnalysis': formData.privacy.consentBetAnalysis
      }).unwrap()
      
      setSuccessMessage('Profile updated successfully!')
      setEditing(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  if (!user) {
    return (
      <Page title="Dating Profile">
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
      <Page title="Dating Profile">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading your profile...</p>
        </div>
      </Page>
    )
  }
  
  return (
    <Page title="Dating Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{user.username}'s Dating Profile</h1>
              <p className="text-white/70">Customize your dating profile and preferences</p>
            </div>
            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setError('')
                      // Reset form data
                      if (fullUser) {
                        setFormData({
                          bio: fullUser.bio || '',
                          age: fullUser.age || 25,
                          photos: fullUser.photos || [],
                          interests: fullUser.preferences?.interests || [],
                          location: fullUser.location || { city: '', lat: 0, lng: 0 },
                          preferences: {
                            ageRange: fullUser.preferences?.ageRange || [22, 35],
                            distance: fullUser.preferences?.distance || 25,
                            interests: fullUser.preferences?.interests || []
                          },
                          privacy: {
                            hideFromBetting: fullUser.privacy?.hideFromBetting || false,
                            consentBetAnalysis: fullUser.privacy?.consentBetAnalysis || false
                          }
                        })
                      }
                    }}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors text-white disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-brand-pink rounded-lg hover:bg-brand-pink/90 transition-colors text-white"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          
          {/* Success/Error Messages */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400"
            >
              {successMessage}
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400"
            >
              {error}
            </motion.div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Age</label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none"
                    min="18"
                    max="100"
                  />
                ) : (
                  <p className="text-white text-lg">{formData.age} years old</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Location</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value } 
                    }))}
                    placeholder="City, State"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50"
                  />
                ) : (
                  <p className="text-white text-lg">{formData.location.city || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Bio</label>
                {editing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell people about yourself..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50 resize-none"
                  />
                ) : (
                  <p className="text-white">{formData.bio || 'No bio added yet'}</p>
                )}
                {editing && (
                  <div className="text-right text-white/60 text-sm mt-1">
                    {formData.bio.length}/500
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Photos */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Photos ({formData.photos.length}/6)</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {editing && (
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-brand-pink text-white text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                </div>
              ))}
              
              {editing && formData.photos.length < 6 && (
                <label className="aspect-square border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-pink/50 transition-colors">
                  <svg className="w-8 h-8 text-white/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-white/60 text-sm">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload photo"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload(file)
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
        
        {/* Interests */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Interests ({formData.interests.length}/10)</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {INTEREST_OPTIONS.map(interest => (
              <button
                key={interest}
                onClick={() => editing && toggleInterest(interest)}
                disabled={!editing || (!formData.interests.includes(interest) && formData.interests.length >= 10)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  formData.interests.includes(interest)
                    ? 'bg-brand-pink text-white'
                    : editing
                      ? 'bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-white/10 text-white/80'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
        
        {/* Dating Preferences */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Dating Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Age Range: {formData.preferences.ageRange[0]} - {formData.preferences.ageRange[1]}
              </label>
              {editing ? (
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="text-xs text-white/60">Min Age</label>
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={formData.preferences.ageRange[0]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          ageRange: [parseInt(e.target.value), prev.preferences.ageRange[1]]
                        }
                      }))}
                      className="w-full"
                      aria-label="Minimum age preference"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-white/60">Max Age</label>
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={formData.preferences.ageRange[1]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          ageRange: [prev.preferences.ageRange[0], parseInt(e.target.value)]
                        }
                      }))}
                      className="w-full"
                      aria-label="Maximum age preference"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-white">{formData.preferences.ageRange[0]} - {formData.preferences.ageRange[1]} years old</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Maximum Distance: {formData.preferences.distance} miles
              </label>
              {editing ? (
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.preferences.distance}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      distance: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full"
                  aria-label="Maximum distance preference"
                />
              ) : (
                <p className="text-white">{formData.preferences.distance} miles</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Privacy Settings */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Privacy Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">Betting Analysis Consent</h4>
                <p className="text-white/60 text-sm">
                  Allow us to analyze your dating patterns to improve betting odds and provide personalized insights.
                </p>
              </div>
              {editing ? (
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={formData.privacy.consentBetAnalysis}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      privacy: {
                        ...prev.privacy,
                        consentBetAnalysis: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                    aria-label="Consent to betting analysis"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                </label>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  formData.privacy.consentBetAnalysis ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {formData.privacy.consentBetAnalysis ? 'Enabled' : 'Disabled'}
                </span>
              )}
            </div>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">Hide from Betting</h4>
                <p className="text-white/60 text-sm">
                  Prevent others from creating betting markets about your dates and relationships.
                </p>
              </div>
              {editing ? (
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={formData.privacy.hideFromBetting}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      privacy: {
                        ...prev.privacy,
                        hideFromBetting: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                    aria-label="Hide from betting markets"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                </label>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  formData.privacy.hideFromBetting ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {formData.privacy.hideFromBetting ? 'Hidden' : 'Visible'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}
