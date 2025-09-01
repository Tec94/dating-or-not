const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'matched', 'unmatched', 'blocked'], default: 'matched' },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    dateScheduled: { type: Date },
    betsMarketId: { type: mongoose.Schema.Types.ObjectId, ref: 'BetsMarket' },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model('Match', MatchSchema);


