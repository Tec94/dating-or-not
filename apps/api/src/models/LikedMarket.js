const mongoose = require('mongoose');

const LikedMarketSchema = new mongoose.Schema(
  {
    marketId: { type: mongoose.Schema.Types.ObjectId, ref: 'BetsMarket', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

LikedMarketSchema.index({ marketId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('LikedMarket', LikedMarketSchema);


