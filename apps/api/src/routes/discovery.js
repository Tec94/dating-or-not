const express = require('express');
const { z } = require('zod');
const { schemas, validate } = require('../utils/validation');
const DiscoveryService = require('../services/discovery');
const PersonalizedOddsEngine = require('../services/personalizedOdds');
const BetsMarket = require('../models/BetsMarket');

const router = express.Router();

/**
 * @swagger
 * /discovery/feed:
 *   get:
 *     summary: Get personalized discovery feed
 *     tags: [Discovery]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Personalized discovery feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       age:
 *                         type: number
 *                       photos:
 *                         type: array
 *                         items:
 *                           type: string
 *                       bio:
 *                         type: string
 *                       interests:
 *                         type: array
 *                         items:
 *                           type: string
 *                       location:
 *                         type: object
 *                         properties:
 *                           city:
 *                             type: string
 *                           distance:
 *                             type: number
 *                       compatibility:
 *                         type: object
 *                         properties:
 *                           score:
 *                             type: number
 *                           confidence:
 *                             type: number
 */
router.get('/feed', 
  validate(z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    maxDistance: z.coerce.number().int().min(1).max(100).default(50),
    ageMin: z.coerce.number().int().min(18).max(100).optional(),
    ageMax: z.coerce.number().int().min(18).max(100).optional()
  }), 'query'),
  async (req, res, next) => {
    try {
      const { limit, maxDistance, ageMin, ageMax } = req.query;
      const userId = req.userId;
      
      const options = {
        limit,
        maxDistance,
        ageRange: (ageMin && ageMax) ? [ageMin, ageMax] : null
      };
      
      const discoveryFeed = await DiscoveryService.getDiscoveryFeed(userId, options);
      
      res.json({
        users: discoveryFeed,
        count: discoveryFeed.length,
        hasMore: discoveryFeed.length === limit
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /discovery/swipe:
 *   post:
 *     summary: Handle user swipe action
 *     tags: [Discovery]
 *     security:
 *       - BearerAuth: []
 *       - CsrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *               - action
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *               action:
 *                 type: string
 *                 enum: [like, pass]
 *     responses:
 *       200:
 *         description: Swipe action processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 matched:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 match:
 *                   type: object
 */
router.post('/swipe',
  validate(z.object({
    targetUserId: schemas.mongoId,
    action: z.enum(['like', 'pass'])
  })),
  async (req, res, next) => {
    try {
      const { targetUserId, action } = req.body;
      const swiperId = req.userId;
      
      const result = await DiscoveryService.handleSwipe(swiperId, targetUserId, action);
      
      // If it's a match and both users consent to betting, create a market automatically
      if (result.matched && result.match) {
        try {
          await createMarketForMatch(result.match._id, swiperId);
        } catch (marketError) {
          console.warn('Failed to create market for new match:', marketError.message);
          // Don't fail the swipe if market creation fails
        }
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /discovery/matches:
 *   get:
 *     summary: Get user's active matches
 *     tags: [Discovery]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's active matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/matches', async (req, res, next) => {
  try {
    const userId = req.userId;
    const matches = await DiscoveryService.getActiveMatches(userId);
    
    res.json({
      matches,
      count: matches.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /discovery/odds-preview:
 *   post:
 *     summary: Get personalized odds preview for a potential bet
 *     tags: [Discovery]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - betType
 *             properties:
 *               matchId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *               betType:
 *                 type: string
 *                 enum: [first_date, second_date, relationship_30_days, first_kiss, drinks_over_2]
 *     responses:
 *       200:
 *         description: Personalized odds preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 personalizedOdds:
 *                   type: number
 *                 explanation:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 fairnessScore:
 *                   type: number
 */
router.post('/odds-preview',
  validate(z.object({
    matchId: schemas.mongoId,
    betType: z.enum(['first_date', 'second_date', 'relationship_30_days', 'first_kiss', 'drinks_over_2', 'message_response_6_hours'])
  })),
  async (req, res, next) => {
    try {
      const { matchId, betType } = req.body;
      const bettorId = req.userId;
      
      // Create a mock bet object for odds calculation
      const mockBet = {
        _id: 'preview',
        betType,
        description: `Preview: ${betType.replace('_', ' ')}`
      };
      
      // Get match details
      const match = await require('../models/Match').findById(matchId);
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      // Get bettor details
      const bettor = await require('../models/User').findById(bettorId);
      if (!bettor) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Calculate personalized odds
      const oddsResult = await PersonalizedOddsEngine.calculatePersonalizedOdds(
        mockBet,
        match,
        bettor
      );
      
      res.json({
        personalizedOdds: oddsResult.personalizedOdds,
        explanation: oddsResult.explanation,
        confidence: Math.round(oddsResult.confidence * 100),
        fairnessScore: Math.round(oddsResult.fairnessScore * 100),
        factors: oddsResult.factors
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to automatically create betting markets for new matches
async function createMarketForMatch(matchId, createdBy) {
  try {
    // Check if both users consent to betting analysis
    const match = await require('../models/Match').findById(matchId)
      .populate('userA userB', 'privacy.consentBetAnalysis privacy.hideFromBetting');
    
    if (!match) return;
    
    const userAConsents = match.userA.privacy?.consentBetAnalysis && !match.userA.privacy?.hideFromBetting;
    const userBConsents = match.userB.privacy?.consentBetAnalysis && !match.userB.privacy?.hideFromBetting;
    
    if (!userAConsents || !userBConsents) {
      console.log('Users have not consented to betting analysis, skipping market creation');
      return;
    }
    
    // Create betting market
    const market = await BetsMarket.create({ 
      matchId, 
      createdBy,
      status: 'open',
      autoCreated: true
    });
    
    // Create personalized bets based on compatibility analysis
    const bets = await createPersonalizedBets(market._id, match);
    
    // Update market with bet references
    market.standardBets = bets.map(b => b._id);
    await market.save();
    
    // Update match with market reference
    await require('../models/Match').findByIdAndUpdate(matchId, { 
      betsMarketId: market._id 
    });
    
    console.log(`Auto-created market ${market._id} for match ${matchId}`);
    
  } catch (error) {
    console.error('Auto market creation error:', error);
    throw error;
  }
}

// Helper function to create personalized bets
async function createPersonalizedBets(marketId, match) {
  const Bet = require('../models/Bet');
  const CompatibilityEngine = require('../services/compatibility');
  
  try {
    // Get user details
    const [userA, userB] = await Promise.all([
      require('../models/User').findById(match.userA),
      require('../models/User').findById(match.userB)
    ]);
    
    // Calculate compatibility for intelligent bet creation
    const compatibility = await CompatibilityEngine.calculateCompatibility(userA, userB);
    
    // Create personalized bets based on compatibility factors
    const betTypes = [
      {
        betType: 'first_date',
        description: 'Will they go on a first date within 7 days?',
        baseProbability: Math.min(0.95, 0.3 + (compatibility.overallScore * 0.6))
      },
      {
        betType: 'message_response_6_hours',
        description: 'Will they both respond to messages within 6 hours?',
        baseProbability: Math.min(0.90, 0.4 + (compatibility.breakdown?.behavioralCompatibility || 0.5) * 0.5)
      },
      {
        betType: 'second_date',
        description: 'Will they go on a second date?',
        baseProbability: Math.min(0.85, 0.15 + (compatibility.overallScore * 0.7))
      },
      {
        betType: 'first_kiss',
        description: 'Will there be a first kiss?',
        baseProbability: Math.min(0.80, 0.2 + (compatibility.breakdown?.profileSimilarity || 0.5) * 0.6)
      }
    ];
    
    // Only create bets with reasonable probabilities
    const viableBets = betTypes.filter(bet => 
      bet.baseProbability >= 0.1 && bet.baseProbability <= 0.9
    );
    
    // Convert probabilities to odds with house edge
    const betsToCreate = viableBets.map(bet => ({
      marketId,
      betType: bet.betType,
      description: bet.description,
      odds: Math.max(1.05, Math.round((1 / (bet.baseProbability * 1.05)) * 100) / 100) // 5% house edge
    }));
    
    return await Bet.insertMany(betsToCreate);
    
  } catch (error) {
    console.error('Personalized bet creation error:', error);
    throw error;
  }
}

module.exports = router;
