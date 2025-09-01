const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messageText: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    scanData: {
      keywords: { type: [String], default: [] },
      sentiment: { type: String },
      entities: { type: [String], default: [] },
    },
  },
  { minimize: false }
);

module.exports = mongoose.model('Message', MessageSchema);


