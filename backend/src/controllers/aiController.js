import AITravelService from '../services/aiTravelService.js';

class AIController {
  constructor() {
    this.aiService = new AITravelService();
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

      // Rate limiting check (handled by middleware)
      const response = await this.aiService.generateResponse(message, userContext);

      if (!response.success) {
        return res.status(500).json(response);
      }

      res.json({
        success: true,
        data: {
          message: response.message,
          timestamp: response.timestamp,
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
      const quickActions = this.aiService.getQuickActions();

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

      const welcomeMessage = this.aiService.generateWelcomeMessage(userProfile);

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
      const testResponse = await this.aiService.generateResponse(
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