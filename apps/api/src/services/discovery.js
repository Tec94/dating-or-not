const User = require('../models/User');
const Match = require('../models/Match');
const CompatibilityEngine = require('./compatibility');

/**
 * User Discovery and Matching Service
 * Finds potential matches based on preferences, compatibility, and location
 */
class DiscoveryService {
  
  /**
   * Get personalized discovery feed for a user
   * @param {String} userId - The user requesting matches
   * @param {Object} options - Discovery options (limit, radius, etc.)
   * @returns {Array} Array of potential matches with compatibility scores
   */
  static async getDiscoveryFeed(userId, options = {}) {
    try {
      const {
        limit = 20,
        maxDistance = 50,
        ageRange = null,
        skipUserIds = []
      } = options;
      
      // Get current user
      const currentUser = await User.findById(userId).lean();
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      // Build discovery query
      const discoveryQuery = this.buildDiscoveryQuery(currentUser, {
        maxDistance,
        ageRange,
        skipUserIds: [...skipUserIds, userId] // Don't show self
      });
      
      // Get potential matches
      const potentialMatches = await User.find(discoveryQuery)
        .select('-passwordHash -email') // Remove sensitive data
        .limit(limit * 3) // Get more candidates for filtering
        .lean();
      
      // Calculate compatibility scores and rank
      const rankedMatches = await Promise.all(
        potentialMatches.map(async (candidate) => {
          const compatibility = await CompatibilityEngine.calculateCompatibility(
            currentUser, 
            candidate
          );
          
          return {
            user: candidate,
            compatibility,
            distance: this.calculateDistance(currentUser.location, candidate.location),
            discoveryScore: this.calculateDiscoveryScore(currentUser, candidate, compatibility)
          };
        })
      );
      
      // Sort by discovery score and return top matches
      return rankedMatches
        .sort((a, b) => b.discoveryScore - a.discoveryScore)
        .slice(0, limit)
        .map(match => ({
          id: match.user._id,
          username: match.user.username,
          age: match.user.age,
          photos: match.user.photos || [],
          bio: match.user.bio || '',
          interests: match.user.preferences?.interests || [],
          location: {
            city: match.user.location?.city || 'Unknown',
            distance: Math.round(match.distance)
          },
          compatibility: {
            score: Math.round(match.compatibility.overallScore * 100),
            confidence: Math.round(match.compatibility.confidence * 100)
          },
          discoveryScore: match.discoveryScore
        }));
        
    } catch (error) {
      console.error('Discovery feed error:', error);
      throw error;
    }
  }
  
  /**
   * Handle user swipe action (like/pass)
   * @param {String} swiperId - User who swiped
   * @param {String} targetId - User who was swiped on
   * @param {String} action - 'like' or 'pass'
   * @returns {Object} Result including match status
   */
  static async handleSwipe(swiperId, targetId, action) {
    try {
      if (swiperId === targetId) {
        throw new Error('Cannot swipe on yourself');
      }
      
      // Check if already matched
      const existingMatch = await Match.findOne({
        $or: [
          { userA: swiperId, userB: targetId },
          { userA: targetId, userB: swiperId }
        ]
      });
      
      if (existingMatch) {
        return {
          success: false,
          message: 'Already matched or interacted',
          match: existingMatch
        };
      }
      
      // Record the swipe (you might want a separate SwipeAction model)
      // For now, we'll check for mutual likes directly
      
      if (action === 'like') {
        // Check if target user has already liked the swiper
        const reverseMatch = await Match.findOne({
          userA: targetId,
          userB: swiperId,
          status: 'pending_match'
        });
        
        if (reverseMatch) {
          // Mutual like! Create match
          reverseMatch.status = 'matched';
          reverseMatch.matchedAt = new Date();
          await reverseMatch.save();
          
          // Update user statistics
          await Promise.all([
            User.findByIdAndUpdate(swiperId, { $inc: { 'history.matchesCount': 1 } }),
            User.findByIdAndUpdate(targetId, { $inc: { 'history.matchesCount': 1 } })
          ]);
          
          return {
            success: true,
            matched: true,
            match: reverseMatch,
            message: 'It\'s a match!'
          };
        } else {
          // Create pending match (waiting for reciprocation)
          const newMatch = await Match.create({
            userA: swiperId,
            userB: targetId,
            status: 'pending_match'
          });
          
          return {
            success: true,
            matched: false,
            match: newMatch,
            message: 'Like sent'
          };
        }
      } else {
        // Pass - just record the action (could store in separate model)
        return {
          success: true,
          matched: false,
          message: 'Pass recorded'
        };
      }
      
    } catch (error) {
      console.error('Swipe handling error:', error);
      throw error;
    }
  }
  
  /**
   * Get user's active matches
   * @param {String} userId - User ID
   * @returns {Array} Active matches with user details
   */
  static async getActiveMatches(userId) {
    try {
      const matches = await Match.find({
        $or: [
          { userA: userId },
          { userB: userId }
        ],
        status: 'matched'
      })
      .populate('userA', 'username age photos bio')
      .populate('userB', 'username age photos bio')
      .sort({ matchedAt: -1 })
      .lean();
      
      return matches.map(match => {
        const otherUser = match.userA._id.toString() === userId ? match.userB : match.userA;
        
        return {
          matchId: match._id,
          user: {
            id: otherUser._id,
            username: otherUser.username,
            age: otherUser.age,
            photos: otherUser.photos || [],
            bio: otherUser.bio || ''
          },
          matchedAt: match.matchedAt,
          lastMessage: match.lastMessage,
          hasMarket: !!match.betsMarketId
        };
      });
      
    } catch (error) {
      console.error('Active matches error:', error);
      throw error;
    }
  }
  
  /**
   * Build MongoDB query for user discovery
   */
  static buildDiscoveryQuery(currentUser, options) {
    const query = {
      _id: { $nin: options.skipUserIds },
      'privacy.hideFromBetting': { $ne: true }, // Respect privacy settings
    };
    
    // Age preferences
    const userPrefs = currentUser.preferences || {};
    const ageRange = options.ageRange || userPrefs.ageRange;
    
    if (ageRange && Array.isArray(ageRange) && ageRange.length === 2) {
      query.age = {
        $gte: ageRange[0],
        $lte: ageRange[1]
      };
    }
    
    // Geographic filtering
    if (currentUser.location && currentUser.location.lat && currentUser.location.lng) {
      const maxDistance = options.maxDistance || userPrefs.distance || 50;
      
      // MongoDB geospatial query for users within distance
      query['location.lat'] = {
        $gte: currentUser.location.lat - (maxDistance / 69), // Rough miles to degrees
        $lte: currentUser.location.lat + (maxDistance / 69)
      };
      query['location.lng'] = {
        $gte: currentUser.location.lng - (maxDistance / 54.6), // Longitude conversion varies by latitude
        $lte: currentUser.location.lng + (maxDistance / 54.6)
      };
    }
    
    // Exclude users they've already interacted with
    // TODO: Add SwipeAction model to track this properly
    
    // Profile completeness filter (ensure quality matches)
    query.age = { ...query.age, $exists: true };
    query.photos = { $exists: true, $not: { $size: 0 } };
    query.bio = { $exists: true, $ne: '' };
    
    return query;
  }
  
  /**
   * Calculate discovery score combining multiple factors
   */
  static calculateDiscoveryScore(currentUser, candidate, compatibility) {
    let score = 0;
    
    // Base compatibility score (weighted heavily)
    score += compatibility.overallScore * 0.6;
    
    // Mutual preference alignment
    const mutualInterest = this.calculateMutualInterest(currentUser, candidate);
    score += mutualInterest * 0.2;
    
    // Profile quality factor
    const profileQuality = this.calculateProfileQuality(candidate);
    score += profileQuality * 0.1;
    
    // Activity/freshness factor
    const activityScore = this.calculateActivityScore(candidate);
    score += activityScore * 0.05;
    
    // Random factor for serendipity
    score += Math.random() * 0.05;
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  /**
   * Calculate mutual interest/preference alignment
   */
  static calculateMutualInterest(userA, userB) {
    const prefsA = userA.preferences || {};
    const prefsB = userB.preferences || {};
    
    let score = 0;
    let factors = 0;
    
    // Age preference mutual alignment
    if (prefsA.ageRange && prefsB.ageRange) {
      const aLikesB = userB.age >= prefsA.ageRange[0] && userB.age <= prefsA.ageRange[1];
      const bLikesA = userA.age >= prefsB.ageRange[0] && userA.age <= prefsB.ageRange[1];
      
      if (aLikesB && bLikesA) score += 1.0;
      else if (aLikesB || bLikesA) score += 0.5;
      
      factors += 1.0;
    }
    
    // Interest overlap
    const interestsA = new Set(prefsA.interests || []);
    const interestsB = new Set(prefsB.interests || []);
    const intersection = new Set([...interestsA].filter(x => interestsB.has(x)));
    const union = new Set([...interestsA, ...interestsB]);
    
    if (union.size > 0) {
      score += intersection.size / union.size;
      factors += 1.0;
    }
    
    return factors > 0 ? score / factors : 0.5;
  }
  
  /**
   * Calculate profile quality score
   */
  static calculateProfileQuality(user) {
    let score = 0;
    
    // Photo count and quality
    const photoCount = (user.photos || []).length;
    score += Math.min(photoCount / 4, 1) * 0.4; // Max score with 4+ photos
    
    // Bio quality
    const bioLength = (user.bio || '').length;
    if (bioLength > 50) score += 0.3;
    else if (bioLength > 20) score += 0.15;
    
    // Profile completeness
    if (user.age) score += 0.1;
    if (user.location?.city) score += 0.1;
    if (user.preferences?.interests?.length >= 3) score += 0.1;
    
    return score;
  }
  
  /**
   * Calculate user activity/recency score
   */
  static calculateActivityScore(user) {
    const daysSinceUpdate = (Date.now() - new Date(user.updatedAt)) / (1000 * 60 * 60 * 24);
    
    // More recent activity = higher score
    if (daysSinceUpdate <= 1) return 1.0;
    if (daysSinceUpdate <= 7) return 0.8;
    if (daysSinceUpdate <= 30) return 0.6;
    return 0.3;
  }
  
  /**
   * Calculate distance between two locations
   */
  static calculateDistance(locA, locB) {
    if (!locA || !locB || !locA.lat || !locA.lng || !locB.lat || !locB.lng) {
      return 999; // Unknown distance
    }
    
    const R = 3959; // Earth's radius in miles
    const dLat = (locB.lat - locA.lat) * Math.PI / 180;
    const dLon = (locB.lng - locA.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(locA.lat * Math.PI / 180) * Math.cos(locB.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = DiscoveryService;
