## dating-or-not
Social betting on dating outcomes — MVP monorepo.

### Stack
- **Web**: React + TypeScript + Vite + Tailwind, Framer Motion for animations, RTK Query for API, Socket.IO client for realtime
- **API**: Node.js + Express + Mongoose (MongoDB), Socket.IO server; optional in-memory Mongo for local dev
- **AI/NLP**: FastAPI Bet Generator (stub) on port 8000
- **DB/Infra**: Local MongoDB via Docker (optional), `mongodb-memory-server` for fast dev

### Apps/Services
- **apps/api**: Node.js + Express backend (MongoDB via Mongoose)
- **apps/web**: React web app (Vite + Tailwind)
- **services/betgen**: FastAPI microservice for custom bet generation (stub)
- **docker-compose.yml**: Local MongoDB + Mongo Express

### Implemented features  
- **Security**: Production-grade authentication with JWT secret validation, comprehensive input validation, authorization controls, security headers, and file upload protection
- **Data models**: Users, Matches, Messages, BetsMarket, Bet, BetPlacement, Parlay, Transactions, Analytics, ChatRoom, ChatMessage
- **Bets and markets**:
  - Create markets with standard bets and optional AI bets
  - Place single bets (USD)
  - Parlay module with Power/Flex tiers and animated ParlaySlip UI (PrizePicks-style)
- **Markets feed**: backend list returns markets with likes, comments (from chatroom `messagesCount`), and top odds; frontend renders social-style feed with counters
- **Likes**: per-bet likes; market-level like endpoint; a single market "Like this market" button in detail
- **Wallet**: redesigned UI (balance, actions, quick stats); backend wallet summary endpoint; frontend falls back to demo values when id isn’t an ObjectId
- **PnL chart**: hover tooltips/dots, axis spacing, clickable filters (unsupported ranges show a note)
- **Chat**: `ChatRoom`/`ChatMessage` with TTL indexes for auto-expiry after market closes; collapsible chat bar mounts and connects on open; optimistic message render; Socket.IO `join_room` and `message_text`; messages persisted and broadcast; room `messagesCount` increments
- **Seeding**: admin seed; markets seed creates demo users/match, 3 markets with standard bets, random likes/comments; chatroom created

### Local development
- **Environment Setup**:
  - Copy `apps/api/env.template` to `apps/api/.env`
  - Set `JWT_SECRET=your-secure-random-string` in `.env`
- **MongoDB (optional, via Docker)**:
  - `docker compose up -d`
  - Mongo Express at `http://localhost:8081`
- **API (port 4000)**:
  - `cd apps\api && npm install`
  - Windows (in-memory Mongo): `cd apps\api && set USE_MEMORY_MONGO=true && npm run dev`
  - Health: `http://localhost:4000/health`
- **Seed**:
  - `POST http://localhost:4000/seed/admin`
  - `POST http://localhost:4000/seed/markets`
- **BetGen (port 8000)**:
  - `cd services\betgen && pip install -r requirements.txt`
  - If using venv: activate it, then `uvicorn main:app --reload --port 8000`
  - Health: `http://localhost:8000/health`
- **Web (port 5173/next available)**:
  - `cd apps\web && npm install`
  - `cd apps\web && set VITE_API_URL=http://localhost:4000 && npm run dev`

### Selected endpoints
- **Bets**: `POST /bets/market/create`, `GET /bets/market/:id`, `GET /bets/markets`, `POST /bets/:id/place`, `POST /bets/:id/like`, `POST /bets/market/:id/like`
- **Parlays**: `POST /bets/parlay`
- **Wallet**: `GET /wallet/summary/:userId`
- **Chat**: `POST /chat/room/by-market`, `GET /chat/room/:id/messages`, Socket.IO `/socket.io`
- **Auth**: `POST /auth/login`
- **Seed**: `POST /seed/admin`, `POST /seed/markets`

### What's next (suggested roadmap)
- **Additional security enhancements**:
  - Implement rate limiting per endpoint and user
  - Add audit logging for sensitive operations
- **Chat hardening**:
  - Gate access: only users allowed in the market/parlay can join room; block once market closed
  - Image uploads: presigned S3 POST + thumbnail pipeline; client-side compression; size limits
  - Redis adapter for Socket.IO; cache last N messages per room
  - Moderation hooks (text/image)
- **Markets and odds**:
  - Add real `GET /bets/markets` backing data everywhere on the web app (currently demo avatar/title in list)
  - Implement market closing flow; on settlement, set `ChatRoom.closedAt`/`expiresAt` and message TTLs
  - Odds/house edge configurable; unify multiplier policy for parlays (documented formula)
- **Likes/comments UX**:
  - Prevent duplicate likes per user (`LikedBet`/`LikedMarket` collection)
  - Wire market like button to API; update list via RTK Query cache invalidation
  - Display chat/comments count live with socket updates (increment on new message)
- **Wallet/transactions**:
  - Implement deposit/withdraw via Stripe test mode
  - Link wallet stats to real `Transactions` and `BetPlacements`; replace demo data
  - Add PnL chart data endpoint (time-bucketed aggregation)
- **Frontend polish**:
  - Animate bottom nav slide in/out from dashboard landing
  - Add onboarding, login/register pages; settings page for name/payment methods
  - Improve accessibility: labels, focus rings, contrast
- **Infra**:
  - Switch from in-memory Mongo to Atlas (use env `MONGO_URI` or `MONGO_USER`/`PASS`/`HOST`/`DB`)
  - Add Docker dev stack (MongoDB + API + web), and `.env` templates
  - Logging/monitoring (Sentry) and error boundaries in React

### Notes
- The BetGen service returns simple, illustrative bets and odds; replace with real NLP/ML later
- Production-grade security implemented: JWT validation, input sanitization, authorization controls, security headers
- `apps/api` supports fast local dev via in-memory Mongo: set `USE_MEMORY_MONGO=true`
- See `SECURITY-FIXES.md` for detailed security implementation notes

MIT License