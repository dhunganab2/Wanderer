/**
 * Improved AI Travel Service
 * Uses the new multi-agent architecture with natural conversation flow
 */
import TravelPlanningOrchestrator from './managers/TravelPlanningOrchestrator.js';

export default class ImprovedAITravelService {
  constructor() {
    this.orchestrator = null; // Lazy initialization
    this.systemReady = false;
    this.initializationPromise = null;
  }

  /**
   * Initialize the orchestrator with socket service
   */
  async initialize(socketService = null) {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization(socketService);
    return this.initializationPromise;
  }

  async _performInitialization(socketService) {
    try {
      console.log('🤖 Initializing Improved AI Travel Service...');

      // Initialize the orchestrator with socket service for real-time updates
      this.orchestrator = new TravelPlanningOrchestrator(socketService);

      this.systemReady = true;
      console.log('✅ Improved AI Travel Service initialized successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Improved AI Travel Service:', error);
      this.systemReady = false;
      throw error;
    }
  }

  /**
   * Main method for generating responses using the new conversational flow
   */
  async generateResponse(message, userContext = {}, socketService = null) {
    try {
      // Ensure the system is initialized
      if (!this.systemReady) {
        await this.initialize(socketService);
      }

      // Update orchestrator with current socket service if provided
      if (socketService && this.orchestrator) {
        this.orchestrator.socketService = socketService;
      }

      console.log(`🤖 Processing message with Improved AI Service: "${message.substring(0, 50)}..."`);

      // Use the orchestrator to process the message naturally
      const response = await this.orchestrator.processMessage(message, userContext);

      // Format the response for the existing API structure
      return this.formatResponse(response, userContext);

    } catch (error) {
      console.error('❌ Error in Improved AI Travel Service:', error);
      return this.getErrorResponse(error, message, userContext);
    }
  }

  /**
   * Format the orchestrator response for backward compatibility
   */
  formatResponse(response, userContext) {
    if (!response.success) {
      return response;
    }

    // Map conversation stages to response types
    const stageToType = {
      'greeting': 'chat',
      'gathering_details': 'trip_planning_questions',
      'planning_in_progress': 'planning_status',
      'proposal_review': 'interactive_trip_plan',
      'booking_assistance': 'booking_help',
      'completed': 'trip_plan'
    };

    const responseType = response.type || stageToType[response.conversationStage] || 'chat';

    return {
      success: true,
      message: response.message,
      timestamp: response.timestamp,
      type: responseType,
      metadata: {
        ...response.metadata,
        conversationStage: response.conversationStage,
        agentSystem: 'improved_multi_agent',
        systemVersion: '2.0'
      }
    };
  }

  /**
   * Get error response with fallback
   */
  getErrorResponse(error, message, userContext) {
    console.log('🔄 Generating error fallback response');

    // Determine appropriate fallback message based on the error and message content
    let fallbackMessage = "I'm experiencing some technical difficulties, but I'm still here to help! ";

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('trip') || lowerMessage.includes('plan') || lowerMessage.includes('travel')) {
      fallbackMessage += "Let me try a simpler approach to help you plan your trip. Where would you like to go and for how many days? 🌟";
    } else if (lowerMessage.includes('weather')) {
      fallbackMessage += "I'd recommend checking your weather app for current conditions. Planning a trip somewhere? I'd love to help! ✈️";
    } else if (this.isGreeting(lowerMessage)) {
      const name = userContext.userProfile?.name || '';
      fallbackMessage = `Hey there${name ? `, ${name}` : ''}! 👋 I'm having some technical hiccups, but I'm excited to help you plan your next adventure. What destination has been on your mind lately? 🌍`;
    } else {
      fallbackMessage += "Feel free to ask me about travel destinations, trip planning, or anything travel-related! 🗺️";
    }

    return {
      success: true,
      message: fallbackMessage,
      timestamp: new Date().toISOString(),
      type: 'chat',
      metadata: {
        error: error.message,
        fallbackUsed: true,
        systemVersion: '2.0'
      }
    };
  }

  /**
   * Check if message is a greeting
   */
  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.startsWith(greeting) && message.length < 50);
  }

  /**
   * Get quick action prompts (backward compatibility)
   */
  getQuickActions() {
    return [
      {
        id: 'destination_ideas',
        text: 'Get destination ideas',
        prompt: "I'm looking for destination recommendations based on my travel style!"
      },
      {
        id: 'plan_trip',
        text: 'Plan a trip',
        prompt: "I want to plan a trip - can you help me get started?"
      },
      {
        id: 'budget_tips',
        text: 'Budget travel tips',
        prompt: "What are some effective ways to travel on a budget?"
      },
      {
        id: 'packing_advice',
        text: 'Packing advice',
        prompt: "Can you give me some smart packing tips?"
      },
      {
        id: 'cultural_insights',
        text: 'Cultural insights',
        prompt: "I want to learn about local customs for respectful travel"
      },
      {
        id: 'hidden_gems',
        text: 'Hidden gems',
        prompt: "Can you recommend some off-the-beaten-path places to explore?"
      }
    ];
  }

  /**
   * Generate welcome message (backward compatibility)
   */
  generateWelcomeMessage(userProfile = {}) {
    const name = userProfile.name || 'there';
    const interests = userProfile.interests || [];
    const bucketList = userProfile.bucketList || [];

    let welcomeMessage = `Hey ${name}! 👋 I'm your AI travel companion, here to help turn your travel dreams into reality.`;

    if (bucketList.length > 0) {
      welcomeMessage += ` I see you've got ${bucketList[0]} on your bucket list - that sounds incredible! What's calling to you for your next adventure? 🗺️`;
    } else if (interests.length > 0) {
      welcomeMessage += ` With your interest in ${interests[0]}, I bet there are some amazing destinations out there perfect for you! ✈️`;
    } else {
      welcomeMessage += ` What destination has been on your mind lately? I'm excited to help you plan something amazing! 🌟`;
    }

    return welcomeMessage;
  }

  /**
   * Health check method
   */
  async healthCheck() {
    try {
      if (!this.systemReady) {
        await this.initialize();
      }

      // Test with a simple message
      const testResponse = await this.generateResponse(
        "Hello, this is a health check",
        { userProfile: { name: 'TestUser' } }
      );

      return {
        status: 'healthy',
        systemReady: this.systemReady,
        orchestratorActive: !!this.orchestrator,
        testResponse: testResponse.success,
        agentStatuses: this.orchestrator ? this.orchestrator.getAgentStatuses() : {},
        version: '2.0'
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        systemReady: this.systemReady,
        version: '2.0'
      };
    }
  }

  /**
   * Get conversation state for a user
   */
  getConversationState(userId) {
    if (!this.orchestrator) {
      return null;
    }
    return this.orchestrator.getConversationState(userId);
  }

  /**
   * Clear conversation state for a user
   */
  clearConversationState(userId) {
    if (!this.orchestrator) {
      return false;
    }
    this.orchestrator.clearConversationState(userId);
    return true;
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    if (!this.orchestrator) {
      return {
        systemReady: false,
        agents: {},
        version: '2.0'
      };
    }

    return {
      systemReady: this.systemReady,
      agents: this.orchestrator.getAgentStatuses(),
      version: '2.0',
      features: [
        'Natural conversation flow',
        'Multi-agent coordination',
        'Real-time status updates',
        'Personalized recommendations',
        'Live API integration'
      ]
    };
  }

  /**
   * Force system reinitialization
   */
  async reinitialize(socketService = null) {
    console.log('🔄 Reinitializing Improved AI Travel Service...');

    this.systemReady = false;
    this.orchestrator = null;
    this.initializationPromise = null;

    return await this.initialize(socketService);
  }
}