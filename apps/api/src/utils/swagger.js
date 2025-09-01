const swaggerJsdoc = require('swagger-jsdoc');
const { zodToJsonSchema } = require('zod-to-json-schema');
const { schemas } = require('./validation');

// Convert Zod schemas to JSON Schema for OpenAPI
const jsonSchemas = {};
Object.keys(schemas).forEach(key => {
  try {
    // Skip function schemas that can't be converted to JSON Schema
    if (typeof schemas[key] === 'function') {
      return;
    }
    jsonSchemas[key] = zodToJsonSchema(schemas[key], {
      name: key,
      $refStrategy: 'none'
    });
  } catch (err) {
    console.warn(`Could not convert schema ${key} to JSON Schema:`, err.message);
  }
});

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dating-or-Not API',
      version: '1.0.0',
      description: 'A comprehensive dating market and betting platform API',
      contact: {
        name: 'API Support',
        email: 'support@dating-or-not.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        // Core entities
        User: jsonSchemas.userResponse || {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
            avatarUrl: { type: 'string' },
            bio: { type: 'string' }
          }
        },
        Transaction: jsonSchemas.transactionResponse || {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            type: { type: 'string', enum: ['deposit', 'withdrawal', 'betStake', 'betPayout', 'tokenPurchase'] },
            amountUSD: { type: 'number' },
            amountTokens: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
            timestamp: { type: 'string', format: 'date-time' },
            paymentProvider: { type: 'string' },
            externalId: { type: 'string' }
          }
        },
        Market: jsonSchemas.marketResponse || {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['open', 'closed', 'settled'] },
            createdAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'string' },
            likes: { type: 'number' },
            comments: { type: 'number' },
            topOdds: { type: 'number' }
          }
        },
        
        // Request schemas
        CreateTransaction: jsonSchemas.createTransaction || {
          type: 'object',
          required: ['amountUSD'],
          properties: {
            amountUSD: { type: 'number', minimum: 1, maximum: 10000 }
          }
        },
        CreateMarket: jsonSchemas.createMarket || {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 200 },
            description: { type: 'string', minLength: 10, maxLength: 1000 },
            category: { type: 'string', minLength: 1, maxLength: 50 },
            endDate: { type: 'string', format: 'date-time' }
          }
        },
        PlaceBet: jsonSchemas.placeBet || {
          type: 'object',
          properties: {
            stakeUSD: { type: 'number', minimum: 1, maximum: 10000, default: 0 },
            stakeTokens: { type: 'number', maximum: 1000000 },
            selection: { type: 'string', enum: ['yes', 'no', 'over', 'under'] }
          }
        },
        CreateParlay: jsonSchemas.createParlay || {
          type: 'object',
          required: ['legs', 'stakeUSD'],
          properties: {
            legs: {
              type: 'array',
              minItems: 2,
              maxItems: 10,
              items: {
                type: 'object',
                required: ['betId', 'selection'],
                properties: {
                  betId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                  selection: { type: 'string', enum: ['yes', 'no', 'over', 'under'] }
                }
              }
            },
            stakeUSD: { type: 'number', minimum: 1, maximum: 10000 }
          }
        },

        // Response schemas
        PaginatedResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: {} },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        },
        CursorPaginatedResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: {} },
            hasMore: { type: 'boolean' },
            nextCursor: { type: 'string', nullable: true },
            prevCursor: { type: 'string', nullable: true }
          }
        },
        Error: jsonSchemas.errorResponse || {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        CsrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-csrf-token'
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: [],
        CsrfToken: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'Users',
        description: 'User profile management'
      },
      {
        name: 'Transactions',
        description: 'Financial transactions and wallet operations'
      },
      {
        name: 'Markets',
        description: 'Dating markets and betting operations'
      },
      {
        name: 'Bets',
        description: 'Individual bets and parlays'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      }
    ]
  },
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;
