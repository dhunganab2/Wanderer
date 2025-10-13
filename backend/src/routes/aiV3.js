/**
 * AI Routes V3 - Quick Response System
 * Lightning-fast responses with background processing
 */
import express from 'express';
import QuickResponseAIService from '../ai-agents/QuickResponseAIService.js';

const router = express.Router();

// Initialize service once
let aiService = null;
const getAIService = async (socketService = null) => {
  if (!aiService) {
    aiService = new QuickResponseAIService();
    await aiService.initialize(socketService);
  }
  return aiService;
};

// Main chat endpoint - Instant responses
router.post('/chat', async (req, res) => {
  try {
    const { message, userContext = {} } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const userId = req.headers['x-user-id'] || userContext.userId;
    const socketService = req.app.locals.socketService;

    const enhancedUserContext = {
      ...userContext,
      userId: userId,
      currentUser: userId
    };

    console.log(`⚡ Quick AI Chat Request from user: ${userId}, message: "${message.substring(0, 50)}..."`);

    const startTime = Date.now();
    const service = await getAIService(socketService);
    const response = await service.generateResponse(message, enhancedUserContext, socketService);
    const responseTime = Date.now() - startTime;

    console.log(`✅ Response generated in ${responseTime}ms`);

    if (!response.success) {
      return res.status(500).json(response);
    }

    res.json({
      success: true,
      data: {
        message: response.message,
        timestamp: response.timestamp,
        type: response.type || 'chat',
        responseTime: `${responseTime}ms`,
        metadata: {
          ...response.metadata,
          systemVersion: '2.1',
          agentSystem: 'quick_response_manager'
        },
        conversationId: req.headers['x-conversation-id'] || 'default'
      }
    });

  } catch (error) {
    console.error('AI V3 Chat Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
      systemVersion: '2.1'
    });
  }
});

// Health check with performance metrics
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    const service = await getAIService();
    const healthCheck = await service.healthCheck();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...healthCheck,
        responseTime: `${responseTime}ms`,
        performance: responseTime < 100 ? 'excellent' : responseTime < 500 ? 'good' : 'slow'
      }
    });

  } catch (error) {
    console.error('AI V3 Health Check Error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      systemVersion: '2.1'
    });
  }
});

// System stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const service = await getAIService();
    const stats = service.getSystemStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('AI V3 Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system stats'
    });
  }
});

// Quick actions
router.get('/quick-actions', async (req, res) => {
  try {
    const service = await getAIService();
    const quickActions = service.getQuickActions();

    res.json({
      success: true,
      data: quickActions,
      systemVersion: '2.1'
    });

  } catch (error) {
    console.error('AI V3 Quick Actions Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quick actions'
    });
  }
});

// Welcome message
router.post('/welcome', async (req, res) => {
  try {
    const { userProfile = {} } = req.body;
    const service = await getAIService();
    const welcomeMessage = service.generateWelcomeMessage(userProfile);

    res.json({
      success: true,
      data: {
        message: welcomeMessage,
        timestamp: new Date().toISOString(),
        type: 'welcome',
        systemVersion: '2.1'
      }
    });

  } catch (error) {
    console.error('AI V3 Welcome Message Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate welcome message'
    });
  }
});

// Conversation state management
router.get('/conversation/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const service = await getAIService();
    const conversationState = service.getConversationState(userId);

    res.json({
      success: true,
      data: {
        userId,
        conversationState,
        systemVersion: '2.1'
      }
    });

  } catch (error) {
    console.error('AI V3 Conversation State Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation state'
    });
  }
});

router.delete('/conversation/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const service = await getAIService();
    const cleared = service.clearConversationState(userId);

    res.json({
      success: true,
      data: {
        userId,
        cleared,
        message: cleared ? 'Conversation state cleared successfully' : 'No conversation state to clear',
        systemVersion: '2.1'
      }
    });

  } catch (error) {
    console.error('AI V3 Clear State Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation state'
    });
  }
});

// Performance test endpoint
router.get('/performance-test', async (req, res) => {
  try {
    const testMessages = [
      "hi",
      "plan a trip",
      "to Japan",
      "for 5 days",
      "solo"
    ];

    const results = [];
    const service = await getAIService();

    for (const message of testMessages) {
      const startTime = Date.now();
      const response = await service.generateResponse(message, {
        userId: 'perf-test',
        userProfile: { name: 'PerfTest' }
      });
      const responseTime = Date.now() - startTime;

      results.push({
        message,
        responseTime: `${responseTime}ms`,
        success: response.success,
        type: response.type,
        quick: response.metadata?.quickResponse
      });
    }

    const avgTime = results.reduce((sum, r) => sum + parseInt(r.responseTime), 0) / results.length;

    res.json({
      success: true,
      data: {
        testResults: results,
        averageResponseTime: `${avgTime.toFixed(0)}ms`,
        performance: avgTime < 100 ? 'excellent' : avgTime < 500 ? 'good' : 'needs improvement',
        systemVersion: '2.1'
      }
    });

  } catch (error) {
    console.error('AI V3 Performance Test Error:', error);
    res.status(500).json({
      success: false,
      error: 'Performance test failed'
    });
  }
});

// Debug endpoint to clear user state
router.delete('/debug/clear-state/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const service = await getAIService();

    // Force clear user state
    const cleared = service.chatManager.forceClearUserState(userId);

    res.json({
      success: true,
      message: `Cleared all state for user ${userId}`,
      cleared,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear user state',
      message: error.message
    });
  }
});

// Test WebSocket connection
router.post('/test-websocket/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(500).json({
        success: false,
        error: 'Socket service not available'
      });
    }

    // Send a test message
    const testData = {
      stage: 'test',
      message: 'This is a test WebSocket message',
      timestamp: new Date().toISOString(),
      progress: 100
    };

    const success = socketService.sendToUser(userId, 'ai_status_update', testData);
    
    res.json({
      success: true,
      data: {
        message: `Test WebSocket message sent to user ${userId}`,
        delivered: success,
        connectedUsers: Array.from(socketService.connectedUsers.keys()),
        userSocketId: socketService.connectedUsers.get(userId)
      }
    });

  } catch (error) {
    console.error('Test WebSocket Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test WebSocket connection'
    });
  }
});

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'AI V3 (Quick Response) routes are working!',
      timestamp: new Date().toISOString(),
      systemVersion: '2.1',
      features: [
        'Instant greeting responses (<100ms)',
        'Quick trip planning start',
        'Background specialist coordination',
        'Real-time status updates',
        'Single manager interface'
      ],
      endpoints: [
        'POST /api/ai/v3/chat - Lightning-fast chat',
        'GET /api/ai/v3/health - Health with performance',
        'GET /api/ai/v3/stats - System statistics',
        'GET /api/ai/v3/performance-test - Speed test',
        'GET /api/ai/v3/conversation/:userId - Conversation state',
        'DELETE /api/ai/v3/conversation/:userId - Clear conversation',
        'DELETE /api/ai/v3/debug/clear-state/:userId - Force clear user state'
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