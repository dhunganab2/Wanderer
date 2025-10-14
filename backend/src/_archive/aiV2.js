/**
 * AI Routes V2
 * Enhanced routes for the improved multi-agent AI system
 */
import express from 'express';
import AIControllerV2 from '../controllers/aiControllerV2.js';

const router = express.Router();
const aiController = new AIControllerV2();

// Main chat endpoint - Enhanced with multi-agent support
router.post('/chat', async (req, res) => {
  await aiController.chat(req, res);
});

// Quick actions for the UI
router.get('/quick-actions', async (req, res) => {
  await aiController.getQuickActions(req, res);
});

// Welcome message generation
router.post('/welcome', async (req, res) => {
  await aiController.getWelcomeMessage(req, res);
});

// System health check with detailed status
router.get('/health', async (req, res) => {
  await aiController.healthCheck(req, res);
});

// System statistics and agent status
router.get('/stats', async (req, res) => {
  await aiController.getSystemStats(req, res);
});

// Conversation state management
router.get('/conversation/:userId', async (req, res) => {
  await aiController.getConversationState(req, res);
});

router.delete('/conversation/:userId', async (req, res) => {
  await aiController.clearConversationState(req, res);
});

// Conversation history (enhanced)
router.get('/history', async (req, res) => {
  await aiController.getConversationHistory(req, res);
});

// System management endpoints
router.post('/switch-system', async (req, res) => {
  await aiController.switchSystem(req, res);
});

router.post('/reinitialize', async (req, res) => {
  await aiController.reinitializeSystem(req, res);
});

// Test endpoint for development
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'AI V2 routes are working!',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /api/ai/v2/chat - Main chat interface',
        'GET /api/ai/v2/quick-actions - Get quick action buttons',
        'POST /api/ai/v2/welcome - Generate welcome message',
        'GET /api/ai/v2/health - System health check',
        'GET /api/ai/v2/stats - System statistics',
        'GET /api/ai/v2/conversation/:userId - Get conversation state',
        'DELETE /api/ai/v2/conversation/:userId - Clear conversation state',
        'POST /api/ai/v2/switch-system - Switch AI systems',
        'POST /api/ai/v2/reinitialize - Reinitialize system'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test endpoint error',
      message: error.message
    });
  }
});

export default router;