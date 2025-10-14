/**
 * Travel Planning Orchestrator
 * Coordinates all AI agents and manages the conversational flow
 * for natural trip planning experiences
 */
import ConversationFlowManager from './ConversationFlowManager.js';
import ChiefTravelPlannerAgent from './ChiefTravelPlannerAgent.js';
import ProfileAnalystAgent from './ProfileAnalystAgent.js';
import DataScoutAgent from './DataScoutAgent.js';
import ItineraryArchitectAgent from './ItineraryArchitectAgent.js';

export default class TravelPlanningOrchestrator {
  constructor(socketService = null) {
    this.conversationManager = new ConversationFlowManager();
    this.socketService = socketService;

    // Initialize all agents
    this.agents = {
      ChiefTravelPlanner: new ChiefTravelPlannerAgent(),
      ProfileAnalyst: new ProfileAnalystAgent(),
      DataScout: new DataScoutAgent(),
      ItineraryArchitect: new ItineraryArchitectAgent()
    };

    // Active processes tracking
    this.activeProcesses = new Map();
  }

  /**
   * Main entry point for processing user messages
   * Implements the natural conversation flow described in the scenario
   */
  async processMessage(message, userContext = {}) {
    const userId = userContext.userId;

    try {
      console.log(`\n🤖 Processing message from user ${userId}: "${message.substring(0, 50)}..."`);

      // Analyze the message and determine intent
      const messageAnalysis = await this.conversationManager.analyzeMessage(message, userContext);
      console.log(`🧠 Message analysis:`, messageAnalysis);

      // Add to conversation history
      this.conversationManager.addToHistory(userId, message, '', { analysis: messageAnalysis });

      // Route to appropriate handler based on conversation stage and intent
      switch (messageAnalysis.nextAction) {
        case 'respond_greeting':
          return await this.handleGreeting(userContext, messageAnalysis);

        case 'gather_details':
          return await this.handleInitialTripRequest(message, userContext, messageAnalysis);

        case 'ask_for_missing_info':
          return await this.handleFollowUpQuestion(message, userContext, messageAnalysis);

        case 'start_planning':
          return await this.startTripPlanning(message, userContext, messageAnalysis);

        case 'provide_planning_update':
          return await this.providePlanningUpdate(userContext);

        case 'provide_recommendations':
          return await this.provideRecommendations(message, userContext);

        case 'provide_weather_info':
          return await this.provideWeatherInfo(message, userContext);

        case 'handle_modifications':
          return await this.handlePlanModifications(message, userContext);

        case 'general_response':
        default:
          return await this.handleGeneralChat(message, userContext, messageAnalysis);
      }

    } catch (error) {
      console.error('🚨 Orchestrator error:', error);

      return {
        success: false,
        message: "I encountered an unexpected error. Let me try a different approach - what can I help you with today? ✈️",
        type: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle greeting messages with personalized welcome
   */
  async handleGreeting(userContext, messageAnalysis) {
    const chiefPlanner = this.agents.ChiefTravelPlanner;
    chiefPlanner.updateStatus('working', 'Generating personalized welcome message');

    const userProfile = userContext.userProfile || {};
    const name = userProfile.name || '';
    const interests = userProfile.interests || [];
    const bucketList = userProfile.bucketList || [];

    let greetingMessage = `Hey there${name ? `, ${name}` : ''}! 👋 What's got you thinking about travel today?`;

    if (bucketList.length > 0) {
      greetingMessage += ` I see ${bucketList.slice(0, 2).join(' and ')} on your bucket list - planning to check one off? 🗺️`;
    } else if (interests.length > 0) {
      greetingMessage += ` With your love for ${interests[0]}, I bet there are some amazing destinations calling to you! 🌍`;
    }

    chiefPlanner.updateStatus('completed', 'Generated personalized greeting');

    return {
      success: true,
      message: greetingMessage,
      type: 'greeting',
      timestamp: new Date().toISOString(),
      conversationStage: 'greeting'
    };
  }

  /**
   * Handle initial trip planning requests
   * Step 1 in the scenario: Initial conversation with the Manager
   */
  async handleInitialTripRequest(message, userContext, messageAnalysis) {
    const userId = userContext.userId;

    // Set conversation state for information gathering
    this.conversationManager.setConversationState(userId, {
      stage: this.conversationManager.STAGES.GATHERING_DETAILS,
      extractedInfo: messageAnalysis.extractedInfo || {},
      originalMessage: message,
      timestamp: new Date()
    });

    // Use ChiefTravelPlanner to handle the initial request
    const response = await this.agents.ChiefTravelPlanner.execute({
      action: 'handle_initial_request',
      message,
      userContext,
      conversationState: this.conversationManager.getConversationState(userId)
    });

    // Update conversation state
    if (response.extractedInfo) {
      this.conversationManager.updateConversationState(userId, {
        extractedInfo: response.extractedInfo
      });
    }

    // Add to conversation history
    this.conversationManager.addToHistory(userId, message, response.message, {
      stage: 'gathering_details',
      extractedInfo: response.extractedInfo
    });

    return {
      success: true,
      message: response.message,
      type: response.type,
      timestamp: new Date().toISOString(),
      conversationStage: 'gathering_details',
      metadata: {
        missingInfo: response.missingInfo,
        extractedInfo: response.extractedInfo
      }
    };
  }

  /**
   * Handle follow-up questions during information gathering
   * Continues Step 1: Gathering necessary details
   */
  async handleFollowUpQuestion(message, userContext, messageAnalysis) {
    const userId = userContext.userId;
    const conversationState = this.conversationManager.getConversationState(userId);

    if (!conversationState) {
      // State lost, restart the process
      return await this.handleInitialTripRequest(message, userContext, messageAnalysis);
    }

    // Update conversation state with new analysis
    this.conversationManager.updateConversationState(userId, {
      extractedInfo: {
        ...conversationState.extractedInfo,
        ...messageAnalysis.extractedInfo
      }
    });

    const response = await this.agents.ChiefTravelPlanner.execute({
      action: 'handle_follow_up',
      message,
      userContext,
      conversationState: this.conversationManager.getConversationState(userId)
    });

    // If ready to plan, trigger the multi-agent system
    if (response.type === 'ready_to_plan') {
      return await this.startTripPlanning(message, userContext, {
        extractedInfo: response.extractedInfo,
        conversationStage: this.conversationManager.STAGES.PLANNING_IN_PROGRESS
      });
    }

    // Update conversation state with the latest extracted info
    this.conversationManager.updateConversationState(userId, {
      extractedInfo: response.extractedInfo
    });

    // Add to conversation history
    this.conversationManager.addToHistory(userId, message, response.message, {
      stage: 'gathering_details',
      extractedInfo: response.extractedInfo
    });

    return {
      success: true,
      message: response.message,
      type: response.type,
      timestamp: new Date().toISOString(),
      conversationStage: 'gathering_details',
      metadata: {
        missingInfo: response.missingInfo,
        extractedInfo: response.extractedInfo
      }
    };
  }

  /**
   * Start the multi-agent trip planning process
   * Steps 2-5 from the scenario: Parallel research, creative briefing, itinerary design, final assembly
   */
  async startTripPlanning(message, userContext, messageAnalysis) {
    const userId = userContext.userId;
    const tripDetails = messageAnalysis.extractedInfo;

    console.log('\n🚀 ===== STARTING MULTI-AGENT TRIP PLANNING =====');
    console.log('📍 Destination:', tripDetails.destination);
    console.log('📅 Duration:', tripDetails.duration);
    console.log('👥 Travelers:', tripDetails.travelers);

    // Update conversation state to planning in progress
    this.conversationManager.setConversationState(userId, {
      stage: this.conversationManager.STAGES.PLANNING_IN_PROGRESS,
      extractedInfo: tripDetails,
      planningStarted: new Date(),
      agentProgress: {
        ProfileAnalyst: 'queued',
        DataScout: 'queued',
        ItineraryArchitect: 'queued',
        ChiefTravelPlanner: 'queued'
      }
    });

    // Send initial status update
    if (this.socketService && userId) {
      this.sendAgentStatusUpdate(userId, 'initializing', 'My specialist team is getting ready to create your amazing trip!', 10);
    }

    try {
      // Step 2: Parallel Research - ProfileAnalyst and DataScout work simultaneously
      console.log('\n📊 ===== STEP 2: PARALLEL RESEARCH =====');

      const [profileResults, dataResults] = await Promise.allSettled([
        this.runProfileAnalysis(tripDetails, userContext, userId),
        this.runDataScout(tripDetails, userId)
      ]);

      const profileAnalysis = this.getPromiseResult(profileResults, {});
      const travelData = this.getPromiseResult(dataResults, {});

      // Step 3: Creative Briefing - ChiefTravelPlanner prepares final task
      console.log('\n📋 ===== STEP 3: CREATIVE BRIEFING =====');
      this.sendAgentStatusUpdate(userId, 'briefing', 'Preparing detailed brief for the creative team...', 60);

      // Step 4: Itinerary Design - ItineraryArchitect takes over
      console.log('\n🎨 ===== STEP 4: ITINERARY DESIGN =====');
      const itineraryResults = await this.runItineraryArchitect(tripDetails, profileAnalysis, travelData, userId);

      // Step 5: Final Assembly & Display - ChiefTravelPlanner presents the plan
      console.log('\n📋 ===== STEP 5: FINAL ASSEMBLY =====');
      this.sendAgentStatusUpdate(userId, 'finalizing', 'Putting the finishing touches on your perfect trip...', 90);

      const finalPlan = await this.agents.ChiefTravelPlanner.execute({
        action: 'coordinate_plan_creation',
        tripDetails,
        agentResults: {
          ProfileAnalyst: profileAnalysis,
          DataScout: travelData,
          ItineraryArchitect: itineraryResults
        }
      });

      // Update conversation state to proposal review
      this.conversationManager.setConversationState(userId, {
        stage: this.conversationManager.STAGES.PROPOSAL_REVIEW,
        extractedInfo: tripDetails,
        finalPlan: finalPlan.compiledPlan,
        agentResults: {
          ProfileAnalyst: profileAnalysis,
          DataScout: travelData,
          ItineraryArchitect: itineraryResults
        },
        planningCompleted: new Date()
      });

      // Send completion status
      this.sendAgentStatusUpdate(userId, 'completed', '🎉 Your personalized travel masterpiece is ready!', 100);

      // Add to conversation history
      this.conversationManager.addToHistory(userId, message, finalPlan.compiledPlan, {
        stage: 'proposal_review',
        tripDetails,
        agentCredits: finalPlan.agentCredits
      });

      console.log('✅ ===== MULTI-AGENT TRIP PLANNING COMPLETED =====');

      return {
        success: true,
        message: finalPlan.compiledPlan,
        type: 'complete_trip_plan',
        timestamp: new Date().toISOString(),
        conversationStage: 'proposal_review',
        metadata: {
          tripDetails,
          agentCredits: finalPlan.agentCredits,
          rawAgentData: finalPlan.rawAgentData || {
            ProfileAnalyst: profileAnalysis,
            DataScout: travelData,
            ItineraryArchitect: itineraryResults
          }
        }
      };

    } catch (error) {
      console.error('🚨 Multi-agent planning error:', error);

      // Send error status
      this.sendAgentStatusUpdate(userId, 'error', 'Switching to backup planning assistant...', 0);

      // Fallback to single-agent planning
      return await this.handleFallbackPlanning(tripDetails, userContext);
    }
  }

  /**
   * Run ProfileAnalyst with status updates
   */
  async runProfileAnalysis(tripDetails, userContext, userId) {
    this.sendAgentStatusUpdate(userId, 'profile_analysis', '🧠 Analyzing your travel personality and preferences...', 25);

    const profileAgent = this.agents.ProfileAnalyst;
    const results = await profileAgent.execute({
      action: 'analyze_profile',
      userProfile: userContext.userProfile || {},
      tripContext: tripDetails
    });

    this.sendAgentStatusUpdate(userId, 'profile_completed', '✅ Travel profile analysis complete!', 35);
    return results;
  }

  /**
   * Run DataScout with status updates
   */
  async runDataScout(tripDetails, userId) {
    this.sendAgentStatusUpdate(userId, 'data_scouting', '🔍 Gathering live travel data and options...', 40);

    const dataAgent = this.agents.DataScout;
    const results = await dataAgent.execute({
      action: 'gather_travel_data',
      destination: tripDetails.destination,
      duration: parseInt(tripDetails.duration) || 7,
      departureCity: 'New York', // Could be extracted from user profile
      travelDates: null // Could be extracted if provided
    });

    this.sendAgentStatusUpdate(userId, 'data_completed', '✅ Travel data research complete!', 55);
    return results;
  }

  /**
   * Run ItineraryArchitect with status updates
   */
  async runItineraryArchitect(tripDetails, profileAnalysis, travelData, userId) {
    this.sendAgentStatusUpdate(userId, 'itinerary_design', '🎨 Designing your perfect day-by-day adventure...', 70);

    const itineraryAgent = this.agents.ItineraryArchitect;
    const results = await itineraryAgent.execute({
      action: 'design_itinerary',
      tripDetails,
      profileAnalysis,
      travelData
    });

    this.sendAgentStatusUpdate(userId, 'itinerary_completed', '✅ Personalized itinerary design complete!', 85);
    return results;
  }

  /**
   * Send status updates to frontend via WebSocket
   */
  sendAgentStatusUpdate(userId, stage, message, progress) {
    if (!this.socketService || !userId) return;

    const statusUpdate = {
      stage,
      message,
      progress,
      timestamp: new Date().toISOString(),
      agents_status: this.getAgentStatusArray(stage)
    };

    this.socketService.sendStatusUpdate(userId, statusUpdate);
    console.log(`📡 Status update sent: ${stage} - ${progress}%`);
  }

  /**
   * Get agent status array for frontend display
   */
  getAgentStatusArray(currentStage) {
    const stages = {
      initializing: { active: 'ChiefTravelPlanner', message: '📋 Getting ready to coordinate your trip...' },
      profile_analysis: { active: 'ProfileAnalyst', message: '🧠 Deep-diving into your travel personality...' },
      data_scouting: { active: 'DataScout', message: '🔍 Scouring for the best travel options...' },
      itinerary_design: { active: 'ItineraryArchitect', message: '🎨 Crafting your perfect itinerary...' },
      finalizing: { active: 'ChiefTravelPlanner', message: '📋 Finalizing your travel masterpiece...' }
    };

    const currentStageInfo = stages[currentStage] || stages.initializing;

    return Object.keys(this.agents).map(agentName => ({
      name: agentName,
      status: agentName === currentStageInfo.active ? 'working' : 'waiting',
      task: agentName === currentStageInfo.active ? currentStageInfo.message : '⏳ Standing by...'
    }));
  }

  /**
   * Handle plan modifications
   */
  async handlePlanModifications(message, userContext) {
    const userId = userContext.userId;
    const conversationState = this.conversationManager.getConversationState(userId);

    if (!conversationState?.finalPlan) {
      return {
        success: true,
        message: "I don't have a current plan to modify. Would you like me to create a new trip plan for you?",
        type: 'chat',
        timestamp: new Date().toISOString()
      };
    }

    const response = await this.agents.ChiefTravelPlanner.execute({
      action: 'handle_plan_modification',
      message,
      currentPlan: conversationState.finalPlan,
      userContext
    });

    return {
      success: true,
      message: response.message,
      type: 'modification_response',
      timestamp: new Date().toISOString(),
      conversationStage: 'proposal_review'
    };
  }

  /**
   * Provide planning updates for active processes
   */
  async providePlanningUpdate(userContext) {
    const userId = userContext.userId;
    const conversationState = this.conversationManager.getConversationState(userId);

    if (!conversationState || conversationState.stage !== this.conversationManager.STAGES.PLANNING_IN_PROGRESS) {
      return {
        success: true,
        message: "I'm not currently working on a trip plan for you. Would you like to start planning a new adventure? 🌟",
        type: 'chat',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      message: "My specialist team is hard at work on your trip! 🚀 I'll have your personalized itinerary ready in just a moment. The ProfileAnalyst is diving deep into your travel style, while the DataScout is gathering the latest travel options. Almost there!",
      type: 'planning_update',
      timestamp: new Date().toISOString(),
      conversationStage: 'planning_in_progress'
    };
  }

  /**
   * Handle general travel recommendations
   */
  async provideRecommendations(message, userContext) {
    const response = await this.agents.ChiefTravelPlanner.execute({
      action: 'handle_initial_request', // Reuse the recommendation logic
      message,
      userContext,
      conversationState: { extractedInfo: {} }
    });

    return {
      success: true,
      message: response.message,
      type: 'recommendations',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle weather information requests
   */
  async provideWeatherInfo(message, userContext) {
    // Extract location from message
    const locationMatch = message.match(/weather\s+(?:in|for)\s+([a-zA-Z\s]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : null;

    if (!location) {
      return {
        success: true,
        message: "I'd love to check the weather for you! Which destination are you curious about? 🌤️",
        type: 'chat',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const weatherData = await this.agents.DataScout.execute({
        action: 'get_weather',
        destination: location
      });

      let weatherMessage = `🌤️ **Current Weather in ${location}**\n\n`;
      if (weatherData && weatherData.current) {
        const { temperature, description, humidity } = weatherData.current;
        weatherMessage += `🌡️ **Temperature:** ${temperature}°C\n`;
        weatherMessage += `☁️ **Conditions:** ${description.charAt(0).toUpperCase() + description.slice(1)}\n`;
        weatherMessage += `💧 **Humidity:** ${humidity}%\n\n`;
        weatherMessage += `Perfect weather information for your travel planning! Are you thinking of visiting ${location}? I'd love to help you plan an amazing trip there! ✈️`;
      } else {
        weatherMessage += `I couldn't get the current weather data for ${location}, but I'd recommend checking a local weather service for the most up-to-date conditions.\n\nAre you planning a trip to ${location}? I'd be happy to help you plan the perfect itinerary! 🌍`;
      }

      return {
        success: true,
        message: weatherMessage,
        type: 'weather_info',
        timestamp: new Date().toISOString(),
        metadata: { location, weatherData }
      };

    } catch (error) {
      return {
        success: true,
        message: `I had trouble getting weather data for ${location}, but I'd recommend checking your favorite weather app for current conditions. Planning a trip there? I'd love to help you create an amazing itinerary! 🌟`,
        type: 'weather_info',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle general chat when not trip planning
   */
  async handleGeneralChat(message, userContext, messageAnalysis) {
    const response = await this.agents.ChiefTravelPlanner.execute({
      action: 'handle_initial_request',
      message,
      userContext,
      conversationState: { extractedInfo: {} }
    });

    return {
      success: true,
      message: response.message,
      type: 'chat',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fallback planning when multi-agent system fails
   */
  async handleFallbackPlanning(tripDetails, userContext) {
    console.log('🔄 Using fallback single-agent planning');

    try {
      // Use ItineraryArchitect as fallback
      const fallbackResults = await this.agents.ItineraryArchitect.execute({
        action: 'design_itinerary',
        tripDetails,
        profileAnalysis: { travelPersonality: 'Explorer', primaryInterests: ['culture', 'food'] },
        travelData: { destination: tripDetails.destination }
      });

      return {
        success: true,
        message: `I've created a wonderful ${tripDetails.duration} trip plan for ${tripDetails.destination}! While I had some technical challenges with my full specialist team, I was able to design a great itinerary for you. Here's your adventure:\n\n${JSON.stringify(fallbackResults.overview || 'Your personalized trip awaits!')}`,
        type: 'fallback_trip_plan',
        timestamp: new Date().toISOString(),
        metadata: { tripDetails, fallbackUsed: true, rawData: fallbackResults }
      };

    } catch (error) {
      console.error('Fallback planning also failed:', error);

      return {
        success: true,
        message: `I'm experiencing some technical difficulties creating your ${tripDetails.destination} trip plan right now. Let me try a different approach - could you tell me more about what kind of experiences you're looking for in ${tripDetails.destination}? I'd love to give you some personalized recommendations! ✈️`,
        type: 'fallback_error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Helper methods
   */
  getPromiseResult(promiseResult, fallback) {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value;
    } else {
      console.log('Promise rejected:', promiseResult.reason?.message || promiseResult.reason);
      return fallback;
    }
  }

  /**
   * Get conversation state for external access
   */
  getConversationState(userId) {
    return this.conversationManager.getConversationState(userId);
  }

  /**
   * Clear conversation state for external access
   */
  clearConversationState(userId) {
    return this.conversationManager.clearConversationState(userId);
  }

  /**
   * Get agent status for monitoring
   */
  getAgentStatuses() {
    const statuses = {};
    Object.entries(this.agents).forEach(([name, agent]) => {
      statuses[name] = agent.getStatusUpdate();
    });
    return statuses;
  }
}