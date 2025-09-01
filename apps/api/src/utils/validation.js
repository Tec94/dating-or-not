const { z } = require('zod');

// MongoDB ObjectId validation
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Common validation schemas
const schemas = {
  // MongoDB ObjectId
  mongoId: mongoIdSchema,
  
  // User ID validation
  userId: mongoIdSchema,
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),
  
  // Cursor-based pagination
  cursorPagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
    direction: z.enum(['forward', 'backward']).default('forward')
  }),
  
  // String with length limits - common sizes
  safeString: z.string().trim().min(1).max(1000),
  shortString: z.string().trim().min(1).max(100),
  longString: z.string().trim().min(1).max(5000),
  
  // Email validation
  email: z.string().email().max(255),
  
  // User input for messages
  messageText: z.string().trim().min(1).max(2000),
  
  // Bet amount validation
  betAmount: z.number().positive().finite().max(10000),
  
  // Date validation
  isoDate: z.string().datetime().optional(),
  
  // File validation
  filename: z.string().trim().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename'),
  contentType: z.enum([
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]),
  
  // Transaction validation
  createTransaction: z.object({ 
    amountUSD: z.number().positive().finite().min(1).max(10000) 
  }),
  transactionType: z.enum(['deposit', 'withdrawal', 'betStake', 'betPayout', 'tokenPurchase']),
  transactionStatus: z.enum(['pending', 'completed', 'failed']),
  
  // Bet validation
  betSelection: z.enum(['yes', 'no', 'over', 'under']),
  
  // Market validation
  marketStatus: z.enum(['open', 'closed', 'settled']),
  
  // User role validation
  userRole: z.enum(['user', 'admin']),

  // Complete request schemas
  createTransaction: z.object({
    amountUSD: z.number().positive().finite().min(1).max(10000)
  }),
  
  createMarket: z.object({
    title: z.string().trim().min(5).max(200),
    description: z.string().trim().min(10).max(1000).optional(),
    category: z.string().trim().min(1).max(50).optional(),
    endDate: z.string().datetime().optional()
  }),
  
  placeBet: z.object({
    stakeUSD: z.number().positive().finite().min(1).max(10000).default(0),
    stakeTokens: z.number().positive().finite().max(1000000).optional(),
    selection: z.enum(['yes', 'no', 'over', 'under']).optional()
  }),
  
  createParlay: z.object({
    legs: z.array(z.object({
      betId: z.string().regex(/^[0-9a-fA-F]{24}$/),
      selection: z.enum(['yes', 'no', 'over', 'under'])
    })).min(2).max(10),
    stakeUSD: z.number().positive().finite().min(1).max(10000)
  }),

  // Response schemas for OpenAPI
  userResponse: z.object({
    _id: z.string(),
    username: z.string(),
    email: z.string().email(),
    role: z.string(),
    createdAt: z.string(),
    avatarUrl: z.string().optional(),
    bio: z.string().optional()
  }),
  
  transactionResponse: z.object({
    _id: z.string(),
    userId: z.string(),
    type: z.string(),
    amountUSD: z.number(),
    amountTokens: z.number(),
    status: z.string(),
    timestamp: z.string(),
    paymentProvider: z.string().optional(),
    externalId: z.string().optional()
  }),
  
  marketResponse: z.object({
    _id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.string(),
    createdAt: z.string(),
    createdBy: z.string(),
    likes: z.number(),
    comments: z.number(),
    topOdds: z.number()
  }),

  errorResponse: z.object({
    error: z.string(),
    details: z.array(z.object({
      field: z.string(),
      message: z.string()
    })).optional()
  })
};

// Validation middleware generator
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = source === 'params' ? req.params : 
                   source === 'query' ? req.query : req.body;
      
      const result = schema.safeParse(data);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors 
        });
      }
      
      // Replace original data with validated/sanitized data
      if (source === 'params') req.params = result.data;
      else if (source === 'query') req.query = result.data;
      else req.body = result.data;
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Sanitize MongoDB query objects to prevent injection
function sanitizeQuery(query) {
  if (typeof query !== 'object' || query === null) return {};
  
  const sanitized = {};
  for (const [key, value] of Object.entries(query)) {
    // Only allow safe field names (alphanumeric + underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) continue;
    
    // Sanitize values
    if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (typeof value === 'number' && isFinite(value)) {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
    // Skip objects, arrays, and other complex types to prevent injection
  }
  
  return sanitized;
}

module.exports = {
  schemas,
  validate,
  sanitizeQuery
};
