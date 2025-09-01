const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Optional client-generated id to dedupe messages across reconnects/retries
    clientMessageId: { type: String },
    type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
    text: { type: String },
    mediaKey: { type: String },
    thumbKey: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { minimize: false }
);

ChatMessageSchema.index({ roomId: 1, createdAt: -1 });
// Ensure we don't store duplicate client messages per sender/room
ChatMessageSchema.index({ roomId: 1, senderId: 1, clientMessageId: 1 }, { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);


