// AI Chat Types for Travel Buddy

export interface AIChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isTyping?: boolean;
  type?: 'chat' | 'trip_plan' | 'interactive_trip_plan' | 'welcome';
  metadata?: {
    destination?: string;
    travelers?: string[];
    duration?: number;
    trip_type?: 'solo' | 'group';
    rawData?: any;
    userProfile?: {
      name?: string;
      age?: number;
      location?: string;
      travelStyle?: string[];
      interests?: string[];
      bucketList?: string[];
      travelExperience?: string;
      preferredBudget?: string;
    };
  };
}

export interface AIQuickAction {
  id: string;
  text: string;
  prompt: string;
  icon?: string;
}

export interface AIChatSession {
  id: string;
  title?: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIUserContext {
  userProfile?: {
    name?: string;
    age?: number;
    location?: string;
    travelStyle?: string[];
    interests?: string[];
    bucketList?: string[];
    travelExperience?: string;
    preferredBudget?: string;
  };
  recentConversations?: Array<{
    userMessage: string;
    aiResponse: string;
    timestamp: string;
  }>;
  currentLocation?: string;
  upcomingTrips?: string[];
}

export interface AIChatResponse {
  success: boolean;
  data?: {
    message: string;
    timestamp: string;
    conversationId?: string;
    type?: 'chat' | 'trip_plan' | 'interactive_trip_plan' | 'welcome';
    metadata?: {
      destination?: string;
      travelers?: string[];
      duration?: number;
      trip_type?: 'solo' | 'group';
      rawData?: any;
      userProfile?: {
        name?: string;
        age?: number;
        location?: string;
        travelStyle?: string[];
        interests?: string[];
        bucketList?: string[];
        travelExperience?: string;
        preferredBudget?: string;
      };
    };
  };
  error?: string;
}

export interface AIWelcomeResponse {
  success: boolean;
  data?: {
    message: string;
    timestamp: string;
    type: 'welcome';
  };
  error?: string;
}

export interface AIQuickActionsResponse {
  success: boolean;
  data?: AIQuickAction[];
  error?: string;
}

export interface AIChatState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: AIChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentSessionId: string;
  hasWelcomed: boolean;
}

export interface AIChatProps {
  className?: string;
  initialPosition?: 'right' | 'left';
  theme?: 'light' | 'dark' | 'auto';
  userContext?: AIUserContext;
  onMessageSent?: (message: string) => void;
  onChatToggle?: (isOpen: boolean) => void;
}

// API Configuration
export interface AIServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}