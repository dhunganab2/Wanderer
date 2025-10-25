/**
 * Chat Manager Agent
 * The single point of contact for users - handles ALL user interaction
 * and coordinates other agents behind the scenes
 */
import BaseAgent from './BaseAgent.js';
import DataScoutAgent from './DataScoutAgent.js';
import ProfileAnalystAgent from './ProfileAnalystAgent.js';
import ItineraryArchitectAgent from './ItineraryArchitectAgent.js';
import ChiefTravelPlannerAgent from './ChiefTravelPlannerAgent.js';

export default class ChatManagerAgent extends BaseAgent {
  constructor(agentRegistry = {}) {
    const systemPrompt = `You are WanderBuddy, the main AI travel assistant for the Wanderer app. You are the ONLY agent that talks directly to users.

PERSONALITY:
- Warm, enthusiastic, and genuinely excited about travel
- Conversational and relaxed, like texting a knowledgeable friend
- Quick to respond and always engaging
- Use casual language and avoid corporate-speak
- Show real enthusiasm when someone mentions destinations
- Use travel emojis naturally: ✈️ 🗺️ 🌍 🎒

CORE RESPONSIBILITIES:
1. Handle ALL user interactions - you're the only face users see
2. Coordinate specialist agents behind the scenes
3. Provide personalized, enthusiastic responses
4. Guide users through trip planning conversations
5. Deliver comprehensive travel plans

SPECIALIST AGENTS (you coordinate these behind the scenes):
- ProfileAnalyst: Analyzes user preferences and travel style
- DataScout: Gathers real-time travel data (flights, hotels, attractions)
- ItineraryArchitect: Creates detailed day-by-day itineraries
- ChiefTravelPlanner: Compiles everything into final comprehensive plans

RESPONSE STYLE:
- Always be warm and enthusiastic
- Use the user's name when you know it
- Ask follow-up questions to understand their needs
- Provide specific, actionable advice
- Use emojis naturally and appropriately
- Keep responses conversational but informative

Remember: You are the ONLY agent users interact with. Other agents work behind the scenes.`;

    super('ChatManager', 'Main User Interface & Agent Coordinator', systemPrompt);

    // Initialize all specialist agents
    this.profileAnalyst = new ProfileAnalystAgent();
    this.dataScout = new DataScoutAgent();
    this.itineraryArchitect = new ItineraryArchitectAgent();
    this.chiefPlanner = new ChiefTravelPlannerAgent();

    console.log('✅ ChatManager: All specialist agents initialized');

    this.agentRegistry = agentRegistry;
    this.conversationStates = new Map();
    this.planningProcesses = new Map();
  }

  /**
   * Main method - handles ALL user messages
   */
  async handleUserMessage(message, userContext, socketService = null) {
    this.updateStatus('working', 'Processing user message');

    try {
      const userId = userContext.userId;
      const messageIntent = this.classifyMessageQuickly(message, userContext);

      console.log(`💬 ChatManager handling: "${message}" -> ${messageIntent.type}`);

      switch (messageIntent.type) {
        case 'greeting':
          return await this.handleGreeting(userContext);

        case 'trip_planning_start':
          return await this.handleTripPlanningStart(message, userContext, messageIntent, socketService);

        case 'trip_planning_follow_up':
          return await this.handleTripPlanningFollowUp(message, userContext, socketService);

        case 'trip_modification':
          return await this.handleTripModification(message, userContext, socketService);

        case 'general_question':
          return await this.handleGeneralQuestion(message, userContext);

        case 'planning_status_check':
          return await this.handlePlanningStatusCheck(userId);

        default:
          return await this.handleGeneralChat(message, userContext);
      }
    } catch (error) {
      console.error('ChatManager error:', error);
      return this.getErrorResponse(error, message);
    }
  }

  /**
   * Quick message classification - no API calls for simple cases
   */
  classifyMessageQuickly(message, userContext = {}) {
    const lowerMessage = message.toLowerCase().trim();
    const userId = userContext.userId;

    console.log(`🔍 DEBUG: Classifying message "${message}" for user ${userId}`);
    console.log(`🔍 DEBUG: Planning processes for user: ${this.planningProcesses.has(userId)}`);

    // Clean up old processes FIRST
    this.cleanupOldPlanningProcesses(userId);

    // Simple greetings - CHECK FIRST before anything else
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup', 'what\'s up'];
    if (greetings.some(greeting => lowerMessage.startsWith(greeting) && lowerMessage.length < 25)) {
      // Even if there's an active planning process, a simple greeting is just a greeting
      console.log(`🎯 DEBUG: Detected as GREETING for "${message}"`);
      return { type: 'greeting' };
    }

    // Status check phrases - only if NOT a simple greeting
    const statusPhrases = ['status', 'how is it going', 'any updates', 'progress', 'what\'s happening'];
    if (this.planningProcesses.has(userId) && statusPhrases.some(phrase => lowerMessage.includes(phrase))) {
      console.log(`🎯 DEBUG: Detected as PLANNING_STATUS_CHECK for "${message}"`);
      return { type: 'planning_status_check' };
    }

    // Trip planning keywords
    const tripKeywords = ['plan', 'trip', 'travel', 'visit', 'go to', 'vacation', 'holiday'];
    if (tripKeywords.some(keyword => lowerMessage.includes(keyword))) {
      // Check if they're continuing a conversation
      const conversationState = this.conversationStates.get(userId);
      if (conversationState && conversationState.stage === 'gathering_info') {
        return { type: 'trip_planning_follow_up' };
      }
      return { type: 'trip_planning_start' };
    }

    // Follow-up responses (when they're answering questions)
    if (this.conversationStates.has(userId)) {
      const state = this.conversationStates.get(userId);
      if (state.stage === 'gathering_info') {
        return { type: 'trip_planning_follow_up' };
      }
      if (state.stage === 'plan_ready' && this.containsModificationKeywords(lowerMessage)) {
        return { type: 'trip_modification' };
      }
    }

    return { type: 'general_chat' };
  }

  /**
   * Handle greetings - AI-generated personalized response
   */
  async handleGreeting(userContext) {
    // Clean up old planning processes (older than 10 minutes)
    this.cleanupOldPlanningProcesses(userContext.userId);
    try {
      const userProfile = userContext.userProfile || {};
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

      // Check if we have API key available before attempting AI greeting
      if (!this.apiKey) {
        throw new Error('No API key available - using fallback');
      }

      const greetingPrompt = `You are WanderBuddy, a warm and enthusiastic AI travel companion. Generate a personalized greeting for this user.

USER CONTEXT:
${contextInfo}

INSTRUCTIONS:
- Be warm, friendly, and genuinely excited about travel
- Use their name if provided
- Reference their interests or bucket list naturally
- Keep it conversational and engaging
- Use travel emojis naturally (👋 ✈️ 🌍)
- Ask what's got them thinking about travel today
- Keep it under 100 words

Generate a personalized greeting that makes them feel excited about planning their next adventure.`;

      const aiGreeting = await this.callGemini(greetingPrompt);
      
      this.updateStatus('completed', 'Generated AI greeting');

      return {
        success: true,
        message: aiGreeting,
        type: 'chat',
        timestamp: new Date().toISOString(),
        quick: true
      };
    } catch (error) {
      console.error('Error generating AI greeting:', error);

      // Check if it's API key exhaustion or temporary overload
      if (error.message?.includes('All API keys are exhausted') || error.message?.includes('exhausted')) {
        console.log('🔑 All API keys exhausted, using fallback greeting...');
        // Skip retry attempts, go straight to fallback
      } else if (error.status === 503 || error.message?.includes('overloaded')) {
        console.log('🔄 API temporarily overloaded, retrying with simpler prompt...');
        
        try {
          // Try with a simpler, shorter prompt
          const simplePrompt = `Generate a warm, personalized greeting for a traveler named ${userContext.userProfile?.name || 'there'}. Include their interests: ${userContext.userProfile?.interests?.join(', ') || 'travel'}. Keep it under 50 words and use travel emojis.`;
          
          const retryGreeting = await this.callGemini(simplePrompt);
          
          this.updateStatus('completed', 'Generated AI greeting (retry)');
          return {
            success: true,
            message: retryGreeting,
            type: 'chat',
            timestamp: new Date().toISOString(),
            quick: true
          };
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }
      
      // Final fallback - generate a personalized greeting without AI
      const userProfile = userContext.userProfile || {};
      const name = userProfile.name || '';
      const interests = userProfile.interests || [];
      const bucketList = userProfile.bucketList || [];
      
      let fallbackGreeting = `Hey there${name ? `, ${name}` : ''}! 👋 What's got you thinking about travel today?`;
      
      if (bucketList.length > 0) {
        fallbackGreeting += ` I see ${bucketList.slice(0, 2).join(' and ')} on your bucket list - ready to make one happen? 🌍`;
      } else if (interests.length > 0) {
        fallbackGreeting += ` With your passion for ${interests[0]}, I bet there are some incredible adventures calling your name! ✈️`;
      }

      this.updateStatus('completed', 'Generated fallback greeting');

      return {
        success: true,
        message: fallbackGreeting,
        type: 'chat',
        timestamp: new Date().toISOString(),
        quick: true
      };
    }
  }

  /**
   * Handle trip planning start
   */
  async handleTripPlanningStart(message, userContext, messageIntent, socketService = null) {
    const userId = userContext.userId;

    // Extract basic info from the message using AI
    const extractedInfo = await this.extractTripInfo(message);

    // Check if we have enough info to start planning immediately
    const isComplete = this.isTripInfoComplete(extractedInfo);

    if (isComplete) {
      // We have enough info - start the planning process!
      console.log('🚀 Starting background planning process from initial message...');

      // Set up conversation state for planning
      this.conversationStates.set(userId, {
        stage: 'planning_in_progress',
        extractedInfo,
        startTime: new Date()
      });

      // Start background planning (non-blocking)
      this.startBackgroundPlanning(userId, extractedInfo, userContext, socketService);

      // Give immediate encouraging response
      const planningMessage = await this.generatePlanningStartMessage(extractedInfo, userContext);

      this.updateStatus('completed', 'Started trip planning process');

      return {
        success: true,
        message: planningMessage,
        type: 'planning_started',
        timestamp: new Date().toISOString(),
        quick: true,
        metadata: {
          conversationStage: 'planning_in_progress',
          tripDetails: extractedInfo
        }
      };
    } else {
      // Set up conversation state for gathering more info
      this.conversationStates.set(userId, {
        stage: 'gathering_info',
        extractedInfo,
        startTime: new Date()
      });

      // Generate appropriate follow-up question
      const response = await this.generateFollowUpQuestion(extractedInfo, userContext);

      this.updateStatus('completed', 'Started trip planning conversation');

      return {
        success: true,
        message: response,
        type: 'trip_planning_conversation',
        timestamp: new Date().toISOString(),
        quick: true,
        metadata: {
          conversationStage: 'gathering_info',
          extractedInfo
        }
      };
    }
  }

  /**
   * Handle follow-up during trip planning
   */
  async handleTripPlanningFollowUp(message, userContext, socketService) {
    const userId = userContext.userId;
    const conversationState = this.conversationStates.get(userId);

    if (!conversationState) {
      // State lost, restart
      return await this.handleTripPlanningStart(message, userContext, { type: 'trip_planning_start' }, socketService);
    }

    // Extract new info and merge with existing using AI
    const newInfo = await this.extractTripInfo(message);
    const mergedInfo = this.mergeTripInfo(conversationState.extractedInfo, newInfo);

    // Check if we have enough info to start planning
    const isComplete = this.isTripInfoComplete(mergedInfo);

    if (isComplete) {
      // We have enough info - start the planning process!
      console.log('🚀 Starting background planning process...');

      // Update conversation state
      conversationState.stage = 'planning_in_progress';
      conversationState.extractedInfo = mergedInfo;

      // Start background planning (non-blocking)
      this.startBackgroundPlanning(userId, mergedInfo, userContext, socketService);

      // Give immediate encouraging response
      const planningMessage = await this.generatePlanningStartMessage(mergedInfo, userContext);

      return {
        success: true,
        message: planningMessage,
        type: 'planning_started',
        timestamp: new Date().toISOString(),
        quick: true,
        metadata: {
          conversationStage: 'planning_in_progress',
          tripDetails: mergedInfo
        }
      };

    } else {
      // Still need more info
      conversationState.extractedInfo = mergedInfo;
      const followUpQuestion = await this.generateFollowUpQuestion(mergedInfo, userContext);

      return {
        success: true,
        message: followUpQuestion,
        type: 'trip_planning_conversation',
        timestamp: new Date().toISOString(),
        quick: true,
        metadata: {
          conversationStage: 'gathering_info',
          extractedInfo: mergedInfo
        }
      };
    }
  }

  /**
   * Start background planning process - non-blocking with detailed thinking updates
   */
  async startBackgroundPlanning(userId, tripDetails, userContext, socketService) {
    // Mark that planning is in progress
    this.planningProcesses.set(userId, {
      status: 'in_progress',
      startTime: new Date(),
      tripDetails,
      socketService, // Store socketService for later use
      progress: 10
    });

    try {
      // Show thinking status first
      this.sendPlanningUpdate(userId, socketService, 5, "🧠 Thinking...", true, "Analyzing your trip request and preparing specialist agents");

      // Send initial status with agent instructions
      this.sendPlanningUpdate(userId, socketService, 10, "🤖 My specialist team is getting ready...", false, "Initializing ProfileAnalyst, DataScout, and ItineraryArchitect agents");

      // Coordinate agents in parallel with detailed updates
      const planningResult = await this.coordinateAgents(tripDetails, userContext, (progress, message, thinking, instructions) => {
        this.sendPlanningUpdate(userId, socketService, progress, message, thinking, instructions);
      });

      // Planning complete
      this.planningProcesses.set(userId, {
        status: 'completed',
        result: planningResult,
        completedAt: new Date()
      });

      // Update conversation state
      const conversationState = this.conversationStates.get(userId);
      if (conversationState) {
        conversationState.stage = 'plan_ready';
        conversationState.finalPlan = planningResult;
      }

      // Send completion update
      this.sendPlanningUpdate(userId, socketService, 100, "🎉 Your perfect trip plan is ready!");

      // Send the actual plan with feedback request
      const finalMessage = await this.formatComprehensiveFinalPlan(planningResult, tripDetails, userContext);
      this.sendFinalPlanWithFeedbackRequest(userId, socketService, finalMessage, tripDetails);

    } catch (error) {
      console.error('Background planning error:', error);

      this.planningProcesses.set(userId, {
        status: 'error',
        error: error.message
      });

      this.sendPlanningUpdate(userId, socketService, 0, "Something went wrong, but let me try a different approach...");
    }
  }

  /**
   * Coordinate specialist agents with detailed thinking updates - REFACTORED to use actual agents
   */
  async coordinateAgents(tripDetails, userContext, progressCallback) {
    console.log('🎯 ChatManager: Starting multi-agent coordination...');

    // STEP 1: ProfileAnalyst Agent - Analyze user profile and preferences
    progressCallback(15, "🧠 Thinking about your travel preferences...", true, "ProfileAnalyst agent initializing - analyzing user profile for travel personality");
    progressCallback(25, "🧠 Analyzing your travel style...", false, "ProfileAnalyst: Examining interests, previous trips, and preferences");

    const profile = await this.profileAnalyst.analyzeProfile(userContext.userProfile, {
      destination: tripDetails.destination,
      duration: tripDetails.duration,
      tripType: tripDetails.tripType || 'leisure'
    });

    console.log('✅ ProfileAnalyst completed:', profile.travelPersonality);
    progressCallback(35, "✅ Got your travel personality mapped!", false, "ProfileAnalyst: Completed personality analysis - identified as " + profile.travelPersonality);

    // STEP 2: DataScout Agent - Gather real-time travel data
    progressCallback(40, "🧠 Thinking about the best options for your trip...", true, "DataScout agent starting - researching live data for " + tripDetails.destination);
    progressCallback(50, "🔍 Scouting the best flights, hotels, and local info...", false, "DataScout: Fetching weather, accommodation, and transportation data");

    const data = await this.dataScout.gatherTravelData(
      tripDetails.destination,
      {
        duration: tripDetails.duration,
        departureCity: tripDetails.departureCity || 'New York',
        budget: tripDetails.budgetPreference || 'Mid-range',
        interests: profile.primaryInterests || userContext.userProfile.interests || []
      }
    );

    console.log('✅ DataScout completed:', data.summary || 'Data gathered');

    // Show success message based on data quality
    if (data && (data.attractions?.length > 0 || data.restaurants?.length > 0 || data.transportation?.flights)) {
      progressCallback(60, "✅ Found amazing options for you!", false, "DataScout: Collected comprehensive destination data and pricing");
    } else {
      progressCallback(60, "⚠️ Using fallback data for planning...", false, "DataScout: Fallback data used due to API limitations");
    }

    // STEP 3: ItineraryArchitect Agent - Design personalized itinerary
    progressCallback(65, "🧠 Thinking about the perfect itinerary structure...", true, "ItineraryArchitect agent starting - designing custom itinerary framework");
    progressCallback(75, "🎨 Crafting your perfect day-by-day adventure...", false, "ItineraryArchitect: Creating " + tripDetails.duration + " itinerary with personalized activities");

    const itinerary = await this.itineraryArchitect.designItinerary(tripDetails, profile, data);

    console.log('✅ ItineraryArchitect completed:', itinerary.summary || 'Itinerary designed');

    // Show success message based on itinerary quality
    if (itinerary && (itinerary.daily_plans || itinerary.days) && ((itinerary.daily_plans && itinerary.daily_plans.length > 0) || (itinerary.days && itinerary.days.length > 0))) {
      progressCallback(85, "✅ Your perfect itinerary is taking shape!", false, "ItineraryArchitect: Completed " + tripDetails.duration + " detailed itinerary");
    } else {
      progressCallback(85, "✅ Building itinerary with comprehensive travel data...", false, "ItineraryArchitect: Assembling " + tripDetails.duration + " detailed plan from collected data");
    }

    // STEP 4: ChiefTravelPlanner Agent - Compile final comprehensive plan
    progressCallback(90, "🧠 Bringing everything together...", true, "ChiefTravelPlanner: Compiling all agent results into comprehensive plan");
    progressCallback(95, "📋 Putting the finishing touches...", false, "ChiefTravelPlanner: Final formatting and presentation preparation");

    const agentResults = {
      ProfileAnalyst: profile,
      DataScout: data,
      ItineraryArchitect: itinerary
    };

    const finalPlan = await this.chiefPlanner.coordinatePlanCreation(tripDetails, agentResults);

    console.log('✅ ChiefTravelPlanner completed: Final plan compiled');

    return finalPlan;
  }

  /**
   * Send planning updates via WebSocket with thinking status
   */
  sendPlanningUpdate(userId, socketService, progress, message, thinking = false, agentInstructions = null) {
    if (socketService) {
      socketService.sendStatusUpdate(userId, {
        stage: thinking ? 'thinking' : 'planning_in_progress',
        progress,
        message,
        timestamp: new Date().toISOString(),
        thinking: thinking,
        agentInstructions: agentInstructions,
        showToUser: true // Flag to show this to user
      });
    }
    console.log(`📡 ${thinking ? 'Thinking' : 'Planning'} update for ${userId}: ${progress}% - ${message}`);

    // Log agent instructions if provided
    if (agentInstructions) {
      console.log(`🤖 Agent Instructions: ${agentInstructions}`);
    }
  }

  /**
   * Send final plan via WebSocket
   */
  sendFinalPlan(userId, socketService, planMessage) {
    if (socketService) {
      socketService.sendStatusUpdate(userId, {
        stage: 'completed',
        message: planMessage,
        progress: 100,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'trip_plan_ready'
        }
      });
    }
  }

  /**
   * Handle planning status checks
   */
  async handlePlanningStatusCheck(userId) {
    const planningStatus = this.planningProcesses.get(userId);

    if (!planningStatus) {
      return {
        success: true,
        message: "I don't have any active planning processes for you. Want to start planning a new trip? 🌟",
        type: 'chat',
        timestamp: new Date().toISOString(),
        quick: true
      };
    }

    switch (planningStatus.status) {
      case 'in_progress':
        const elapsed = Date.now() - planningStatus.startTime.getTime();
        const elapsedSeconds = Math.floor(elapsed / 1000);
        return {
          success: true,
          message: `My team is still working on your ${planningStatus.tripDetails.destination} trip! 🚀 We're about ${elapsedSeconds} seconds in - should have your amazing plan ready very soon!`,
          type: 'planning_status',
          timestamp: new Date().toISOString(),
          quick: true
        };

      case 'completed':
        // Plan is ready, present it
        const finalMessage = await this.formatComprehensiveFinalPlan(
          planningStatus.result,
          planningStatus.tripDetails || { destination: 'your destination' },
          {}
        );
        return {
          success: true,
          message: finalMessage,
          type: 'trip_plan',
          timestamp: new Date().toISOString(),
          quick: true
        };

      case 'error':
        return {
          success: true,
          message: "I ran into some trouble with your trip planning, but I'm ready to try again! What destination were you thinking of? ✈️",
          type: 'chat',
          timestamp: new Date().toISOString(),
          quick: true
        };

      default:
        return await this.handleGeneralChat("How's my trip planning going?", { userId });
    }
  }

  /**
   * Handle general questions quickly
   */
  async handleGeneralQuestion(message, userContext) {
    // Quick responses for common questions
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('weather')) {
      return {
        success: true,
        message: "I'd love to check weather for you! Which destination are you curious about? 🌤️",
        type: 'chat',
        timestamp: new Date().toISOString(),
        quick: true
      };
    }

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      const userProfile = userContext.userProfile || {};
      const interests = userProfile.interests || [];

      let response = "I'd love to give you some personalized recommendations! ";
      if (interests.length > 0) {
        response += `With your interest in ${interests[0]}, there are some amazing destinations I could suggest! `;
      }
      response += "What kind of trip are you in the mood for? Adventure? Relaxation? Culture? 🗺️";

      return {
        success: true,
        message: response,
        type: 'chat',
        timestamp: new Date().toISOString(),
        quick: true
      };
    }

    // Fall through to AI-generated response for complex questions
    return await this.handleGeneralChat(message, userContext);
  }

  /**
   * Handle general chat with AI
   */
  async handleGeneralChat(message, userContext) {
    try {
      const contextPrompt = this.buildContextPrompt(userContext);
      const fullPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nUser: ${message}`;

      const response = await this.callGemini(fullPrompt);

      this.updateStatus('completed', 'Generated chat response');

      return {
        success: true,
        message: response,
        type: 'chat',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('General chat error:', error);
      return this.getErrorResponse(error, message);
    }
  }

  /**
   * Helper method to detect modification requests
   */
  containsModificationKeywords(message) {
    const modificationKeywords = [
      'change', 'modify', 'adjust', 'update', 'different', 'instead',
      'more', 'less', 'add', 'remove', 'replace', 'budget', 'cheaper',
      'expensive', 'luxury', 'budget-friendly', 'slow', 'fast', 'pace',
      'culture', 'food', 'adventure', 'activity', 'hotel', 'accommodation',
      'restaurant', 'dining', 'sightseeing', 'shopping', 'night', 'day',
      'earlier', 'later', 'longer', 'shorter'
    ];

    return modificationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Helper methods
   */
  async extractTripInfo(message) {
    // Use AI to intelligently extract trip information from the message
    console.log('🔍 Extracting info from message:', message);
    
    try {
      const extractionPrompt = `Extract travel planning information from this user message. Return ONLY valid JSON without any markdown formatting or code blocks.

USER MESSAGE: "${message}"

Extract the following information if present in the message:
- destination: The city, country, or location they want to visit (e.g., "Hawaii", "Paris", "Tokyo")
- duration: Number of days (convert "5-day", "five days", "a week", "4 days" to "X days" format, e.g., "5 days")
- travelers: Array with one of ["solo", "duo", "group"]. If user says "solo", "alone", "by myself" → ["solo"]. If "with friend", "duo" → ["duo"]. If "group", "friends" → ["group"]. If not mentioned → []
- departureCity: City they're flying from (e.g., "Cincinnati", "New York"). Look for phrases like "from Cincinnati", "flying from", "leaving from"
- budget: The ACTUAL dollar amount if mentioned (e.g., "$5000", "5k", "$2,500"). Extract the numeric value only (e.g., 5000, 2500). Look for patterns like "$5000", "5k usd", "$2,500", "five thousand dollars"
- budgetPreference: One of ["Budget", "Mid-range", "Luxury"]. Determine based on:
  * If budget amount given: Under $1500 → "Budget", $1500-$4000 → "Mid-range", Over $4000 → "Luxury"
  * If no amount: Keywords "budget", "cheap", "affordable" → "Budget", "mid-range", "moderate" → "Mid-range", "luxury", "high-end" → "Luxury"
  * If neither budget nor keywords mentioned → null

IMPORTANT:
- If user says "just create a trip" or "any island" or similar, infer they want "solo" travel unless they mention companions
- ALWAYS extract the budget dollar amount if provided (e.g., "$5000" → 5000, "5k" → 5000)
- Convert all duration formats to "X days" (e.g., "4 days", "5 days")
- Extract both budget (number) AND budgetPreference (category)

Return ONLY this JSON format:
{
  "destination": "city/country name or null",
  "duration": "X days or null",
  "travelers": ["solo"] or ["duo"] or ["group"] or [],
  "departureCity": "city name or null",
  "budget": number or null,
  "budgetPreference": "Budget or Mid-range or Luxury or null"
}`;

      const response = await this.callGemini(extractionPrompt);
      const extracted = this.parseAIResponse(response);
      
      if (extracted && typeof extracted === 'object') {
        const result = {
          destination: extracted.destination || null,
          duration: extracted.duration || null,
          travelers: Array.isArray(extracted.travelers) ? extracted.travelers : [],
          budget: extracted.budget || null,
          departureCity: extracted.departureCity || null,
          budgetPreference: extracted.budgetPreference || null
        };
        
        console.log('✅ AI Extraction Result:', JSON.stringify(result, null, 2));
        return result;
      }
    } catch (error) {
      console.error('❌ AI extraction failed, using fallback regex:', error.message);
    }

    // Fallback to simple regex if AI fails
    return this.extractTripInfoFallback(message);
  }

  extractTripInfoFallback(message) {
    console.log('⚠️ Using fallback regex extraction');
    
    const info = {
      destination: null,
      duration: null,
      travelers: [],
      budget: null,
      departureCity: null,
      budgetPreference: null
    };

    const lowerMsg = message.toLowerCase();

    // Destination extraction - try multiple patterns
    const destPatterns = [
      /(?:to|visit)\s+([A-Za-z\s]{2,30}?)(?:\s+for|\s|$)/i,
      /([A-Za-z]{3,20})\s+for\s+\d+\s*days?/i
    ];
    for (const pattern of destPatterns) {
      const match = message.match(pattern);
      if (match) {
        info.destination = match[1].trim();
        break;
      }
    }

    // Duration extraction
    const durationMatch = message.match(/(\d+)[-\s]*(?:day|days)/i);
    if (durationMatch) {
      info.duration = durationMatch[1] + ' days';
    }

    // Travelers extraction
    if (/solo|alone|by myself|just me/i.test(message) || /just create|any island/i.test(message)) {
      info.travelers = ['solo'];
    } else if (/duo|with.*friend|two people/i.test(message)) {
      info.travelers = ['duo'];
    } else if (/group|friends|family/i.test(message)) {
      info.travelers = ['group'];
    }

    // Departure city extraction
    const departureMatch = message.match(/(?:from|flying from|leaving from)\s+([A-Za-z\s]{3,30}?)(?:\s+and|\s|$)/i);
    if (departureMatch) {
      info.departureCity = departureMatch[1].trim();
    }

    // Budget preference extraction - convert dollar amounts to categories
    const budgetMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (budgetMatch) {
      const amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
      if (amount < 1000) {
        info.budgetPreference = 'Budget';
      } else if (amount >= 1000 && amount <= 3000) {
        info.budgetPreference = 'Mid-range';
      } else {
        info.budgetPreference = 'Luxury';
      }
    } else if (/super budget|budget[\s-]friendly|cheap|affordable|budget/i.test(message)) {
      info.budgetPreference = 'Budget';
    } else if (/mid[-\s]?range|moderate/i.test(message)) {
      info.budgetPreference = 'Mid-range';
    } else if (/luxury|luxurious|high[-\s]?end|premium/i.test(message)) {
      info.budgetPreference = 'Luxury';
    }

    console.log('📊 Fallback extraction result:', JSON.stringify(info, null, 2));
    return info;
  }

  mergeTripInfo(existing, newInfo) {
    return {
      destination: newInfo.destination || existing.destination,
      duration: newInfo.duration || existing.duration,
      travelers: newInfo.travelers.length > 0 ? newInfo.travelers : existing.travelers,
      budget: newInfo.budget || existing.budget,
      departureCity: newInfo.departureCity || existing.departureCity,
      budgetPreference: newInfo.budgetPreference || existing.budgetPreference
    };
  }

  async isDestinationSpecific(destination) {
    // Use AI to determine if destination is specific enough
    try {
      const prompt = `Is "${destination}" a specific city or location, or is it too broad (like a country)?

Return ONLY a JSON object:
{
  "isSpecific": true/false,
  "reason": "brief explanation",
  "suggestedCities": ["city1", "city2", "city3"] (only if not specific)
}

Examples:
- "Paris" → {"isSpecific": true, "reason": "Specific city"}
- "Tokyo" → {"isSpecific": true, "reason": "Specific city"}
- "Hawaii" → {"isSpecific": true, "reason": "Specific island destination"}
- "USA" → {"isSpecific": false, "reason": "Country is too broad", "suggestedCities": ["New York", "Los Angeles", "Miami", "Chicago", "San Francisco"]}
- "India" → {"isSpecific": false, "reason": "Country is too broad", "suggestedCities": ["Delhi", "Mumbai", "Jaipur", "Goa", "Bangalore"]}`;

      const response = await this.callGemini(prompt);
      const result = this.parseAIResponse(response);
      return result || { isSpecific: true, reason: "Unable to validate" };
    } catch (error) {
      console.error('Destination validation error:', error.message);
      return { isSpecific: true, reason: "Validation failed, proceeding" };
    }
  }

  isTripInfoComplete(info) {
    // Require ALL fields including departureCity and budgetPreference
    const isComplete = info.destination && 
           info.duration && 
           info.travelers.length > 0 && 
           info.departureCity && 
           info.budgetPreference;
    
    console.log('🔍 Checking if trip info is complete:', {
      destination: info.destination ? '✅' : '❌',
      duration: info.duration ? '✅' : '❌',
      travelers: info.travelers.length > 0 ? `✅ ${info.travelers.join(', ')}` : '❌',
      departureCity: info.departureCity ? '✅' : '❌',
      budgetPreference: info.budgetPreference ? '✅' : '❌',
      isComplete: isComplete ? '✅ ALL COMPLETE!' : '❌ Missing info'
    });
    
    return isComplete;
  }

  async generateFollowUpQuestion(extractedInfo, userContext) {
    const missing = [];
    if (!extractedInfo.destination) missing.push('destination');
    if (!extractedInfo.duration) missing.push('duration');
    if (!extractedInfo.travelers || extractedInfo.travelers.length === 0) missing.push('travelers');
    if (!extractedInfo.departureCity) missing.push('departureCity');
    if (!extractedInfo.budgetPreference) missing.push('budgetPreference');

    // Check if destination is too broad (if destination exists)
    let destinationValidation = null;
    if (extractedInfo.destination && !missing.includes('destination')) {
      destinationValidation = await this.isDestinationSpecific(extractedInfo.destination);
      if (!destinationValidation.isSpecific) {
        // Destination is too broad, ask for specific city first
        const cities = destinationValidation.suggestedCities || [];
        return `Awesome! ${extractedInfo.destination} has so many amazing places to explore! 🌍 Which city would you like to visit? 

Popular options include:
${cities.map(city => `• ${city}`).join('\n')}

Or let me know if you have a specific city in mind!`;
      }
    }

    const userProfile = userContext.userProfile || {};
    const name = userProfile.name || '';
    const interests = userProfile.interests || [];
    const bucketList = userProfile.bucketList || [];

    // Batch questions if multiple are missing (max 3 at once)
    const shouldBatchQuestions = missing.length >= 2;

    // Generate dynamic follow-up questions using AI
    try {
      let contextPrompt = `You are WanderBuddy, an enthusiastic AI travel companion. Generate a personalized follow-up question to collect trip planning information.

USER INFO:
- Name: ${name || 'Not provided'}
- Interests: ${interests.join(', ') || 'Not specified'}
- Bucket List: ${bucketList.join(', ') || 'Not specified'}

CURRENT TRIP INFO:
- Destination: ${extractedInfo.destination || 'Not provided'}
- Duration: ${extractedInfo.duration || 'Not provided'}
- Travelers: ${extractedInfo.travelers.join(', ') || 'Not provided'}
- Departure City: ${extractedInfo.departureCity || 'Not provided'}
- Budget Preference: ${extractedInfo.budgetPreference || 'Not provided'}

MISSING INFO: ${missing.join(', ')}

TASK:${shouldBatchQuestions ? ` Ask for ${Math.min(3, missing.length)} pieces of missing information in ONE message. Format as:
"Great! To plan your perfect trip, I need a few quick details:
1. [First question]
2. [Second question]
${missing.length >= 3 ? '3. [Third question]' : ''}"` : ''}`;

      if (missing.includes('destination') && !extractedInfo.duration && !extractedInfo.travelers.length) {
        contextPrompt += ` Ask enthusiastically about their dream destination. Reference their interests or bucket list if available. Keep it under 30 words and use travel emojis.`;
      } else if (extractedInfo.destination && missing.includes('duration')) {
        contextPrompt += ` Ask about trip duration for ${extractedInfo.destination}. Show excitement about their destination choice. Keep it under 25 words and use emojis.`;
      } else if (extractedInfo.destination && extractedInfo.duration && missing.includes('travelers')) {
        contextPrompt += ` Ask about travel companions for their ${extractedInfo.duration} trip to ${extractedInfo.destination}. Keep it under 25 words and use emojis.`;
      } else if (extractedInfo.destination && extractedInfo.duration && extractedInfo.travelers.length > 0 && missing.includes('departureCity')) {
        contextPrompt += ` Ask where they'll be flying from for their ${extractedInfo.duration} ${extractedInfo.travelers[0]} trip to ${extractedInfo.destination}. Keep it under 25 words and use emojis.`;
      } else if (extractedInfo.destination && extractedInfo.duration && extractedInfo.travelers.length > 0 && extractedInfo.departureCity && missing.includes('budgetPreference')) {
        contextPrompt += ` Ask about their accommodation budget preference using ONLY these options: Budget 🎒, Mid-range 🏨, or Luxury ✨ for their ${extractedInfo.duration} trip to ${extractedInfo.destination}. DO NOT ask for dollar amounts. Format exactly like: "What's your accommodation budget? Budget 🎒, Mid-range 🏨, or Luxury ✨?" Keep it under 30 words.`;
      } else {
        contextPrompt += ` Ask for the next missing piece of information: ${missing[0]}. Be encouraging and enthusiastic. Keep it under 30 words and use travel emojis.`;
      }

      const dynamicQuestion = await this.callGemini(contextPrompt);
      return dynamicQuestion;
    } catch (error) {
      console.error('Failed to generate dynamic follow-up question:', error.message);

      // Simple fallback without hardcoded text
      const missingText = missing.join(' and ');
      return `Great! I need to know about your ${missingText} to create the perfect trip plan. What can you tell me? ✈️`;
    }
  }

  async generatePlanningStartMessage(tripInfo, userContext) {
    const userProfile = userContext.userProfile || {};
    const name = userProfile.name || '';
    const interests = userProfile.interests || [];

    // Generate dynamic planning start message using AI
    try {
      const planningPrompt = `You are WanderBuddy, an enthusiastic AI travel companion. Generate an exciting message announcing that trip planning is starting.

USER INFO:
- Name: ${name || 'Traveler'}
- Interests: ${interests.join(', ') || 'General travel'}

TRIP DETAILS:
- Destination: ${tripInfo.destination}
- Duration: ${tripInfo.duration}
- Travel Type: ${tripInfo.travelers[0]}

TASK: Generate an enthusiastic message that:
- Shows excitement about their specific trip
- Mentions that your specialist team is working
- References the AI agents working behind the scenes (ProfileAnalyst, DataScout, ItineraryArchitect)
- Uses travel emojis appropriately
- Keeps it under 100 words
- Sounds personal and engaging

Be warm, enthusiastic, and make them excited about the planning process!`;

      const dynamicMessage = await this.callGemini(planningPrompt);
      return dynamicMessage;
    } catch (error) {
      console.error('Failed to generate dynamic planning start message:', error.message);

      // Simple fallback
      return `Excellent${name ? `, ${name}` : ''}! Your ${tripInfo.duration} trip to ${tripInfo.destination} sounds amazing! 🎉

My specialist AI team is working on your perfect itinerary right now. I'll have everything ready soon! ✨`;
    }
  }

  formatFinalPlan(planResult, tripDetails, userContext) {
    return `🌟 **Your ${tripDetails.destination} Adventure is Ready!** 🌟

I've crafted the perfect ${tripDetails.duration} trip to ${tripDetails.destination}! Here's what my specialist team put together:

**✈️ Travel Highlights:**
${planResult.itinerary?.highlights || 'Amazing experiences tailored to your interests'}

**🏨 Smart Recommendations:**
${planResult.data?.hotels || 'Handpicked accommodations for your style'}

**🌤️ Weather & Timing:**
${planResult.data?.weather || 'Perfect weather information for your dates'}

**🎯 Why This Plan is Perfect for You:**
${planResult.profile?.recommendations || 'Designed around your travel personality'}

Ready to make this happen? I can help you with next steps for booking! 🚀`;
  }

  buildContextPrompt(userContext) {
    const profile = userContext.userProfile || {};
    const parts = [];

    if (profile.name) parts.push(`User: ${profile.name}`);
    if (profile.interests) parts.push(`Interests: ${profile.interests.join(', ')}`);
    if (profile.travelStyle) parts.push(`Travel Style: ${profile.travelStyle.join(', ')}`);

    return parts.join('\n');
  }

  determineTravelPersonality(userProfile) {
    const styles = userProfile.travelStyle || [];
    if (styles.includes('luxury')) return 'Luxury Explorer';
    if (styles.includes('adventure')) return 'Adventure Seeker';
    if (styles.includes('backpacker')) return 'Budget Explorer';
    return 'Culture Enthusiast';
  }

  /**
   * Format comprehensive final plan for user display - AI-powered
   */
  async formatComprehensiveFinalPlan(tripData, tripDetails, userContext) {
    try {
      // Extract data from tripData
      const tripInfo = tripData.tripInfo || {};
      const recommendations = tripData.recommendations || {};
      const itineraryData = tripData.itinerary || [];
      
      // Extract real data from recommendations
      const flights = recommendations.transportation?.flights || [];
      // Handle accommodation structure - might be object with hotels array or just array
      let hotels = [];
      if (recommendations.accommodation) {
        if (Array.isArray(recommendations.accommodation)) {
          // Old format: accommodation is an array
          hotels = [];
        } else if (recommendations.accommodation.hotels) {
          // New format: accommodation is an object with hotels array
          hotels = recommendations.accommodation.hotels;
        }
      }
      const weather = recommendations.weather || {};
      const departureCity = recommendations.departureCity || tripDetails.departureCity || 'your city';
      const budgetPreference = recommendations.budgetPreference || tripDetails.budgetPreference || 'Mid-range';
      
      // DEBUG: Log extracted data
      console.log('🔍 DEBUG: Extracted data for formatting:');
      console.log(`   Flights: ${flights.length} items`);
      console.log(`   Hotels: ${hotels.length} items`);
      console.log(`   Weather: ${weather ? 'Available' : 'Not available'}`);
      console.log(`   Departure City: ${departureCity}`);
      console.log(`   Budget Preference: ${budgetPreference}`);

      // Use AI to format the plan as structured markdown
      const prompt = `You are an expert travel planner. Create a beautifully formatted travel plan using markdown for ${tripDetails.destination}.

TRIP DETAILS:
- Destination: ${tripDetails.destination}
- Duration: ${tripDetails.duration}
- Travel Style: ${tripDetails.travelers?.join(', ') || 'solo'}
- Departure City: ${departureCity}
- Budget Preference: ${budgetPreference}
- Budget: ${tripInfo.budget || recommendations.budgetBreakdown || 'moderate budget'}

AVAILABLE REAL DATA:
- Flights: ${JSON.stringify(flights.slice(0, 3))}
- Hotels: ${JSON.stringify(hotels.slice(0, 3))}
- Weather: ${JSON.stringify(weather)}
- Restaurants: ${JSON.stringify(recommendations.restaurants || [])}
- Transportation: ${recommendations.transportation || 'Public transport and walking'}
- Travel Tips: ${JSON.stringify(recommendations.travelTips || [])}
- Packing List: ${JSON.stringify(recommendations.packingList || [])}
- Daily Itinerary: ${JSON.stringify(itineraryData)}

FORMATTING INSTRUCTIONS - FOLLOW EXACTLY:

1. Start with a SHORT, exciting intro paragraph (2-3 sentences max)

2. Create a "Trip at a Glance" section:
**✨ Trip at a Glance ✨**
* **Destination:** [destination with flag emoji]
* **Duration:** [duration]
* **Travel Style:** [styles]
* **Estimated Cost:** [budget]

3. Add Destination Overview with current weather:
**🌍 Destination Overview**
[2-3 sentences describing the destination. Include current weather: "Currently [temp]°C and [condition], perfect for [activity]!"]

4. Use "---" separator, then add Flight Options section:
**✈️ Flight Options from ${departureCity}**
${flights.length > 0 ? flights.slice(0, 3).map((flight, idx) => 
  `* **Option ${idx + 1}:** ${flight.airline || 'Multiple Airlines'} - ${flight.price || 'Price varies'} - ${flight.departure || 'Departure time'} to ${flight.arrival || 'Arrival time'} - ${flight.duration || 'Duration varies'}`
).join('\n') : 'Flight search from ' + departureCity + ' - check major airlines for best rates'}

5. Add Hotel Recommendations section based on budget preference:
**🏨 Hotel Recommendations (${budgetPreference})**
${hotels.length > 0 ? hotels.slice(0, 3).map((hotel, idx) => 
  `* **${hotel.name || 'Hotel Option ' + (idx + 1)}:** ${hotel.price || 'Price varies'}/night - ${hotel.rating || 'Check rating'}⭐ - ${hotel.location || 'Central location'} - ${hotel.description || 'Good accommodation option'}`
).join('\n') : 'Recommended accommodations in central areas with good access to attractions'}

6. Use "---" separator, then create the itinerary:
### **🗺️ Your Itinerary**

For each day, format like this:
**🗓️ Day X: [Day Title]**
* **[Time] - [Activity Name]**
    * *Action:* [What they'll do]
    * *Duration:* [How long]
    * *Cost:* [Price]

7. Use "---" separator, then add Weather Forecast:
**🌤️ Weather Forecast**
IMPORTANT: Extract and display the actual weather data from the weather object. Show:
**Current Weather:** [Extract temperature from weather.current]°C, [Extract description from weather.current]
**Trip Forecast:**
${weather.forecast ? `* Day 1: [Extract temperature and condition from weather.forecast[0]]
* Day 2: [Extract temperature and condition from weather.forecast[1]]
* Day 3: [Extract temperature and condition from weather.forecast[2]]
[Continue for all available forecast days]` : '* Weather forecast data not available - check local forecast closer to travel date'}

Use the actual weather data from the weather object, not placeholder text.

8. Use "---" separator, then budget section:
### **💰 Budget Breakdown**
*Total Estimated Cost: [total including flights and hotels]*

IMPORTANT: Extract actual costs from the available data:
* **Flights:** ${flights.length > 0 ? '[Extract and sum flight prices from flights array]' : 'To be determined - check airline websites'}
* **Accommodation:** ${hotels.length > 0 ? '[Extract hotel prices and calculate total for trip duration from hotels array]' : 'Varies by accommodation choice'}
* **Food & Dining:** [amount from recommendations or estimate]
* **Transportation:** [amount from recommendations or estimate]
* **Activities:** [amount from recommendations or estimate]

Use actual data from flights and hotels arrays when available.

9. Use "---" separator, then prep section:
### **🎒 Packing & Travel Tips**

**✅ Packing Checklist**
* [ ] [Item based on weather]
* [ ] [Item]
* [ ] [Item]

**💡 Travel Tips**
1. [Tip with brief explanation]
2. [Tip with brief explanation]

10. End with: "This plan is completely customizable! Want to adjust anything? Just let me know! 🛠️✨"

CRITICAL RULES:
- Use markdown formatting (**, *, ###, ---, bullet points, numbered lists)
- Be concise and scannable
- Include relevant emojis naturally
- **MOST IMPORTANT: Extract and use ONLY the actual data from the provided JSON objects**
- For flights: Use the actual airline names, prices, times, and durations from the flights array
- For hotels: Use the actual hotel names, prices, ratings, and locations from the hotels array
- For weather: Use the actual temperature and conditions from the weather object
- List activities with nested bullet points for details
- Keep it professional yet friendly
- ALL costs, times, and practical details must be clearly labeled
- **DO NOT use placeholder text like "[Airline]" or "[Price]" - extract the real values from the data**
- **DO NOT make up prices or times - only use what's provided in the data**

Generate the complete formatted travel plan now:`;

      const response = await this.callGemini(prompt);
      
      // If AI fails, fall back to structured formatting
      if (!response || response.length < 100) {
        throw new Error('AI formatting failed');
      }
      
      return response;
    } catch (error) {
      console.error('AI Formatting error:', error);
      
      // Fallback to basic structured formatting
      const tripInfo = tripData.tripInfo || {};
      const itinerary = tripData.itinerary || [];
      const recommendations = tripData.recommendations || {};
      const weather = recommendations.weather || {};
      const flights = recommendations.transportation?.flights || [];
      const hotels = recommendations.accommodation?.hotels || [];

      let comprehensiveMessage = `Get ready for an amazing ${tripDetails.duration} adventure to ${tripDetails.destination}!\n\n`;

      // Trip at a Glance
      comprehensiveMessage += `**✨ Trip at a Glance ✨**\n`;
      comprehensiveMessage += `* **Destination:** ${tripDetails.destination}\n`;
      comprehensiveMessage += `* **Duration:** ${tripDetails.duration}\n`;
      comprehensiveMessage += `* **Travel Style:** ${tripDetails.travelers?.join(', ') || 'solo'}\n`;
      comprehensiveMessage += `* **Estimated Cost:** ${tripInfo.budget || '$2,500-3,500'}\n\n`;

      // Weather if available
      if (weather.current) {
        comprehensiveMessage += `**🌍 Destination Overview**\n`;
        comprehensiveMessage += `${tripDetails.destination} awaits! Currently ${weather.current.temperature}°C and ${weather.current.description}, perfect for exploring!\n\n`;
      }

      // Flights if available
      if (flights.length > 0) {
        comprehensiveMessage += `---\n\n**✈️ Flight Options**\n`;
        flights.slice(0, 3).forEach((flight, index) => {
          comprehensiveMessage += `* **Option ${index + 1}:** ${flight.airline || 'Multiple Airlines'} - ${flight.price || 'Price varies'} - ${flight.departure || 'Check times'} to ${flight.arrival || 'Check times'} - ${flight.duration || 'Check duration'}\n`;
        });
        comprehensiveMessage += `\n`;
      } else {
        comprehensiveMessage += `---\n\n**✈️ Flight Options**\n`;
        comprehensiveMessage += `Flight search from ${departureCity} - check major airlines for best rates\n\n`;
      }

      // Hotels if available
      if (hotels.length > 0) {
        comprehensiveMessage += `**🏨 Hotel Recommendations (${budgetPreference})**\n`;
        hotels.slice(0, 3).forEach((hotel, index) => {
          comprehensiveMessage += `* **${hotel.name || 'Hotel'}:** ${hotel.price || 'Price varies'}/night - ${hotel.rating || 'Check rating'} - ${hotel.location || 'Check location'} - ${hotel.description || 'Great accommodation option'}\n`;
        });
        comprehensiveMessage += `\n`;
      } else {
        comprehensiveMessage += `**🏨 Hotel Recommendations (${budgetPreference})**\n`;
        comprehensiveMessage += `Recommended accommodations in central areas with good access to attractions\n\n`;
      }

      comprehensiveMessage += `---\n\n### **🗺️ Your Itinerary**\n\n`;

      // Daily Itinerary in structured format
      if (itinerary.length > 0) {
        itinerary.forEach((day, index) => {
          comprehensiveMessage += `**🗓️ Day ${index + 1}: ${day.title || 'Adventure Day'}**\n`;
          if (day.activities && day.activities.length > 0) {
            day.activities.forEach((activity) => {
              comprehensiveMessage += `* **${activity.time || 'TBD'} - ${activity.name}**\n`;
              if (activity.description) comprehensiveMessage += `    * *Action:* ${activity.description}\n`;
              if (activity.duration) comprehensiveMessage += `    * *Duration:* ${activity.duration}\n`;
              if (activity.cost) comprehensiveMessage += `    * *Cost:* ${activity.cost}\n`;
            });
          }
          comprehensiveMessage += `\n`;
        });
      }

      comprehensiveMessage += `---\n\n`;

      // Weather Forecast if available
      if (weather.current || weather.forecast) {
        comprehensiveMessage += `**🌤️ Weather Forecast**\n`;
        if (weather.current) {
          comprehensiveMessage += `**Current Weather:** ${weather.current.temperature}°C, ${weather.current.description}\n`;
        }
        if (weather.forecast && weather.forecast.length > 0) {
          comprehensiveMessage += `**Trip Forecast:**\n`;
          weather.forecast.slice(0, 5).forEach((day, idx) => {
            comprehensiveMessage += `* Day ${idx + 1}: ${day.temperature || day.temp}°C, ${day.condition || day.description}\n`;
          });
        }
        comprehensiveMessage += `\n---\n\n`;
      }

      // Budget Breakdown
      comprehensiveMessage += `### **💰 Budget Breakdown**\n`;
      comprehensiveMessage += `*Total Estimated Cost: ${tripInfo.budget || recommendations.budgetBreakdown || '$2,500-3,500'}*\n\n`;
      if (recommendations.budgetInfo) {
        if (flights.length > 0) comprehensiveMessage += `* **Flights:** ${flights[0].price || 'TBD'}\n`;
        if (recommendations.budgetInfo.accommodation) comprehensiveMessage += `* **Accommodation:** ${recommendations.budgetInfo.accommodation}\n`;
        if (recommendations.budgetInfo.food) comprehensiveMessage += `* **Food & Dining:** ${recommendations.budgetInfo.food}\n`;
        if (recommendations.budgetInfo.transport) comprehensiveMessage += `* **Transportation:** ${recommendations.budgetInfo.transport}\n`;
        if (recommendations.budgetInfo.activities) comprehensiveMessage += `* **Activities:** ${recommendations.budgetInfo.activities}\n`;
      }

      comprehensiveMessage += `\n---\n\n`;

      // Packing and Travel Tips
      comprehensiveMessage += `### **🎒 Packing & Travel Tips**\n\n`;
      
      if (recommendations.packingList && recommendations.packingList.length > 0) {
        comprehensiveMessage += `**✅ Packing Checklist**\n`;
        recommendations.packingList.forEach((item) => {
          comprehensiveMessage += `* [ ] ${item}\n`;
        });
        comprehensiveMessage += `\n`;
      }

      if (recommendations.travelTips && recommendations.travelTips.length > 0) {
        comprehensiveMessage += `**💡 Travel Tips**\n`;
        recommendations.travelTips.forEach((tip, idx) => {
          comprehensiveMessage += `${idx + 1}. ${tip}\n`;
        });
      }

      // Add closing message
      comprehensiveMessage += `\n\nThis plan is completely customizable! Want to adjust anything? Just let me know! 🛠️✨`;

      return comprehensiveMessage.trim();
    }
  }

  /**
   * Send final plan with feedback request via WebSocket
   */
  sendFinalPlanWithFeedbackRequest(userId, socketService, planMessage, tripDetails = null) {
    const feedbackMessage = `\n\n---\n\n🎯 **What do you think?**\n\nThis plan is completely customizable! Want to add more cultural experiences, include more food adventures, adjust the pace of activities, change the accommodation style, or modify the budget? Just let me know what you'd like to adjust and I'll reshape the plan to match your vision perfectly! 🛠️✨`;

    const completeMessage = planMessage + feedbackMessage;

    // Get the comprehensive planning data from the user's planning process
    const planningProcess = this.planningProcesses.get(userId);
    const structuredData = planningProcess?.result || {};

    console.log('🔍 DEBUG: Full structured data:', JSON.stringify(structuredData, null, 2));

    // If socketService wasn't passed, try to get it from the stored planning process
    if (!socketService && planningProcess?.socketService) {
      console.log('⚠️ socketService not passed, retrieving from stored planning process');
      socketService = planningProcess.socketService;
    }

    if (socketService) {
      console.log('✅ socketService found, sending WebSocket message to user:', userId);
      socketService.sendStatusUpdate(userId, {
        stage: 'completed',
        message: completeMessage,
        progress: 100,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'trip_plan_with_feedback',
          allowsFeedback: true,
          destination: tripDetails?.destination,
          duration: tripDetails?.duration,
          travelers: tripDetails?.travelers,
          trip_type: tripDetails?.trip_type || 'solo',
          rawData: {
            // Simple text-based data structure - no cards
            destination: tripDetails?.destination,
            travelers: tripDetails?.travelers,
            duration: tripDetails?.duration,
            estimated_budget: structuredData.tripInfo?.budget || structuredData.recommendations?.budgetBreakdown || '$2,500-3,500',
            itinerary_text: structuredData.itinerary || 'Detailed itinerary will be provided',
            weather_info: structuredData.data?.weather?.current || 'Pleasant weather conditions',
            packing_tips: structuredData.recommendations?.packingList || [],
            cultural_notes: structuredData.data?.culturalTips || [],
            safety_info: structuredData.data?.safetyInfo || 'General travel safety advice',
            budget_breakdown: structuredData.recommendations?.budgetBreakdown || {}
          },
          feedbackPrompts: [
            "Add more cultural activities",
            "Include more food experiences",
            "Make it more budget-friendly",
            "Add luxury options",
            "Slow down the pace",
            "Speed up the itinerary"
          ]
        }
      });
    } else {
      console.error('❌ socketService is null/undefined, cannot send trip plan to user:', userId);
      console.error('❌ This means the WebSocket connection is not available');
    }
    console.log(`📨 Sent comprehensive trip plan with feedback request to ${userId}`);
  }

  getErrorResponse(error, message) {
    return {
      success: true,
      message: "I'm having a quick hiccup, but I'm still here to help! What can I do for you? 😊",
      type: 'chat',
      timestamp: new Date().toISOString(),
      quick: true,
      metadata: { error: error.message }
    };
  }
  /**
   * Handle trip modification requests
   */
  async handleTripModification(message, userContext, socketService) {
    const userId = userContext.userId;
    const conversationState = this.conversationStates.get(userId);

    if (!conversationState || !conversationState.finalPlan) {
      return {
        success: true,
        message: "I don't have a current trip plan to modify. Would you like to start planning a new trip? 🌟",
        type: 'chat',
        timestamp: new Date().toISOString(),
        quick: true
      };
    }

    // Analyze the modification request
    const modification = this.analyzeModificationRequest(message);

    // Send immediate acknowledgment
    let immediateResponse = "Great idea! Let me work on those adjustments for you... 🛠️";

    if (modification.type === 'budget') {
      immediateResponse = "Perfect! I'll adjust the budget and find better options for you! 💰";
    } else if (modification.type === 'pace') {
      immediateResponse = "Absolutely! I'll modify the pace to make it more comfortable for you! ⏰";
    } else if (modification.type === 'activities') {
      immediateResponse = "Love it! I'll add those activities to make your trip even better! 🎯";
    }

    // Start modification process
    setTimeout(async () => {
      await this.processModification(userId, modification, conversationState.finalPlan, socketService);
    }, 100);

    return {
      success: true,
      message: immediateResponse,
      type: 'modification_started',
      timestamp: new Date().toISOString(),
      quick: true
    };
  }

  analyzeModificationRequest(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('expensive')) {
      return { type: 'budget', details: message };
    }
    if (lowerMessage.includes('pace') || lowerMessage.includes('slow') || lowerMessage.includes('fast') || lowerMessage.includes('rush')) {
      return { type: 'pace', details: message };
    }
    if (lowerMessage.includes('culture') || lowerMessage.includes('food') || lowerMessage.includes('adventure') || lowerMessage.includes('activity')) {
      return { type: 'activities', details: message };
    }
    if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation')) {
      return { type: 'accommodation', details: message };
    }

    return { type: 'general', details: message };
  }

  async processModification(userId, modification, originalPlan, socketService) {
    // Send working update
    this.sendPlanningUpdate(userId, socketService, 20, "🔧 Analyzing your requested changes...", true, "Processing modification request: " + modification.type);

    // Simulate modification work
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.sendPlanningUpdate(userId, socketService, 60, "✏️ Making the adjustments...", false, "Updating trip plan based on: " + modification.details.substring(0, 100));

    await new Promise(resolve => setTimeout(resolve, 1500));

    this.sendPlanningUpdate(userId, socketService, 100, "🎉 Your updated trip plan is ready!");

    // Generate modified plan (simplified for demo)
    const modifiedMessage = `🔄 **Updated Trip Plan**\n\nI've made the adjustments you requested! Here's your updated ${originalPlan.tripInfo?.destination || 'trip'} plan:\n\n✅ **What I Changed:**\n• ${modification.details}\n\n🎯 **Your trip is now even better customized to your preferences!**\n\n*[Full updated itinerary would be displayed here]*\n\nNeed any other adjustments? Just let me know! 🌟`;

    this.sendFinalPlanWithFeedbackRequest(userId, socketService, modifiedMessage, originalPlan.tripDetails);
  }

  /**
   * Clean up old planning processes to prevent interference
   */
  cleanupOldPlanningProcesses(userId) {
    const process = this.planningProcesses.get(userId);
    if (process) {
      const now = new Date();
      const processTime = process.startTime || process.completedAt;

      // Remove processes older than 5 minutes OR completed processes older than 30 seconds
      const shouldCleanup = (processTime && (now - new Date(processTime)) > 5 * 60 * 1000) ||
                           (process.status === 'completed' && processTime && (now - new Date(processTime)) > 30 * 1000);

      if (shouldCleanup) {
        console.log(`🧹 Cleaning up ${process.status || 'old'} planning process for user ${userId}`);
        this.planningProcesses.delete(userId);
        this.conversationStates.delete(userId);
      }
    }
  }

  /**
   * Force clear all planning states for a user - useful for debugging
   */
  forceClearUserState(userId) {
    console.log(`🗑️ Force clearing ALL state for user ${userId}`);
    this.planningProcesses.delete(userId);
    this.conversationStates.delete(userId);
    return true;
  }

  /**
   * Execute method for external calls
   */
  async execute(input, context = {}) {
    const { message, userContext, socketService } = input;
    return await this.handleUserMessage(message, userContext, socketService);
  }
}
