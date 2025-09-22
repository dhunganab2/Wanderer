import AITravelService from '../services/aiTravelService.js';

class AIController {
  constructor() {
    this.aiService = null; // Lazy initialization
  }

  getAIService() {
    if (!this.aiService) {
      this.aiService = new AITravelService();
    }
    return this.aiService;
  }

  // Chat with AI Travel Buddy
  async chat(req, res) {
    try {
      const { message, userContext = {} } = req.body;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      // Get user ID from headers for real-time updates
      const userId = req.headers['x-user-id'] || userContext.userId;
      const socketService = req.app.locals.socketService;

      // Enhanced user context with current user ID
      const enhancedUserContext = {
        ...userContext,
        userId: userId,
        currentUser: userId // For backward compatibility
      };

      console.log(`🤖 AI Chat Request from user: ${userId}, message: "${message.substring(0, 50)}..."`);

      // Rate limiting check (handled by middleware)
      const response = await this.getAIService().generateResponse(
        message,
        enhancedUserContext,
        socketService
      );

      if (!response.success) {
        return res.status(500).json(response);
      }

      res.json({
        success: true,
        data: {
          message: response.message,
          timestamp: response.timestamp,
          type: response.type || 'chat',
          metadata: response.metadata || {},
          conversationId: req.headers['x-conversation-id'] || 'default'
        }
      });

    } catch (error) {
      console.error('AI Controller Chat Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process chat request'
      });
    }
  }

  // Get quick action prompts
  async getQuickActions(req, res) {
    try {
      const quickActions = this.getAIService().getQuickActions();

      res.json({
        success: true,
        data: quickActions
      });

    } catch (error) {
      console.error('AI Controller Quick Actions Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quick actions'
      });
    }
  }

  // Generate welcome message
  async getWelcomeMessage(req, res) {
    try {
      const { userProfile = {} } = req.body;

      const welcomeMessage = this.getAIService().generateWelcomeMessage(userProfile);

      res.json({
        success: true,
        data: {
          message: welcomeMessage,
          timestamp: new Date().toISOString(),
          type: 'welcome'
        }
      });

    } catch (error) {
      console.error('AI Controller Welcome Message Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate welcome message'
      });
    }
  }

  // Health check for AI service
  async healthCheck(req, res) {
    try {
      // Test a simple AI request
      const testResponse = await this.getAIService().generateResponse(
        "Hello, this is a health check.",
        {}
      );

      res.json({
        success: true,
        data: {
          status: 'healthy',
          aiServiceAvailable: testResponse.success,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('AI Controller Health Check Error:', error);
      res.status(500).json({
        success: false,
        error: 'AI service health check failed'
      });
    }
  }

  // Get conversation history (placeholder for future implementation)
  async getConversationHistory(req, res) {
    try {
      const { conversationId = 'default', limit = 20 } = req.query;

      // TODO: Implement conversation history storage and retrieval
      // For now, return empty history
      res.json({
        success: true,
        data: {
          conversationId,
          messages: [],
          totalCount: 0
        }
      });

    } catch (error) {
      console.error('AI Controller Conversation History Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation history'
      });
    }
  }

  // Clear conversation history (placeholder for future implementation)
  async clearConversationHistory(req, res) {
    try {
      const { conversationId = 'default' } = req.body;

      // TODO: Implement conversation history clearing
      res.json({
        success: true,
        data: {
          message: 'Conversation history cleared successfully',
          conversationId
        }
      });

    } catch (error) {
      console.error('AI Controller Clear History Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear conversation history'
      });
    }
  }
}

export default AIController;