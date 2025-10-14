import express from 'express';
import rateLimit from 'express-rate-limit';
import AIController from '../controllers/aiController.js';

const router = express.Router();
const aiController = new AIController();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: 'Too many AI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More restrictive rate limiting for chat endpoint
const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 chat requests per minute
  message: {
    success: false,
    error: 'Too many chat requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all AI routes
router.use(aiRateLimit);

// Routes
router.post('/chat', chatRateLimit, (req, res) => {
  aiController.chat(req, res);
});

router.get('/quick-actions', (req, res) => {
  aiController.getQuickActions(req, res);
});

router.post('/welcome', (req, res) => {
  aiController.getWelcomeMessage(req, res);
});

router.get('/health', (req, res) => {
  aiController.healthCheck(req, res);
});

router.get('/conversation/:conversationId?', (req, res) => {
  // Move conversationId from params to query for consistency
  req.query.conversationId = req.params.conversationId;
  aiController.getConversationHistory(req, res);
});

router.delete('/conversation', (req, res) => {
  aiController.clearConversationHistory(req, res);
});

// Info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'AI Travel Buddy',
      version: '1.0.0',
      endpoints: {
        chat: 'POST /chat',
        quickActions: 'GET /quick-actions',
        welcome: 'POST /welcome',
        health: 'GET /health',
        conversation: 'GET /conversation/:conversationId',
        clearConversation: 'DELETE /conversation'
      },
      rateLimits: {
        general: '50 requests per 15 minutes',
        chat: '10 requests per minute'
      }
    }
  });
});

export default router;