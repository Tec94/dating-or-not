const express = require('express');
const { z } = require('zod');
const User = require('../models/User');
const { schemas, validate } = require('../utils/validation');

const router = express.Router();

router.get('/:id', validate(z.object({ id: schemas.mongoId }), 'params'), async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const requestingUserId = req.userId;
    
    if (!targetUserId) return res.status(400).json({ error: 'User ID required' });
    
    // Allow full access only to own profile
    if (String(requestingUserId) === String(targetUserId)) {
      const user = await User.findById(targetUserId).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'Not found' });
      return res.json(user);
    }
    
    // Limited public profile for other users
    const user = await User.findById(targetUserId).select('username age gender bio photos avatarKey location.lat location.lng preferences.interests createdAt');
    if (!user) return res.status(404).json({ error: 'Not found' });
    
    // Respect privacy settings
    if (user.privacy?.hideFromBetting) {
      return res.status(403).json({ error: 'Profile is private' });
    }
    
    res.json(user);
  } catch (err) {
    next(err);
  }
});

const userUpdateSchema = z.object({
  username: z.string().trim().min(3).max(50).optional(),
  age: z.number().int().min(18).max(120).optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'other']).optional(),
  bio: z.string().trim().max(1000).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
  'privacy.hideFromBetting': z.boolean().optional(),
  'privacy.restrictToFriends': z.boolean().optional(),
  'privacy.consentBetAnalysis': z.boolean().optional(),
  'notifications.emailDeposit': z.boolean().optional(),
  'notifications.emailWithdrawal': z.boolean().optional(),
  'notifications.pushEnabled': z.boolean().optional()
}).strict();

router.put('/:id', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  validate(userUpdateSchema), 
  async (req, res, next) => {
    try {
      if (String(req.userId) !== String(req.params.id)) return res.status(403).json({ error: 'Forbidden' });
      
      const update = req.body;
      // Ensure no sensitive fields can be updated
      delete update.passwordHash;
      delete update.email;
      delete update.role;
      delete update.walletBalanceUSD;
      delete update.tokensBalance;
      delete update.stripeCustomerId;
      
      const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'Not found' });
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

router.get('/:id/friends', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id).populate('friends', 'username email');
      if (!user) return res.status(404).json({ error: 'Not found' });
      res.json(user.friends || []);
    } catch (err) {
      next(err);
    }
  });

router.post('/:id/friends', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  validate(z.object({ friendId: schemas.mongoId })),
  async (req, res, next) => {
    try {
      if (String(req.userId) !== String(req.params.id)) return res.status(403).json({ error: 'Forbidden' });
      
      const { friendId } = req.body;
      
      // Prevent adding self as friend
      if (String(friendId) === String(req.params.id)) {
        return res.status(400).json({ error: 'Cannot add yourself as friend' });
      }
      
      // Verify friend exists
      const friendExists = await User.findById(friendId).select('_id');
      if (!friendExists) return res.status(404).json({ error: 'Friend not found' });
      
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      
      if (!user.friends) user.friends = [];
      if (!user.friends.find((f) => f.toString() === friendId)) {
        user.friends.push(friendId);
        await user.save();
      }
      
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

module.exports = router;


