const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    res.status(201).json({ id: user._id, username: user.username, email: user.email });
  } catch (err) {
    next(err);
  }
});

function signAccessToken(user) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign(
    { sub: user._id, role: user.role, typ: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function signRefreshToken(user) {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign(
    { sub: user._id, role: user.role, typ: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);
    const csrfToken = crypto.randomBytes(24).toString('hex');
    const isProd = process.env.NODE_ENV === 'production';
    res
      .cookie('auth_token', access, {
        httpOnly: true,
        sameSite: isProd ? 'strict' : 'lax',
        secure: isProd,
        maxAge: 15 * 60 * 1000,
        path: '/',
      })
      .cookie('refresh_token', refresh, {
        httpOnly: true,
        sameSite: isProd ? 'strict' : 'lax',
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/auth',
      })
      // Double-submit cookie (non-HttpOnly so client can mirror in header)
      .cookie('csrf_token', csrfToken, {
        httpOnly: false,
        sameSite: isProd ? 'strict' : 'lax',
        secure: isProd,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      })
      .json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/auth' });
  res.clearCookie('csrf_token', { path: '/' });
  res.json({ ok: true });
});

// Rotate tokens using refresh cookie
router.post('/refresh', async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!JWT_REFRESH_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    if (payload.typ !== 'refresh') return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);
    const csrfToken = crypto.randomBytes(24).toString('hex');
    res
      .cookie('auth_token', access, {
        httpOnly: true,
        sameSite: isProd ? 'strict' : 'lax',
        secure: isProd,
        maxAge: 15 * 60 * 1000,
        path: '/',
      })
      .cookie('refresh_token', refresh, {
        httpOnly: true,
        sameSite: isProd ? 'strict' : 'lax',
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/auth',
      })
      .cookie('csrf_token', csrfToken, {
        httpOnly: false,
        sameSite: isProd ? 'strict' : 'lax',
        secure: isProd,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      })
      .json({ ok: true });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;


