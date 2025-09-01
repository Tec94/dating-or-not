const mongoose = require('mongoose');

const ParlayLegSchema = new mongoose.Schema(
  {
    betId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bet', required: true },
    selection: { type: String, enum: ['yes', 'no', 'over', 'under'], required: true },
    line: { type: Number },
    odds: { type: Number, required: true },
    description: { type: String },
  },
  { _id: false }
);

const ParlaySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    legs: { type: [ParlayLegSchema], validate: (v) => Array.isArray(v) && v.length >= 2 },
    stakeUSD: { type: Number, required: true },
    potentialPayoutUSD: { type: Number, required: true },
    mode: { type: String, enum: ['power', 'flex'], default: 'power' },
    multiplier: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'won', 'lost', 'void'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model('Parlay', ParlaySchema);


