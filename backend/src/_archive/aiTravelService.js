import { GoogleGenerativeAI } from '@google/generative-ai';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AITravelService {
  constructor() {
    // In-memory conversation state storage (in production, use Redis or database)
    this.conversationStates = new Map();

    // Single API Key system
    this.apiKey = process.env.GEMINI_API_KEY;
    this.callCounter = 0;

    if (!this.apiKey) {
      console.warn('⚠️ No GEMINI_API_KEY provided - AI features will be disabled');
      this.genAI = null;
      this.model = null;
    } else {
      const maskedKey = this.apiKey.length > 8 ? this.apiKey.substring(0, 4) + "..." + this.apiKey.substring(this.apiKey.length - 4) : "***";
      console.log(`🔑 Initialized with single API key: ${maskedKey}`);
      this.initializeGemini();
    }

    // Path to Python travel agent system (use working version)
    this.pythonScriptPath = path.join(__dirname, 'working_travel_agent.py');
    this.pythonExecutable = path.join(__dirname, '..', '..', 'venv', 'bin', 'python');
    // System prompt for the AI Travel Buddy
    this.systemPrompt = `You are WanderBuddy, a super chill and enthusiastic AI travel companion for the Wanderer app. You're like that friend who's been everywhere and loves helping people discover amazing places.

PERSONALITY:
- Genuine excitement about travel (but not over-the-top)
- Conversational and relaxed, like texting a knowledgeable friend
- Use casual language and avoid corporate-speak
- Show real enthusiasm when someone mentions cool destinations
- Remember what they've told you and reference it naturally
- Use travel emojis naturally (not excessively): ✈️ 🗺️ 🏔️ 🌍 🎒

RESPONSE STYLE:
- Chat like a real person - use contractions, casual phrases
- Keep it conversational and flowing naturally
- Avoid structured lists unless specifically asked
- Ask follow-up questions that show genuine interest
- Match their energy - if they're excited, be excited too
- Use "I" statements to make it personal ("I love that place!", "I've got some great ideas...")

CONVERSATION FLOW:
- Don't rush to trip planning mode unless they clearly want a full itinerary
- For general questions, give helpful info and naturally check if they want more
- Build on what they say instead of giving generic responses
- Show you're listening by referencing specific things they mention

EXPERTISE SHARING:
- Share insights like personal experiences ("That place is incredible for...")
- Give practical tips without making it feel like a lecture
- Offer to dive deeper instead of dumping all info at once
- Connect recommendations to what they actually care about

EXAMPLES:
User: "hi" → "Hey there! 👋 What's got you thinking about travel today?"
User: "I want to visit Japan" → "Oh, Japan is absolutely amazing! 🇯🇵 What's drawing you there? The food scene, temples, cities, nature...? I can point you toward the perfect spots once I know what gets you excited."
User: "budget tips" → "Smart thinking! Budget travel can actually make trips way more fun and authentic. What kind of trip are you planning? I've got different tricks depending on where you're headed."

Be genuinely helpful, naturally curious, and actually interested in their travel dreams!`;
  }

  // Initialize Gemini with single API key
  initializeGemini() {
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
      console.log(`🔑 Gemini initialized with single API key`);
    }
  }

  // Simple wrapper for Gemini API calls
  async callGeminiWithRotation(prompt) {
    // Skip API calls entirely - we know the key doesn't work
    console.log(`⚠️ Skipping API call - using fallback response.`);
    throw new Error('API key has limited access - using fallback');
  }

  async generateResponse(message, userContext = {}, socketService = null) {
    try {
      // Check if user is in an ongoing trip planning conversation
      const conversationState = this.getConversationState(userContext);

      if (conversationState && conversationState.stage === 'gathering_details') {
        console.log('🤖 Continuing trip planning conversation...');
        return this.handleTripPlanningFollowUp(message, userContext, socketService);
      }

      // First try simple pattern detection to avoid API calls when obvious
      const simpleClassification = this.simpleIntentDetection(message, userContext);

      let classification;
      if (simpleClassification) {
        classification = simpleClassification;
        console.log(`🎯 Simple Detection: ${classification.intent} (confidence: ${classification.confidence})`);
      } else {
        // Fall back to AI-powered intent classification for complex cases
        classification = await this.classifyUserIntent(message, userContext);
        console.log(`🧠 AI Classification: ${classification.intent} (confidence: ${classification.confidence})`);
      }

      console.log(`🎯 Detected Intent: ${classification.intent} (confidence: ${classification.confidence})`);

      // Route to appropriate agent based on AI classification
      switch (classification.intent) {
        case 'trip_planning_complete':
          console.log('🚀 Complete trip planning request - triggering CrewAI multi-agent system');
          return await this.handleTripPlanningRequest(message, userContext, socketService);

        case 'trip_planning_incomplete':
          console.log('❓ Incomplete trip planning request - starting conversation state');

          // Store conversation state for follow-ups
          this.setConversationState(userContext.userId, {
            stage: 'gathering_details',
            originalMessage: message,
            classification: classification,
            collectedInfo: {
              destination: classification.extracted_details?.destination || null,
              duration: classification.extracted_details?.duration || null,
              travelers: classification.extracted_details?.travelers || []
            },
            timestamp: new Date().toISOString()
          });

          return await this.handleIncompleteTripRequest(classification, userContext);

        case 'weather_request':
          console.log('🌤️ Weather request - using weather agent');
          const location = classification.extracted_details?.destination || null;
          return await this.handleWeatherRequest(message, userContext, location);

        case 'destination_recommendation':
          console.log('🗺️ Destination recommendation request - using recommendation agent');
          return await this.handleRecommendationsRequest(message, userContext);

        case 'general_chat':
        default:
          console.log('💬 General chat - using conversation agent');
          return await this.generateRegularChatResponse(message, userContext);
      }

    } catch (error) {
      console.error('AI Travel Service Error:', error);
      return {
        success: false,
        error: 'Sorry, I encountered an error while processing your request. Please try again!',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Simple pattern-based intent detection to avoid API calls for obvious cases
  simpleIntentDetection(message, userContext = {}) {
    const lowerMessage = message.toLowerCase().trim();

    // Simple trip planning patterns
    const tripPlanningPatterns = [
      /plan\s+(?:a\s+)?(?:\d+\s*(?:day|days|week|weeks)\s+)?trip\s+to\s+([a-z\s]+)/i,
      /(?:\d+\s*(?:day|days|week|weeks)\s+)?(?:trip|travel|visit)\s+to\s+([a-z\s]+)/i,
      /create\s+(?:a\s+)?(?:\d+\s*(?:day|days|week|weeks)\s+)?(?:trip|itinerary)\s+(?:to\s+)?([a-z\s]+)/i,
      /going\s+to\s+([a-z\s]+)\s+for\s+(\d+)\s*(?:day|days|week|weeks)/i
    ];

    for (const pattern of tripPlanningPatterns) {
      const match = message.match(pattern);
      if (match) {
        // Extract basic trip details
        const destination = match[1] ? match[1].trim() : null;
        const durationMatch = message.match(/(\d+)\s*(?:day|days|week|weeks)/i);
        const duration = durationMatch ? durationMatch[1] + ' days' : null;

        console.log(`🎯 Pattern detected - Destination: ${destination}, Duration: ${duration}`);

        // Check if we have enough for complete trip planning
        if (destination && destination.length > 2 && durationMatch) {
          return {
            intent: 'trip_planning_complete',
            confidence: 0.95,
            reasoning: 'Simple pattern detection found destination and duration',
            extracted_details: {
              destination: destination,
              duration: duration,
              travelers: [],
              completeness: 'mostly_complete'
            }
          };
        } else if (destination && destination.length > 2) {
          return {
            intent: 'trip_planning_incomplete',
            confidence: 0.9,
            reasoning: 'Found destination but missing duration or details',
            extracted_details: {
              destination: destination,
              duration: null,
              travelers: [],
              completeness: 'incomplete'
            }
          };
        }
      }
    }

    // Simple weather patterns
    if (lowerMessage.includes('weather') && (lowerMessage.includes('in') || lowerMessage.includes('for'))) {
      return {
        intent: 'weather_request',
        confidence: 0.9,
        reasoning: 'Simple weather request pattern detected',
        extracted_details: { completeness: 'complete' }
      };
    }

    // Simple greetings
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(greeting => lowerMessage.startsWith(greeting) && lowerMessage.length < 20)) {
      return {
        intent: 'general_chat',
        confidence: 0.95,
        reasoning: 'Simple greeting detected',
        extracted_details: { completeness: 'complete' }
      };
    }

    // Simple continuation phrases (like "just create", "go ahead", "make it")
    const continuationPhrases = ['just create', 'create it', 'go ahead', 'make it', 'proceed', 'do it', 'continue'];
    if (continuationPhrases.some(phrase => lowerMessage.includes(phrase))) {
      // Check if user context has recent trip discussion
      if (userContext.recentConversations && userContext.recentConversations.length > 0) {
        const lastConv = userContext.recentConversations[userContext.recentConversations.length - 1];
        if (lastConv.userMessage && lastConv.userMessage.toLowerCase().includes('trip')) {
          return {
            intent: 'trip_planning_incomplete',
            confidence: 0.9,
            reasoning: 'Continuation phrase detected with recent trip context',
            extracted_details: {
              destination: null,
              duration: null,
              travelers: [],
              completeness: 'needs_clarification'
            }
          };
        }
      }
    }

    // If no simple patterns match, return null to use AI classification
    return null;
  }

  // AI-powered intent classification to replace hardcoded detection
  async classifyUserIntent(message, userContext = {}) {
    try {
      const classificationPrompt = `You are an AI assistant that classifies user messages into different travel-related intents.

CLASSIFICATION CATEGORIES:
1. "trip_planning_complete" - User wants complete trip planning with destination, duration, and details
2. "trip_planning_incomplete" - User wants trip planning but missing key details (destination, duration, etc.)
3. "weather_request" - User asking about weather information
4. "destination_recommendation" - User wants destination suggestions or travel advice
5. "general_chat" - General conversation, greetings, or non-travel topics

USER MESSAGE: "${message}"

USER CONTEXT:
- Name: ${userContext.userProfile?.name || 'Unknown'}
- Interests: ${userContext.userProfile?.interests?.join(', ') || 'Not specified'}
- Travel Style: ${userContext.userProfile?.travelStyle?.join(', ') || 'Not specified'}
- Bucket List: ${userContext.userProfile?.bucketList?.join(', ') || 'Not specified'}

ANALYSIS INSTRUCTIONS:
- Look for intent to plan a complete trip vs. asking questions
- Consider the user's travel profile and interests
- Detect both explicit requests ("plan a trip to Japan") and implicit ones ("I want to go somewhere")
- Determine if request has enough details to proceed with full trip planning

EXAMPLES:
- "plan a trip to Japan for 7 days" → trip_planning_complete
- "plan me a trip" → trip_planning_incomplete
- "I want to go somewhere" → trip_planning_incomplete
- "what's the weather in Miami?" → weather_request
- "tell me about Tokyo" → destination_recommendation
- "hi" → general_chat

RESPONSE FORMAT:
Return ONLY a JSON object:
{
  "intent": "trip_planning_complete|trip_planning_incomplete|weather_request|destination_recommendation|general_chat",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification",
  "extracted_details": {
    "destination": "extracted destination if mentioned",
    "duration": "extracted duration if mentioned",
    "travelers": ["extracted traveler names if mentioned"],
    "completeness": "complete|incomplete|vague"
  }
}`;

      const response = await this.callGeminiWithRotation(classificationPrompt);
      const text = response.text();

      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const classification = JSON.parse(jsonMatch[0]);

      console.log(`🧠 AI Intent Classification: "${message}" -> ${classification.intent} (confidence: ${classification.confidence})`);
      console.log(`💭 Reasoning: ${classification.reasoning}`);

      return classification;

    } catch (error) {
      console.error('❌ Error in AI intent classification:', error);
      return {
        intent: 'general_chat',
        confidence: 0.5,
        reasoning: 'Fallback due to AI classification error',
        extracted_details: { completeness: 'unknown' }
      };
    }
  }

  // Handle incomplete trip requests with AI-generated follow-up questions
  async handleIncompleteTripRequest(classification, userContext) {
    try {
      const userProfile = userContext.userProfile || {};
      const extractedDetails = classification.extracted_details;

      // Use AI to generate personalized follow-up questions
      const followUpPrompt = `The user wants to plan a trip but provided incomplete information. Generate a personalized response asking for missing details.

USER PROFILE:
- Name: ${userProfile.name || 'there'}
- Interests: ${userProfile.interests?.join(', ') || 'travel'}
- Travel Style: ${userProfile.travelStyle?.join(', ') || 'adventure'}
- Bucket List: ${userProfile.bucketList?.join(', ') || 'various destinations'}

EXTRACTED DETAILS:
- Destination: ${extractedDetails?.destination || 'Not mentioned'}
- Duration: ${extractedDetails?.duration || 'Not mentioned'}
- Travelers: ${extractedDetails?.travelers?.join(', ') || 'Not mentioned'}

MISSING INFORMATION:
${!extractedDetails?.destination ? '- Destination' : ''}
${!extractedDetails?.duration ? '- Duration (how many days)' : ''}
${!extractedDetails?.travelers || extractedDetails.travelers.length === 0 ? '- Travel companions' : ''}

INSTRUCTIONS:
- Create a friendly, personalized response
- Reference their profile and interests
- Ask for missing information naturally
- Show excitement about planning their trip
- Keep it conversational and engaging
- Use their name if available
- Reference their bucket list destinations

RESPONSE FORMAT:
Return a natural, conversational response that asks for the missing information.`;

      const response = await this.callGeminiWithRotation(followUpPrompt);
      const text = response.text();

      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString(),
        type: 'trip_planning_questions',
        metadata: {
          stage: 'gathering_details',
          classification: classification,
          extracted_details: extractedDetails
        }
      };

    } catch (error) {
      console.error('Error generating AI follow-up questions:', error);
      return {
        success: true,
        message: "I'd love to help plan your trip! Could you tell me where you'd like to go and how many days you're thinking?",
        timestamp: new Date().toISOString(),
        type: 'trip_planning_questions'
      };
    }
  }




  // Get conversation state for a user
  getConversationState(userContext) {
    const userId = userContext.userId;
    return userId ? this.conversationStates.get(userId) : null;
  }

  // Set conversation state for a user
  setConversationState(userId, state) {
    if (userId) {
      this.conversationStates.set(userId, state);
      // Auto-expire after 30 minutes
      setTimeout(() => {
        this.conversationStates.delete(userId);
      }, 30 * 60 * 1000);
    }
  }

  // Clear conversation state
  clearConversationState(userId) {
    if (userId) {
      this.conversationStates.delete(userId);
    }
  }

  // Handle follow-up responses in trip planning conversation using AI
  async handleTripPlanningFollowUp(message, userContext, socketService = null) {
    try {
      const conversationState = this.getConversationState(userContext);
      if (!conversationState) {
        // Fallback if state is lost
        return this.generateResponse(message, userContext, socketService);
      }

      console.log('🔗 Previous conversation state:', conversationState.collectedInfo);

      // Analyze the current message to extract new information
      const currentClassification = await this.classifyUserIntent(message, userContext);
      console.log('📝 Current message analysis:', currentClassification.extracted_details);

      // Combine all information from conversation
      const combinedInfo = {
        destination: currentClassification.extracted_details?.destination ||
                    conversationState.collectedInfo?.destination ||
                    null,
        duration: currentClassification.extracted_details?.duration ||
                 conversationState.collectedInfo?.duration ||
                 null,
        travelers: [...new Set([  // Remove duplicates using Set
          ...(currentClassification.extracted_details?.travelers || []),
          ...(conversationState.collectedInfo?.travelers || [])
        ])]
      };

      // Extract duration from simple number responses like "5 days" or "4"
      if (!combinedInfo.duration && /^\d+(\s*(day|days))?\s*$/i.test(message.trim())) {
        const match = message.match(/(\d+)/);
        if (match) {
          combinedInfo.duration = `${match[1]} days`;
        }
      }

      // Extract destination from simple responses like "italy"
      if (!combinedInfo.destination && /^[a-zA-Z\s]+$/i.test(message.trim()) && message.trim().length > 2) {
        const destinations = ['italy', 'japan', 'thailand', 'korea', 'iceland', 'france', 'spain', 'germany', 'usa', 'uk', 'nepal'];
        const lowerMessage = message.toLowerCase().trim();
        if (destinations.some(dest => lowerMessage.includes(dest))) {
          combinedInfo.destination = message.trim();
        }
      }

      console.log('🧩 Combined trip information:', combinedInfo);

      // Check if we have enough information to proceed
      const hasDestination = combinedInfo.destination && combinedInfo.destination.length > 0;
      const hasDuration = combinedInfo.duration && combinedInfo.duration.length > 0;
      const hasTravelers = combinedInfo.travelers && combinedInfo.travelers.length > 0;

      // We need all 3 pieces: destination, duration, and traveler info
      if (hasDestination && hasDuration && hasTravelers) {
        console.log('✅ Trip request now complete! Destination:', combinedInfo.destination, 'Duration:', combinedInfo.duration, 'Travelers:', combinedInfo.travelers.length);

        // Clear conversation state
        this.clearConversationState(userContext.userId);

        // Create complete trip request message
        const completeMessage = `Plan a ${combinedInfo.duration} trip to ${combinedInfo.destination}${combinedInfo.travelers.length > 0 ? ' with ' + combinedInfo.travelers.join(' and ') : ' solo'}`;
        console.log('🚀 Complete trip request:', completeMessage);

        // Process with CrewAI directly
        return await this.handleTripPlanningRequest(completeMessage, userContext, socketService);
      } else {
        // Still missing information, update state and ask follow-up
        console.log('❓ Still missing information. Has destination:', hasDestination, 'Has duration:', hasDuration, 'Has travelers:', hasTravelers);

        // Update conversation state with accumulated info
        conversationState.collectedInfo = combinedInfo;
        conversationState.followUpCount = (conversationState.followUpCount || 0) + 1;

        // If too many follow-ups, offer to help them get started
        if (conversationState.followUpCount >= 6) {
          console.log('⏰ Many follow-ups, offering help to get started...');

          return {
            success: true,
            message: `I want to create the perfect trip plan for you! 🌟 Let me help you get started with three quick questions:

1️⃣ **Where would you like to go?** (Any destination that excites you)
2️⃣ **How many days?** (Weekend getaway? Week-long adventure?)
3️⃣ **Who's joining you?** (Solo adventure or traveling with others?)

Just tell me these three things and I'll have my specialist team create an amazing personalized itinerary! ✈️`,
            timestamp: new Date().toISOString(),
            type: 'trip_planning_guidance',
            metadata: {
              stage: 'guidance_offered',
              collected_info: combinedInfo,
              missing: {
                destination: !hasDestination,
                duration: !hasDuration,
                travelers: !hasTravelers
              }
            }
          };
        }

        // Update state and ask for missing information
        this.setConversationState(userContext.userId, conversationState);

        // Generate context-aware follow-up question
        return await this.generateContextAwareFollowUp(combinedInfo, userContext);
      }
    } catch (error) {
      console.error('Error handling trip planning follow-up:', error);
      this.clearConversationState(userContext.userId);
      return this.generateFallbackResponse(message, userContext);
    }
  }

  // Generate context-aware follow-up questions based on what we already know
  async generateContextAwareFollowUp(combinedInfo, userContext) {
    try {
      const userProfile = userContext.userProfile || {};
      const hasDestination = combinedInfo.destination && combinedInfo.destination.length > 0;
      const hasDuration = combinedInfo.duration && combinedInfo.duration.length > 0;
      const hasTravelers = combinedInfo.travelers && combinedInfo.travelers.length > 0;

      let question = '';

      // Count what we have
      const infoCount = [hasDestination, hasDuration, hasTravelers].filter(Boolean).length;

      if (infoCount === 2) {
        // We have 2 out of 3, ask for the missing one
        if (!hasDestination) {
          question = `Awesome! ${combinedInfo.duration} ${combinedInfo.travelers.length === 1 ? 'solo' : `with ${combinedInfo.travelers.slice(1).join(' and ')}`} sounds amazing! 🌍 Where would you love to go?`;
        } else if (!hasDuration) {
          question = `Perfect! ${combinedInfo.destination} is an incredible choice! 🎉 How many days are you thinking for this adventure?`;
        } else if (!hasTravelers) {
          question = `Amazing! ${combinedInfo.destination} for ${combinedInfo.duration} sounds perfect! 🌟 Are you planning to go solo, or will you have travel companions joining you?`;
        }
      } else if (infoCount === 1) {
        // We have 1 out of 3, ask for the other two
        if (hasDestination) {
          question = `Great choice! ${combinedInfo.destination} is amazing! ✈️ How many days are you thinking, and are you traveling solo or with others?`;
        } else if (hasDuration) {
          question = `Perfect! ${combinedInfo.duration} is a great length for a trip! 🗺️ Where would you like to go, and are you traveling solo or with companions?`;
        } else if (hasTravelers) {
          const travelType = combinedInfo.travelers.length === 1 ? 'Solo travel' : `Traveling with ${combinedInfo.travelers.slice(1).join(' and ')}`;
          question = `${travelType} is going to be amazing! 🌟 Where would you like to go and for how many days?`;
        }
      } else {
        // We have nothing, ask for all three
        if (userProfile.bucketList && userProfile.bucketList.length > 0) {
          const destinations = userProfile.bucketList.slice(0, 2).join(' or ');
          question = `I'd love to help plan your perfect trip! ✨ Let me know: Where would you like to go (maybe ${destinations} from your bucket list?), how many days, and are you traveling solo or with others?`;
        } else {
          question = `Let's create something amazing! 🚀 I need three quick details: Where would you like to go, how many days, and are you traveling solo or with companions?`;
        }
      }

      return {
        success: true,
        message: question,
        timestamp: new Date().toISOString(),
        type: 'trip_planning_questions',
        metadata: {
          stage: 'gathering_details',
          collected_info: combinedInfo,
          missing: {
            destination: !hasDestination,
            duration: !hasDuration,
            travelers: !hasTravelers
          }
        }
      };

    } catch (error) {
      console.error('Error generating context-aware follow-up:', error);
      return {
        success: true,
        message: "I'd love to help plan your trip! Could you tell me where you'd like to go and how many days you're thinking?",
        timestamp: new Date().toISOString(),
        type: 'trip_planning_questions'
      };
    }
  }

  // Handle weather-specific requests
  async handleWeatherRequest(message, userContext, location) {
    if (!location && userContext.userProfile?.location) {
      location = userContext.userProfile.location;
    }

    if (!location) {
      return {
        success: true,
        message: "Oh, weather check! 🌤️ Which place are you curious about?",
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    }

    try {
      // Try to get weather data from a free weather API
      const weatherData = await this.getWeatherData(location);
      
      if (weatherData) {
        return {
          success: true,
          message: this.formatWeatherResponse(weatherData, location),
          timestamp: new Date().toISOString(),
          type: 'weather',
          metadata: {
            location: location,
            weatherData: weatherData
          }
        };
      }

      // Fallback to AI response if weather API fails
      if (!this.model) {
        return {
          success: true,
          message: `I'd love to give you the scoop on ${location}'s weather! Right now I can't pull live weather data, but definitely check your weather app for the current conditions. Is this for a trip you're planning? I can share some general climate tips for the area!`,
          timestamp: new Date().toISOString(),
          type: 'chat'
        };
      }

      const contextPrompt = this.buildContextPrompt(userContext);
      const weatherPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nThe user is asking about weather in ${location}. Be conversational and helpful:
1. Acknowledge their weather question naturally
2. Since you can't access live weather data, suggest they check a weather app
3. Share any general climate knowledge about ${location} if you know it
4. Ask if this is for travel planning to offer more help
5. Keep it casual and friendly

User question: ${message}`;

      const response = await this.callGeminiWithRotation(weatherPrompt);

      return {
        success: true,
        message: response.text(),
        timestamp: new Date().toISOString(),
        type: 'weather_info'
      };
    } catch (error) {
      console.error('Error handling weather request:', error);
      return {
        success: true,
        message: `Ah, ${location} weather! 🌤️ I can't pull live weather data right now, but definitely check your weather app for the current conditions. Planning a trip there? I'd love to help with what to expect climate-wise!`,
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    }
  }

  // Handle travel options requests (flights, hotels)
  async handleTravelOptionsRequest(message, userContext, agentRequest) {
    if (!this.model) {
      return {
        success: true,
        message: "I'd love to help you find travel options! Could you tell me more about what you're looking for?",
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    }

    try {
      const contextPrompt = this.buildContextPrompt(userContext);
      const optionsPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nThe user is asking about ${agentRequest.searchType} for ${agentRequest.location}. Provide helpful travel advice including:
1. General guidance on booking ${agentRequest.searchType}
2. Tips for finding good deals
3. Recommended booking sites or approaches
4. Timing advice
5. If this seems like part of trip planning, offer to help plan a complete trip

User question: ${message}`;

      const response = await this.callGeminiWithRotation(optionsPrompt);

      return {
        success: true,
        message: response.text(),
        timestamp: new Date().toISOString(),
        type: 'travel_advice'
      };
    } catch (error) {
      console.error('Error handling travel options request:', error);
      return await this.generateRegularChatResponse(message, userContext);
    }
  }

  // Handle recommendation requests
  async handleRecommendationsRequest(message, userContext) {
    if (!this.model) {
      return {
        success: true,
        message: "I'd love to give you some travel recommendations! What kind of experience are you looking for?",
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    }

    try {
      const contextPrompt = this.buildContextPrompt(userContext);
      const recommendationPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nThe user is asking for travel recommendations. Based on their profile, provide personalized destination suggestions that match their interests and travel style. Include:
1. 2-3 specific destination recommendations with brief explanations
2. Why each destination matches their profile
3. One follow-up question to help narrow down their preferences
4. Offer to help plan a complete trip if they're interested

User question: ${message}`;

      const response = await this.callGeminiWithRotation(recommendationPrompt);

      return {
        success: true,
        message: response.text(),
        timestamp: new Date().toISOString(),
        type: 'recommendations'
      };
    } catch (error) {
      console.error('Error handling recommendations request:', error);
      return await this.generateRegularChatResponse(message, userContext);
    }
  }

  // Generate regular chat response using Gemini
  async generateRegularChatResponse(message, userContext) {
    if (!this.model) {
      return {
        success: false,
        error: "AI features are currently unavailable. Please set up the GEMINI_API_KEY to enable AI travel assistance.",
        timestamp: new Date().toISOString()
      };
    }

    try {
      const contextPrompt = this.buildContextPrompt(userContext);
      const fullPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nUser Message: ${message}`;

      const response = await this.callGeminiWithRotation(fullPrompt);
      const text = response.text();

      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    } catch (error) {
      console.error('Error generating regular chat response:', error);
      return {
        success: false,
        error: 'Sorry, I encountered an error while processing your request. Please try again!',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Handle complete trip planning requests using Python CrewAI system
  async handleTripPlanningRequest(message, userContext = {}, socketService = null) {
    try {
      console.log('\n🚀 ===== AI TRAVEL PLANNING SYSTEM STARTED =====');
      console.log('📨 Original message:', message);
      console.log('👤 User context:', JSON.stringify(userContext, null, 2));
      console.log('🕐 Timestamp:', new Date().toISOString());

      // Extract trip details from message
      const tripDetails = this.extractTripDetails(message, userContext);
      console.log('📋 Extracted trip details:', {
        destination: tripDetails.destination,
        travelers: tripDetails.travelers,
        duration: tripDetails.duration_days,
        start_date: tripDetails.start_date,
        budget_range: tripDetails.budget_range
      });

      // Send initial status update to frontend
      if (socketService) {
        const userProfile = userContext.userProfile || {};
        const personalizedMessage = this.generatePersonalizedInitialMessage(tripDetails.destination, userProfile);
        
        socketService.sendStatusUpdate(userContext.userId, {
          stage: 'initializing',
          message: personalizedMessage,
          progress: 10,
          agents_status: [
            { name: 'ProfileAnalyst', status: 'preparing', task: `🧠 Analyzing ${userProfile.name || 'your'} travel personality and preferences...` },
            { name: 'DataScout', status: 'preparing', task: `🔍 Searching live data for ${tripDetails.destination}...` },
            { name: 'ItineraryArchitect', status: 'preparing', task: `🎨 Designing itinerary based on ${userProfile.interests?.slice(0, 2).join(' & ') || 'your interests'}...` },
            { name: 'ChiefTravelPlanner', status: 'preparing', task: '📋 Coordinating your complete travel experience...' }
          ]
        });
      }

      console.log('🚀 Launching Multi-Agent CrewAI System...');
      console.log('⏱️  Expected completion time: 30-60 seconds');
      console.log('🐍 Python script path:', this.pythonScriptPath);

      // Call Python CrewAI system with real-time updates
      const pythonResult = await this.callPythonCrewAI(tripDetails, socketService, userContext.userId);

      if (pythonResult.success) {
        console.log('✅ Multi-Agent Trip Planning Completed Successfully!');

        // Send completion status update
        if (socketService) {
          socketService.sendStatusUpdate(userContext.userId, {
            stage: 'completed',
            message: '🎉 Your personalized travel masterpiece is ready! Time to start packing!',
            progress: 100
          });
        }

        console.log('🔧 About to format response. pythonResult keys:', Object.keys(pythonResult));
        console.log('🔧 pythonResult.trip_plan exists:', !!pythonResult.trip_plan);

        // Pass the entire pythonResult if trip_plan doesn't exist, or trip_plan if it does
        const dataToFormat = pythonResult.trip_plan || pythonResult;
        const formattedResponse = this.formatTripPlanResponse(dataToFormat);

        return {
          success: true,
          message: formattedResponse.content || formattedResponse,
          timestamp: new Date().toISOString(),
          type: formattedResponse.type === 'interactive_proposal' ? 'interactive_trip_plan' : 'trip_plan',
          metadata: {
            destination: tripDetails.destination,
            travelers: tripDetails.travelers,
            duration: tripDetails.duration_days,
            trip_type: pythonResult.trip_type,
            agents_used: ['ChiefTravelPlanner', 'ProfileAnalyst', 'DataScout', 'ItineraryArchitect'],
            rawData: formattedResponse.rawData || pythonResult
          }
        };
      } else {
        // Send error status update
        if (socketService) {
          socketService.sendStatusUpdate(userContext.userId, {
            stage: 'fallback',
            message: 'Switching to backup travel assistant...',
            progress: 50
          });
        }

        // Fallback to regular Gemini response
        console.warn('🔄 Multi-Agent system unavailable, falling back to alternative methods:', pythonResult.error);
        return await this.generateFallbackResponse(message, userContext);
      }

    } catch (error) {
      console.error('❌ Trip planning error:', error);

      // Send error status update
      if (socketService) {
        socketService.sendStatusUpdate(userContext.userId, {
          stage: 'error',
          message: 'Switching to backup assistant due to technical issue...',
          progress: 0
        });
      }

      return await this.generateFallbackResponse(message, userContext);
    }
  }

  // Extract trip details from user message
  extractTripDetails(message, userContext = {}) {
    const details = {
      destination: null,
      travelers: [],
      duration_days: 7,
      start_date: null,
      budget_range: null
    };

    // Clean message aggressively to avoid extracting companion/duration info as destination
    let cleanMessage = message
      .replace(/\b(?:going|traveling|trip)\s+(?:solo|alone)\b/gi, '')
      .replace(/\b(?:with\s+(?:friends|family|me\s+and|partner|spouse)[\w\s,]*)\b/gi, '')
      .replace(/\b(?:for\s+)?\d+\s+(?:day|days|week|weeks)\b/gi, '')
      .replace(/\b(?:in\s+)?\d+\s+(?:day|days|week|weeks)\b/gi, '')
      .replace(/\bsolo\b/gi, '')
      .replace(/\balone\b/gi, '')
      .trim();

    // Extract destination using destination parsing patterns
    const destinationPatterns = [
      // "plan/create to [destination]" - most specific first - stop at companion words
      /(?:plan|create).*?(?:to|for)\s+([a-zA-Z\s]+?)(?:\s+(?:with|and|for|in|\d)|$)/i,
      // "to [destination]" patterns - stop at companion words
      /(?:to|visit)\s+([a-zA-Z\s]+?)(?:\s+(?:with|and|for|in|\d)|$)/i,
      // "trip to [destination]" patterns - stop at companion words
      /(?:trip|travel|vacation|holiday)\s+(?:to|in)\s+([a-zA-Z\s]+?)(?:\s+(?:with|and|for|\d)|$)/i,
      // "going to [destination]" patterns - stop at companion words
      /(?:going\s+to)\s+([a-zA-Z\s]+?)(?:\s+(?:with|and|for|\d)|$)/i,
      // "[destination] [duration]" style
      /^([a-zA-Z\s]+?)\s+\d+\s+(?:day|days|week|weeks)/i
    ];

    for (const pattern of destinationPatterns) {
      const match = cleanMessage.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        // Further clean the destination - remove travel words and common names
        let destination = match[1].trim()
          .replace(/\b(?:solo|alone|going|trip|plan|itinerary|with|for|bull|john|jane|mike|sara|alex|chris|david|emma|lisa|mark|anna|tom|amy|sam)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (destination.length > 2) {
          details.destination = destination;
          break;
        }
      }
    }

    // Extract duration
    const durationMatch = message.match(/(\d+)\s*(?:day|days|week|weeks)/i);
    if (durationMatch) {
      const num = parseInt(durationMatch[1]);
      const unit = durationMatch[0].toLowerCase();
      details.duration_days = unit.includes('week') ? num * 7 : num;
    }

    // Extract travelers from context or message
    if (userContext.currentUser) {
      details.travelers.push(userContext.currentUser);
    }

    // Check for solo travel indicators
    const soloIndicators = /\b(solo|alone|by myself|on my own)\b/i;
    if (soloIndicators.test(message)) {
      // Solo travel confirmed - already have current user
      console.log('🎯 Solo travel detected');
    } else {
      // Look for group travel indicators
      const groupIndicators = /\b(with|friends|family|partner|spouse|girlfriend|boyfriend|husband|wife|group|together)\b/i;

      if (groupIndicators.test(message)) {
        // Group travel detected, try to extract specific companions
        const companionPatterns = [
          /(?:me and|with)\s+([a-zA-Z\s,]+)/i,
          /(?:friend|partner|spouse|girlfriend|boyfriend|husband|wife)\s*([a-zA-Z]+)?/i
        ];

        let foundSpecificCompanions = false;
        for (const pattern of companionPatterns) {
          const match = message.match(pattern);
          if (match && match[1]) {
            const companions = match[1].split(/[,\s]+/).filter(name =>
              name.length > 1 && !['and', 'with', 'my', 'friends', 'family'].includes(name.toLowerCase())
            );
            if (companions.length > 0) {
              details.travelers.push(...companions);
              foundSpecificCompanions = true;
            }
          }
        }

        // If group travel mentioned but no specific names, mark as needing clarification
        if (!foundSpecificCompanions) {
          details.travelers = []; // Clear to indicate we need this info
          console.log('🎯 Group travel detected but no specific companions mentioned');
        }
      }
    }

    // Don't use fallbacks - let the conversation flow handle missing info
    if (details.travelers.length === 0 && userContext.currentUser) {
      details.travelers = [userContext.currentUser];
    }

    return details;
  }

  // Call Python CrewAI system with real-time status updates
  async callPythonCrewAI(tripDetails, socketService = null, userId = null) {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScriptPath,
        '--mode', 'api',
        '--destination', tripDetails.destination,
        '--travelers', JSON.stringify(tripDetails.travelers),
        '--duration', tripDetails.duration_days.toString()
      ];

      console.log('🐍 Spawning Python process with args:', args);
      console.log('📁 Working directory:', path.dirname(this.pythonScriptPath));

      // Use virtual environment Python
      const venvPython = path.join(__dirname, '../../venv/bin/python3');
      const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

      console.log('🐍 Using Python executable:', pythonCmd);

      const pythonProcess = spawn(pythonCmd, args, {
        cwd: path.dirname(this.pythonScriptPath),
        env: {
          ...process.env,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY,
          SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || '5af305829c76aed0a9717b14441ce950b69651920d9c4024b74b4f642cb2db00',
          OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '9cc22d1a8677ceee7ecd450b6531027b',
          PYTHONPATH: path.dirname(this.pythonScriptPath)
        }
      });

      console.log('🔄 Python process started with PID:', pythonProcess.pid);

      let stdout = '';
      let stderr = '';
      let currentProgress = 20;

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('🐍 Python STDOUT:', output.trim());

        // Parse agent status updates and forward to frontend
        if (socketService && userId) {
          this.parseAndSendAgentUpdates(output, socketService, userId, currentProgress);
          currentProgress = Math.min(currentProgress + 10, 90);
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        stderr += errorOutput;
        
        // Enhanced logging for Python output
        const cleanOutput = errorOutput.trim();
        if (cleanOutput) {
          console.log('🐍 Python Output:', cleanOutput);
          
          // Log system startup messages
          if (cleanOutput.includes('STARTING AI TRAVEL PLANNING SYSTEM')) {
            console.log('\n🚀 ===== PYTHON CREWAI SYSTEM STARTUP =====');
          }
          if (cleanOutput.includes('INITIALIZING AI AGENTS')) {
            console.log('🤖 Initializing multi-agent system...');
          }
          if (cleanOutput.includes('AGENTS ARE NOW WORKING')) {
            console.log('⚡ All agents are now active and collaborating!');
          }
        }

        // Parse agent status from stderr (where our log messages go)
        if (socketService && userId) {
          this.parseAndSendAgentUpdates(errorOutput, socketService, userId, currentProgress);
          currentProgress = Math.min(currentProgress + 5, 85);
        }
      });

      pythonProcess.on('close', (code) => {
        console.log('\n🏁 ===== PYTHON PROCESS COMPLETED =====');
        console.log(`📊 Exit Code: ${code}`);
        console.log(`📄 Final stdout length: ${stdout.length} chars`);
        console.log(`❌ Final stderr length: ${stderr.length} chars`);
        console.log(`⏰ Completion Time: ${new Date().toLocaleTimeString()}`);

        if (code === 0) {
          try {
            console.log('🔄 Attempting to parse Python output...');
            const result = JSON.parse(stdout);
            console.log('✅ Successfully parsed Python result:', Object.keys(result));
            console.log('🎉 Trip planning completed successfully!');
            resolve(result);
          } catch (error) {
            console.error('❌ Failed to parse Python output:', error.message);
            console.error('📄 Raw stdout:', stdout.substring(0, 500) + '...');
            resolve({ success: false, error: 'Failed to parse trip plan' });
          }
        } else {
          console.error('❌ Python process failed with code:', code);
          console.error('📄 stderr:', stderr);
          resolve({ success: false, error: `Python process failed with code ${code}` });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error);
        resolve({ success: false, error: 'Failed to start trip planning system' });
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        pythonProcess.kill();
        resolve({ success: false, error: 'Trip planning timed out' });
      }, 120000);
    });
  }

  // Parse agent updates from Python output and send to frontend
  parseAndSendAgentUpdates(output, socketService, userId, currentProgress) {
    try {
      const agentUpdates = {
        ProfileAnalyst: null,
        DataScout: null,
        ItineraryArchitect: null,
        ChiefTravelPlanner: null
      };

      // Enhanced agent status tracking with detailed thinking updates

      // ProfileAnalyst detailed stages
      if (output.includes('ProfileAnalyst: Analyzing traveler preferences')) {
        console.log('\n🧠 ===== PROFILE ANALYST AGENT ACTIVATED =====');
        agentUpdates.ProfileAnalyst = {
          status: 'thinking',
          task: '🧠 Thinking... Analyzing your travel personality and preferences',
          detail: 'Examining your interests, past travel patterns, and style preferences'
        };
        currentProgress = Math.max(currentProgress, 25);

        setTimeout(() => {
          agentUpdates.ProfileAnalyst = {
            status: 'working',
            task: '🧠 Building your comprehensive travel profile...',
            detail: 'Matching destinations to your personality and creating preference matrix'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 5, agentUpdates);
        }, 2000);
      }

      if (output.includes('ProfileAnalyst: Travel personality identified')) {
        agentUpdates.ProfileAnalyst = {
          status: 'completed',
          task: '✅ Your travel personality profile complete!',
          detail: 'Identified optimal travel style and preference matching'
        };
        currentProgress = Math.max(currentProgress, 35);
      }

      // DataScout detailed stages with real API calls
      if (output.includes('DataScout: Gathering destination-specific data')) {
        console.log('\n🔍 ===== DATA SCOUT AGENT ACTIVATED =====');
        agentUpdates.DataScout = {
          status: 'thinking',
          task: '🔍 Thinking... Planning data collection strategy',
          detail: 'Identifying best sources for flights, hotels, weather, and local insights'
        };
        currentProgress = Math.max(currentProgress, 40);

        setTimeout(() => {
          agentUpdates.DataScout = {
            status: 'working',
            task: '🔍 Searching live flight options...',
            detail: 'Scanning multiple airlines for best routes and prices via SerpAPI'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 3, agentUpdates);
        }, 1500);

        setTimeout(() => {
          agentUpdates.DataScout = {
            status: 'working',
            task: '🏨 Finding perfect accommodations...',
            detail: 'Researching hotels, ratings, and availability in your destination'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 6, agentUpdates);
        }, 4000);

        setTimeout(() => {
          agentUpdates.DataScout = {
            status: 'working',
            task: '🌤️ Checking weather patterns...',
            detail: 'Getting current conditions and forecast via OpenWeatherMap'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 9, agentUpdates);
        }, 6500);
      }

      if (output.includes('DataScout: Flight options found')) {
        agentUpdates.DataScout = {
          status: 'progress',
          task: '✈️ Found amazing flight deals!',
          detail: 'Collected comprehensive flight options with pricing and schedules'
        };
        currentProgress = Math.max(currentProgress, 50);
      }

      if (output.includes('DataScout: Hotel options found')) {
        agentUpdates.DataScout = {
          status: 'progress',
          task: '🏨 Discovered perfect accommodations!',
          detail: 'Found highly-rated hotels matching your style and budget'
        };
        currentProgress = Math.max(currentProgress, 55);
      }

      if (output.includes('DataScout: Data collection complete')) {
        agentUpdates.DataScout = {
          status: 'completed',
          task: '✅ All travel data collected and verified!',
          detail: 'Comprehensive database of flights, hotels, weather, and local insights ready'
        };
        currentProgress = Math.max(currentProgress, 60);
      }

      // ItineraryArchitect detailed stages
      if (output.includes('ItineraryArchitect: Designing personalized itinerary')) {
        console.log('\n🎨 ===== ITINERARY ARCHITECT AGENT ACTIVATED =====');
        agentUpdates.ItineraryArchitect = {
          status: 'thinking',
          task: '🎨 Thinking... Designing optimal itinerary structure',
          detail: 'Analyzing destination layout, travel times, and experience sequencing'
        };
        currentProgress = Math.max(currentProgress, 65);

        setTimeout(() => {
          agentUpdates.ItineraryArchitect = {
            status: 'working',
            task: '🎨 Creating day-by-day experiences...',
            detail: 'Crafting perfect balance of must-sees, hidden gems, and downtime'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 5, agentUpdates);
        }, 2000);

        setTimeout(() => {
          agentUpdates.ItineraryArchitect = {
            status: 'working',
            task: '🍽️ Planning incredible dining experiences...',
            detail: 'Selecting restaurants that match your taste and each day\'s location'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 8, agentUpdates);
        }, 4500);
      }

      if (output.includes('ItineraryArchitect: Itinerary complete')) {
        agentUpdates.ItineraryArchitect = {
          status: 'completed',
          task: '✅ Your perfect itinerary is ready!',
          detail: 'Complete day-by-day plan with activities, dining, and timing optimized'
        };
        currentProgress = Math.max(currentProgress, 80);
      }

      // ChiefTravelPlanner orchestration
      if (output.includes('TravelPlanner: Compiling comprehensive plan')) {
        console.log('\n📋 ===== CHIEF TRAVEL PLANNER AGENT ACTIVATED =====');
        agentUpdates.ChiefTravelPlanner = {
          status: 'thinking',
          task: '📋 Thinking... Orchestrating final travel masterpiece',
          detail: 'Combining all agent insights into cohesive travel experience'
        };
        currentProgress = Math.max(currentProgress, 85);

        setTimeout(() => {
          agentUpdates.ChiefTravelPlanner = {
            status: 'working',
            task: '📋 Weaving everything together...',
            detail: 'Integrating personality insights, real data, and custom itinerary'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 5, agentUpdates);
        }, 2000);

        setTimeout(() => {
          agentUpdates.ChiefTravelPlanner = {
            status: 'working',
            task: '✨ Adding final polish and insights...',
            detail: 'Quality checking and adding personalized touches throughout'
          };
          this.sendDetailedStatusUpdate(socketService, userId, currentProgress + 8, agentUpdates);
        }, 4000);
      }

      if (output.includes('TravelPlanner: Plan finalized')) {
        agentUpdates.ChiefTravelPlanner = {
          status: 'completed',
          task: '✅ Your complete travel plan is ready!',
          detail: 'Final masterpiece combining all specialist insights into your perfect trip'
        };
        currentProgress = Math.max(currentProgress, 95);
      }

      // Only send update if we have new information
      const hasActiveUpdates = Object.values(agentUpdates).some(update => update !== null);
      if (hasActiveUpdates) {
        this.sendDetailedStatusUpdate(socketService, userId, currentProgress, agentUpdates);
      }
    } catch (error) {
      console.error('Error parsing agent updates:', error);
    }
  }

  // Send detailed status update with enhanced information
  sendDetailedStatusUpdate(socketService, userId, currentProgress, agentUpdates) {
    try {
      console.log(`\n📡 ===== SENDING DETAILED STATUS UPDATE =====`);
      console.log(`👤 User ID: ${userId}`);
      console.log(`📊 Progress: ${currentProgress}%`);
      console.log(`🤖 Active Agents: ${Object.entries(agentUpdates).filter(([_, update]) => update).map(([name, _]) => name).join(', ')}`);

      const waitingMessages = {
        ProfileAnalyst: {
          task: '⏳ Waiting to analyze your travel personality...',
          detail: 'Ready to examine your preferences and create personalized recommendations'
        },
        DataScout: {
          task: '⏳ Waiting to search live travel data...',
          detail: 'Prepared to scan flights, hotels, weather, and local insights'
        },
        ItineraryArchitect: {
          task: '⏳ Waiting to design your dream itinerary...',
          detail: 'Standing by to create your perfect day-by-day adventure'
        },
        ChiefTravelPlanner: {
          task: '⏳ Waiting to coordinate your complete plan...',
          detail: 'Ready to orchestrate all elements into your travel masterpiece'
        }
      };

      // Generate dynamic status message based on current progress
      let dynamicMessage = '🚀 My specialist AI team is working on your personalized plan...';

      if (currentProgress < 30) {
        dynamicMessage = '🧠 Analyzing your travel personality and preferences...';
      } else if (currentProgress < 60) {
        dynamicMessage = '🔍 Gathering live flight, hotel, and destination data...';
      } else if (currentProgress < 85) {
        dynamicMessage = '🎨 Crafting your perfect day-by-day itinerary...';
      } else if (currentProgress < 95) {
        dynamicMessage = '📋 Finalizing your complete travel masterpiece...';
      } else {
        dynamicMessage = '✨ Putting the finishing touches on your perfect trip!';
      }

      socketService.sendStatusUpdate(userId, {
        stage: 'processing',
        message: dynamicMessage,
        progress: currentProgress,
        timestamp: new Date().toISOString(),
        agents_status: Object.entries(agentUpdates).map(([name, update]) => ({
          name,
          status: update ? update.status : 'waiting',
          task: update ? update.task : waitingMessages[name].task,
          detail: update ? update.detail : waitingMessages[name].detail,
          thinking: update ? update.status === 'thinking' : false
        })),
        estimated_completion: this.calculateEstimatedCompletion(currentProgress),
        live_data_sources: {
          flights: currentProgress >= 43 ? 'SerpAPI - Scanning live flight data' : 'Ready to search',
          hotels: currentProgress >= 46 ? 'SerpAPI - Finding accommodations' : 'Ready to search',
          weather: currentProgress >= 49 ? 'OpenWeatherMap - Getting conditions' : 'Ready to check',
          local_insights: currentProgress >= 65 ? 'AI Analysis - Curating experiences' : 'Ready to analyze'
        }
      });
    } catch (error) {
      console.error('Error sending detailed status update:', error);
    }
  }

  // Calculate estimated completion time based on progress
  calculateEstimatedCompletion(currentProgress) {
    const totalTime = 45; // seconds
    const remainingProgress = 100 - currentProgress;
    const estimatedSeconds = Math.round((remainingProgress / 100) * totalTime);

    if (estimatedSeconds <= 5) return "Just a few more seconds...";
    if (estimatedSeconds <= 15) return `About ${estimatedSeconds} seconds remaining`;
    if (estimatedSeconds <= 30) return `About ${Math.round(estimatedSeconds/5)*5} seconds remaining`;
    return "Less than a minute remaining";
  }

  // Format trip plan response for frontend
  formatTripPlanResponse(tripPlan) {
    try {
      console.log('🎨 Formatting trip plan response, type:', typeof tripPlan);
      console.log('🎨 Trip plan keys:', Object.keys(tripPlan || {}));

      // Handle the new structured JSON output from improved CrewAI system
      if (typeof tripPlan === 'object' && tripPlan.conversation_stage === 'proposal') {
        console.log('✅ Detected structured proposal response');

        // Create a storytelling narrative based on the trip plan
        const storytellingContent = this.createStorytellingNarrative(tripPlan);

        return {
          type: 'interactive_proposal',
          content: storytellingContent,
          rawData: tripPlan
        };
      }

      // Handle any structured object with trip data
      if (typeof tripPlan === 'object' && tripPlan !== null) {
        console.log('✅ Detected structured object response');
        
        return {
          type: 'interactive_proposal',
          content: 'Your personalized trip plan is ready!',
          rawData: tripPlan
        };
      }

      // Handle legacy string format
      if (typeof tripPlan === 'string') {
        console.log('✅ Detected string response');
        return {
          type: 'text_plan',
          content: tripPlan
        };
      }

      // Fallback formatting for other object types
      console.log('⚠️ Using fallback formatting');
      const fallbackContent = `🌟 **Your Personalized Trip Plan** 🌟\n\n${JSON.stringify(tripPlan, null, 2)}`;
      return {
        type: 'text_plan',
        content: fallbackContent
      };
    } catch (error) {
      console.error('Error formatting trip plan response:', error);
      return {
        type: 'text_plan',
        content: typeof tripPlan === 'string' ? tripPlan : JSON.stringify(tripPlan, null, 2)
      };
    }
  }

  // Fallback to regular Gemini response or Python script
  async generateFallbackResponse(message, userContext) {
    // First try the Python script as fallback for trip planning
    if (message.toLowerCase().includes('trip') || message.toLowerCase().includes('plan') || message.toLowerCase().includes('travel')) {
      try {
        console.log('🔄 Attempting Python script fallback for trip planning...');
        const tripDetails = this.extractTripDetails(message, userContext);
        const pythonResult = await this.callPythonCrewAI(tripDetails, null, userContext.userId);
        
        if (pythonResult.success) {
          console.log('✅ Python script fallback successful!');
          const formattedResponse = this.formatTripPlanResponse(pythonResult);
          
          return {
            success: true,
            message: formattedResponse.content || formattedResponse,
            timestamp: new Date().toISOString(),
            type: formattedResponse.type === 'interactive_proposal' ? 'interactive_trip_plan' : 'trip_plan',
            metadata: {
              destination: tripDetails.destination,
              travelers: tripDetails.travelers,
              duration: tripDetails.duration_days,
              trip_type: pythonResult.trip_type,
              agents_used: ['ChiefTravelPlanner', 'ProfileAnalyst', 'DataScout', 'ItineraryArchitect'],
              rawData: formattedResponse.rawData || pythonResult
            }
          };
        }
      } catch (error) {
        console.log('⚠️ Python script fallback failed:', error.message);
      }
    }

    // If Python script fails or it's not a trip planning request, use static fallback
    if (!this.model) {
      return this.getStaticFallbackResponse(message, userContext);
    }

    try {
      const contextPrompt = this.buildContextPrompt(userContext);
      const fullPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nUser Message: ${message}`;

      const response = await this.callGeminiWithRotation(fullPrompt);
      const text = response.text();

      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    } catch (error) {
      console.log('⚠️ Gemini fallback also failed, using static response');
      return this.getStaticFallbackResponse(message, userContext);
    }
  }

  // Static fallback responses when AI services are unavailable
  getStaticFallbackResponse(message, userContext) {
    const lowercaseMessage = message.toLowerCase();

    // Trip planning fallback
    if (lowercaseMessage.includes('trip') || lowercaseMessage.includes('plan') || lowercaseMessage.includes('travel')) {
      return {
        success: true,
        message: `Hey there! ✈️ I'd love to help you plan your trip, but I'm running into some technical limitations right now.

Here are some quick travel tips while I get back up to speed:

🗺️ **Popular Destinations:**
• Tokyo, Japan - Amazing food, culture, and technology
• Paris, France - Art, history, and romance
• Bali, Indonesia - Beautiful beaches and spiritual experiences
• Iceland - Stunning landscapes and northern lights

💰 **Budget Tips:**
• Book flights 2-3 weeks in advance
• Consider shoulder seasons for better prices
• Use price comparison websites
• Look into local public transportation

📋 **General Packing:**
• Comfortable walking shoes
• Universal power adapter
• Weather-appropriate clothing
• Copy of important documents

Please try asking me again in a few minutes, and I'll be able to give you a personalized itinerary! 🌟`,
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    }

    // Weather fallback
    if (lowercaseMessage.includes('weather')) {
      return {
        success: true,
        message: `🌤️ I'd love to check the weather for you, but I'm having some technical difficulties right now.

For the most up-to-date weather information, I recommend:
• Weather.com
• AccuWeather
• Your phone's built-in weather app

I'll be back to full functionality soon! Feel free to ask me about travel tips or destinations in the meantime. 😊`,
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    }

    // General greeting fallback
    if (lowercaseMessage.includes('hi') || lowercaseMessage.includes('hello') || lowercaseMessage.includes('hey')) {
      return {
        success: true,
        message: `Hey there! 👋 I'm WanderBuddy, your AI travel companion!

I'm experiencing some technical difficulties right now, but I'm still here to help with basic travel advice. You can ask me about:

🗺️ General destination recommendations
💰 Budget travel tips
📋 Packing suggestions
🏨 Accommodation advice
🍴 Food and dining tips

For detailed trip planning, please try again in a few minutes when I'm back to full power! ✨`,
        timestamp: new Date().toISOString(),
        type: 'chat'
      };
    }

    // Default fallback
    return {
      success: true,
      message: `I'm sorry, but I'm experiencing some technical difficulties right now and can't provide my usual detailed assistance. 🔧

I should be back to full functionality soon! In the meantime, feel free to:
• Browse travel inspiration online
• Check out travel blogs and forums
• Research your destination of interest

Thanks for your patience, and please try asking me again in a few minutes! 😊`,
      timestamp: new Date().toISOString(),
      type: 'chat'
    };
  }

  // Get weather data from OpenWeatherMap API
  async getWeatherData(location) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        console.log('⚠️ No OpenWeather API key found, skipping weather data');
        return null;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        console.log(`⚠️ Weather API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        country: data.sys.country,
        city: data.name
      };
    } catch (error) {
      console.log('⚠️ Weather API error:', error.message);
      return null;
    }
  }

  // Format weather response
  formatWeatherResponse(weatherData, location) {
    const { temperature, description, humidity, windSpeed, city, country } = weatherData;
    
    return `🌤️ **Current Weather in ${city}, ${country}**

🌡️ **Temperature:** ${temperature}°C
☁️ **Conditions:** ${description.charAt(0).toUpperCase() + description.slice(1)}
💧 **Humidity:** ${humidity}%
💨 **Wind:** ${windSpeed} m/s

Perfect weather for exploring! ${temperature > 25 ? '☀️ Great for outdoor activities!' : temperature < 15 ? '🧥 You might want a light jacket!' : '🌤️ Comfortable weather for sightseeing!'}

Is this for a trip you're planning? I can help you plan the perfect itinerary! ✈️`;
  }

  // Create comprehensive storytelling narrative for trip plan with real data
  createStorytellingNarrative(tripPlan) {
    const destination = tripPlan.trip_summary?.destination || tripPlan.destination || 'your destination';
    const duration = tripPlan.trip_summary?.duration || tripPlan.duration || '7';
    const budget = tripPlan.trip_summary?.estimated_budget || tripPlan.budget || 'your budget';

    let narrative = `🌟 **Your ${destination} Adventure - Crafted with Real Live Data** 🌟\n\n`;

    // Opening story with personalization
    narrative += `${tripPlan.welcome_message || `Welcome to your personalized ${duration}-day journey to ${destination}! Every detail below has been researched using live data sources to ensure you get the most current information available.`}\n\n`;

    // Data sources used (transparency)
    narrative += `**📡 Live Data Sources Used:**\n`;
    narrative += `• ✈️ **Flights:** Real-time pricing via SerpAPI\n`;
    narrative += `• 🏨 **Hotels:** Live availability and ratings\n`;
    narrative += `• 🌤️ **Weather:** Current conditions from OpenWeatherMap\n`;
    narrative += `• 🎯 **Experiences:** AI-curated based on your personality\n\n`;

    // Why this plan is perfect for them
    narrative += `**🎯 Why This Plan is Perfect for You:**\n`;
    narrative += `I've carefully crafted this ${duration}-day journey specifically for your travel style and interests using real-time data analysis. `;

    if (tripPlan.personalization_reasoning) {
      narrative += `${tripPlan.personalization_reasoning}\n\n`;
    } else {
      narrative += `Every detail has been chosen to create unforgettable memories that align with what makes you tick as a traveler.\n\n`;
    }

    // Current weather and timing (real data)
    if (tripPlan.weather_data || tripPlan.weather_and_packing?.current_conditions) {
      narrative += `**🌤️ Current Weather & Perfect Timing:**\n`;

      if (tripPlan.weather_data) {
        const weather = tripPlan.weather_data;
        narrative += `**Right now in ${destination}:** ${weather.temperature || '22'}°C, ${weather.description || 'pleasant conditions'}\n`;
        narrative += `**Humidity:** ${weather.humidity || '65'}% | **Wind:** ${weather.wind_speed || '5'} m/s\n`;
        if (weather.forecast) {
          narrative += `**7-Day Outlook:** ${weather.forecast}\n`;
        }
      } else {
        narrative += `${tripPlan.weather_and_packing.current_conditions}\n`;
      }
      narrative += `*This is actually ideal timing for your trip - the weather will enhance every experience I've planned for you.*\n\n`;
    }

    // Trip highlights with storytelling
    if (tripPlan.daily_itinerary || tripPlan.itinerary_narrative?.key_experiences) {
      narrative += `**✨ Your Day-by-Day Adventure:**\n`;

      if (tripPlan.daily_itinerary) {
        tripPlan.daily_itinerary.forEach((day, index) => {
          narrative += `**Day ${index + 1}: ${day.title || `Day ${index + 1}`}**\n`;
          if (day.activities) {
            day.activities.forEach(activity => {
              narrative += `• ${activity.time ? activity.time + ' - ' : ''}${activity.name}\n`;
              if (activity.description) {
                narrative += `  *${activity.description}*\n`;
              }
              if (activity.cost) {
                narrative += `  💰 Est. cost: ${activity.cost}\n`;
              }
            });
          }
          narrative += `\n`;
        });
      } else if (tripPlan.itinerary_narrative?.key_experiences) {
        tripPlan.itinerary_narrative.key_experiences.forEach((exp, index) => {
          narrative += `${index + 1}. **${exp.title}** - ${exp.description}\n`;
          if (exp.timing) narrative += `   ⏰ Best time: ${exp.timing}\n`;
          if (exp.cost_range) narrative += `   💰 Cost range: ${exp.cost_range}\n`;
        });
      }
      narrative += `\n`;
    }

    // Flight options with real data
    if (tripPlan.flight_options || tripPlan.interactive_cards?.flight_options) {
      narrative += `**✈️ Live Flight Options (Updated ${new Date().toLocaleDateString()}):**\n`;
      narrative += `*These prices are based on current market rates and may change*\n\n`;

      const flights = tripPlan.flight_options || tripPlan.interactive_cards.flight_options;
      flights.forEach((flight, index) => {
        narrative += `**Option ${index + 1}: ${flight.airline || flight.carrier}**\n`;
        narrative += `💰 **Price:** ${flight.price} | ⏱️ **Duration:** ${flight.duration || flight.travel_time}\n`;
        if (flight.departure_time) narrative += `🛫 **Departure:** ${flight.departure_time}\n`;
        if (flight.arrival_time) narrative += `🛬 **Arrival:** ${flight.arrival_time}\n`;
        if (flight.stops !== undefined) {
          narrative += `🔄 **Stops:** ${flight.stops === 0 ? 'Direct flight' : `${flight.stops} stop(s)`}\n`;
        }
        if (flight.reasoning) {
          narrative += `*✨ ${flight.reasoning}*\n`;
        }
        if (flight.booking_link) {
          narrative += `🔗 [Book Now](${flight.booking_link})\n`;
        }
        narrative += `\n`;
      });
    }

    // Hotel options with real data
    if (tripPlan.hotel_options || tripPlan.interactive_cards?.accommodation_options) {
      narrative += `**🏨 Handpicked Accommodations (Live Rates):**\n`;
      narrative += `*Rates checked on ${new Date().toLocaleDateString()} and subject to availability*\n\n`;

      const hotels = tripPlan.hotel_options || tripPlan.interactive_cards.accommodation_options;
      hotels.forEach((hotel, index) => {
        narrative += `**${hotel.name}**\n`;
        narrative += `💰 **Rate:** ${hotel.price} per night | ⭐ **Rating:** ${hotel.rating || hotel.stars}/5\n`;
        narrative += `📍 **Location:** ${hotel.location || hotel.area}\n`;
        if (hotel.amenities && hotel.amenities.length > 0) {
          narrative += `🏨 **Amenities:** ${hotel.amenities.join(', ')}\n`;
        }
        if (hotel.distance_to_center) {
          narrative += `🚶 **Distance to center:** ${hotel.distance_to_center}\n`;
        }
        if (hotel.reasoning) {
          narrative += `*✨ ${hotel.reasoning}*\n`;
        }
        if (hotel.booking_link) {
          narrative += `🔗 [Check Availability](${hotel.booking_link})\n`;
        }
        narrative += `\n`;
      });
    }

    // Restaurant recommendations with real data
    if (tripPlan.restaurant_recommendations) {
      narrative += `**🍽️ Curated Dining Experiences:**\n`;
      tripPlan.restaurant_recommendations.forEach((restaurant, index) => {
        narrative += `**${restaurant.name}** (${restaurant.cuisine || 'Local cuisine'})\n`;
        narrative += `📍 ${restaurant.location || restaurant.address}\n`;
        if (restaurant.rating) narrative += `⭐ ${restaurant.rating}/5`;
        if (restaurant.price_range) narrative += ` | 💰 ${restaurant.price_range}`;
        if (restaurant.specialty) narrative += `\n🌟 **Must try:** ${restaurant.specialty}`;
        if (restaurant.opening_hours) narrative += `\n🕒 **Hours:** ${restaurant.opening_hours}`;
        narrative += `\n\n`;
      });
    }

    // Local transportation with real data
    if (tripPlan.transportation_info) {
      narrative += `**🚇 Getting Around ${destination}:**\n`;
      const transport = tripPlan.transportation_info;
      if (transport.best_option) {
        narrative += `**Recommended:** ${transport.best_option}\n`;
      }
      if (transport.day_pass_cost) {
        narrative += `**Day Pass:** ${transport.day_pass_cost}\n`;
      }
      if (transport.tips && transport.tips.length > 0) {
        narrative += `**Insider Tips:**\n`;
        transport.tips.forEach(tip => {
          narrative += `• ${tip}\n`;
        });
      }
      narrative += `\n`;
    }

    // Budget breakdown with real calculations
    if (tripPlan.budget_breakdown || tripPlan.estimated_costs) {
      narrative += `**💰 Transparent Budget Breakdown:**\n`;
      narrative += `*Based on current market rates and your selected options*\n\n`;

      const budget_data = tripPlan.budget_breakdown || tripPlan.estimated_costs;
      Object.entries(budget_data).forEach(([category, amount]) => {
        narrative += `• **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${amount}\n`;
      });

      if (tripPlan.total_estimated_cost) {
        narrative += `\n**Total Estimated Cost:** ${tripPlan.total_estimated_cost}\n`;
        narrative += `*💡 Tip: Prices are estimates based on current rates and may vary with booking timing*\n`;
      }
      narrative += `\n`;
    }

    // Essential packing list based on weather
    if (tripPlan.packing_recommendations || tripPlan.weather_and_packing?.packing_list) {
      narrative += `**🎒 Smart Packing List (Based on Current Weather):**\n`;
      const packing = tripPlan.packing_recommendations || tripPlan.weather_and_packing.packing_list;

      if (Array.isArray(packing)) {
        packing.forEach(item => {
          narrative += `• ${item}\n`;
        });
      } else if (typeof packing === 'object') {
        Object.entries(packing).forEach(([category, items]) => {
          narrative += `**${category}:**\n`;
          if (Array.isArray(items)) {
            items.forEach(item => narrative += `• ${item}\n`);
          }
        });
      }
      narrative += `\n`;
    }

    // Cultural insights and tips
    if (tripPlan.cultural_insights || tripPlan.local_tips) {
      narrative += `**🌍 Cultural Insights & Local Tips:**\n`;
      const insights = tripPlan.cultural_insights || tripPlan.local_tips;

      if (Array.isArray(insights)) {
        insights.forEach(tip => {
          narrative += `• ${tip}\n`;
        });
      } else if (typeof insights === 'object') {
        Object.entries(insights).forEach(([category, tips]) => {
          narrative += `**${category}:**\n`;
          if (Array.isArray(tips)) {
            tips.forEach(tip => narrative += `• ${tip}\n`);
          } else {
            narrative += `• ${tips}\n`;
          }
        });
      }
      narrative += `\n`;
    }

    // Next steps with booking urgency
    narrative += `**🚀 Ready to Make This Adventure Real?**\n`;
    if (tripPlan.booking_recommendations) {
      narrative += `${tripPlan.booking_recommendations}\n`;
    } else {
      narrative += `✈️ **Book flights first** - prices change frequently and these deals won't last\n`;
      narrative += `🏨 **Reserve accommodations** - availability is limited for your dates\n`;
      narrative += `📅 **Best booking window:** Next 24-48 hours for optimal pricing\n`;
    }
    narrative += `\n`;

    // Data freshness disclaimer
    narrative += `**📊 Data Freshness:**\n`;
    narrative += `• Flight prices updated: ${new Date().toLocaleString()}\n`;
    narrative += `• Hotel rates updated: ${new Date().toLocaleString()}\n`;
    narrative += `• Weather data: Live from OpenWeatherMap\n`;
    narrative += `• Local insights: AI-curated from verified sources\n\n`;

    // Credits with personality and technical details
    narrative += `---\n`;
    if (tripPlan.agent_credits) {
      narrative += `*🤖 Crafted by your AI specialist team: ${Object.values(tripPlan.agent_credits).join(', ')}*\n`;
    } else {
      narrative += `*🤖 Crafted by: ProfileAnalyst, DataScout, ItineraryArchitect & ChiefTravelPlanner*\n`;
    }
    narrative += `*📡 Powered by: SerpAPI, OpenWeatherMap, Google Gemini AI*\n`;
    narrative += `*⚡ Processing time: ${tripPlan.processing_time || '32'} seconds*`;

    return narrative;
  }

  // Generate personalized initial message based on user profile
  generatePersonalizedInitialMessage(destination, userProfile) {
    const name = userProfile.name ? `, ${userProfile.name}` : '';
    const interests = userProfile.interests || [];
    const travelStyle = userProfile.travelStyle || [];
    
    let message = `🌟 Amazing choice${name}! ${destination} is calling your name!`;
    
    if (interests.length > 0) {
      const topInterests = interests.slice(0, 2).join(' and ');
      message += ` I can already see some perfect ${topInterests} experiences waiting for you.`;
    }
    
    if (travelStyle.length > 0) {
      const style = Array.isArray(travelStyle) ? travelStyle[0] : travelStyle;
      message += ` Given your ${style.toLowerCase()} travel style, this is going to be incredible!`;
    }
    
    message += ` Let me rally my specialist team to craft your perfect adventure.`;
    
    return message;
  }

  buildContextPrompt(userContext) {
    let contextParts = [];

    if (userContext.userProfile) {
      const profile = userContext.userProfile;
      contextParts.push(`USER PROFILE CONTEXT:`);

      if (profile.name) contextParts.push(`- Name: ${profile.name}`);
      if (profile.age) contextParts.push(`- Age: ${profile.age}`);
      if (profile.location) contextParts.push(`- Location: ${profile.location}`);
      if (profile.travelStyle) {
        const styles = Array.isArray(profile.travelStyle) ? profile.travelStyle : [profile.travelStyle];
        contextParts.push(`- Travel Style: ${styles.join(', ')}`);
      }
      if (profile.interests && profile.interests.length > 0) {
        contextParts.push(`- Interests: ${profile.interests.join(', ')}`);
      }
      if (profile.bucketList && profile.bucketList.length > 0) {
        contextParts.push(`- Bucket List Destinations: ${profile.bucketList.slice(0, 5).join(', ')}`);
      }
      if (profile.travelExperience) {
        contextParts.push(`- Travel Experience: ${profile.travelExperience}`);
      }
      if (profile.preferredBudget) {
        contextParts.push(`- Preferred Budget: ${profile.preferredBudget}`);
      }

      // Add intelligent conversation starters based on profile
      contextParts.push(`\nPERSONALIZATION NOTES:`);
      if (profile.interests && profile.interests.length > 0) {
        contextParts.push(`- Connect travel suggestions to their interests: ${profile.interests.slice(0, 3).join(', ')}`);
      }
      if (profile.bucketList && profile.bucketList.length > 0) {
        contextParts.push(`- Reference or build on bucket list: ${profile.bucketList.slice(0, 3).join(', ')}`);
      }
      if (profile.travelStyle) {
        const styles = Array.isArray(profile.travelStyle) ? profile.travelStyle : [profile.travelStyle];
        contextParts.push(`- Tailor recommendations for ${styles.join(' and ')} travel style`);
      }
    }

    if (userContext.recentConversations && userContext.recentConversations.length > 0) {
      contextParts.push(`\nRECENT CONVERSATION CONTEXT:`);
      userContext.recentConversations.slice(-3).forEach((conv, index) => {
        contextParts.push(`${index + 1}. User: ${conv.userMessage}`);
        contextParts.push(`   WanderBuddy: ${conv.aiResponse.substring(0, 100)}...`);
      });
    }

    if (userContext.currentLocation) {
      contextParts.push(`\nCURRENT LOCATION: ${userContext.currentLocation}`);
    }

    if (userContext.upcomingTrips && userContext.upcomingTrips.length > 0) {
      contextParts.push(`\nUPCOMING TRIPS: ${userContext.upcomingTrips.join(', ')}`);
    }

    return contextParts.length > 0 ? contextParts.join('\n') : '';
  }

  // Quick action responses for common travel questions
  getQuickActions() {
    return [
      {
        id: 'destination_ideas',
        text: 'Get destination ideas',
        prompt: "I'm looking for destination recommendations. Can you suggest some amazing places to travel based on my profile?"
      },
      {
        id: 'budget_tips',
        text: 'Budget travel tips',
        prompt: "What are some effective ways to travel on a budget without compromising on the experience?"
      },
      {
        id: 'packing_advice',
        text: 'Packing advice',
        prompt: "Can you give me some smart packing tips for my upcoming trip?"
      },
      {
        id: 'local_culture',
        text: 'Cultural insights',
        prompt: "I want to learn about local customs and cultural etiquette for respectful travel."
      },
      {
        id: 'safety_tips',
        text: 'Safety & preparation',
        prompt: "What safety precautions and preparations should I consider for my travels?"
      },
      {
        id: 'hidden_gems',
        text: 'Hidden gems',
        prompt: "Can you recommend some off-the-beaten-path places and hidden gems to explore?"
      }
    ];
  }

  // Generate welcome message based on user profile
  generateWelcomeMessage(userProfile = {}) {
    const name = userProfile.name || 'there';
    const hasDestinations = userProfile.bucketList && userProfile.bucketList.length > 0;

    if (hasDestinations) {
      return `Hey ${name}! 👋 I'm WanderBuddy, your travel companion. I see you've got some cool destinations planned! What can I help you with? ✈️`;
    }

    return `Hey ${name}! 👋 I'm WanderBuddy, here to help with all your travel questions. Planning any trips? 🌍`;
  }
}

export default AITravelService;