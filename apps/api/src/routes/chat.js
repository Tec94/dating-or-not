const express = require('express');
const mongoose = require('mongoose');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const BetsMarket = require('../models/BetsMarket');

const router = express.Router();

// Media presign (S3 stub): returns fake URL/fields for test mode
router.post('/media/presign', async (req, res, next) => {
  try {
    const { filename, contentType } = req.body || {};
    if (!filename) return res.status(400).json({ error: 'filename required' });
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    if (!contentType || !allowedTypes.includes(contentType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid file type. Only images and videos are allowed.' });
    }
    
    // Sanitize and validate filename
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace unsafe characters
      .substring(0, 100);  // Limit length
    
    if (sanitizedFilename.length === 0) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    // Check file extension matches content type
    const fileExt = sanitizedFilename.split('.').pop()?.toLowerCase();
    const typeMap = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 
      'gif': 'image/gif', 'webp': 'image/webp',
      'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime'
    };
    
    if (!fileExt || !typeMap[fileExt] || typeMap[fileExt] !== contentType.toLowerCase()) {
      return res.status(400).json({ error: 'File extension does not match content type' });
    }
    
    // Generate secure key
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const userPrefix = req.userId.toString().slice(-6); // Last 6 chars of user ID
    const key = `uploads/${userPrefix}/${timestamp}_${random}_${sanitizedFilename}`;
    
    const uploadUrl = `${process.env.S3_UPLOAD_URL || 'http://localhost:4000'}/dev-upload/${encodeURIComponent(key)}`;
    res.json({ key, uploadUrl, contentType });
  } catch (err) { next(err) }
});

// Media confirm + moderation stub
router.post('/media/confirm', async (req, res, next) => {
  try {
    const { roomId, key, type = 'image' } = req.body || {};
    if (!roomId || !key) return res.status(400).json({ error: 'roomId and key required' });
    
    // Validate roomId format
    if (!require('mongoose').Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: 'Invalid roomId format' });
    }
    
    // Validate key format - should match what we generated
    const keyRegex = /^uploads\/[a-zA-Z0-9]{6}\/\d+_[a-zA-Z0-9]+_[a-zA-Z0-9._-]+$/;
    if (!keyRegex.test(key)) {
      return res.status(400).json({ error: 'Invalid media key format' });
    }
    
    // Verify user owns this upload (based on user prefix in key)
    const userPrefix = req.userId.toString().slice(-6);
    if (!key.startsWith(`uploads/${userPrefix}/`)) {
      return res.status(403).json({ error: 'Unauthorized media key' });
    }
    
    // Validate type
    const allowedTypes = ['image', 'video'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid media type' });
    }
    
    // Check if room exists and user has access
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const isMember = room.members?.some((m) => String(m) === String(req.userId)) || 
                     String(room.createdBy) === String(req.userId);
    if (!isMember) return res.status(403).json({ error: 'Not a room member' });
    
    // Enhanced moderation checks
    const banned = ['violence', 'nsfw', 'illegal', 'abuse', 'spam'];
    const flagged = banned.some((w) => String(key).toLowerCase().includes(w));
    if (flagged) return res.status(400).json({ error: 'Content rejected by moderation' });
    
    const msg = await ChatMessage.create({ roomId, senderId: req.userId, type, mediaKey: key });
    await ChatRoom.findByIdAndUpdate(roomId, { $inc: { messagesCount: 1 } });
    res.status(201).json(msg);
  } catch (err) { next(err) }
});

// Create or get active room by market
router.post('/room/by-market', async (req, res, next) => {
  try {
    const { marketId } = req.body;
    const createdBy = req.userId;
    if (!mongoose.Types.ObjectId.isValid(marketId)) return res.status(400).json({ error: 'Invalid marketId' });
    const market = await BetsMarket.findById(marketId);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    if (market.status !== 'open') return res.status(400).json({ error: 'Market not active' });
    let room = await ChatRoom.findOne({ marketId, isActive: true });
    if (!room) room = await ChatRoom.create({ marketId, createdBy, isActive: true, members: [createdBy] });
    // Ensure caller is in members list
    if (!room.members?.some((m) => String(m) === String(createdBy))) {
      room = await ChatRoom.findByIdAndUpdate(room._id, { $addToSet: { members: createdBy } }, { new: true });
    }
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// Paginate messages (newest to oldest)
router.get('/room/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cursor, limit = 50 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid room id' });
    // Gate access: requester must be a member
    const room = await ChatRoom.findById(id).lean();
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const isMember = room.members?.some((m) => String(m) === String(req.userId)) || String(room.createdBy) === String(req.userId);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });
    const q = { roomId: new mongoose.Types.ObjectId(id) };
    if (cursor) q.createdAt = { $lt: new Date(cursor) };
    const msgs = await ChatMessage.find(q).sort({ createdAt: -1 }).limit(Math.min(Number(limit), 100));
    const nextCursor = msgs.length ? msgs[msgs.length - 1].createdAt.toISOString() : null;
    res.json({ messages: msgs.reverse(), nextCursor });
  } catch (err) {
    next(err);
  }
});

// Admin or creator can close a room
router.post('/room/:id/close', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid room id' });
    const room = await ChatRoom.findById(id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const isCreator = String(room.createdBy) === String(req.userId);
    const isAdmin = req.userRole === 'admin';
    if (!isCreator && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    room.isActive = false;
    room.closedAt = new Date();
    await room.save();
    res.json({ ok: true, room });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


