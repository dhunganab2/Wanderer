/**
 * Chat Manager Agent
 * The single point of contact for users - handles ALL user interaction
 * and coordinates other agents behind the scenes
 */
import BaseAgent from '../utils/BaseAgent.js';
import DataScoutAgent from './DataScoutAgent.js';

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
    
    // Initialize DataScout agent for real data fetching
    this.dataScout = new DataScoutAgent();

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
   * Coordinate specialist agents with detailed thinking updates - AI-powered
   */
  async coordinateAgents(tripDetails, userContext, progressCallback) {
    // ProfileAnalyst work - AI-powered
    progressCallback(15, "🧠 Thinking about your travel preferences...", true, "ProfileAnalyst agent initializing - analyzing user profile for travel personality");
    progressCallback(25, "🧠 Analyzing your travel style...", false, "ProfileAnalyst: Examining interests, previous trips, and preferences");

    const profile = await this.aiProfileAnalysis(userContext.userProfile, tripDetails);
    progressCallback(35, "✅ Got your travel personality mapped!", false, "ProfileAnalyst: Completed personality analysis - identified as " + profile.travelPersonality);

    // DataScout work - Real API-powered
    progressCallback(40, "🧠 Thinking about the best options for your trip...", true, "DataScout agent starting - researching live data for " + tripDetails.destination);
    progressCallback(50, "🔍 Scouting the best flights, hotels, and local info...", false, "DataScout: Fetching weather, accommodation, and transportation data");

    const data = await this.aiDataGathering(tripDetails.destination, tripDetails.duration, tripDetails.departureCity, tripDetails.budgetPreference);
    
    // Only show success if we actually got real data
    if (data && (data.attractions?.length > 0 || data.restaurants?.length > 0 || data.transportation?.flights)) {
      progressCallback(60, "✅ Found amazing options for you!", false, "DataScout: Collected comprehensive destination data and pricing");
    } else {
      progressCallback(60, "⚠️ Using fallback data for planning...", false, "DataScout: Fallback data used due to API limitations");
    }

    // ItineraryArchitect work - AI-powered
    progressCallback(65, "🧠 Thinking about the perfect itinerary structure...", true, "ItineraryArchitect agent starting - designing custom itinerary framework");
    progressCallback(75, "🎨 Crafting your perfect day-by-day adventure...", false, "ItineraryArchitect: Creating " + tripDetails.duration + " itinerary with personalized activities");

    const itinerary = await this.aiItineraryCreation(tripDetails, userContext.userProfile, profile);
    
    // Only show success if we actually got a real itinerary
    if (itinerary && (itinerary.dailyPlans || itinerary.days) && ((itinerary.dailyPlans && itinerary.dailyPlans.length > 0) || (itinerary.days && itinerary.days.length > 0))) {
      progressCallback(85, "✅ Your perfect itinerary is taking shape!", false, "ItineraryArchitect: Completed " + tripDetails.duration + " detailed itinerary");
    } else {
      progressCallback(85, "✅ Building itinerary with comprehensive travel data...", false, "ItineraryArchitect: Assembling " + tripDetails.duration + " detailed plan from collected data");
    }

    // Final compilation - AI-powered
    progressCallback(90, "🧠 Bringing everything together...", true, "ChatManager: Compiling all agent results into comprehensive plan");
    progressCallback(95, "📋 Putting the finishing touches...", false, "ChatManager: Final formatting and presentation preparation");

    // Compile final plan with AI-generated content
    const finalPlan = await this.aiCompileFinalPlan(tripDetails, { profile, data, itinerary }, userContext);

    return finalPlan;
  }

  /**
   * AI-powered profile analysis
   */
  async aiProfileAnalysis(userProfile, tripDetails) {
    try {
      const prompt = `You are a ProfileAnalyst agent specializing in travel personality analysis. Analyze this user's profile and create a comprehensive travel personality assessment.

USER PROFILE:
- Name: ${userProfile.name || 'Unknown'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Travel Style: ${userProfile.travelStyle?.join(', ') || 'Not specified'}
- Bucket List: ${userProfile.bucketList?.join(', ') || 'Not specified'}

TRIP CONTEXT:
- Destination: ${tripDetails.destination}
- Duration: ${tripDetails.duration}

ANALYSIS TASK:
Provide a comprehensive travel personality analysis in this JSON format. Return ONLY valid JSON without any markdown formatting or code blocks:

{
  "travelPersonality": "Adventure Seeker|Culture Enthusiast|Luxury Explorer|Budget Explorer|Wellness Seeker",
  "travelStyle": ["adventure", "culture", "budget", "luxury"],
  "interests": ["specific interests based on profile"],
  "preferences": {
    "accommodationStyle": "luxury hotels|mid-range hotels|hostels and budget hotels",
    "activityLevel": "high-energy|moderate|relaxed",
    "diningStyle": "foodie experiences|local cuisine|budget dining",
    "culturalInterest": "high|moderate|low"
  },
  "recommendations": {
    "bestTimeToVisit": "specific recommendations",
    "accommodationType": "specific recommendations",
    "budgetRange": "specific budget range per day"
  }
}

Focus on creating a personalized assessment that will guide the itinerary creation.`;

      const response = await this.callGemini(prompt);
      const parsedResponse = this.parseAIResponse(response);
      
      if (!parsedResponse) {
        throw new Error('Failed to parse AI response as JSON');
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('AI Profile Analysis error:', error);
      return {
        travelPersonality: 'Culture Enthusiast',
        travelStyle: userProfile.travelStyle || ['culture'],
        interests: userProfile.interests || ['sightseeing'],
        preferences: {
          accommodationStyle: 'mid-range hotels',
          activityLevel: 'moderate',
          diningStyle: 'local cuisine',
          culturalInterest: 'high'
        },
        recommendations: {
          bestTimeToVisit: 'Based on weather patterns',
          accommodationType: '3-4 star hotels',
          budgetRange: '$100-200/day'
        }
      };
    }
  }

  /**
   * Legacy simulate methods (kept for fallback)
   */
  async simulateProfileAnalysis(userProfile) {
    return new Promise(resolve => {
      setTimeout(() => {
        const personality = this.determineTravelPersonality(userProfile);
        const interests = userProfile.interests || ['culture', 'food', 'sightseeing'];
        const travelStyle = userProfile.travelStyle || ['moderate'];

        resolve({
          travelPersonality: personality,
          interests: interests,
          travelStyle: travelStyle,
          preferences: {
            accommodationStyle: personality.includes('Luxury') ? 'luxury hotels' : personality.includes('Budget') ? 'hostels and budget hotels' : 'mid-range hotels',
            activityLevel: travelStyle.includes('adventure') ? 'high-energy' : 'moderate',
            diningStyle: interests.includes('food') ? 'foodie experiences' : 'local cuisine',
            culturalInterest: interests.includes('culture') ? 'high' : 'moderate'
          },
          recommendations: {
            bestTimeToVisit: 'Based on your preferences and weather patterns',
            accommodationType: personality.includes('Luxury') ? '4-5 star hotels' : '3-4 star hotels',
            budgetRange: personality.includes('Budget') ? '$50-100/day' : personality.includes('Luxury') ? '$200-400/day' : '$100-200/day'
          }
        });
      }, 1000);
    });
  }

  /**
   * AI-powered data gathering using real DataScout agent with SERP API
   */
  async aiDataGathering(destination, duration, departureCity = 'New York', budgetPreference = 'Mid-range') {
    try {
      console.log(`🔍 Starting real data gathering for ${destination} using DataScout agent...`);
      console.log(`   Departure city: ${departureCity}, Budget preference: ${budgetPreference}`);
      
      // Use DataScout agent to gather all data in parallel with better error handling
      console.log('🚀 Starting parallel API calls for comprehensive data...');

      const [flightData, hotelData, attractionData, restaurantData, weatherData] = await Promise.allSettled([
        this.dataScout.getFlightData(destination, departureCity).then(data => {
          console.log('✅ Flight data received:', Array.isArray(data) ? data.length : 'invalid format');
          return data;
        }).catch(e => {
          console.log('❌ Flight data failed:', e.message);
          return [];
        }),

        this.dataScout.getHotelData(destination, null, duration).then(data => {
          console.log('✅ Hotel data received:', Array.isArray(data) ? data.length : 'invalid format');
          return data;
        }).catch(e => {
          console.log('❌ Hotel data failed:', e.message);
          return [];
        }),

        this.dataScout.getAttractionData(destination).then(data => {
          console.log('✅ Attraction data received:', Array.isArray(data) ? data.length : 'invalid format');
          return data;
        }).catch(e => {
          console.log('❌ Attraction data failed:', e.message);
          return [];
        }),

        this.dataScout.getRestaurantData(destination).then(data => {
          console.log('✅ Restaurant data received:', data?.restaurants?.length || 0, 'restaurants');
          return data;
        }).catch(e => {
          console.log('❌ Restaurant data failed:', e.message);
          return { restaurants: [] };
        }),

        this.dataScout.getWeatherData(destination).then(data => {
          console.log('✅ Weather data received:', data?.current ? 'success' : 'incomplete');
          return data;
        }).catch(e => {
          console.log('❌ Weather data failed:', e.message);
          return null;
        })
      ]);

      // Process results with proper error handling
      const processResult = (result, fallback) => {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
        console.log('Using fallback for failed result:', result.reason?.message || 'Unknown error');
        return fallback;
      };

      const flights = processResult(flightData, []);
      const hotels = processResult(hotelData, []);
      const attractions = processResult(attractionData, []);
      const restaurants = processResult(restaurantData, { restaurants: [] });
      const weather = processResult(weatherData, null);

      // Create comprehensive data structure matching expected format
      const comprehensiveData = {
        weather: weather,
        departureCity: departureCity,
        budgetPreference: budgetPreference,
        transportation: {
          flights: flights,
          localTransport: 'Public transport and taxis available',
          budgetInfo: {
            transport: '$15-25/day',
            flights: flights.length > 0 ? flights[0].price : '$600-1200'
          }
        },
        accommodation: {
          hotels: hotels,
          budgetInfo: {
            accommodation: '$80-150/day'
          }
        },
        attractions: attractions,
        restaurants: restaurants.restaurants || [],
        budgetInfo: {
          accommodation: '$80-150/day',
          food: restaurants.budgetInfo?.food || '$40-60/day',
          transport: '$15-25/day',
          activities: '$25-40/day'
        },
        safetyInfo: 'Generally safe with normal precautions',
        culturalTips: ['Research local customs', 'Learn basic local phrases'],
        dataSource: 'live_apis',
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Final comprehensive data for ${destination}:`, {
        flights: flights.length,
        hotels: hotels.length,
        attractions: attractions.length,
        restaurants: comprehensiveData.restaurants.length,
        weather: weather ? 'available' : 'unavailable'
      });
      
      return comprehensiveData;
    } catch (error) {
      console.error('Real Data Gathering error:', error);
      
      // Fallback to AI-generated data if real APIs fail
      try {
        const prompt = `You are a DataScout agent specializing in destination research. Provide comprehensive travel data for ${destination} for a ${duration} trip.

RESEARCH TASK:
Create detailed travel information in this JSON format. Return ONLY valid JSON without any markdown formatting or code blocks:

{
  "weather": {
    "current": "current weather conditions",
    "forecast": "7-day weather forecast",
    "bestTime": "best time to visit recommendations"
  },
  "transportation": {
    "flights": {
      "priceRange": "typical flight price range",
      "airlines": ["major airlines serving this destination"],
      "duration": "typical flight duration"
    },
    "localTransport": "best local transportation options"
  },
  "accommodation": {
    "hotels": [
      {
        "name": "hotel name",
        "rating": 4,
        "location": "area/neighborhood",
        "price": "price range per night"
      }
    ],
    "neighborhoods": ["recommended areas to stay"]
  },
  "attractions": ["must-see attractions"],
  "restaurants": [
    {
      "name": "restaurant name",
      "cuisine": "type of cuisine",
      "location": "area",
      "specialty": "signature dish"
    }
  ],
  "budgetInfo": {
    "accommodation": "daily accommodation budget",
    "food": "daily food budget",
    "transport": "daily transport budget",
    "activities": "daily activities budget"
  },
  "safetyInfo": "safety tips",
  "culturalTips": ["cultural etiquette and local customs"]
}

Provide realistic, helpful information for trip planning.`;

        const response = await this.callGemini(prompt);
        const parsedResponse = this.parseAIResponse(response);
        
        if (!parsedResponse) {
          throw new Error('Failed to parse AI response as JSON');
        }
        
        console.log(`🔄 Fallback to AI-generated data for ${destination}`);
        return parsedResponse;
      } catch (aiError) {
        console.error('AI Data Gathering fallback error:', aiError);
        return {
          weather: { current: 'Pleasant conditions', forecast: 'Favorable weather', bestTime: 'Year-round destination' },
          transportation: { flights: { priceRange: '$600-1200', airlines: ['Various'], duration: '8-12 hours' }, localTransport: 'Public transport available' },
          accommodation: { hotels: [{ name: 'City Center Hotel', rating: 4, location: 'Downtown', price: '$120-180/night' }], neighborhoods: ['City Center'] },
          attractions: ['Main landmark', 'Historic district'],
          restaurants: [{ name: 'Local Favorite', cuisine: 'Local', location: 'City Center', specialty: 'Regional dishes' }],
          budgetInfo: { accommodation: '$80-150/day', food: '$40-60/day', transport: '$15-25/day', activities: '$25-40/day' },
          safetyInfo: 'Generally safe with normal precautions',
          culturalTips: ['Research local customs']
        };
      }
    }
  }

  /**
   * Simulate comprehensive data gathering (replace with actual DataScout later)
   */
  async simulateDataGathering(destination) {
    return new Promise(resolve => {
      setTimeout(() => {
        const destinationData = this.getDestinationData(destination);

        resolve({
          weather: {
            current: `Current weather in ${destination}: ${destinationData.weather}`,
            forecast: `7-day forecast: ${destinationData.forecast}`,
            bestTime: destinationData.bestTime
          },
          transportation: {
            flights: {
              priceRange: destinationData.flightPrices,
              airlines: destinationData.airlines,
              duration: destinationData.flightDuration
            },
            localTransport: destinationData.localTransport,
            tips: destinationData.transportTips
          },
          accommodation: {
            hotels: destinationData.hotels,
            neighborhoods: destinationData.neighborhoods,
            priceRanges: destinationData.hotelPrices
          },
          attractions: destinationData.attractions,
          restaurants: destinationData.restaurants,
          budgetInfo: destinationData.budgetBreakdown,
          safetyInfo: destinationData.safety,
          culturalTips: destinationData.cultural
        });
      }, 1500);
    });
  }

  /**
   * AI-powered itinerary creation
   */
  async aiItineraryCreation(tripDetails, userProfile, profile) {
    try {
      const days = parseInt(tripDetails.duration) || 5;
      const destination = tripDetails.destination;
      
      const prompt = `You are an ItineraryArchitect agent. Create a detailed ${days}-day itinerary for ${destination} based on this user profile and analysis.

USER PROFILE:
- Name: ${userProfile.name || 'Traveler'}
- Interests: ${userProfile.interests?.join(', ') || 'General sightseeing'}
- Travel Style: ${profile.travelStyle?.join(', ') || 'Moderate'}
- Travel Personality: ${profile.travelPersonality}

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${days} days
- Travelers: ${tripDetails.travelers.join(', ')}

ITINERARY TASK:
Create a comprehensive itinerary in this JSON format. Return ONLY valid JSON without any markdown formatting or code blocks:

{
  "duration": "${days} days",
  "destination": "${destination}",
  "dailyPlans": [
    {
      "day": 1,
      "title": "Day 1: Arrival and City Introduction",
      "activities": [
        {
          "time": "10:00",
          "name": "Arrival and Check-in",
          "location": "Hotel",
          "description": "Settle in and get oriented",
          "duration": "2 hours",
          "cost": "Included in accommodation"
        }
      ]
    }
  ],
  "highlights": ["key highlights of the trip"],
  "recommendations": {
    "packingList": ["essential items to pack"],
    "travelTips": ["helpful travel tips"],
    "budgetBreakdown": {
      "accommodation": "total accommodation cost",
      "meals": "total food cost",
      "transportation": "total transport cost",
      "activities": "total activities cost"
    }
  }
}

Make it personalized to the user's interests and travel style. Include realistic timing, locations, and costs.`;

      const response = await this.callGemini(prompt);
      const parsedResponse = this.parseAIResponse(response);
      
      if (!parsedResponse) {
        throw new Error('Failed to parse AI response as JSON');
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('AI Itinerary Creation error:', error);
      const days = parseInt(tripDetails.duration) || 5;
      return {
        duration: `${days} days`,
        destination: tripDetails.destination,
        dailyPlans: Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}: ${i === 0 ? 'Arrival and Orientation' : i === days - 1 ? 'Departure Day' : 'Exploring the City'}`,
          activities: [
            {
              time: i === 0 ? '10:00' : '09:00',
              name: i === 0 ? 'Arrival and Check-in' : i === days - 1 ? 'Departure' : 'Morning Activity',
              location: i === 0 ? 'Hotel' : 'City Center',
              description: i === 0 ? 'Settle in and get oriented' : i === days - 1 ? 'Check out and depart' : 'Explore local attractions',
              duration: '2-3 hours',
              cost: i === 0 ? 'Included' : '$20-40'
            }
          ]
        })),
        highlights: ['Main attractions', 'Local culture', 'Authentic experiences'],
        recommendations: {
          packingList: ['Comfortable walking shoes', 'Weather-appropriate clothing', 'Universal adapter'],
          travelTips: ['Download offline maps', 'Learn basic local phrases', 'Keep copies of important documents'],
          budgetBreakdown: {
            accommodation: `$${100 * days} - $${200 * days}`,
            meals: `$${50 * days} - $${80 * days}`,
            transportation: `$${20 * days} - $${40 * days}`,
            activities: `$${30 * days} - $${60 * days}`
          }
        }
      };
    }
  }

  /**
   * Simulate comprehensive itinerary creation (replace with actual ItineraryArchitect later)
   */
  async simulateItineraryCreation(tripDetails, userProfile) {
    return new Promise(resolve => {
      setTimeout(() => {
        const days = parseInt(tripDetails.duration) || 5;
        const destination = tripDetails.destination;
        const interests = userProfile.interests || ['sightseeing'];

        const dailyItinerary = this.generateSampleItinerary(destination, days, interests);

        resolve({
          duration: `${days} days`,
          destination: destination,
          dailyPlans: dailyItinerary,
          highlights: this.generateHighlights(destination, interests),
          recommendations: {
            packingList: this.generatePackingList(destination),
            travelTips: this.generateTravelTips(destination),
            budgetBreakdown: this.generateBudgetBreakdown(destination, days)
          }
        });
      }, 2000);
    });
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
- budgetPreference: One of ["Budget", "Mid-range", "Luxury"]. Look for:
  * Dollar amounts under $1000 total budget OR "budget", "cheap", "affordable", "budget-friendly" → "Budget"
  * Dollar amounts $1000-$3000 total budget OR "mid-range", "moderate", "average" → "Mid-range"  
  * Dollar amounts over $3000 total budget OR "luxury", "high-end", "premium", "luxurious" → "Luxury"
  * If user mentions "$500" or any specific amount, categorize it based on the ranges above
  * IGNORE the dollar amount itself and ONLY return the category (Budget/Mid-range/Luxury)

IMPORTANT: 
- If user says "just create a trip" or "any island" or similar, infer they want "solo" travel unless they mention companions
- If user provides a specific dollar amount like "$500", convert it to the appropriate category ("Budget") - DO NOT store the number
- Convert all duration formats to "X days" (e.g., "4 days", "5 days")

Return ONLY this JSON format:
{
  "destination": "city/country name or null",
  "duration": "X days or null",
  "travelers": ["solo"] or ["duo"] or ["group"] or [],
  "departureCity": "city name or null",
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
   * AI-powered final plan compilation
   */
  async aiCompileFinalPlan(tripDetails, results, userContext) {
    try {
      const prompt = `You are the ChiefTravelPlanner agent. Compile all the specialist agent results into a comprehensive, engaging trip plan.

TRIP DETAILS:
- Destination: ${tripDetails.destination}
- Duration: ${tripDetails.duration}
- Travelers: ${tripDetails.travelers.join(', ')}

SPECIALIST RESULTS:
Profile Analysis: ${JSON.stringify(results.profile, null, 2)}
Destination Data: ${JSON.stringify(results.data, null, 2)}
Itinerary: ${JSON.stringify(results.itinerary, null, 2)}

COMPILATION TASK:
Create a comprehensive trip plan in this JSON format. Return ONLY valid JSON without any markdown formatting or code blocks:

{
  "tripInfo": {
    "destination": "${tripDetails.destination}",
    "duration": "${tripDetails.duration}",
    "companions": "description of travel companions",
    "travelStyle": ["travel style"],
    "budget": "total budget range"
  },
  "itinerary": "formatted daily itinerary",
  "recommendations": {
    "accommodation": ["accommodation recommendations"],
    "restaurants": ["restaurant recommendations"],
    "transportation": "transportation recommendations",
    "budgetBreakdown": "detailed budget breakdown",
    "travelTips": ["essential travel tips"],
    "packingList": ["packing recommendations"],
    "weather": "weather information and advice"
  },
  "profile": "travel personality summary",
  "data": "destination data summary",
  "compiledAt": "timestamp",
  "message": "engaging summary message for the user"
}

Make it engaging, practical, and personalized. The message should be exciting and make the user feel confident about their upcoming trip.`;

      const response = await this.callGemini(prompt);
      
      // Clean the response to extract JSON from markdown code blocks
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const compiledPlan = JSON.parse(cleanResponse);
      
      // Ensure we have a proper message
      if (!compiledPlan.message) {
        compiledPlan.message = `🌟 **Your Perfect ${tripDetails.destination} Adventure is Ready!** 🌟\n\nI've crafted an amazing ${tripDetails.duration} trip to ${tripDetails.destination} just for you! This plan is completely personalized based on your travel style and preferences.`;
      }
      
      // CRITICAL: Inject actual flight and hotel data from results.data
      // The AI-generated JSON might not preserve the exact structure of arrays
      if (!compiledPlan.recommendations) {
        compiledPlan.recommendations = {};
      }
      
      // Inject real flight data (check both data.flights and data.transportation.flights)
      const flights = results.data?.flights || results.data?.transportation?.flights || [];
      if (flights.length > 0) {
        if (!compiledPlan.recommendations.transportation) {
          compiledPlan.recommendations.transportation = {};
        }
        compiledPlan.recommendations.transportation.flights = flights;
        console.log(`✅ Injected ${flights.length} real flight options into compiled plan`);
      }
      
      // Inject real hotel data (check both data.hotels and data.accommodation.hotels)
      const hotels = results.data?.hotels || results.data?.accommodation?.hotels || [];
      if (hotels.length > 0) {
        if (!compiledPlan.recommendations.accommodation) {
          compiledPlan.recommendations.accommodation = {};
        }
        // Preserve accommodation text if it exists, but add hotels array
        if (typeof compiledPlan.recommendations.accommodation === 'string' || Array.isArray(compiledPlan.recommendations.accommodation)) {
          const existingText = compiledPlan.recommendations.accommodation;
          compiledPlan.recommendations.accommodation = {
            text: existingText,
            hotels: hotels
          };
        } else {
          compiledPlan.recommendations.accommodation.hotels = hotels;
        }
        console.log(`✅ Injected ${hotels.length} real hotel options into compiled plan`);
      }
      
      // Inject weather data
      if (results.data && results.data.weather) {
        compiledPlan.recommendations.weather = results.data.weather;
      }
      
      // Inject departure city and budget preference
      compiledPlan.recommendations.departureCity = tripDetails.departureCity;
      compiledPlan.recommendations.budgetPreference = tripDetails.budgetPreference;
      
      return compiledPlan;
    } catch (error) {
      console.error('AI Final Plan Compilation error:', error);
      // Fallback compilation
      return {
        tripInfo: {
          destination: tripDetails.destination,
          duration: tripDetails.duration,
          companions: tripDetails.travelers[0] === 'solo' ? 'Solo travel' : 'Group travel',
          travelStyle: results.profile.travelStyle || ['culture'],
          budget: results.profile.recommendations?.budgetRange || '$100-200/day'
        },
        itinerary: results.itinerary.dailyPlans || [],
        recommendations: {
          // Fix data structure to properly pass flights, hotels, and weather
          transportation: {
            flights: results.data.transportation?.flights || [],
            localTransport: results.data.transportation?.localTransport || 'Public transport'
          },
          accommodation: {
            hotels: results.data.accommodation?.hotels || []
          },
          restaurants: results.data.restaurants || [],
          budgetBreakdown: results.itinerary.recommendations?.budgetBreakdown || {},
          travelTips: results.itinerary.recommendations?.travelTips || [],
          packingList: results.itinerary.recommendations?.packingList || [],
          weather: results.data.weather || null,
          departureCity: results.data.departureCity || tripDetails.departureCity,
          budgetPreference: results.data.budgetPreference || tripDetails.budgetPreference
        },
        profile: results.profile,
        data: results.data,
        compiledAt: new Date().toISOString(),
        message: `🌟 **Your Perfect ${tripDetails.destination} Adventure is Ready!** 🌟\n\nI've crafted an amazing ${tripDetails.duration} trip to ${tripDetails.destination} just for you! This plan is completely personalized based on your travel style and preferences.`
      };
    }
  }

  async compileFinalPlan(tripDetails, results) {
    return {
      tripInfo: {
        destination: tripDetails.destination,
        duration: tripDetails.duration,
        companions: tripDetails.travelers[0] === 'solo' ? 'Solo travel' : tripDetails.travelers[0] === 'duo' ? 'With a companion' : 'Group travel',
        travelStyle: results.profile.travelStyle,
        budget: results.profile.recommendations.budgetRange
      },
      itinerary: results.itinerary.dailyPlans || [],
      recommendations: {
        accommodation: results.data.accommodation.hotels || [],
        restaurants: results.data.restaurants || [],
        transportation: {
          localTransport: results.data.transportation.localTransport,
          tips: results.data.transportation.tips || []
        },
        budgetBreakdown: results.itinerary.recommendations.budgetBreakdown || {},
        travelTips: results.itinerary.recommendations.travelTips || [],
        packingList: results.itinerary.recommendations.packingList || [],
        weather: results.data.weather.current || ''
      },
      profile: results.profile,
      data: results.data,
      compiledAt: new Date().toISOString()
    };
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
      
      // Old narrative code below is skipped
      if (false && recommendations.transportation) {
        comprehensiveMessage += `Getting around is easy once you know the tricks. `;

        if (recommendations.transportation.localTransport) {
          comprehensiveMessage += `Your best bet for getting around is ${recommendations.transportation.localTransport}. `;
        }

        if (recommendations.transportation.tips && recommendations.transportation.tips.length > 0) {
          comprehensiveMessage += `Here are some insider tips that'll save you time and hassle: `;
          recommendations.transportation.tips.forEach((tip, idx) => {
            if (idx > 0) comprehensiveMessage += `, `;
            comprehensiveMessage += `${tip.toLowerCase()}`;
          });
          comprehensiveMessage += `.`;
        }

        comprehensiveMessage += `\n\n`;
      }

      // Budget Breakdown in pure paragraph format - NO headers
      if (recommendations.budgetBreakdown && Object.keys(recommendations.budgetBreakdown).length > 0) {
        comprehensiveMessage += `Let's talk money for a second. `;

        const budgetEntries = Object.entries(recommendations.budgetBreakdown);
        budgetEntries.forEach(([category, amount], idx) => {
          const catName = category.charAt(0).toUpperCase() + category.slice(1);

          if (idx === 0) {
            comprehensiveMessage += `You're looking at roughly ${amount} for ${catName.toLowerCase()}`;
          } else if (idx === budgetEntries.length - 1) {
            comprehensiveMessage += `, and ${amount} for ${catName.toLowerCase()}`;
          } else {
            comprehensiveMessage += `, ${amount} for ${catName.toLowerCase()}`;
          }
        });

        comprehensiveMessage += `. This gives you a comfortable trip without overspending, leaving room for those spontaneous moments that make travel magical.\n\n`;
      }

      // Travel Tips in pure paragraph format - NO headers
      if (recommendations.travelTips && recommendations.travelTips.length > 0) {
        comprehensiveMessage += `Here's some travel wisdom that'll make your trip smoother. `;

        recommendations.travelTips.forEach((tip, idx) => {
          if (idx === 0) {
            comprehensiveMessage += `${tip}`;
          } else {
            comprehensiveMessage += ` ${tip}`;
          }

          if (idx < recommendations.travelTips.length - 1) {
            comprehensiveMessage += `.`;
          }
        });

        comprehensiveMessage += `. These little insights can turn a good trip into an extraordinary one.\n\n`;
      }

      // Weather Information in pure paragraph format - NO headers
      if (recommendations.weather) {
        comprehensiveMessage += `Weather-wise, ${recommendations.weather.toLowerCase()} This is actually perfect timing for your adventure, giving you comfortable conditions to explore without the extremes. Pack accordingly and you'll be set! `;
      }

      // Packing Suggestions in pure paragraph format - NO headers
      if (recommendations.packingList && recommendations.packingList.length > 0) {
        comprehensiveMessage += `You don't need to bring your entire closet, but these essentials will make your life so much easier: `;

        recommendations.packingList.forEach((item, idx) => {
          if (idx === recommendations.packingList.length - 1) {
            comprehensiveMessage += `and ${item.toLowerCase()}`;
          } else if (idx > 0) {
            comprehensiveMessage += `, ${item.toLowerCase()}`;
          } else {
            comprehensiveMessage += `${item.toLowerCase()}`;
          }
        });

        comprehensiveMessage += `. Trust me, you'll thank yourself for bringing these!\n\n`;
      }

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
   * Helper methods for generating sample destination data
   */
  getDestinationData(destination) {
    const destinations = {
      'Japan': {
        weather: '18°C, cherry blossom season',
        forecast: 'Mild temperatures, occasional rain',
        bestTime: 'Spring (March-May) for cherry blossoms, Fall for autumn colors',
        flightPrices: '$800-1500',
        airlines: ['JAL', 'ANA', 'United'],
        flightDuration: '12-16 hours',
        localTransport: 'JR Pass for trains, IC cards for local transport',
        transportTips: ['Get JR Pass before arrival', 'Download Google Translate', 'Cash is preferred'],
        hotels: [
          { name: 'Hotel Gracery Shinjuku', rating: 4, location: 'Shinjuku', price: '$150-200/night', highlights: 'Godzilla views' },
          { name: 'Ryokan Yamashiro', rating: 5, location: 'Kyoto', price: '$300-400/night', highlights: 'Traditional experience' }
        ],
        neighborhoods: ['Shinjuku (modern)', 'Kyoto (traditional)', 'Harajuku (trendy)'],
        hotelPrices: 'Budget: $50-80, Mid: $100-200, Luxury: $300+',
        attractions: ['Tokyo Skytree', 'Fushimi Inari Shrine', 'Senso-ji Temple'],
        restaurants: [
          { name: 'Sukiyabashi Jiro', cuisine: 'Sushi', location: 'Ginza', specialty: 'Omakase', priceRange: '$300-400' },
          { name: 'Ichiran Ramen', cuisine: 'Ramen', location: 'Multiple', specialty: 'Tonkotsu Ramen', priceRange: '$10-15' }
        ],
        budgetBreakdown: { accommodation: '$100-200/day', food: '$50-80/day', transport: '$20-30/day', activities: '$30-50/day' },
        safety: 'Extremely safe, low crime rate',
        cultural: ['Remove shoes indoors', 'Bow when greeting', 'No tipping culture']
      },
      'default': {
        weather: '22°C, pleasant conditions',
        forecast: 'Generally favorable weather',
        bestTime: 'Year-round destination',
        flightPrices: '$600-1200',
        airlines: ['Various carriers available'],
        flightDuration: '8-12 hours',
        localTransport: 'Public transport and taxis available',
        transportTips: ['Research local transport apps', 'Keep small bills handy'],
        hotels: [
          { name: 'City Center Hotel', rating: 4, location: 'Downtown', price: '$120-180/night', highlights: 'Central location' }
        ],
        neighborhoods: ['City Center', 'Old Town', 'Modern District'],
        hotelPrices: 'Budget: $40-70, Mid: $80-150, Luxury: $200+',
        attractions: ['Main landmark', 'Historic district', 'Cultural sites'],
        restaurants: [
          { name: 'Local Favorite', cuisine: 'Local', location: 'City Center', specialty: 'Regional dishes', priceRange: '$20-40' }
        ],
        budgetBreakdown: { accommodation: '$80-150/day', food: '$40-60/day', transport: '$15-25/day', activities: '$25-40/day' },
        safety: 'Generally safe with normal precautions',
        cultural: ['Research local customs', 'Respect local traditions']
      }
    };

    return destinations[destination] || destinations['default'];
  }

  generateSampleItinerary(destination, days, interests) {
    const itineraryTemplates = {
      'Japan': [
        {
          title: 'Tokyo Arrival & Modern Exploration',
          activities: [
            { time: '10:00', name: 'Arrive at Narita/Haneda Airport', location: 'Airport', description: 'Immigration and transport to hotel' },
            { time: '14:00', name: 'Check-in and Shibuya Crossing', location: 'Shibuya', description: 'Experience the worlds busiest crossing' },
            { time: '16:00', name: 'Meiji Shrine Visit', location: 'Shibuya', description: 'Peaceful shrine in the heart of Tokyo' },
            { time: '18:00', name: 'Harajuku Street Food Tour', location: 'Harajuku', description: 'Quirky fashion and amazing street food' }
          ]
        },
        {
          title: 'Traditional Tokyo & Temples',
          activities: [
            { time: '09:00', name: 'Senso-ji Temple', location: 'Asakusa', description: 'Tokyos oldest Buddhist temple' },
            { time: '11:00', name: 'Traditional Shopping at Nakamise', location: 'Asakusa', description: 'Traditional snacks and souvenirs' },
            { time: '14:00', name: 'Tokyo Skytree', location: 'Sumida', description: 'Panoramic city views' },
            { time: '17:00', name: 'Izakaya Dinner Experience', location: 'Shinjuku', description: 'Authentic Japanese dining culture' }
          ]
        }
      ]
    };

    const template = itineraryTemplates[destination] || [
      {
        title: `Day 1 - Arrival and City Introduction`,
        activities: [
          { time: '10:00', name: 'Arrival and Check-in', location: 'Hotel', description: 'Settle in and get oriented' },
          { time: '14:00', name: 'City Center Exploration', location: 'Downtown', description: 'Get familiar with the main area' },
          { time: '17:00', name: 'Welcome Dinner', location: 'Local Restaurant', description: 'Try the local cuisine' }
        ]
      },
      {
        title: `Day 2 - Cultural Highlights`,
        activities: [
          { time: '09:00', name: 'Main Cultural Site', location: 'Historic District', description: 'Explore the main cultural attraction' },
          { time: '14:00', name: 'Local Market Visit', location: 'Market District', description: 'Experience local life and shopping' },
          { time: '16:00', name: 'Scenic Viewpoint', location: 'High Point', description: 'Best views of the city' }
        ]
      }
    ];

    return template.slice(0, days);
  }

  generateHighlights(destination, interests) {
    const highlights = {
      culture: 'Immersive cultural experiences and historic sites',
      food: 'Authentic culinary adventures and local delicacies',
      adventure: 'Exciting activities and unique experiences',
      sightseeing: 'Must-see landmarks and scenic viewpoints'
    };

    const relevantHighlights = interests.map(interest => highlights[interest] || highlights.sightseeing);
    return `Perfect for ${interests.join(' and ')} enthusiasts: ${relevantHighlights.join(', ')}`;
  }

  generatePackingList(destination) {
    return [
      'Comfortable walking shoes',
      'Weather-appropriate clothing',
      'Universal power adapter',
      'Portable phone charger',
      'Travel documents and copies',
      'Basic first aid kit',
      'Local currency and cards',
      'Camera or phone for photos'
    ];
  }

  generateTravelTips(destination) {
    return [
      'Download offline maps and translation apps',
      'Research local customs and etiquette',
      'Keep important documents secure',
      'Stay hydrated and take breaks',
      'Try to learn basic local phrases',
      'Be flexible with your itinerary',
      'Take plenty of photos and enjoy the moment!'
    ];
  }

  generateBudgetBreakdown(destination, days) {
    return {
      accommodation: `$80-200 per night (${days} nights)`,
      meals: '$40-80 per day',
      transportation: '$20-40 per day',
      activities: '$30-60 per day',
      miscellaneous: '$20-30 per day',
      total: `$${(150 * days)} - $${(410 * days)} estimated`
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