const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema(
  {
    marketId: { type: mongoose.Schema.Types.ObjectId, ref: 'BetsMarket', required: true },
    betType: { type: String, required: true },
    description: { type: String, required: true },
    odds: { type: Number, required: true },
    overUnderValue: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    outcome: { type: String, enum: ['pending', 'win', 'lose'], default: 'pending' },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model('Bet', BetSchema);


