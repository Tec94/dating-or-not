const express = require('express');
const { z } = require('zod');
const Match = require('../models/Match');
const Message = require('../models/Message');
const BetsMarket = require('../models/BetsMarket');
const { schemas, validate } = require('../utils/validation');

const router = express.Router();

router.post('/', 
  validate(z.object({
    userA: schemas.mongoId,
    userB: schemas.mongoId
  })),
  async (req, res, next) => {
    try {
      const { userA, userB } = req.body;
      
      // Prevent matching user with themselves
      if (String(userA) === String(userB)) {
        return res.status(400).json({ error: 'Cannot match user with themselves' });
      }
      
      const match = await Match.create({ userA, userB, status: 'matched' });
      res.status(201).json(match);
    } catch (err) {
      next(err);
    }
  });

router.get('/:id', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Not found' });
    
    // Verify user is part of this match
    if (String(match.userA) !== String(req.userId) && 
        String(match.userB) !== String(req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const populatedMatch = await Match.findById(req.params.id).populate('messages');
    res.json(populatedMatch);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/message', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  validate(z.object({ messageText: schemas.messageText })),
  async (req, res, next) => {
  try {
    const { messageText } = req.body;
    const senderId = req.userId;
    const matchId = req.params.id;
    
    // Verify user is part of this match before allowing message
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    
    if (String(match.userA) !== String(senderId) && 
        String(match.userB) !== String(senderId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const msg = await Message.create({ matchId, senderId, messageText });
    await Match.findByIdAndUpdate(matchId, { $push: { messages: msg._id } });
    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/schedule-date', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  validate(z.object({ date: schemas.isoDate })),
  async (req, res, next) => {
  try {
    const { date } = req.body;
    const matchId = req.params.id;
    
    // First check if match exists and user has access
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Not found' });
    
    // Verify user is part of this match
    if (String(match.userA) !== String(req.userId) && 
        String(match.userB) !== String(req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      { dateScheduled: date ? new Date(date) : undefined },
      { new: true }
    );
    res.json(updatedMatch);
  } catch (err) {
    next(err);
  }
});

module.exports = router;


