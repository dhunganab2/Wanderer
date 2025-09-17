import type {
  AIChatResponse,
  AIWelcomeResponse,
  AIQuickActionsResponse,
  AIUserContext,
  AIServiceConfig
} from '../types/aiChat';

class AITravelService {
  private baseUrl: string;
  private timeout: number;

  constructor(config?: AIServiceConfig) {
    this.baseUrl = config?.baseUrl || 'http://localhost:3001/api/ai';
    this.timeout = config?.timeout || 30000;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-conversation-id': this.getConversationId(),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  private getConversationId(): string {
    let conversationId = localStorage.getItem('ai_conversation_id');
    if (!conversationId) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('ai_conversation_id', conversationId);
    }
    return conversationId;
  }

  async sendMessage(
    message: string,
    userContext?: AIUserContext
  ): Promise<AIChatResponse> {
    try {
      console.log('🤖 Sending message to backend:', message);
      const response = await this.makeRequest<AIChatResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: message.trim(),
          userContext: userContext || {}
        }),
      });
      console.log('🤖 Backend response:', response);
      return response;
    } catch (error) {
      console.error('AI Chat Service - Send Message Error:', error);
      console.log('🤖 Falling back to mock response');
      // Fallback to mock if backend fails
      return await this.getMockResponse(message, userContext);
    }
  }

  private async getMockResponse(message: string, userContext?: AIUserContext): Promise<AIChatResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    const lowerMessage = message.toLowerCase();

    let response = '';

    if (lowerMessage.includes('destination') || lowerMessage.includes('where')) {
      response = `🌟 Ooh, great question! Based on your vibe, I'm thinking Japan for amazing culture and food, or maybe Costa Rica for adventure? \n\nWhat kind of experience gets you excited - adventure, culture, or relaxation? 🗺️`;
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('money') || lowerMessage.includes('cost')) {
      response = `💰 Smart thinking! My top budget tip is to eat where locals do - street food is usually amazing and super cheap! Also, being flexible with your travel dates can save you hundreds on flights.\n\nWhat's your rough budget looking like? Happy to share more targeted tips! 💡`;
    } else if (lowerMessage.includes('pack') || lowerMessage.includes('luggage') || lowerMessage.includes('bring')) {
      response = `🎒 Golden rule: pack half the clothes and twice the money! Roll everything to save space, bring layers, and always pack one outfit in your carry-on just in case.\n\nWhere are you headed? I can give you destination-specific packing tips! ✈️`;
    } else if (lowerMessage.includes('safety') || lowerMessage.includes('safe') || lowerMessage.includes('security')) {
      response = `🛡️ Most important safety tip? Trust your gut! If something feels off, it probably is. Keep copies of your passport, don't flash expensive stuff, and always let someone know your plans.\n\nAny specific safety concerns for your trip? Happy to help ease those worries! 🌍`;
    } else if (lowerMessage.includes('culture') || lowerMessage.includes('local') || lowerMessage.includes('customs')) {
      response = `🌍 Best way to experience culture? Eat where locals eat and learn "hello", "thank you", and "excuse me" in the local language. People light up when you make the effort!\n\nWhich destination's culture are you curious about? I love sharing cultural insights! 🎭`;
    } else if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('cuisine')) {
      response = `🍜 Food is the best part of traveling! My rule: if locals are lining up for it, you should too. Street food tours are amazing ways to discover hidden gems safely.\n\nWhat cuisine are you excited to dive into? I've got some incredible recommendations! 🌶️`;
    } else if (lowerMessage.includes('solo') || lowerMessage.includes('alone') || lowerMessage.includes('single')) {
      response = `🌟 Solo travel is the best! You'll be amazed how much you discover about yourself. Japan, New Zealand, and Iceland are fantastic for first-timers - super safe and easy to navigate.\n\nWhere are you thinking of going solo? I'd love to help you plan it! 🚶‍♀️`;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = `👋 Hey there, fellow wanderer! I'm here to help you plan amazing adventures - from finding perfect destinations to budget tips and everything in between.\n\nWhat's on your travel mind today? 🌎✈️`;
    } else {
      response = `🤔 Hmm, I'm all about travel! I'm best at helping with destinations, budgets, packing, safety, local culture, and food recommendations.\n\nWhat travel adventure can I help you plan today? 🗺️`;
    }

    return {
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString()
      }
    };
  }

  async getWelcomeMessage(userContext?: AIUserContext): Promise<AIWelcomeResponse> {
    try {
      // Mock welcome message
      await new Promise(resolve => setTimeout(resolve, 800));

      const userProfile = userContext?.userProfile;
      const userName = userProfile?.name || 'fellow wanderer';

      return {
        success: true,
        data: {
          message: `🌟 Welcome to WanderBuddy, ${userName}! I'm your AI travel companion, ready to help you plan incredible adventures.\n\n**I can assist you with:**\n• Finding amazing destinations based on your interests\n• Creating budget-friendly travel plans\n• Discovering local culture and hidden gems\n• Providing safety tips and packing advice\n• Connecting you with like-minded travelers\n\nReady to explore the world? Ask me anything or choose a quick option below! ✈️`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('AI Chat Service - Welcome Message Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get welcome message'
      };
    }
  }

  async getQuickActions(): Promise<AIQuickActionsResponse> {
    try {
      // Mock quick actions
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        success: true,
        data: [
          {
            id: 'destination_ideas',
            text: 'Get destination recommendations',
            prompt: 'What are some amazing travel destinations you would recommend for me?'
          },
          {
            id: 'budget_tips',
            text: 'Budget travel tips',
            prompt: 'Can you give me some budget travel tips to save money?'
          },
          {
            id: 'packing_advice',
            text: 'Packing essentials guide',
            prompt: 'What should I pack for my upcoming trip?'
          },
          {
            id: 'local_culture',
            text: 'Cultural travel insights',
            prompt: 'Tell me about local cultures and customs for travelers'
          },
          {
            id: 'safety_tips',
            text: 'Travel safety advice',
            prompt: 'What are the most important travel safety tips?'
          },
          {
            id: 'hidden_gems',
            text: 'Discover hidden gems',
            prompt: 'Help me find hidden gems and off-the-beaten-path destinations'
          }
        ]
      };
    } catch (error) {
      console.error('AI Chat Service - Quick Actions Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get quick actions'
      };
    }
  }

  async healthCheck(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.makeRequest<any>('/health');
      return { success: response.success };
    } catch (error) {
      console.error('AI Chat Service - Health Check Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  async clearConversation(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.makeRequest<any>('/conversation', {
        method: 'DELETE',
        body: JSON.stringify({
          conversationId: this.getConversationId()
        }),
      });

      // Clear local conversation ID to start fresh
      localStorage.removeItem('ai_conversation_id');

      return { success: true };
    } catch (error) {
      console.error('AI Chat Service - Clear Conversation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear conversation'
      };
    }
  }

  // Utility methods
  getStoredMessages(): any[] {
    try {
      const stored = localStorage.getItem('ai_chat_messages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  storeMessages(messages: any[]): void {
    try {
      localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to store messages:', error);
    }
  }

  clearStoredMessages(): void {
    localStorage.removeItem('ai_chat_messages');
    localStorage.removeItem('ai_conversation_id');
  }
}

// Export singleton instance
const aiTravelService = new AITravelService();
export default aiTravelService;