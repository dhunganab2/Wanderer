/**
 * Quick Response AI Service
 * Uses the ChatManager as the single point of contact for instant responses
 */
import ChatManagerAgent from './ChatManagerAgent.js';

export default class QuickResponseAIService {
  constructor() {
    this.chatManager = null;
    this.systemReady = false;
  }

  /**
   * Initialize with instant setup
   */
  async initialize(socketService = null) {
    console.log('⚡ Initializing Quick Response AI Service...');

    // Create the chat manager (instant setup)
    this.chatManager = new ChatManagerAgent();
    this.systemReady = true;

    console.log('✅ Quick Response AI Service ready instantly!');
    return true;
  }

  /**
   * Main method - all requests go through ChatManager
   */
  async generateResponse(message, userContext = {}, socketService = null) {
    try {
      // Ensure system is ready
      if (!this.systemReady) {
        await this.initialize(socketService);
      }

      // Let ChatManager handle everything
      const response = await this.chatManager.handleUserMessage(
        message,
        userContext,
        socketService
      );

      return this.formatResponse(response);

    } catch (error) {
      console.error('Quick Response AI Service error:', error);
      return this.getQuickErrorResponse(error, message, userContext);
    }
  }

  /**
   * Format response for API compatibility
   */
  formatResponse(response) {
    if (!response.success) {
      return response;
    }

    return {
      success: true,
      message: response.message,
      timestamp: response.timestamp,
      type: response.type || 'chat',
      metadata: {
        ...response.metadata,
        quickResponse: response.quick || false,
        systemVersion: '2.1',
        responseTime: 'instant'
      }
    };
  }

  /**
   * Quick error response
   */
  getQuickErrorResponse(error, message, userContext) {
    const name = userContext.userProfile?.name || '';

    return {
      success: true,
      message: `Hey${name ? ` ${name}` : ''}! I'm having a quick technical moment, but I'm still here to help! What's on your travel wishlist? ✈️`,
      timestamp: new Date().toISOString(),
      type: 'chat',
      metadata: {
        error: error.message,
        fallbackUsed: true,
        systemVersion: '2.1',
        responseTime: 'instant'
      }
    };
  }

  /**
   * Quick actions for UI
   */
  getQuickActions() {
    return [
      {
        id: 'plan_trip',
        text: 'Plan a trip',
        prompt: "I want to plan a trip!"
      },
      {
        id: 'destination_ideas',
        text: 'Get destination ideas',
        prompt: "Can you recommend some destinations for me?"
      },
      {
        id: 'budget_tips',
        text: 'Budget tips',
        prompt: "What are some budget travel tips?"
      },
      {
        id: 'weather_check',
        text: 'Check weather',
        prompt: "Can you check the weather for my destination?"
      }
    ];
  }

  /**
   * Generate welcome message - AI-powered
   */
  async generateWelcomeMessage(userProfile = {}) {
    try {
      const name = userProfile.name || '';
      const interests = userProfile.interests || [];
      const bucketList = userProfile.bucketList || [];
      const travelStyle = userProfile.travelStyle || [];

      // Build context for AI
      let contextInfo = '';
      if (name) contextInfo += `User's name: ${name}\n`;
      if (interests.length > 0) contextInfo += `Interests: ${interests.join(', ')}\n`;
      if (bucketList.length > 0) contextInfo += `Bucket list destinations: ${bucketList.join(', ')}\n`;
      if (travelStyle.length > 0) contextInfo += `Travel style: ${travelStyle.join(', ')}\n`;

      const welcomePrompt = `You are WanderBuddy, a warm and enthusiastic AI travel companion. Generate a personalized welcome message for this user.

USER CONTEXT:
${contextInfo}

INSTRUCTIONS:
- Be warm, friendly, and genuinely excited about travel
- Use their name if provided
- Reference their interests, bucket list, or travel style naturally
- Keep it conversational and engaging
- Use travel emojis naturally (👋 ✈️ 🌍 🗺️)
- Ask what destination they're thinking about or what adventure they want to plan
- Keep it under 80 words

Generate a personalized welcome that makes them excited to start planning their next adventure.`;

      const aiWelcome = await this.chatManager.callGemini(welcomePrompt);
      return aiWelcome;
    } catch (error) {
      console.error('Error generating AI welcome message:', error);
      
      // Fallback to simple welcome if AI fails
      const name = userProfile.name || '';
      const interests = userProfile.interests || [];
      
      let fallbackWelcome = `Hey${name ? ` ${name}` : ''}! 👋 Ready to plan your next adventure?`;
      
      if (interests.length > 0) {
        fallbackWelcome += ` I see you're into ${interests[0]} - there are some incredible destinations perfect for that! 🌟`;
      } else {
        fallbackWelcome += ` What destination has been calling your name lately? 🗺️`;
      }
      
      return fallbackWelcome;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const testResponse = await this.generateResponse(
        "hi",
        { userProfile: { name: 'TestUser' } }
      );

      return {
        status: 'healthy',
        systemReady: this.systemReady,
        chatManagerActive: !!this.chatManager,
        testResponseSuccess: testResponse.success,
        version: '2.1',
        features: ['Instant responses', 'Single agent interface', 'Background planning', 'Real-time updates']
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        version: '2.1'
      };
    }
  }

  /**
   * Get system stats
   */
  getSystemStats() {
    return {
      systemReady: this.systemReady,
      version: '2.1',
      architecture: 'single_manager_agent',
      features: [
        'Instant greeting responses',
        'Natural conversation flow',
        'Background specialist coordination',
        'Real-time planning updates',
        'Single point of user contact'
      ],
      chatManagerStatus: this.chatManager ? this.chatManager.getStatusUpdate() : null,
      activeConversations: this.chatManager ? this.chatManager.conversationStates.size : 0,
      activePlanningProcesses: this.chatManager ? this.chatManager.planningProcesses.size : 0
    };
  }

  /**
   * Get conversation state
   */
  getConversationState(userId) {
    if (!this.chatManager) return null;
    return this.chatManager.conversationStates.get(userId);
  }

  /**
   * Clear conversation state
   */
  clearConversationState(userId) {
    if (!this.chatManager) return false;

    this.chatManager.conversationStates.delete(userId);
    this.chatManager.planningProcesses.delete(userId);

    return true;
  }

  /**
   * Force reinitialize
   */
  async reinitialize(socketService = null) {
    this.systemReady = false;
    this.chatManager = null;
    return await this.initialize(socketService);
  }
}