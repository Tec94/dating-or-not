const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
const BetPlacement = require('../models/BetPlacement');

/**
 * Advanced Compatibility Scoring System
 * Calculates multi-dimensional compatibility between two users
 */
class CompatibilityEngine {
  
  /**
   * Calculate overall compatibility score between two users
   * @param {Object} userA - First user object
   * @param {Object} userB - Second user object
   * @returns {Object} Detailed compatibility analysis
   */
  static async calculateCompatibility(userA, userB) {
    try {
      // Core compatibility factors
      const profileSimilarity = this.calculateProfileSimilarity(userA, userB);
      const preferenceAlignment = this.calculatePreferenceAlignment(userA, userB);
      const geographicCompatibility = this.calculateGeographicCompatibility(userA, userB);
      const behavioralCompatibility = await this.calculateBehavioralCompatibility(userA, userB);
      const historicalSuccess = await this.calculateHistoricalSuccessPatterns(userA, userB);
      
      // Weighted compatibility score
      const weights = {
        profile: 0.25,
        preferences: 0.20,
        geographic: 0.10,
        behavioral: 0.30,
        historical: 0.15
      };
      
      const overallScore = (
        profileSimilarity * weights.profile +
        preferenceAlignment * weights.preferences +
        geographicCompatibility * weights.geographic +
        behavioralCompatibility * weights.behavioral +
        historicalSuccess * weights.historical
      );
      
      return {
        overallScore: Math.min(Math.max(overallScore, 0), 1), // Clamp between 0-1
        breakdown: {
          profileSimilarity,
          preferenceAlignment,
          geographicCompatibility,
          behavioralCompatibility,
          historicalSuccess
        },
        confidence: this.calculateConfidence(userA, userB),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Compatibility calculation error:', error);
      return {
        overallScore: 0.5, // Default neutral score
        breakdown: {},
        confidence: 0.1,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate profile-based similarity
   */
  static calculateProfileSimilarity(userA, userB) {
    let score = 0;
    let factors = 0;
    
    // Age compatibility
    const ageDiff = Math.abs(userA.age - userB.age);
    const ageScore = Math.max(0, 1 - (ageDiff / 15)); // Penalty increases with age gap
    score += ageScore * 0.3;
    factors += 0.3;
    
    // Interest overlap using Jaccard similarity
    const interestsA = new Set(userA.preferences?.interests || []);
    const interestsB = new Set(userB.preferences?.interests || []);
    const intersection = new Set([...interestsA].filter(x => interestsB.has(x)));
    const union = new Set([...interestsA, ...interestsB]);
    const interestScore = union.size > 0 ? intersection.size / union.size : 0;
    score += interestScore * 0.4;
    factors += 0.4;
    
    // Bio similarity using simple text analysis
    const bioScore = this.calculateTextSimilarity(userA.bio || '', userB.bio || '');
    score += bioScore * 0.3;
    factors += 0.3;
    
    return factors > 0 ? score / factors : 0;
  }
  
  /**
   * Calculate preference alignment
   */
  static calculatePreferenceAlignment(userA, userB) {
    let score = 0;
    let factors = 0;
    
    // Age preference match
    const prefsA = userA.preferences || {};
    const prefsB = userB.preferences || {};
    
    if (prefsA.ageRange && prefsB.ageRange) {
      const aWantsB = userB.age >= prefsA.ageRange[0] && userB.age <= prefsA.ageRange[1];
      const bWantsA = userA.age >= prefsB.ageRange[0] && userA.age <= prefsB.ageRange[1];
      
      if (aWantsB && bWantsA) score += 1.0;
      else if (aWantsB || bWantsA) score += 0.5;
      
      factors += 1.0;
    }
    
    // Distance preference alignment
    if (prefsA.distance && prefsB.distance && userA.location && userB.location) {
      const actualDistance = this.calculateDistance(userA.location, userB.location);
      const maxAcceptableDistance = Math.min(prefsA.distance, prefsB.distance);
      
      if (actualDistance <= maxAcceptableDistance) {
        score += Math.max(0, 1 - (actualDistance / maxAcceptableDistance));
      }
      factors += 1.0;
    }
    
    return factors > 0 ? score / factors : 0.5;
  }
  
  /**
   * Calculate geographic compatibility
   */
  static calculateGeographicCompatibility(userA, userB) {
    if (!userA.location || !userB.location) return 0.5;
    
    const distance = this.calculateDistance(userA.location, userB.location);
    
    // Logarithmic decay function - closer is much better
    if (distance <= 5) return 1.0;
    if (distance <= 15) return 0.8;
    if (distance <= 30) return 0.6;
    if (distance <= 50) return 0.4;
    return Math.max(0.1, 1 - (distance / 100));
  }
  
  /**
   * Calculate behavioral compatibility based on app usage patterns
   */
  static async calculateBehavioralCompatibility(userA, userB) {
    try {
      // Get recent activity patterns
      const activityA = await this.getUserActivityPattern(userA._id);
      const activityB = await this.getUserActivityPattern(userB._id);
      
      if (!activityA || !activityB) return 0.5;
      
      let score = 0;
      let factors = 0;
      
      // Active time overlap
      const timeOverlap = this.calculateTimeOverlap(activityA.activeTimes, activityB.activeTimes);
      score += timeOverlap * 0.4;
      factors += 0.4;
      
      // Response time compatibility
      const responseTimeScore = this.calculateResponseTimeCompatibility(
        activityA.avgResponseTime, 
        activityB.avgResponseTime
      );
      score += responseTimeScore * 0.3;
      factors += 0.3;
      
      // Session length similarity
      const sessionScore = this.calculateSessionCompatibility(
        activityA.avgSessionLength,
        activityB.avgSessionLength
      );
      score += sessionScore * 0.3;
      factors += 0.3;
      
      return factors > 0 ? score / factors : 0.5;
    } catch (error) {
      console.error('Behavioral compatibility error:', error);
      return 0.5;
    }
  }
  
  /**
   * Calculate historical success patterns
   */
  static async calculateHistoricalSuccessPatterns(userA, userB) {
    try {
      // Analyze past successful matches for similar profiles
      const similarMatches = await this.findSimilarSuccessfulMatches(userA, userB);
      
      if (similarMatches.length === 0) return 0.5;
      
      // Calculate success rate for similar profile combinations
      const successfulMatches = similarMatches.filter(match => 
        match.outcome === 'successful' || match.datesCount > 0
      );
      
      const successRate = successfulMatches.length / similarMatches.length;
      
      // Apply confidence weighting based on sample size
      const confidenceWeight = Math.min(similarMatches.length / 20, 1);
      
      return (successRate * confidenceWeight) + (0.5 * (1 - confidenceWeight));
    } catch (error) {
      console.error('Historical pattern analysis error:', error);
      return 0.5;
    }
  }
  
  /**
   * Calculate confidence level in the compatibility score
   */
  static calculateConfidence(userA, userB) {
    let confidence = 0;
    
    // Profile completeness factor
    const completenessA = this.calculateProfileCompleteness(userA);
    const completenessB = this.calculateProfileCompleteness(userB);
    confidence += (completenessA + completenessB) / 2 * 0.4;
    
    // Account age factor (more data = higher confidence)
    const daysSinceCreationA = (Date.now() - new Date(userA.createdAt)) / (1000 * 60 * 60 * 24);
    const daysSinceCreationB = (Date.now() - new Date(userB.createdAt)) / (1000 * 60 * 60 * 24);
    const avgAccountAge = (daysSinceCreationA + daysSinceCreationB) / 2;
    confidence += Math.min(avgAccountAge / 30, 1) * 0.3; // Max confidence boost at 30 days
    
    // Activity level factor
    const activityLevelA = userA.history?.matchesCount || 0;
    const activityLevelB = userB.history?.matchesCount || 0;
    const avgActivity = (activityLevelA + activityLevelB) / 2;
    confidence += Math.min(avgActivity / 10, 1) * 0.3; // Max confidence boost at 10 matches
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }
  
  // Helper Methods
  
  static calculateTextSimilarity(textA, textB) {
    if (!textA || !textB) return 0;
    
    const wordsA = textA.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const wordsB = textB.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  static calculateDistance(locA, locB) {
    const R = 3959; // Earth's radius in miles
    const dLat = (locB.lat - locA.lat) * Math.PI / 180;
    const dLon = (locB.lng - locA.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(locA.lat * Math.PI / 180) * Math.cos(locB.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  static async getUserActivityPattern(userId) {
    try {
      // Analyze recent messages for activity patterns
      const recentMessages = await Message.find({ 
        senderId: userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ createdAt: -1 }).limit(100);
      
      if (recentMessages.length === 0) return null;
      
      // Calculate active hours
      const hourCounts = new Array(24).fill(0);
      recentMessages.forEach(msg => {
        const hour = new Date(msg.createdAt).getHours();
        hourCounts[hour]++;
      });
      
      const activeTimes = hourCounts.map((count, hour) => ({ hour, activity: count }))
        .filter(item => item.activity > 0)
        .sort((a, b) => b.activity - a.activity)
        .slice(0, 8) // Top 8 active hours
        .map(item => item.hour);
      
      // Calculate average response time (simplified)
      const avgResponseTime = this.calculateAverageResponseTime(recentMessages);
      
      // Calculate average session length (simplified)
      const avgSessionLength = this.calculateAverageSessionLength(recentMessages);
      
      return {
        activeTimes,
        avgResponseTime,
        avgSessionLength,
        messageCount: recentMessages.length
      };
    } catch (error) {
      console.error('Activity pattern analysis error:', error);
      return null;
    }
  }
  
  static calculateTimeOverlap(timesA, timesB) {
    if (!timesA || !timesB) return 0;
    
    const setA = new Set(timesA);
    const setB = new Set(timesB);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / Math.min(setA.size, setB.size) : 0;
  }
  
  static calculateResponseTimeCompatibility(timeA, timeB) {
    if (!timeA || !timeB) return 0.5;
    
    const ratio = Math.min(timeA, timeB) / Math.max(timeA, timeB);
    return ratio; // Higher ratio = more similar response times
  }
  
  static calculateSessionCompatibility(sessionA, sessionB) {
    if (!sessionA || !sessionB) return 0.5;
    
    const ratio = Math.min(sessionA, sessionB) / Math.max(sessionA, sessionB);
    return ratio; // Higher ratio = more similar session lengths
  }
  
  static calculateAverageResponseTime(messages) {
    // Simplified - would need conversation threading for accurate calculation
    const intervals = [];
    for (let i = 1; i < messages.length; i++) {
      const interval = new Date(messages[i-1].createdAt) - new Date(messages[i].createdAt);
      if (interval > 0 && interval < 24 * 60 * 60 * 1000) { // Within 24 hours
        intervals.push(interval);
      }
    }
    
    return intervals.length > 0 ? 
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length / (60 * 1000) : // Convert to minutes
      60; // Default 1 hour
  }
  
  static calculateAverageSessionLength(messages) {
    // Simplified session calculation
    const sessions = [];
    let currentSession = [];
    
    messages.forEach((msg, index) => {
      if (index === 0) {
        currentSession = [msg];
      } else {
        const timeDiff = new Date(messages[index-1].createdAt) - new Date(msg.createdAt);
        if (timeDiff < 30 * 60 * 1000) { // Within 30 minutes = same session
          currentSession.push(msg);
        } else {
          if (currentSession.length > 1) {
            sessions.push(currentSession);
          }
          currentSession = [msg];
        }
      }
    });
    
    if (currentSession.length > 1) {
      sessions.push(currentSession);
    }
    
    const sessionLengths = sessions.map(session => {
      const start = new Date(session[session.length - 1].createdAt);
      const end = new Date(session[0].createdAt);
      return (end - start) / (60 * 1000); // Convert to minutes
    });
    
    return sessionLengths.length > 0 ?
      sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length :
      30; // Default 30 minutes
  }
  
  static async findSimilarSuccessfulMatches(userA, userB) {
    try {
      // Find matches with similar profile characteristics
      const similarMatches = await Match.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userA',
            foreignField: '_id',
            as: 'userAData'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userB',
            foreignField: '_id',
            as: 'userBData'
          }
        },
        {
          $match: {
            'userAData.age': { $gte: userA.age - 5, $lte: userA.age + 5 },
            'userBData.age': { $gte: userB.age - 5, $lte: userB.age + 5 },
            createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
          }
        },
        {
          $limit: 100
        }
      ]);
      
      return similarMatches;
    } catch (error) {
      console.error('Similar matches query error:', error);
      return [];
    }
  }
  
  static calculateProfileCompleteness(user) {
    let score = 0;
    const maxScore = 100;
    
    // Basic info
    if (user.age) score += 10;
    if (user.gender) score += 10;
    if (user.location) score += 15;
    
    // Profile content
    if (user.bio && user.bio.length > 20) score += 20;
    if (user.photos && user.photos.length >= 2) score += 25;
    
    // Preferences
    if (user.preferences?.interests && user.preferences.interests.length >= 3) score += 15;
    if (user.preferences?.ageRange) score += 5;
    
    return score / maxScore;
  }
}

module.exports = CompatibilityEngine;
