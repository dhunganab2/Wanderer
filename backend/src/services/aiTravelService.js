import { GoogleGenerativeAI } from '@google/generative-ai';

class AITravelService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not provided - AI features will be disabled');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    // System prompt for the AI Travel Buddy
    this.systemPrompt = `You are WanderBuddy, a friendly AI travel companion for the Wanderer app. You help users with travel planning and advice.

PERSONALITY:
- Friendly and helpful, like chatting with a travel buddy
- Concise but warm responses (1-3 sentences typically)
- Use occasional travel emojis (✈️, 🗺️, 🏔️, 🌍)
- Be conversational and natural

EXPERTISE:
- Destination recommendations
- Budget travel tips
- Cultural insights and etiquette
- Safety advice
- Hidden gems and local spots
- Transportation and accommodation
- Packing and preparation tips

RESPONSE STYLE:
- Keep responses SHORT and conversational (like texting a friend)
- For simple greetings, respond simply
- Ask ONE follow-up question if helpful
- Be specific and actionable
- Match the user's energy level

EXAMPLES:
User: "hi" → "Hey! 👋 Planning any trips soon?"
User: "I want to visit Japan" → "Amazing choice! 🇯🇵 When are you thinking of going? Season makes a big difference there."
User: "budget tips" → "Love budget travel! 💰 Best tips: stay in hostels, eat street food, use public transport, and book flights in advance. What's your destination?"

Keep it short, helpful, and friendly!`;
  }

  async generateResponse(message, userContext = {}) {
    try {
      // Check if AI is available
      if (!this.model) {
        return {
          success: false,
          error: 'AI features are currently disabled. Please configure GEMINI_API_KEY to enable AI travel assistance.',
          timestamp: new Date().toISOString()
        };
      }

      // Prepare the context-aware prompt
      const contextPrompt = this.buildContextPrompt(userContext);
      const fullPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nUser Message: ${message}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI Travel Service Error:', error);
      return {
        success: false,
        error: 'Sorry, I encountered an error while processing your request. Please try again!',
        timestamp: new Date().toISOString()
      };
    }
  }

  buildContextPrompt(userContext) {
    let contextParts = [];

    if (userContext.userProfile) {
      const profile = userContext.userProfile;
      contextParts.push(`USER PROFILE CONTEXT:`);

      if (profile.name) contextParts.push(`- Name: ${profile.name}`);
      if (profile.age) contextParts.push(`- Age: ${profile.age}`);
      if (profile.location) contextParts.push(`- Location: ${profile.location}`);
      if (profile.travelStyle) contextParts.push(`- Travel Style: ${profile.travelStyle}`);
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