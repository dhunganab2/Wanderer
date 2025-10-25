/**
 * QuickResponseAIService - Thin wrapper around ChatManagerAgent
 * Provides backward compatibility for existing API routes
 */
import ChatManagerAgent from './ChatManagerAgent.js';

class QuickResponseAIService {
  constructor() {
    this.chatManager = null;
  }

  async initialize(socketService = null) {
    this.chatManager = new ChatManagerAgent();
    console.log('✅ QuickResponseAIService initialized (using ChatManagerAgent)');
  }

  /**
   * Main entry point - delegates to ChatManagerAgent
   */
  async generateResponse(message, userContext, socketService = null) {
    try {
      const response = await this.chatManager.handleUserMessage(message, userContext, socketService);

      return {
        success: true,
        message: response.message || response,
        timestamp: new Date().toISOString(),
        type: response.type || 'chat',
        metadata: response.metadata || {}
      };
    } catch (error) {
      console.error('QuickResponseAIService Error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'QuickResponseAIService',
      chatManager: this.chatManager ? 'initialized' : 'not initialized',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system stats
   */
  getSystemStats() {
    return {
      service: 'QuickResponseAIService',
      version: '3.0',
      status: 'active',
      chatManager: this.chatManager ? 'active' : 'inactive',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get quick actions
   */
  getQuickActions() {
    return [
      { id: 'plan-trip', label: 'Plan a Trip', icon: '✈️' },
      { id: 'ask-question', label: 'Ask Travel Question', icon: '❓' },
      { id: 'get-recommendations', label: 'Get Recommendations', icon: '⭐' }
    ];
  }

  /**
   * Generate welcome message
   */
  generateWelcomeMessage(userProfile = {}) {
    const name = userProfile.name || 'there';
    return `Hey ${name}! 👋 Ready to plan your next adventure? I'm here to help you create amazing travel experiences. Just tell me where you'd like to go!`;
  }

  /**
   * Get conversation state
   */
  getConversationState(userId) {
    if (!this.chatManager) return null;
    return this.chatManager.conversationStates.get(userId) || null;
  }

  /**
   * Clear conversation state
   */
  clearConversationState(userId) {
    if (!this.chatManager) return false;

    const hadState = this.chatManager.conversationStates.has(userId);
    this.chatManager.conversationStates.delete(userId);
    this.chatManager.planningProcesses.delete(userId);

    return hadState;
  }
}

export default QuickResponseAIService;
