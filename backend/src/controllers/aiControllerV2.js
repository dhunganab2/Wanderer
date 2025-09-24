/**
 * AI Controller V2
 * Supports both the legacy system and the new improved multi-agent system
 */
import AITravelService from '../services/aiTravelService.js';
import ImprovedAITravelService from '../ai-agents/ImprovedAITravelService.js';
import QuickResponseAIService from '../ai-agents/QuickResponseAIService.js';

class AIControllerV2 {
  constructor() {
    this.legacyService = null;
    this.improvedService = null;
    this.quickService = null;
    this.useImprovedSystem = process.env.USE_IMPROVED_AI === 'true' || true; // Default to improved system
    this.useQuickResponse = process.env.USE_QUICK_RESPONSE === 'true' || true; // Default to quick response system
  }

  /**
   * Get the appropriate AI service (lazy initialization)
   */
  async getAIService(socketService = null) {
    if (this.useQuickResponse) {
      if (!this.quickService) {
        this.quickService = new QuickResponseAIService();
        await this.quickService.initialize(socketService);
      }
      return this.quickService;
    } else if (this.useImprovedSystem) {
      if (!this.improvedService) {
        this.improvedService = new ImprovedAITravelService();
        await this.improvedService.initialize(socketService);
      }
      return this.improvedService;
    } else {
      if (!this.legacyService) {
        this.legacyService = new AITravelService();
      }
      return this.legacyService;
    }
  }

  /**
   * Get system version string
   */
  getSystemVersion() {
    if (this.useQuickResponse) return '2.1';
    if (this.useImprovedSystem) return '2.0';
    return '1.0';
  }

  /**
   * Get system type string
   */
  getSystemType() {
    if (this.useQuickResponse) return 'quick_response_manager';
    if (this.useImprovedSystem) return 'multi_agent';
    return 'single_agent';
  }

  /**
   * Chat with AI Travel Buddy - Enhanced version
   */
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

      console.log(`🤖 AI Chat Request (V2) from user: ${userId}, message: "${message.substring(0, 50)}..."`);
      console.log(`🔧 Using ${this.useQuickResponse ? 'Quick Response' : this.useImprovedSystem ? 'Improved' : 'Legacy'} AI System`);

      // Get the appropriate AI service
      const aiService = await this.getAIService(socketService);

      // Generate response using the selected system
      const response = await aiService.generateResponse(
        message,
        enhancedUserContext,
        socketService
      );

      if (!response.success) {
        return res.status(500).json(response);
      }

      // Enhanced response with system information
      res.json({
        success: true,
        data: {
          message: response.message,
          timestamp: response.timestamp,
          type: response.type || 'chat',
          metadata: {
            ...response.metadata,
            systemVersion: this.getSystemVersion(),
            agentSystem: this.getSystemType()
          },
          conversationId: req.headers['x-conversation-id'] || 'default'
        }
      });

    } catch (error) {
      console.error('AI Controller V2 Chat Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process chat request',
        systemVersion: this.getSystemVersion()
      });
    }
  }

  /**
   * Get quick action prompts
   */
  async getQuickActions(req, res) {
    try {
      const aiService = await this.getAIService();
      const quickActions = aiService.getQuickActions();

      res.json({
        success: true,
        data: quickActions,
        systemVersion: this.getSystemVersion()
      });

    } catch (error) {
      console.error('AI Controller V2 Quick Actions Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quick actions'
      });
    }
  }

  /**
   * Generate welcome message
   */
  async getWelcomeMessage(req, res) {
    try {
      const { userProfile = {} } = req.body;

      const aiService = await this.getAIService();
      const welcomeMessage = await aiService.generateWelcomeMessage(userProfile);

      res.json({
        success: true,
        data: {
          message: welcomeMessage,
          timestamp: new Date().toISOString(),
          type: 'welcome',
          systemVersion: this.getSystemVersion()
        }
      });

    } catch (error) {
      console.error('AI Controller V2 Welcome Message Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate welcome message'
      });
    }
  }

  /**
   * Enhanced health check with system status
   */
  async healthCheck(req, res) {
    try {
      const aiService = await this.getAIService();

      let healthData = {
        timestamp: new Date().toISOString(),
        systemVersion: this.getSystemVersion(),
        activeSystem: this.getSystemType()
      };

      if ((this.useQuickResponse || this.useImprovedSystem) && aiService.healthCheck) {
        // Use the improved system's detailed health check
        const detailedHealth = await aiService.healthCheck();
        healthData = { ...healthData, ...detailedHealth };
      } else {
        // Simple health check for legacy system
        const testResponse = await aiService.generateResponse(
          "Hello, this is a health check.",
          {}
        );

        healthData.status = 'healthy';
        healthData.aiServiceAvailable = testResponse.success;
      }

      res.json({
        success: true,
        data: healthData
      });

    } catch (error) {
      console.error('AI Controller V2 Health Check Error:', error);
      res.status(500).json({
        success: false,
        error: 'AI service health check failed',
        systemVersion: this.useImprovedSystem ? '2.0' : '1.0'
      });
    }
  }

  /**
   * Get system statistics and status
   */
  async getSystemStats(req, res) {
    try {
      const aiService = await this.getAIService();

      let stats = {
        systemVersion: this.useImprovedSystem ? '2.0' : '1.0',
        activeSystem: this.useImprovedSystem ? 'improved_multi_agent' : 'legacy',
        timestamp: new Date().toISOString()
      };

      if (this.useImprovedSystem && aiService.getSystemStats) {
        const systemStats = aiService.getSystemStats();
        stats = { ...stats, ...systemStats };
      } else {
        stats.features = ['Basic AI conversation', 'Trip planning', 'Destination recommendations'];
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('AI Controller V2 System Stats Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system statistics'
      });
    }
  }

  /**
   * Get conversation state for a user
   */
  async getConversationState(req, res) {
    try {
      const userId = req.params.userId || req.query.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const aiService = await this.getAIService();

      let conversationState = null;
      if (this.useImprovedSystem && aiService.getConversationState) {
        conversationState = aiService.getConversationState(userId);
      }

      res.json({
        success: true,
        data: {
          userId,
          conversationState,
          systemVersion: this.useImprovedSystem ? '2.0' : '1.0'
        }
      });

    } catch (error) {
      console.error('AI Controller V2 Conversation State Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation state'
      });
    }
  }

  /**
   * Clear conversation state for a user
   */
  async clearConversationState(req, res) {
    try {
      const userId = req.body.userId || req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const aiService = await this.getAIService();

      let cleared = false;
      if (this.useImprovedSystem && aiService.clearConversationState) {
        cleared = aiService.clearConversationState(userId);
      }

      res.json({
        success: true,
        data: {
          userId,
          cleared,
          message: cleared ? 'Conversation state cleared successfully' : 'No conversation state to clear',
          systemVersion: this.useImprovedSystem ? '2.0' : '1.0'
        }
      });

    } catch (error) {
      console.error('AI Controller V2 Clear State Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear conversation state'
      });
    }
  }

  /**
   * Switch between AI systems (for testing/debugging)
   */
  async switchSystem(req, res) {
    try {
      const { system } = req.body; // 'improved' or 'legacy'

      if (!system || !['improved', 'legacy'].includes(system)) {
        return res.status(400).json({
          success: false,
          error: 'System must be "improved" or "legacy"'
        });
      }

      const previousSystem = this.useImprovedSystem ? 'improved' : 'legacy';
      this.useImprovedSystem = system === 'improved';

      // Reset services to force re-initialization
      this.legacyService = null;
      this.improvedService = null;

      res.json({
        success: true,
        data: {
          previousSystem,
          currentSystem: system,
          systemVersion: this.useImprovedSystem ? '2.0' : '1.0',
          message: `Switched to ${system} AI system`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('AI Controller V2 Switch System Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to switch AI system'
      });
    }
  }

  /**
   * Force reinitialize the current AI system
   */
  async reinitializeSystem(req, res) {
    try {
      const socketService = req.app.locals.socketService;

      if (this.useImprovedSystem && this.improvedService) {
        await this.improvedService.reinitialize(socketService);
      } else {
        this.legacyService = null; // Will reinitialize on next request
      }

      res.json({
        success: true,
        data: {
          message: 'AI system reinitialized successfully',
          systemVersion: this.useImprovedSystem ? '2.0' : '1.0',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('AI Controller V2 Reinitialize Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reinitialize AI system'
      });
    }
  }

  /**
   * Backward compatibility methods
   */
  async getConversationHistory(req, res) {
    try {
      const { conversationId = 'default', limit = 20 } = req.query;

      // For now, return empty history (could implement with improved system)
      res.json({
        success: true,
        data: {
          conversationId,
          messages: [],
          totalCount: 0,
          systemVersion: this.useImprovedSystem ? '2.0' : '1.0',
          note: 'Conversation history available in improved system'
        }
      });

    } catch (error) {
      console.error('AI Controller V2 Conversation History Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation history'
      });
    }
  }
}

export default AIControllerV2;