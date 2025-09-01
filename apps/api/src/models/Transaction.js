const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'betStake', 'betPayout', 'tokenPurchase'], required: true },
    amountUSD: { type: Number, default: 0 },
    amountTokens: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentProvider: { type: String },
    externalId: { type: String },
    meta: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model('Transaction', TransactionSchema);


