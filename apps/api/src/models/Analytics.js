const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    avgDateSuccessRate: { type: Number, default: 0 },
    avgBetReturn: { type: Number, default: 0 },
    mostCommonBetType: { type: String },
    matchNoShowRate: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model('Analytics', AnalyticsSchema);


