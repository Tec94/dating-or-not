# Dating-or-Not

> Social betting platform for dating outcomes — where chemistry meets predictions

## 🎯 Overview

Dating-or-Not combines the excitement of social betting with modern dating. Users can discover matches, place bets on relationship outcomes, and engage in a community-driven prediction market around dating chemistry.

## 🏗️ Architecture

**Modern Full-Stack Monorepo:**
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Real-time**: Socket.IO for live chat and updates
- **Mobile**: Capacitor for iOS/Android deployment
- **AI**: FastAPI microservice for bet generation (extensible)

## ✨ Key Features

### 🔐 Security & Authentication
- Production-grade JWT authentication with rotation
- Comprehensive input validation and sanitization
- Authorization controls and security headers
- File upload protection and content validation

### 💕 Dating & Matching
- Complete user onboarding with profile creation
- Advanced compatibility scoring engine
- Swipe-based discovery with real-time matching
- Intelligent user discovery algorithms

### 🎲 Betting & Markets
- Automatic market creation from real matches
- Personalized odds based on compatibility analysis
- Parlay betting with multiple outcome combinations
- Real-time odds adjustment based on market activity

### 💬 Social Features
- Real-time chat rooms for each market
- Like/comment system for bets and markets
- Social feed with market activity
- Community-driven predictions and discussions

### 💰 Wallet & Transactions
- Integrated wallet with balance management
- Stripe payment processing for deposits/withdrawals
- Comprehensive transaction history
- PnL charts with interactive filtering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (Docker optional)
- Python 3.8+ (for AI service)

### Setup & Run
```bash
# 1. Environment setup
cp apps/api/env.template apps/api/.env
# Edit .env and set JWT_SECRET=your-secure-random-string

# 2. Install dependencies
cd apps/api && npm install
cd ../web && npm install
cd ../../services/betgen && pip install -r requirements.txt

# 3. Start services
# Terminal 1: API (with in-memory MongoDB)
cd apps/api && set USE_MEMORY_MONGO=true && npm run dev

# Terminal 2: Web app
cd apps/web && set VITE_API_URL=http://localhost:4000 && npm run dev

# Terminal 3: AI service (optional)
cd services/betgen && uvicorn main:app --reload --port 8000

# 4. Seed demo data
POST http://localhost:4000/seed/admin
POST http://localhost:4000/seed/markets
```

### 📱 Mobile Development

For iOS/Android development, see:
- [`iOS-DEVELOPMENT-GUIDE.md`](iOS-DEVELOPMENT-GUIDE.md) - Complete iOS setup and testing
- [`LIVE-UPDATES-SETUP.md`](LIVE-UPDATES-SETUP.md) - Capacitor Live Updates configuration

### 🔒 Security

This application implements production-grade security practices. See [`SECURITY-FIXES.md`](SECURITY-FIXES.md) for detailed security implementation and audit results.

## 📚 Documentation

- **Security**: [`SECURITY-FIXES.md`](SECURITY-FIXES.md)
- **iOS Development**: [`iOS-DEVELOPMENT-GUIDE.md`](iOS-DEVELOPMENT-GUIDE.md)
- **Live Updates**: [`LIVE-UPDATES-SETUP.md`](LIVE-UPDATES-SETUP.md)

## 🗺️ Roadmap

### Phase 1: Core Platform
- [x] User authentication and profiles
- [x] Dating discovery and matching
- [x] Betting markets and odds
- [x] Real-time chat and notifications

### Phase 2: Advanced Features
- [ ] Machine learning for compatibility prediction
- [ ] Advanced market analytics
- [ ] Social features and leaderboards
- [ ] Mobile app deployment

### Phase 3: Scale
- [ ] Multi-region deployment
- [ ] Advanced fraud detection
- [ ] Enterprise features
- [ ] API marketplace

## 📄 License

MIT License