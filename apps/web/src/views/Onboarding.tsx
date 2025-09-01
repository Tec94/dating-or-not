import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { useUpdateUserMutation, useUploadPhotoMutation } from '../store/services/api'

interface OnboardingData {
  // Basic Info
  age: number
  gender: 'male' | 'female' | 'non-binary' | 'other'
  location: { lat: number; lng: number; city: string }
  
  // Profile
  bio: string
  photos: string[]
  interests: string[]
  
  // Preferences
  ageRange: [number, number]
  maxDistance: number
  lookingFor: 'casual' | 'serious' | 'both'
  
  // Privacy
  consentBetAnalysis: boolean
  hideFromBetting: boolean
}

const INTEREST_OPTIONS = [
  'Coffee', 'Wine', 'Travel', 'Hiking', 'Fitness', 'Music', 'Art', 'Reading',
  'Cooking', 'Dancing', 'Sports', 'Gaming', 'Photography', 'Movies', 'Theater',
  'Tech', 'Fashion', 'Yoga', 'Dogs', 'Cats', 'Concerts', 'Beaches', 'Mountains'
]

const STEP_TITLES = [
  'Basic Information',
  'About You', 
  'Your Photos',
  'Your Interests',
  'Dating Preferences',
  'Privacy Settings'
]

export default function Onboarding() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const [currentStep, setCurrentStep] = useState(0)
  const [updateUser] = useUpdateUserMutation()
  const [uploadPhoto] = useUploadPhotoMutation()
  
  const [data, setData] = useState<OnboardingData>({
    age: 25,
    gender: 'male',
    location: { lat: 0, lng: 0, city: '' },
    bio: '',
    photos: [],
    interests: [],
    ageRange: [22, 35],
    maxDistance: 25,
    lookingFor: 'both',
    consentBetAnalysis: false,
    hideFromBetting: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(updates).forEach(key => delete newErrors[key])
      return newErrors
    })
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 0: // Basic Info
        if (data.age < 18 || data.age > 100) newErrors.age = 'Age must be between 18 and 100'
        if (!data.gender) newErrors.gender = 'Please select your gender'
        if (!data.location.city) newErrors.location = 'Please set your location'
        break
        
      case 1: // About You
        if (data.bio.length < 20) newErrors.bio = 'Bio must be at least 20 characters'
        if (data.bio.length > 500) newErrors.bio = 'Bio must be less than 500 characters'
        break
        
      case 2: // Photos
        if (data.photos.length < 2) newErrors.photos = 'Please upload at least 2 photos'
        if (data.photos.length > 6) newErrors.photos = 'Maximum 6 photos allowed'
        break
        
      case 3: // Interests
        if (data.interests.length < 3) newErrors.interests = 'Please select at least 3 interests'
        if (data.interests.length > 10) newErrors.interests = 'Maximum 10 interests allowed'
        break
        
      case 4: // Preferences
        if (data.ageRange[0] < 18) newErrors.ageRange = 'Minimum age must be 18+'
        if (data.ageRange[1] > 100) newErrors.ageRange = 'Maximum age must be under 100'
        if (data.ageRange[0] >= data.ageRange[1]) newErrors.ageRange = 'Invalid age range'
        if (data.maxDistance < 1 || data.maxDistance > 100) newErrors.maxDistance = 'Distance must be 1-100 miles'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEP_TITLES.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handlePhotoUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const result = await uploadPhoto(formData).unwrap()
      updateData({ photos: [...data.photos, result.url] })
    } catch (error) {
      setErrors({ photos: 'Failed to upload photo. Please try again.' })
    }
  }

  const removePhoto = (index: number) => {
    updateData({ photos: data.photos.filter((_, i) => i !== index) })
  }

  const toggleInterest = (interest: string) => {
    const isSelected = data.interests.includes(interest)
    if (isSelected) {
      updateData({ interests: data.interests.filter(i => i !== interest) })
    } else if (data.interests.length < 10) {
      updateData({ interests: [...data.interests, interest] })
    }
  }

  const finishOnboarding = async () => {
    if (!validateStep(currentStep)) return
    
    setLoading(true)
    try {
      await updateUser({
        id: user!.id,
        age: data.age,
        gender: data.gender,
        location: data.location,
        bio: data.bio,
        photos: data.photos,
        preferences: {
          ageRange: data.ageRange,
          distance: data.maxDistance,
          interests: data.interests
        },
        'privacy.consentBetAnalysis': data.consentBetAnalysis,
        'privacy.hideFromBetting': data.hideFromBetting
      }).unwrap()
      
      // Navigate to main app
      navigate('/dating')
    } catch (error) {
      setErrors({ general: 'Failed to save profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Age</label>
              <input
                type="number"
                value={data.age}
                onChange={(e) => updateData({ age: parseInt(e.target.value) || 18 })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none"
                min="18"
                max="100"
              />
              {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female', 'non-binary', 'other'] as const).map(gender => (
                  <button
                    key={gender}
                    onClick={() => updateData({ gender })}
                    className={`px-4 py-3 rounded-lg border transition-colors ${
                      data.gender === gender
                        ? 'bg-brand-pink border-brand-pink text-white'
                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Location</label>
              <input
                type="text"
                value={data.location.city}
                onChange={(e) => updateData({ location: { ...data.location, city: e.target.value } })}
                placeholder="City, State"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50"
              />
              {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>
        )

      case 1: // About You
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Tell us about yourself
                <span className="text-white/60 ml-2">({data.bio.length}/500)</span>
              </label>
              <textarea
                value={data.bio}
                onChange={(e) => updateData({ bio: e.target.value })}
                placeholder="Write something interesting about yourself that others would want to know..."
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none placeholder-white/50 resize-none"
              />
              {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio}</p>}
            </div>
          </div>
        )

      case 2: // Photos
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Your Photos ({data.photos.length}/6)
              </label>
              <p className="text-white/60 text-sm mb-4">
                Add 2-6 photos that show your personality. Your first photo will be your main profile picture.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-brand-pink text-white text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
                
                {data.photos.length < 6 && (
                  <label className="aspect-square border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-pink/50 transition-colors">
                    <svg className="w-8 h-8 text-white/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-white/60 text-sm">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoUpload(file)
                      }}
                    />
                  </label>
                )}
              </div>
              {errors.photos && <p className="text-red-400 text-sm mt-1">{errors.photos}</p>}
            </div>
          </div>
        )

      case 3: // Interests
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Your Interests ({data.interests.length}/10)
              </label>
              <p className="text-white/60 text-sm mb-4">
                Select 3-10 interests to help us find compatible matches.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTEREST_OPTIONS.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    disabled={!data.interests.includes(interest) && data.interests.length >= 10}
                    className={`px-4 py-2 rounded-lg border transition-colors text-sm ${
                      data.interests.includes(interest)
                        ? 'bg-brand-pink border-brand-pink text-white'
                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {errors.interests && <p className="text-red-400 text-sm mt-1">{errors.interests}</p>}
            </div>
          </div>
        )

      case 4: // Dating Preferences
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Age Range: {data.ageRange[0]} - {data.ageRange[1]}
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-xs text-white/60">Min Age</label>
                                <input
                type="range"
                min="18"
                max="100"
                value={data.ageRange[0]}
                onChange={(e) => updateData({ ageRange: [parseInt(e.target.value), data.ageRange[1]] })}
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
                    value={data.ageRange[1]}
                    onChange={(e) => updateData({ ageRange: [data.ageRange[0], parseInt(e.target.value)] })}
                    className="w-full"
                    aria-label="Maximum age preference"
                  />
                </div>
              </div>
              {errors.ageRange && <p className="text-red-400 text-sm mt-1">{errors.ageRange}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Maximum Distance: {data.maxDistance} miles
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={data.maxDistance}
                onChange={(e) => updateData({ maxDistance: parseInt(e.target.value) })}
                className="w-full"
                aria-label="Maximum distance preference"
              />
              {errors.maxDistance && <p className="text-red-400 text-sm mt-1">{errors.maxDistance}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Looking For</label>
              <div className="grid grid-cols-3 gap-3">
                {(['casual', 'serious', 'both'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => updateData({ lookingFor: type })}
                    className={`px-4 py-3 rounded-lg border transition-colors ${
                      data.lookingFor === type
                        ? 'bg-brand-pink border-brand-pink text-white'
                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 5: // Privacy Settings
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">Betting Analysis Consent</h4>
                    <p className="text-white/60 text-sm">
                      Allow us to analyze your dating patterns to improve betting odds and provide personalized insights.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={data.consentBetAnalysis}
                      onChange={(e) => updateData({ consentBetAnalysis: e.target.checked })}
                      className="sr-only peer"
                      aria-label="Consent to betting analysis"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">Hide from Betting</h4>
                    <p className="text-white/60 text-sm">
                      Prevent others from creating betting markets about your dates and relationships.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={data.hideFromBetting}
                      onChange={(e) => updateData({ hideFromBetting: e.target.checked })}
                      className="sr-only peer"
                      aria-label="Hide from betting markets"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-dark to-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
            <span className="text-white/60 text-sm">
              {currentStep + 1} of {STEP_TITLES.length}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-brand-pink h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            {STEP_TITLES[currentStep]}
          </h2>
          
          {renderStepContent()}
          
          {errors.general && (
            <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {errors.general}
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep === STEP_TITLES.length - 1 ? (
            <button
              onClick={finishOnboarding}
              disabled={loading}
              className="px-8 py-3 rounded-lg bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-6 py-3 rounded-lg bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
