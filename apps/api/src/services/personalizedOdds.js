const CompatibilityEngine = require('./compatibility');
const BetPlacement = require('../models/BetPlacement');
const User = require('../models/User');
const Bet = require('../models/Bet');
const Match = require('../models/Match');

/**
 * Personalized Odds Calculation System
 * Generates fair but advantageous odds based on chemistry and user behavior
 */
class PersonalizedOddsEngine {
  
  /**
   * Calculate personalized odds for a specific bet and bettor
   * @param {Object} bet - The bet object
   * @param {Object} match - The match being bet on
   * @param {Object} bettor - The user placing the bet
   * @returns {Object} Personalized odds calculation
   */
  static async calculatePersonalizedOdds(bet, match, bettor) {
    try {
      // Get the matched users
      const [userA, userB] = await Promise.all([
        User.findById(match.userA),
        User.findById(match.userB)
      ]);
      
      if (!userA || !userB) {
        throw new Error('Match users not found');
      }
      
      // Calculate base probability using compatibility
      const compatibility = await CompatibilityEngine.calculateCompatibility(userA, userB);
      const baseProbability = this.calculateBaseProbability(bet.betType, compatibility);
      
      // Apply personalization factors
      const personalizationMultiplier = await this.calculatePersonalizationMultiplier(
        bettor, 
        bet.betType, 
        compatibility
      );
      
      // Calculate market factors
      const marketFactors = await this.calculateMarketFactors(bet._id);
      
      // Apply real-time adjustments
      const realTimeAdjustments = await this.calculateRealTimeAdjustments(match, bet);
      
      // Calculate final odds
      const adjustedProbability = this.applyAllAdjustments(
        baseProbability,
        personalizationMultiplier,
        marketFactors,
        realTimeAdjustments
      );
      
      const odds = this.convertProbabilityToOdds(adjustedProbability);
      const fairnessScore = this.calculateFairnessScore(odds, baseProbability);
      
      return {
        personalizedOdds: odds,
        baseProbability,
        adjustedProbability,
        factors: {
          compatibility: compatibility.overallScore,
          personalization: personalizationMultiplier,
          market: marketFactors,
          realTime: realTimeAdjustments
        },
        fairnessScore,
        confidence: compatibility.confidence,
        explanation: this.generateExplanation(bet.betType, compatibility, personalizationMultiplier)
      };
    } catch (error) {
      console.error('Personalized odds calculation error:', error);
      return this.getFallbackOdds(bet);
    }
  }
  
  /**
   * Calculate base probability for different bet types
   */
  static calculateBaseProbability(betType, compatibility) {
    const compatibilityScore = compatibility.overallScore;
    
    switch (betType) {
      case 'first_date':
        // Higher compatibility = higher chance of first date
        return Math.min(0.95, 0.3 + (compatibilityScore * 0.6));
        
      case 'second_date':
        // Second date requires higher compatibility threshold
        return Math.min(0.85, 0.15 + (compatibilityScore * 0.7));
        
      case 'relationship_30_days':
        // Long-term success requires very high compatibility
        return Math.min(0.75, 0.05 + (compatibilityScore * 0.7));
        
      case 'first_kiss':
        // Physical chemistry component more important
        const physicalCompatibility = compatibility.breakdown?.profileSimilarity || compatibilityScore;
        return Math.min(0.80, 0.2 + (physicalCompatibility * 0.6));
        
      case 'drinks_over_2':
        // Based on social activity patterns
        const behavioralScore = compatibility.breakdown?.behavioralCompatibility || compatibilityScore;
        return Math.min(0.70, 0.25 + (behavioralScore * 0.45));
        
      case 'message_response_6_hours':
        // Communication-based prediction
        const responseCompatibility = compatibility.breakdown?.behavioralCompatibility || compatibilityScore;
        return Math.min(0.90, 0.4 + (responseCompatibility * 0.5));
        
      default:
        // Generic probability for unknown bet types
        return Math.min(0.80, 0.3 + (compatibilityScore * 0.5));
    }
  }
  
  /**
   * Calculate personalization multiplier based on bettor's characteristics
   */
  static async calculatePersonalizationMultiplier(bettor, betType, compatibility) {
    try {
      // Analyze bettor's historical performance
      const bettingHistory = await this.getBettingHistory(bettor._id, betType);
      const skillLevel = this.calculateBettingSkill(bettingHistory);
      
      // User engagement and activity level
      const engagementLevel = this.calculateEngagementLevel(bettor);
      
      // Market preference analysis
      const marketPreference = this.calculateMarketPreference(bettingHistory, betType);
      
      // Chemistry prediction skill (how good they are at predicting relationships)
      const chemistryPredictionSkill = await this.calculateChemistryPredictionSkill(bettor._id);
      
      let multiplier = 1.0;
      
      // Skilled bettors get slightly worse odds (house protection)
      if (skillLevel > 0.65) {
        multiplier *= 0.96; // 4% worse odds
      } else if (skillLevel < 0.35) {
        multiplier *= 1.03; // 3% better odds for poor performers
      }
      
      // High engagement users get small bonus (retention)
      if (engagementLevel > 0.8) {
        multiplier *= 1.01;
      }
      
      // Market preference bonus
      if (marketPreference > 0.7) {
        multiplier *= 1.01; // Slight bonus for betting on preferred markets
      }
      
      // Chemistry prediction skill factor
      if (chemistryPredictionSkill > 0.7) {
        multiplier *= 0.98; // Slightly worse odds for chemistry experts
      } else if (chemistryPredictionSkill < 0.3) {
        multiplier *= 1.02; // Better odds for those poor at predicting chemistry
      }
      
      // Ensure multiplier stays within reasonable bounds
      return Math.min(Math.max(multiplier, 0.90), 1.10);
      
    } catch (error) {
      console.error('Personalization calculation error:', error);
      return 1.0; // Neutral multiplier on error
    }
  }
  
  /**
   * Calculate market-based factors affecting odds
   */
  static async calculateMarketFactors(betId) {
    try {
      // Get betting volume and distribution
      const bettingActivity = await BetPlacement.aggregate([
        { $match: { betId: betId } },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$stakeUSD' },
            avgStake: { $avg: '$stakeUSD' },
            betCount: { $sum: 1 },
            yesStakes: {
              $sum: {
                $cond: [{ $eq: ['$selection', 'yes'] }, '$stakeUSD', 0]
              }
            },
            noStakes: {
              $sum: {
                $cond: [{ $eq: ['$selection', 'no'] }, '$stakeUSD', 0]
              }
            }
          }
        }
      ]);
      
      if (!bettingActivity.length) {
        return { imbalanceAdjustment: 1.0, volumeAdjustment: 1.0 };
      }
      
      const activity = bettingActivity[0];
      const totalStakes = activity.yesStakes + activity.noStakes;
      
      // Calculate betting imbalance
      let imbalanceAdjustment = 1.0;
      if (totalStakes > 0) {
        const yesRatio = activity.yesStakes / totalStakes;
        const imbalance = Math.abs(yesRatio - 0.5);
        
        // Adjust odds based on betting imbalance (max 10% adjustment)
        if (imbalance > 0.3) {
          imbalanceAdjustment = 1.0 + (imbalance - 0.3) * 0.2;
        }
      }
      
      // Volume-based adjustment (higher volume = more stable odds)
      const volumeAdjustment = Math.min(1.05, 1.0 + (activity.totalVolume / 10000) * 0.05);
      
      return {
        imbalanceAdjustment,
        volumeAdjustment,
        totalVolume: activity.totalVolume,
        betCount: activity.betCount
      };
      
    } catch (error) {
      console.error('Market factors calculation error:', error);
      return { imbalanceAdjustment: 1.0, volumeAdjustment: 1.0 };
    }
  }
  
  /**
   * Calculate real-time adjustments based on recent activity
   */
  static async calculateRealTimeAdjustments(match, bet) {
    try {
      let adjustments = {
        recentActivity: 1.0,
        timeDecay: 1.0,
        socialSignals: 1.0
      };
      
      // Recent messaging activity adjustment
      const recentMessages = await this.getRecentMessages(match._id);
      if (recentMessages.length > 0) {
        const messageFrequency = recentMessages.length / 24; // Messages per hour in last 24h
        
        if (bet.betType === 'first_date' || bet.betType === 'message_response_6_hours') {
          // More messages = higher probability for communication-based bets
          adjustments.recentActivity = Math.min(1.2, 1.0 + (messageFrequency * 0.1));
        }
      }
      
      // Time decay factor for date-based bets
      if (bet.betType.includes('date') && match.dateScheduled) {
        const hoursUntilDate = (new Date(match.dateScheduled) - new Date()) / (1000 * 60 * 60);
        
        if (hoursUntilDate > 0 && hoursUntilDate < 168) { // Within a week
          // Closer to date = more certainty
          adjustments.timeDecay = Math.min(1.1, 1.0 + ((168 - hoursUntilDate) / 168) * 0.1);
        }
      }
      
      // Social signals (simplified - could integrate with social media)
      // This is a placeholder for more sophisticated social signal analysis
      adjustments.socialSignals = 1.0;
      
      return adjustments;
      
    } catch (error) {
      console.error('Real-time adjustments calculation error:', error);
      return { recentActivity: 1.0, timeDecay: 1.0, socialSignals: 1.0 };
    }
  }
  
  /**
   * Apply all adjustments to base probability
   */
  static applyAllAdjustments(baseProbability, personalization, market, realTime) {
    let adjustedProbability = baseProbability;
    
    // Apply market factors
    if (market.imbalanceAdjustment) {
      adjustedProbability *= market.imbalanceAdjustment;
    }
    
    // Apply real-time factors
    Object.values(realTime).forEach(factor => {
      adjustedProbability *= factor;
    });
    
    // Ensure probability stays within bounds
    adjustedProbability = Math.min(Math.max(adjustedProbability, 0.05), 0.95);
    
    return adjustedProbability;
  }
  
  /**
   * Convert probability to odds with house edge
   */
  static convertProbabilityToOdds(probability) {
    const houseEdge = 0.05; // 5% house edge
    const adjustedProbability = probability * (1 + houseEdge);
    const odds = 1 / adjustedProbability;
    
    // Round to reasonable precision and ensure minimum odds
    return Math.max(1.05, Math.round(odds * 100) / 100);
  }
  
  /**
   * Calculate fairness score for transparency
   */
  static calculateFairnessScore(personalizedOdds, baseProbability) {
    const baseOdds = 1 / baseProbability;
    const difference = Math.abs(personalizedOdds - baseOdds) / baseOdds;
    
    // Fairness score decreases as personalization increases
    return Math.max(0, 1 - (difference * 2));
  }
  
  /**
   * Generate human-readable explanation
   */
  static generateExplanation(betType, compatibility, personalization) {
    const compatScore = (compatibility.overallScore * 100).toFixed(0);
    const personalMultiplier = ((personalization - 1) * 100).toFixed(1);
    
    let explanation = `Based on ${compatScore}% compatibility score`;
    
    if (Math.abs(personalMultiplier) > 0.5) {
      const direction = personalMultiplier > 0 ? 'improved' : 'adjusted';
      explanation += `, odds ${direction} by ${Math.abs(personalMultiplier)}% based on your betting profile`;
    }
    
    return explanation;
  }
  
  // Helper Methods
  
  static async getBettingHistory(userId, betType = null) {
    const query = { userId };
    if (betType) {
      const bets = await Bet.find({ betType }).select('_id');
      query.betId = { $in: bets.map(b => b._id) };
    }
    
    return await BetPlacement.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
  }
  
  static calculateBettingSkill(bettingHistory) {
    if (bettingHistory.length < 5) return 0.5; // Neutral for new users
    
    const outcomes = bettingHistory.filter(bet => bet.outcome !== 'pending');
    if (outcomes.length === 0) return 0.5;
    
    const winRate = outcomes.filter(bet => bet.outcome === 'win').length / outcomes.length;
    const profitability = outcomes.reduce((sum, bet) => {
      return sum + (bet.outcome === 'win' ? bet.potentialPayoutUSD - bet.stakeUSD : -bet.stakeUSD);
    }, 0);
    
    const avgStake = outcomes.reduce((sum, bet) => sum + bet.stakeUSD, 0) / outcomes.length;
    const roi = profitability / (avgStake * outcomes.length);
    
    // Combine win rate and ROI for skill score
    return Math.min(Math.max((winRate * 0.6) + ((roi + 1) * 0.4), 0), 1);
  }
  
  static calculateEngagementLevel(user) {
    let score = 0;
    
    // Account age factor
    const daysSinceCreation = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
    score += Math.min(daysSinceCreation / 30, 1) * 0.3;
    
    // Activity factors
    const history = user.history || {};
    score += Math.min((history.matchesCount || 0) / 20, 1) * 0.3;
    score += Math.min((history.betsPlaced || 0) / 50, 1) * 0.4;
    
    return score;
  }
  
  static calculateMarketPreference(bettingHistory, betType) {
    if (bettingHistory.length === 0) return 0.5;
    
    const betTypeCounts = {};
    bettingHistory.forEach(bet => {
      // Would need to resolve bet type from bet ID in real implementation
      betTypeCounts[betType] = (betTypeCounts[betType] || 0) + 1;
    });
    
    const totalBets = bettingHistory.length;
    return (betTypeCounts[betType] || 0) / totalBets;
  }
  
  static async calculateChemistryPredictionSkill(userId) {
    // Analyze user's success rate specifically on relationship-outcome bets
    const relationshipBetTypes = ['first_date', 'second_date', 'relationship_30_days', 'first_kiss'];
    const relationshipBets = await this.getBettingHistory(userId).then(history =>
      // Filter for relationship-related bets (simplified)
      history.filter(bet => relationshipBetTypes.some(type => bet.description?.includes(type)))
    );
    
    return this.calculateBettingSkill(relationshipBets);
  }
  
  static async getRecentMessages(matchId) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await Message.find({
      matchId,
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });
  }
  
  static getFallbackOdds(bet) {
    return {
      personalizedOdds: bet.odds || 2.0,
      baseProbability: 0.5,
      adjustedProbability: 0.5,
      factors: {},
      fairnessScore: 1.0,
      confidence: 0.1,
      explanation: 'Using default odds due to insufficient data'
    };
  }
}

module.exports = PersonalizedOddsEngine;
