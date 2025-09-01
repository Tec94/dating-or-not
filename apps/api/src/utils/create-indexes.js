const mongoose = require('mongoose');

// Import models to ensure they're registered
require('../models/User');
require('../models/Transaction');
require('../models/BetsMarket');
require('../models/ChatMessage');
require('../models/Bet');

async function createIndexes() {
  try {
    console.log('Creating database indexes...');
    
    // Transactions indexes
    const Transaction = mongoose.model('Transaction');
    await Transaction.collection.createIndex({ userId: 1, timestamp: -1 });
    await Transaction.collection.createIndex({ status: 1, timestamp: -1 });
    await Transaction.collection.createIndex({ type: 1, timestamp: -1 });
    await Transaction.collection.createIndex({ userId: 1, type: 1, timestamp: -1 });
    await Transaction.collection.createIndex({ userId: 1, status: 1, timestamp: -1 });
    console.log('✓ Transaction indexes created');
    
    // BetsMarket indexes
    const BetsMarket = mongoose.model('BetsMarket');
    await BetsMarket.collection.createIndex({ createdAt: -1 });
    await BetsMarket.collection.createIndex({ status: 1, createdAt: -1 });
    await BetsMarket.collection.createIndex({ createdBy: 1, createdAt: -1 });
    await BetsMarket.collection.createIndex({ status: 1, createdBy: 1, createdAt: -1 });
    console.log('✓ BetsMarket indexes created');
    
    // ChatMessage indexes (already has roomId, createdAt)
    const ChatMessage = mongoose.model('ChatMessage');
    await ChatMessage.collection.createIndex({ roomId: 1, createdAt: -1 });
    await ChatMessage.collection.createIndex({ clientMessageId: 1 }, { unique: true, sparse: true });
    console.log('✓ ChatMessage indexes verified');
    
    // Bet indexes
    const Bet = mongoose.model('Bet');
    await Bet.collection.createIndex({ marketId: 1 });
    await Bet.collection.createIndex({ marketId: 1, odds: -1 });
    console.log('✓ Bet indexes created');
    
    // User indexes
    const User = mongoose.model('User');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 });
    await User.collection.createIndex({ role: 1 });
    console.log('✓ User indexes verified');
    
    console.log('All indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

module.exports = { createIndexes };

// Run if called directly
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dating-or-not';
  mongoose.connect(mongoUri).then(async () => {
    await createIndexes();
    await mongoose.disconnect();
    console.log('Index creation complete. Database disconnected.');
    process.exit(0);
  }).catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
}
