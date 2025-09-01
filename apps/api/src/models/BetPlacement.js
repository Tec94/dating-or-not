const mongoose = require('mongoose');

const BetPlacementSchema = new mongoose.Schema(
  {
    betId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bet', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stakeTokens: { type: Number, default: 0 },
    stakeUSD: { type: Number, default: 0 },
    potentialPayoutTokens: { type: Number, default: 0 },
    potentialPayoutUSD: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model('BetPlacement', BetPlacementSchema);


