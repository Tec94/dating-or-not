const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Match = require('../models/Match');
const BetsMarket = require('../models/BetsMarket');
const Bet = require('../models/Bet');
const ChatRoom = require('../models/ChatRoom');

const router = express.Router();

// Simple seed endpoint to create an admin if not exists (dev only)
async function ensureAdmin(req, res, next) {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin1234';

    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await User.create({ username, email, passwordHash, role: 'admin' });
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json({ id: user._id, email: user.email, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
}

router.post('/admin', ensureAdmin);
router.get('/admin', ensureAdmin);

// -------- Demo data seeding --------

router.post('/markets', async (req, res, next) => {
  try {
    // Ensure two demo users
    const [u1] = await User.find({ email: 'alex@example.com' });
    let userA = u1;
    if (!userA) {
      userA = await User.create({ username: 'alex', email: 'alex@example.com', passwordHash: await bcrypt.hash('password', 10) });
    }
    const [u2] = await User.find({ email: 'taylor@example.com' });
    let userB = u2;
    if (!userB) {
      userB = await User.create({ username: 'taylor', email: 'taylor@example.com', passwordHash: await bcrypt.hash('password', 10) });
    }

    const match = await Match.create({ userA: userA._id, userB: userB._id, status: 'matched' });

    // Create markets
    const markets = [];
    for (const title of [
      'Alex × Taylor — Will the date happen?',
      'Sam × Chris — Drinks ≥ 2?',
      'Will there be a first kiss?'
    ]) {
      const market = await BetsMarket.create({ matchId: match._id, createdBy: userA._id, status: 'open', likes: Math.floor(Math.random() * 80) });
      const bets = [
        { betType: 'date_happens', description: 'Will the first date take place within 7 days?', odds: 1.39 },
        { betType: 'drinks_over_2', description: 'Will they have 2 or more drinks?', odds: 3.03 },
        { betType: 'first_kiss', description: 'Will there be a first kiss?', odds: 2.1 },
      ];
      const created = await Bet.insertMany(bets.map((b) => ({ ...b, marketId: market._id })));
      market.standardBets = created.map((b) => b._id);
      await market.save();
      await ChatRoom.create({ marketId: market._id, createdBy: userA._id, isActive: true, messagesCount: Math.floor(Math.random() * 25) });
      markets.push(market);
    }

    res.json({ ok: true, markets: markets.map((m) => m._id) });
  } catch (err) {
    next(err);
  }
});

// Create dummy matches for current user
router.post('/user-matches', async (req, res, next) => {
  try {
    const currentUserId = req.userId; // From auth middleware
    
    // Create some dummy users to match with
    const dummyUsers = [
      { 
        username: 'emma_wilson', 
        email: 'emma@example.com', 
        age: 26,
        bio: 'Coffee enthusiast and weekend hiker. Looking for someone to explore the city with!',
        photos: ['https://images.unsplash.com/photo-1494790108755-2616b86d7e28?w=400&h=400&fit=crop&crop=face'],
        interests: ['Coffee', 'Hiking', 'Photography'],
        location: { lat: 40.7128, lng: -74.0060, city: 'New York, NY' }
      },
      { 
        username: 'james_carter', 
        email: 'james@example.com', 
        age: 29,
        bio: 'Foodie and fitness enthusiast. Love trying new restaurants and staying active.',
        photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'],
        interests: ['Fitness', 'Cooking', 'Travel'],
        location: { lat: 40.7580, lng: -73.9855, city: 'New York, NY' }
      },
      { 
        username: 'sophia_lee', 
        email: 'sophia@example.com', 
        age: 24,
        bio: 'Artist and book lover. Always up for deep conversations over wine.',
        photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'],
        interests: ['Art', 'Reading', 'Wine'],
        location: { lat: 40.7831, lng: -73.9712, city: 'New York, NY' }
      },
      { 
        username: 'michael_chen', 
        email: 'michael@example.com', 
        age: 31,
        bio: 'Tech professional who loves music and outdoor adventures.',
        photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'],
        interests: ['Music', 'Technology', 'Outdoor Adventures'],
        location: { lat: 40.7505, lng: -73.9934, city: 'New York, NY' }
      }
    ];

    const createdUsers = [];
    
    for (const userData of dummyUsers) {
      // Check if user already exists
      let existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        // Create new dummy user
        existingUser = await User.create({
          ...userData,
          passwordHash: await bcrypt.hash('password123', 10),
          preferences: {
            ageRange: [22, 35],
            distance: 25,
            interests: userData.interests
          },
          privacy: {
            hideFromBetting: false,
            restrictToFriends: false,
            consentBetAnalysis: true
          }
        });
      }
      
      createdUsers.push(existingUser);
    }

    // Create matches between current user and dummy users
    const matches = [];
    for (const dummyUser of createdUsers) {
      // Check if match already exists
      const existingMatch = await Match.findOne({
        $or: [
          { userA: currentUserId, userB: dummyUser._id },
          { userA: dummyUser._id, userB: currentUserId }
        ]
      });

      if (!existingMatch) {
        const match = await Match.create({
          userA: currentUserId,
          userB: dummyUser._id,
          status: 'matched',
          matchedAt: new Date()
        });
        matches.push(match);
      }
    }

    // Update user match count
    await User.findByIdAndUpdate(currentUserId, { 
      $inc: { 'history.matchesCount': matches.length } 
    });

    res.json({ 
      ok: true, 
      message: `Created ${matches.length} new matches`,
      matches: matches.map(m => m._id),
      users: createdUsers.map(u => ({ id: u._id, username: u.username }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


