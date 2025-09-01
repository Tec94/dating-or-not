const express = require('express');
const Bet = require('../models/Bet');
const BetsMarket = require('../models/BetsMarket');
const BetPlacement = require('../models/BetPlacement');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

// Simple role gate: require req.userId is admin (MVP: allow all; extend later)
router.post('/bets/settle', async (req, res, next) => {
  try {
    const { betId, outcome } = req.body;
    const bet = await Bet.findByIdAndUpdate(betId, { outcome }, { new: true });
    if (!bet) return res.status(404).json({ error: 'Bet not found' });
    res.json(bet);
  } catch (err) {
    next(err);
  }
});

router.post('/odds/update', async (req, res, next) => {
  try {
    const { betId, odds } = req.body;
    const bet = await Bet.findByIdAndUpdate(betId, { odds }, { new: true });
    if (!bet) return res.status(404).json({ error: 'Bet not found' });
    res.json(bet);
  } catch (err) {
    next(err);
  }
});

router.post('/market/:id/close', async (req, res, next) => {
  try {
    const market = await BetsMarket.findByIdAndUpdate(
      req.params.id,
      { status: 'closed', closedAt: new Date() },
      { new: true }
    );
    if (!market) return res.status(404).json({ error: 'Market not found' });
    res.json(market);
  } catch (err) {
    next(err);
  }
});

// Settle entire market by resolving all bets
router.post('/market/:id/settle', async (req, res, next) => {
  try {
    const { outcomes } = req.body; // { [betId]: 'win'|'lose' }
    const market = await BetsMarket.findById(req.params.id);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    const bets = await Bet.find({ marketId: market._id });
    for (const b of bets) {
      const outcome = outcomes?.[String(b._id)] || 'lose';
      b.outcome = outcome === 'win' ? 'win' : 'lose';
      await b.save();
      const placements = await BetPlacement.find({ betId: b._id, status: 'active' });
      for (const p of placements) {
        if (b.outcome === 'win') {
          p.status = 'won';
          await p.save();
          await Transaction.create({ userId: p.userId, type: 'betPayout', amountUSD: p.potentialPayoutUSD, status: 'completed' });
          await User.findByIdAndUpdate(p.userId, { $inc: { walletBalanceUSD: p.potentialPayoutUSD } });
        } else {
          p.status = 'lost';
          await p.save();
        }
      }
    }
    market.status = 'settled';
    await market.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


