const express = require('express');
const { z } = require('zod');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { schemas, validate } = require('../utils/validation');

const router = express.Router();

// Helper: dummy payment customer ID for user (demo mode)
async function ensureDummyCustomer(user) {
  if (user.dummyCustomerId) return user.dummyCustomerId;
  
  // Generate a dummy customer ID
  const dummyCustomerId = `cus_dummy_${user._id.toString().slice(-8)}${Date.now().toString().slice(-6)}`;
  user.dummyCustomerId = dummyCustomerId;
  await user.save();
  return dummyCustomerId;
}

/**
 * @swagger
 * /transactions/deposit:
 *   post:
 *     summary: Create a deposit transaction
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *       - CsrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransaction'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/deposit', 
  validate(schemas.createTransaction),
  async (req, res, next) => {
    try {
      const { amountUSD } = req.body;
      const userId = req.userId;
      
      // Create pending transaction with dummy payment provider
      const tx = await Transaction.create({ 
        userId, 
        type: 'deposit', 
        amountUSD, 
        status: 'pending', 
        paymentProvider: 'Demo',
        externalId: `demo_dep_${Date.now()}_${Math.random().toString(36).slice(2)}`
      });
      
      // In demo mode, auto-complete the transaction after a short delay
      setTimeout(async () => {
        try {
          await Transaction.findByIdAndUpdate(tx._id, { status: 'completed' });
          const user = await User.findById(userId);
          if (user) {
            user.walletBalanceUSD = (user.walletBalanceUSD || 0) + amountUSD;
            await user.save();
          }
        } catch (error) {
          console.error('Demo deposit completion error:', error);
        }
      }, 2000); // 2 second delay to simulate processing
      
      res.status(201).json(tx);
    } catch (err) {
      next(err);
    }
  });

router.post('/withdraw', 
  validate(z.object({ amountUSD: z.number().positive().finite().min(10).max(10000) })),
  async (req, res, next) => {
    try {
      const { amountUSD } = req.body;
      const userId = req.userId;
      
      // Check if user has sufficient balance
      const user = await User.findById(userId);
      if (!user || (user.walletBalanceUSD || 0) < amountUSD) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      // Create pending withdrawal with dummy payment provider
      const tx = await Transaction.create({ 
        userId, 
        type: 'withdrawal', 
        amountUSD, 
        status: 'pending', 
        paymentProvider: 'Demo',
        externalId: `demo_with_${Date.now()}_${Math.random().toString(36).slice(2)}`
      });
      
      // Immediately deduct from balance and complete in demo mode
      setTimeout(async () => {
        try {
          await Transaction.findByIdAndUpdate(tx._id, { status: 'completed' });
          const updatedUser = await User.findById(userId);
          if (updatedUser) {
            updatedUser.walletBalanceUSD = Math.max(0, (updatedUser.walletBalanceUSD || 0) - amountUSD);
            await updatedUser.save();
          }
        } catch (error) {
          console.error('Demo withdrawal completion error:', error);
        }
      }, 1500); // 1.5 second delay to simulate processing
      
      res.status(201).json(tx);
    } catch (err) {
      next(err);
    }
  });

router.post('/purchase-tokens', async (req, res, next) => {
  try {
    const { amountUSD, amountTokens } = req.body;
    const userId = req.userId;
    const tx = await Transaction.create({ userId, type: 'tokenPurchase', amountUSD, amountTokens, status: 'completed', paymentProvider: 'Stripe' });
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

// Demo SetupIntent for adding a payment method
router.post('/payment-methods/setup-intent', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const customerId = await ensureDummyCustomer(user);
    
    // Return a dummy client secret for demo purposes
    const dummyClientSecret = `pi_demo_${Date.now()}_${Math.random().toString(36).slice(2)}_secret_dummy`;
    res.json({ clientSecret: dummyClientSecret });
  } catch (err) { next(err) }
});

// List dummy payment methods
router.get('/payment-methods', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.json({ items: [] });
    
    // Return dummy payment methods for demo
    const dummyPaymentMethods = [
      { id: 'pm_demo_visa_4242', brand: 'visa', last4: '4242' },
      { id: 'pm_demo_mastercard_5555', brand: 'mastercard', last4: '5555' },
    ];
    
    res.json({ items: dummyPaymentMethods });
  } catch (err) { next(err) }
});

// Delete a dummy payment method
router.delete('/payment-methods/:id', async (req, res, next) => {
  try {
    const paymentMethodId = req.params.id;
    
    // Validate that it's a demo payment method
    if (!paymentMethodId.startsWith('pm_demo_')) {
      return res.status(400).json({ error: 'Invalid payment method ID' });
    }
    
    // In demo mode, always succeed
    res.json({ ok: true });
  } catch (err) { next(err) }
});

/**
 * @swagger
 * /transactions/user/{id}:
 *   get:
 *     summary: Get user transactions with pagination and filters
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, betStake, betPayout, tokenPurchase]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: User transactions
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/user/:id', 
  validate(z.object({ id: schemas.mongoId }), 'params'),
  validate(schemas.pagination.extend({
    type: schemas.transactionType.optional(),
    status: schemas.transactionStatus.optional(),
    from: z.string().optional(),
    to: z.string().optional()
  }), 'query'),
  async (req, res, next) => {
  try {
    const target = req.params.id;
    if (String(req.userId) !== String(target)) return res.status(403).json({ error: 'Forbidden' });
    const { page = 1, limit = 50, type, status, from, to } = req.query;
    const q = { userId: target };
    if (type) q.type = String(type);
    if (status) q.status = String(status);
    if (from || to) {
      q.timestamp = {};
      if (from) q.timestamp.$gte = new Date(String(from));
      if (to) q.timestamp.$lte = new Date(String(to));
    }
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (pageNum - 1) * lim;
    const [items, total] = await Promise.all([
      Transaction.find(q).sort({ timestamp: -1 }).skip(skip).limit(lim),
      Transaction.countDocuments(q),
    ]);
    res.json({ items, total, page: pageNum, limit: lim });
  } catch (err) {
    next(err);
  }
});

// CSV export
router.get('/user/:id/export', async (req, res, next) => {
  try {
    const target = req.params.id;
    if (String(req.userId) !== String(target)) return res.status(403).json({ error: 'Forbidden' });
    const { type, status, from, to } = req.query;
    const q = { userId: target };
    if (type) q.type = String(type);
    if (status) q.status = String(status);
    if (from || to) {
      q.timestamp = {};
      if (from) q.timestamp.$gte = new Date(String(from));
      if (to) q.timestamp.$lte = new Date(String(to));
    }
    const items = await Transaction.find(q).sort({ timestamp: -1 });
    const header = 'timestamp,type,status,amountUSD,amountTokens,paymentProvider,externalId\n';
    const rows = items
      .map((t) => [
        new Date(t.timestamp).toISOString(),
        t.type,
        t.status,
        t.amountUSD ?? 0,
        t.amountTokens ?? 0,
        t.paymentProvider ?? '',
        t.externalId ?? '',
      ].map((v) => String(v).replace(/"/g, '""')).join(','))
      .join('\n');
    const csv = header + rows + '\n';
    res.setHeader('content-type', 'text/csv');
    res.setHeader('content-disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (err) { next(err) }
});

// Cursor-based transactions for better performance
router.get('/user/:id/cursor',
  validate(z.object({ id: schemas.mongoId }), 'params'),
  validate(schemas.cursorPagination.extend({
    type: z.string().optional(),
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional()
  }), 'query'),
  async (req, res, next) => {
    try {
      const target = req.params.id;
      if (String(req.userId) !== String(target)) return res.status(403).json({ error: 'Forbidden' });
      
      const { limit, cursor, direction, type, status, from, to } = req.query;
      
      // Build base query
      const baseQuery = { userId: target };
      if (type) baseQuery.type = String(type);
      if (status) baseQuery.status = String(status);
      if (from || to) {
        baseQuery.timestamp = {};
        if (from) baseQuery.timestamp.$gte = new Date(String(from));
        if (to) baseQuery.timestamp.$lte = new Date(String(to));
      }
      
      // Build cursor query
      let cursorQuery = { ...baseQuery };
      if (cursor) {
        try {
          const cursorDoc = await Transaction.findById(cursor, 'timestamp');
          if (cursorDoc) {
            const timestampCondition = direction === 'backward' 
              ? { $gt: cursorDoc.timestamp }
              : { $lt: cursorDoc.timestamp };
            cursorQuery.timestamp = cursorQuery.timestamp 
              ? { ...cursorQuery.timestamp, ...timestampCondition }
              : timestampCondition;
          }
        } catch (err) {
          // Invalid cursor, use base query
        }
      }
      
      const sortOrder = direction === 'backward' ? 1 : -1;
      const items = await Transaction.find(cursorQuery)
        .sort({ timestamp: sortOrder })
        .limit(limit + 1);
      
      // Check if there are more items
      const hasMore = items.length > limit;
      const resultItems = hasMore ? items.slice(0, limit) : items;
      
      // If direction is backward, reverse the results to maintain chronological order
      if (direction === 'backward') {
        resultItems.reverse();
      }
      
      const response = {
        items: resultItems,
        hasMore,
        nextCursor: resultItems.length > 0 ? resultItems[resultItems.length - 1]._id : null,
        prevCursor: resultItems.length > 0 ? resultItems[0]._id : null,
      };
      
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// Demo webhook for testing transaction completion
router.post('/demo/webhook', async (req, res) => {
  try {
    const { type, data } = req.body || {};
    
    if (!data?.userId || typeof data?.amountUSD !== 'number') {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }
    
    const userId = data.userId;
    const amountUSD = data.amountUSD;
    const user = await User.findById(userId);
    
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    if (type === 'deposit.succeeded' || type === 'demo.deposit.completed') {
      await Transaction.updateOne(
        { externalId: data.id || null },
        { $set: { userId, type: 'deposit', amountUSD, status: 'completed', paymentProvider: 'Demo', externalId: data.id || null } },
        { upsert: true }
      );
      user.walletBalanceUSD = (user.walletBalanceUSD || 0) + amountUSD;
      await user.save();
    } else if (type === 'withdrawal.succeeded' || type === 'demo.withdrawal.completed') {
      await Transaction.updateOne(
        { externalId: data.id || null },
        { $set: { userId, type: 'withdrawal', amountUSD, status: 'completed', paymentProvider: 'Demo', externalId: data.id || null } },
        { upsert: true }
      );
      user.walletBalanceUSD = Math.max(0, (user.walletBalanceUSD || 0) - amountUSD);
      await user.save();
    }
    
    res.json({ received: true, message: 'Demo webhook processed successfully' });
  } catch (e) {
    console.error('Demo webhook error:', e);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;


