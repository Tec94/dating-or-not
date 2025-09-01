const express = require('express');
const User = require('../models/User');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const BetPlacement = require('../models/BetPlacement');

const router = express.Router();

// GET /wallet/summary/:userId
router.get('/summary/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (String(req.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [txAgg, placementsAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amountUSD' },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$amountUSD', 0],
              },
            },
          },
        },
      ]),
      BetPlacement.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            stake: { $sum: '$stakeUSD' },
            payout: { $sum: '$potentialPayoutUSD' },
          },
        },
      ]),
    ]);

    const txByType = Object.fromEntries(txAgg.map((t) => [t._id, t]));
    const totalDepositsUSD = (txByType.deposit?.completed || 0);
    const totalWithdrawalsUSD = (txByType.withdrawal?.completed || 0);

    // Lifetime PnL = payouts from won - total stakes across all
    const stakesTotal = placementsAgg.reduce((a, p) => a + (p.stake || 0), 0);
    const won = placementsAgg.find((p) => p._id === 'won');
    const wonPayouts = won?.payout || 0;
    const lifetimePnlUSD = wonPayouts - stakesTotal;

    res.json({
      balanceUSD: user.walletBalanceUSD || 0,
      totalDepositsUSD,
      totalWithdrawalsUSD,
      lifetimePnlUSD,
    });
  } catch (err) {
    next(err);
  }
});

// GET /wallet/pnl/:userId?range=7d|30d|90d|ytd|all
router.get('/pnl/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { range = '30d' } = req.query;
    if (String(req.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    // Determine start date based on range
    const now = new Date();
    const start = new Date(now);
    if (range === '7d') start.setDate(now.getDate() - 7);
    else if (range === '30d') start.setDate(now.getDate() - 30);
    else if (range === '90d') start.setDate(now.getDate() - 90);
    else if (range === 'ytd') start.setMonth(0, 1);
    else if (range === 'all') start.setFullYear(1970, 0, 1);

    // Aggregate daily net flows from transactions
    // net = deposits - withdrawals - betStake + betPayout
    const txAgg = await Transaction.aggregate([
      { $match: { userId: userObjId, timestamp: { $gte: start } } },
      {
        $group: {
          _id: {
            y: { $year: '$timestamp' },
            m: { $month: '$timestamp' },
            d: { $dayOfMonth: '$timestamp' },
          },
          deposit: { $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amountUSD', 0] } },
          withdrawal: { $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amountUSD', 0] } },
          betStake: { $sum: { $cond: [{ $eq: ['$type', 'betStake'] }, '$amountUSD', 0] } },
          betPayout: { $sum: { $cond: [{ $eq: ['$type', 'betPayout'] }, '$amountUSD', 0] } },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);

    // Build daily cumulative balance from zero within range
    let running = 0;
    const points = txAgg.map((r) => {
      const date = new Date(r._id.y, r._id.m - 1, r._id.d);
      const t = date.toISOString().slice(0, 10);
      const net = (r.deposit || 0) - (r.withdrawal || 0) - (r.betStake || 0) + (r.betPayout || 0);
      running += net;
      return { t, v: running };
    });
    return res.json({ range, points });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


