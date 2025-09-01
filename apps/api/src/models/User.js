const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const PreferencesSchema = new mongoose.Schema(
  {
    ageRange: { type: [Number], default: [18, 100] },
    distance: { type: Number, default: 50 },
    interests: { type: [String], default: [] },
  },
  { _id: false }
);

const HistorySchema = new mongoose.Schema(
  {
    matchesCount: { type: Number, default: 0 },
    datesCount: { type: Number, default: 0 },
    betsPlaced: { type: Number, default: 0 },
    betsWon: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatarKey: { type: String },
    age: Number,
    gender: String,
    location: LocationSchema,
    preferences: PreferencesSchema,
    photos: { type: [String], default: [] },
    bio: { type: String, default: '' },
    tokensBalance: { type: Number, default: 0 },
    walletBalanceUSD: { type: Number, default: 0 },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    history: { type: HistorySchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    privacy: {
      hideFromBetting: { type: Boolean, default: false },
      restrictToFriends: { type: Boolean, default: false },
      consentBetAnalysis: { type: Boolean, default: false },
    },
    notifications: {
      emailDeposit: { type: Boolean, default: true },
      emailWithdrawal: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: false },
    },
    dummyCustomerId: { type: String },
  },
  { minimize: false }
);

UserSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', UserSchema);


