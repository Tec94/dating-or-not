const mongoose = require('mongoose');

const LikedBetSchema = new mongoose.Schema(
  {
    betId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bet', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

LikedBetSchema.index({ betId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('LikedBet', LikedBetSchema);


