const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema(
  {
    marketId: { type: mongoose.Schema.Types.ObjectId, ref: 'BetsMarket' },
    parlayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parlay' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messagesCount: { type: Number, default: 0 },
    closedAt: { type: Date },
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);


