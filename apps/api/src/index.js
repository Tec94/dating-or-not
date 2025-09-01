const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:;");
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ 
  origin: allowedOrigins.length > 0 ? allowedOrigins : /http:\/\/localhost:\d+$/,
  credentials: true,
  optionsSuccessStatus: 200
}));
// JSON parser with raw body capture for Stripe webhook
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => {
    if (req.originalUrl === '/transactions/stripe/webhook') {
      // Preserve raw body for Stripe signature verification
      req.rawBody = buf;
    }
  },
}));
app.use(morgan('dev'));
app.use(cookieParser());

// CSRF double-submit cookie validator for state-changing requests
function requireCsrf(req, res, next) {
  const method = (req.method || '').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (!isStateChanging) return next();
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  return next();
}

// Basic rate limits
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const sensitiveLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

// DB
const useMemoryMongo = process.env.USE_MEMORY_MONGO === 'true';
async function connectMongo() {
  if (useMemoryMongo) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { autoIndex: true });
    console.log('MongoDB connected (in-memory)');
  } else {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      const user = process.env.MONGO_USER;
      const pass = process.env.MONGO_PASS;
      const host = process.env.MONGO_HOST || 'localhost:27017';
      const db = process.env.MONGO_DB || 'dating-or-not';
      if (user && pass) {
        const encUser = encodeURIComponent(user);
        const encPass = encodeURIComponent(pass);
        const protocol = host.includes('mongodb.net') ? 'mongodb+srv' : 'mongodb';
        mongoUri = `${protocol}://${encUser}:${encPass}@${host}/${db}?retryWrites=true&w=majority`;
      }
    }
    if (!mongoUri) {
      mongoUri = 'mongodb://localhost:27017/dating-or-not';
    }
    await mongoose.connect(mongoUri, { autoIndex: true });
    console.log('MongoDB connected');
    
    // Create performance indexes
    try {
      const { createIndexes } = require('./utils/create-indexes');
      await createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create some indexes:', err.message);
    }
  }
  // Ensure indexes/collections exist for core models
  const User = require('./models/User');
  const Match = require('./models/Match');
  const Message = require('./models/Message');
  const BetsMarket = require('./models/BetsMarket');
  const Bet = require('./models/Bet');
  const BetPlacement = require('./models/BetPlacement');
  const Transaction = require('./models/Transaction');
  const Analytics = require('./models/Analytics');
  const LikedBet = require('./models/LikedBet');
  const LikedMarket = require('./models/LikedMarket');
  await Promise.all([
    User.createCollection(),
    Match.createCollection(),
    Message.createCollection(),
    BetsMarket.createCollection(),
    Bet.createCollection(),
    BetPlacement.createCollection(),
    Transaction.createCollection(),
    Analytics.createCollection(),
    LikedBet.createCollection(),
    LikedMarket.createCollection(),
  ]);
  await Promise.all([
    User.init(),
    Match.init(),
    Message.init(),
    BetsMarket.init(),
    Bet.init(),
    BetPlacement.init(),
    Transaction.init(),
    Analytics.init(),
    LikedBet.init(),
    LikedMarket.init(),
  ]);
}

connectMongo().catch((err) => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Validate JWT secret at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required for security');
  process.exit(1);
}

// Auth middleware
function authenticateJwt(req, res, next) {
  const bearer = req.headers.authorization;
  const tokenFromHeader = bearer && bearer.startsWith('Bearer ') ? bearer.slice(7) : null;
  const tokenFromCookie = req.cookies?.auth_token;
  const token = tokenFromHeader || tokenFromCookie;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = require('jsonwebtoken').verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role || 'user';
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
}

// OpenAPI Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./utils/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dating-or-Not API Documentation'
}));

// Routes
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authLimiter, require('./routes/auth'));
// Protect most routes; adjust as needed per roadmap
app.use('/users', authenticateJwt, require('./routes/users'));
app.use('/matches', authenticateJwt, require('./routes/matches'));
app.use('/discovery', authenticateJwt, require('./routes/discovery'));
app.use('/bets', authenticateJwt, requireCsrf, require('./routes/bets'));
app.use('/transactions', authenticateJwt, requireCsrf, sensitiveLimiter, require('./routes/transactions'));
app.use('/admin', authenticateJwt, requireAdmin, requireCsrf, require('./routes/admin'));
app.use('/seed', authenticateJwt, require('./routes/seed'));
app.use('/wallet', authenticateJwt, require('./routes/wallet'));
app.use('/chat', authenticateJwt, requireCsrf, require('./routes/chat'));

// Error handler (basic)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, { cors: { origin: /http:\/\/localhost:\d+$/, credentials: true } });

// Socket auth via JWT (from query or cookie)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/auth_token=([^;]+)/)?.[1];
    if (!token) return next(new Error('Unauthorized'));
    const payload = require('jsonwebtoken').verify(token, JWT_SECRET);
    socket.userId = payload.sub;
    socket.userRole = payload.role || 'user';
    return next();
  } catch (e) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_room', async ({ roomId }) => {
    try {
      if (!roomId) return;
      const ChatRoom = require('./models/ChatRoom');
      const room = await ChatRoom.findById(roomId).lean();
      if (!room || room.closedAt || room.isActive === false) return;
      // Gate: only allow if member, creator, or market still open (members list is optional MVP)
      const isMember = room.members?.some((m) => String(m) === String(socket.userId)) || String(room.createdBy) === String(socket.userId);
      if (!isMember) return; // simple gating for now
      socket.join(`room:${roomId}`);
    } catch {}
  });
  socket.on('message_text', async ({ roomId, text, clientMessageId }) => {
    try {
      if (!roomId || !text) return;
      const ChatMessage = require('./models/ChatMessage');
      const ChatRoom = require('./models/ChatRoom');
      const User = require('./models/User');
      const room = await ChatRoom.findById(roomId).lean();
      if (!room || room.closedAt || room.isActive === false) return;
      const isMember = room.members?.some((m) => String(m) === String(socket.userId)) || String(room.createdBy) === String(socket.userId);
      if (!isMember) return;
      // Upsert by clientMessageId if provided to avoid duplicates
      let msg = null;
      if (clientMessageId && typeof clientMessageId === 'string' && clientMessageId.length <= 128) {
        msg = await ChatMessage.findOneAndUpdate(
          { roomId, senderId: socket.userId, clientMessageId },
          { $setOnInsert: { roomId, senderId: socket.userId, clientMessageId, type: 'text', text } },
          { new: true, upsert: true }
        );
      } else {
        msg = await ChatMessage.create({ roomId, senderId: socket.userId, type: 'text', text });
      }
      await ChatRoom.findByIdAndUpdate(roomId, { $inc: { messagesCount: 1 } });
      const user = await User.findById(socket.userId).select('username');
      const enriched = { ...msg.toObject(), sender: { id: socket.userId, username: user?.username || 'User' } };
      io.to(`room:${roomId}`).emit('message', { message: enriched });
    } catch {}
  });
});

// Dev upload store (test mode only)
const devUploads = new Map(); // key -> { buf: Buffer, contentType: string }
app.put('/dev-upload/:key', express.raw({ type: '*/*', limit: '10mb' }), (req, res) => {
  try {
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    devUploads.set(req.params.key, { buf: Buffer.from(req.body), contentType });
    res.status(200).end();
  } catch {
    res.status(400).end();
  }
});
app.get('/dev-upload/:key', (req, res) => {
  const item = devUploads.get(req.params.key);
  if (!item) return res.status(404).end();
  res.setHeader('content-type', item.contentType || 'application/octet-stream');
  res.send(item.buf);
});

const PORT = process.env.PORT || 4000;
http.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));


