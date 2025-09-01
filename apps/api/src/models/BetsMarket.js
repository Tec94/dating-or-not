const mongoose = require('mongoose');

const BetsMarketSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    standardBets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bet' }],
    customBets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bet' }],
    status: { type: String, enum: ['open', 'closed', 'settled'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    likes: { type: Number, default: 0 },
  },
  { minimize: false }
);

module.exports = mongoose.model('BetsMarket', BetsMarketSchema);


