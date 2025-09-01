const express = require('express');
const { z } = require('zod');
const fetch = require('node-fetch');
const BetsMarket = require('../models/BetsMarket');
const Bet = require('../models/Bet');
const BetPlacement = require('../models/BetPlacement');
const Parlay = require('../models/Parlay');
const Match = require('../models/Match');
const ChatRoom = require('../models/ChatRoom');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { schemas, validate } = require('../utils/validation');

const router = express.Router();

const STANDARD_BETS = [
  { betType: 'date_happens', description: 'Did the date happen? (Yes)', odds: 1.9 },
  { betType: 'no_show', description: 'No-show (Yes)', odds: 2.2 },
  { betType: 'first_kiss', description: 'First kiss (Yes)', odds: 2.0 },
  { betType: 'first_message_delay_over', description: 'First message delay over 6 hours', odds: 1.8 },
];

router.post('/market/create', 
  validate(z.object({ matchId: schemas.mongoId })),
  async (req, res, next) => {
    try {
      const { matchId } = req.body;
      const createdBy = req.userId;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const market = await BetsMarket.create({ matchId, createdBy });

    // Create standard bets
    const stdBets = await Bet.insertMany(
      STANDARD_BETS.map((b) => ({ ...b, marketId: market._id }))
    );

    market.standardBets = stdBets.map((b) => b._id);

    // Try to fetch custom bets from betgen service
    const betgenUrl = process.env.BETGEN_URL || 'http://localhost:8000';
    try {
      const resp = await fetch(`${betgenUrl}/internal/betgen/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, trigger: 'new_match', consent: { userA: true, userB: true } }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.bets)) {
          const custom = await Bet.insertMany(
            data.bets.map((b) => ({
              marketId: market._id,
              betType: b.betType,
              description: b.description,
              odds: b.odds || Math.max(1.1, (1 / (b.probability || 0.5)) * 0.95),
            }))
          );
          market.customBets = custom.map((b) => b._id);
        }
      }
    } catch (e) {
      // Swallow betgen errors in MVP
      console.warn('Betgen not available:', e.message);
    }

    await market.save();
    await Match.findByIdAndUpdate(matchId, { betsMarketId: market._id });
    res.status(201).json(await BetsMarket.findById(market._id).populate(['standardBets', 'customBets']));
  } catch (err) {
    next(err);
  }
});

router.get('/market/:id', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  async (req, res, next) => {
  try {
    const market = await BetsMarket.findById(req.params.id).populate(['standardBets', 'customBets']);
    if (!market) return res.status(404).json({ error: 'Not found' });
    const room = await ChatRoom.findOne({ marketId: market._id }).lean();
    const comments = room?.messagesCount || 0;
    res.json({ ...market.toObject(), comments });
  } catch (err) {
    next(err);
  }
});
// Toggle like for a bet (one like per user; second click unlikes)
router.post('/:id/like', async (req, res, next) => {
  try {
    const betId = req.params.id
    const userId = req.userId
    const LikedBet = require('../models/LikedBet')
    const existing = await LikedBet.findOne({ betId, userId })
    if (existing) {
      await LikedBet.deleteOne({ _id: existing._id })
      const updated = await Bet.findByIdAndUpdate(betId, { $inc: { likes: -1 } }, { new: true })
      if (!updated) return res.status(404).json({ error: 'Bet not found' })
      const likes = Math.max(0, updated.likes || 0)
      if (likes !== updated.likes) await Bet.findByIdAndUpdate(betId, { $set: { likes } })
      return res.json({ likes, liked: false })
    } else {
      await LikedBet.create({ betId, userId })
      const updated = await Bet.findByIdAndUpdate(betId, { $inc: { likes: 1 } }, { new: true })
      if (!updated) return res.status(404).json({ error: 'Bet not found' })
      return res.json({ likes: updated.likes || 0, liked: true })
    }
  } catch (err) { next(err) }
})

// Toggle like for a market (one like per user; second click unlikes)
router.post('/market/:id/like', async (req, res, next) => {
  try {
    const marketId = req.params.id
    const userId = req.userId
    const LikedMarket = require('../models/LikedMarket')
    const existing = await LikedMarket.findOne({ marketId, userId })
    if (existing) {
      await LikedMarket.deleteOne({ _id: existing._id })
      const updated = await BetsMarket.findByIdAndUpdate(marketId, { $inc: { likes: -1 } }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      const likes = Math.max(0, updated.likes || 0)
      if (likes !== updated.likes) await BetsMarket.findByIdAndUpdate(marketId, { $set: { likes } })
      return res.json({ likes, liked: false });
    } else {
      await LikedMarket.create({ marketId, userId })
      const updated = await BetsMarket.findByIdAndUpdate(marketId, { $inc: { likes: 1 } }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json({ likes: updated.likes || 0, liked: true });
    }
  } catch (err) {
    next(err);
  }
});

// Markets feed with likes and comments and top odds
router.get('/markets', 
  validate(schemas.pagination, 'query'),
  async (req, res, next) => {
    try {
      const { limit, page } = req.query;
      const skip = (page - 1) * limit;

    const results = await BetsMarket.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // comments via chat room messagesCount
      {
        $lookup: {
          from: 'chatrooms',
          let: { mid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$marketId', '$$mid'] } } },
            { $project: { messagesCount: 1 } },
            { $limit: 1 },
          ],
          as: 'room',
        },
      },
      // author
      { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'author' } },
      { $addFields: { author: { $arrayElemAt: ['$author', 0] } } },
      {
        $lookup: {
          from: 'bets',
          let: { mid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$marketId', '$$mid'] } } },
            { $group: { _id: null, maxOdds: { $max: '$odds' } } },
          ],
          as: 'betstats',
        },
      },
      {
        $addFields: {
          comments: { $ifNull: [{ $arrayElemAt: ['$room.messagesCount', 0] }, 0] },
          topOdds: { $ifNull: [{ $arrayElemAt: ['$betstats.maxOdds', 0] }, 0] },
        },
      },
      { $project: { room: 0, betstats: 0 } },
    ]);

    res.json({ items: results, page, limit });
  } catch (err) {
    next(err);
  }
});

// Cursor-based markets feed for better performance with large datasets
router.get('/markets/cursor', 
  validate(schemas.cursorPagination, 'query'),
  async (req, res, next) => {
    try {
      const { limit, cursor, direction } = req.query;
      
      // Build cursor query
      let cursorQuery = {};
      if (cursor) {
        try {
          const cursorDoc = await BetsMarket.findById(cursor, 'createdAt');
          if (cursorDoc) {
            cursorQuery = direction === 'backward' 
              ? { createdAt: { $gt: cursorDoc.createdAt } }
              : { createdAt: { $lt: cursorDoc.createdAt } };
          }
        } catch (err) {
          // Invalid cursor, start from beginning
        }
      }

      const results = await BetsMarket.aggregate([
        { $match: cursorQuery },
        { $sort: { createdAt: direction === 'backward' ? 1 : -1 } },
        { $limit: limit + 1 }, // Fetch one extra to check if there are more
        // comments via chat room messagesCount
        {
          $lookup: {
            from: 'chatrooms',
            let: { mid: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$marketId', '$$mid'] } } },
              { $project: { messagesCount: 1 } },
              { $limit: 1 },
            ],
            as: 'room',
          },
        },
        // author
        { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'author' } },
        { $addFields: { author: { $arrayElemAt: ['$author', 0] } } },
        {
          $lookup: {
            from: 'bets',
            let: { mid: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$marketId', '$$mid'] } } },
              { $group: { _id: null, maxOdds: { $max: '$odds' } } },
            ],
            as: 'betstats',
          },
        },
        {
          $addFields: {
            comments: { $ifNull: [{ $arrayElemAt: ['$room.messagesCount', 0] }, 0] },
            topOdds: { $ifNull: [{ $arrayElemAt: ['$betstats.maxOdds', 0] }, 0] },
          },
        },
        { $project: { room: 0, betstats: 0 } },
      ]);

      // Check if there are more items
      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, limit) : results;
      
      // If direction is backward, reverse the results to maintain chronological order
      if (direction === 'backward') {
        items.reverse();
      }

      const response = {
        items,
        hasMore,
        nextCursor: items.length > 0 ? items[items.length - 1]._id : null,
        prevCursor: items.length > 0 ? items[0]._id : null,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/place', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  validate(schemas.placeBet),
  async (req, res, next) => {
    try {
      const { stakeUSD } = req.body;
      const userId = req.userId;
    const bet = await Bet.findById(req.params.id);
    if (!bet) return res.status(404).json({ error: 'Bet not found' });
    const potentialPayoutTokens = 0;
    const potentialPayoutUSD = stakeUSD * bet.odds;
    const placement = await BetPlacement.create({
      betId: bet._id,
      userId,
      stakeTokens: 0,
      stakeUSD,
      potentialPayoutTokens,
      potentialPayoutUSD,
    });
    // Ledger entry for stake
    await Transaction.create({ userId, type: 'betStake', amountUSD: stakeUSD, status: 'completed' });
    // Deduct from wallet (MVP)
    await User.findByIdAndUpdate(userId, { $inc: { walletBalanceUSD: -stakeUSD } });
    res.status(201).json(placement);
  } catch (err) {
    next(err);
  }
});

// Create parlay: body { userId, legs: [{ betId, selection: 'yes'|'no'|'over'|'under' }], stakeUSD }
router.post('/parlay', 
  validate(schemas.createParlay),
  async (req, res, next) => {
  try {
    const { legs = [], stakeUSD = 0, mode = 'power' } = req.body;
    const userId = req.userId;
    if (!Array.isArray(legs) || legs.length < 2) return res.status(400).json({ error: 'At least 2 legs required' });
    // Fetch odds for legs
    const betDocs = await Bet.find({ _id: { $in: legs.map((l) => l.betId) } });
    const betMap = new Map(betDocs.map((b) => [String(b._id), b]));
    const resolvedLegs = legs.map((l) => {
      const b = betMap.get(String(l.betId));
      if (!b) throw new Error('Invalid betId in legs');
      const legOdds = b.odds; // MVP: same odds regardless of selection; extend for over/under
      return { betId: b._id, selection: l.selection, line: b.overUnderValue, odds: legOdds, description: b.description };
    });
    // Parlay payout calculation (PrizePicks-like multiplier): product of leg multipliers * stake
    const legMultipliers = resolvedLegs.map((l) => l.odds);
    let combinedMultiplier = legMultipliers.reduce((acc, v) => acc * v, 1);
    // Simple PrizePicks-like tiers (example): adjust based on number of legs and mode
    const tier = resolvedLegs.length;
    if (mode === 'flex') {
      const flexTable = { 2: 2.0, 3: 2.25, 4: 5.0, 5: 10.0 }; // illustrative
      combinedMultiplier = flexTable[tier] || combinedMultiplier;
    } else {
      const powerTable = { 2: 3.0, 3: 5.0, 4: 10.0, 5: 20.0 }; // illustrative
      combinedMultiplier = powerTable[tier] || combinedMultiplier;
    }
    const potentialPayoutUSD = Math.round(stakeUSD * combinedMultiplier * 100) / 100;
    const parlay = await Parlay.create({ userId, legs: resolvedLegs, stakeUSD, potentialPayoutUSD, mode, multiplier: combinedMultiplier });
    res.status(201).json(parlay);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/settle', async (req, res, next) => {
  try {
    const { outcome } = req.body; // 'win' or 'lose'
    const bet = await Bet.findByIdAndUpdate(req.params.id, { outcome }, { new: true });
    if (!bet) return res.status(404).json({ error: 'Bet not found' });
    // Apply to placements and wallet
    const placements = await BetPlacement.find({ betId: bet._id, status: 'active' });
    for (const p of placements) {
      if (outcome === 'win') {
        p.status = 'won';
        await p.save();
        await Transaction.create({ userId: p.userId, type: 'betPayout', amountUSD: p.potentialPayoutUSD, status: 'completed' });
        await User.findByIdAndUpdate(p.userId, { $inc: { walletBalanceUSD: p.potentialPayoutUSD } });
      } else {
        p.status = 'lost';
        await p.save();
      }
    }
    res.json(bet);
  } catch (err) {
    next(err);
  }
});

router.get('/user/:id', async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const requestingUserId = req.userId;
    
    // Only allow users to view their own bet placements
    if (String(requestingUserId) !== String(targetUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const placements = await BetPlacement.find({ userId: targetUserId }).populate('betId');
    res.json(placements);
  } catch (err) {
    next(err);
  }
});

module.exports = router;


