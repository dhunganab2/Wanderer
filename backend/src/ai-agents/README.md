# AI Travel Agent System

> **Multi-Agent Architecture for Intelligent Travel Planning**

This directory contains the AI agent system that powers Wanderer's intelligent travel planning capabilities.

---

## 🎯 System Architecture

The system uses a **single entry point** with coordinated specialist agents working behind the scenes.

### Entry Point
- **`QuickResponseAIService.js`** - Main service interface for all AI requests

### Core Components

#### 1. **BaseAgent.js** (Base Class)
- Foundation class for all AI agents
- Handles Gemini AI API calls
- Provides status tracking and error handling
- Shared utilities for all agents

#### 2. **ChatManagerAgent.js** (Primary Interface)
- **Single point of contact** for all user interactions
- Classifies user intent (greeting, trip planning, questions)
- Coordinates specialist agents behind the scenes
- Handles instant responses (<100ms)
- Manages conversation state and context

#### 3. **DataScoutAgent.js** (Data Specialist)
- Gathers real-time travel data
- Fetches flight information (SerpAPI)
- Gets weather data (OpenWeatherMap)
- Researches hotels and attractions
- Provides factual, up-to-date information

#### 4. **ProfileAnalystAgent.js** (Personalization)
- Analyzes user profiles and preferences
- Understands travel styles and interests
- Matches destinations to user preferences
- Creates personalized recommendations

#### 5. **ChiefTravelPlannerAgent.js** (Trip Coordinator)
- Orchestrates comprehensive trip planning
- Coordinates with all specialist agents
- Compiles complete travel plans
- Manages complex multi-step planning

#### 6. **ItineraryArchitectAgent.js** (Itinerary Designer)
- Creates detailed day-by-day itineraries
- Balances activities with local experiences
- Optimizes routes and timing
- Designs personalized travel flows

### Support Components

#### 7. **ConversationFlowManager.js**
- Manages natural conversation flow
- Tracks conversation context and state
- Handles multi-turn conversations

#### 8. **TravelPlanningOrchestrator.js**
- Coordinates complex planning processes
- Manages agent interactions
- Handles background processing

---

## 🚀 How It Works

### Request Flow

```
User Message
    ↓
QuickResponseAIService
    ↓
ChatManagerAgent (classifies intent)
    ↓
    ├─→ Simple Greeting → Instant Response ⚡
    │
    ├─→ Trip Planning → Coordinate Specialists
    │       ↓
    │   ProfileAnalyst (preferences)
    │   DataScout (live data)
    │   ItineraryArchitect (itinerary)
    │   ChiefTravelPlanner (compile)
    │       ↓
    │   Complete Travel Plan
    │
    └─→ General Question → Direct AI Response
```

### Key Features

- **⚡ Instant Responses**: Greetings and simple queries <100ms
- **🤖 Intelligent Classification**: Automatically routes to appropriate handler
- **🔄 Background Processing**: Complex planning happens asynchronously
- **💬 Natural Conversation**: Maintains context across multiple messages
- **📊 Real-time Data**: Live flights, weather, and attraction info
- **🎯 Personalization**: Tailored to user preferences and travel style

---

## 📦 File Organization

All agents are in a **single directory** for simplicity:

```
ai-agents/
├── QuickResponseAIService.js      # Main entry point
├── BaseAgent.js                   # Base class for all agents
├── ChatManagerAgent.js            # Primary user interface (LARGE: 2,356 lines)
├── DataScoutAgent.js              # Data gathering specialist (739 lines)
├── ProfileAnalystAgent.js         # User preference analyst (316 lines)
├── ChiefTravelPlannerAgent.js     # Trip planning coordinator (415 lines)
├── ItineraryArchitectAgent.js     # Itinerary designer (495 lines)
├── ConversationFlowManager.js     # Conversation state management (483 lines)
├── TravelPlanningOrchestrator.js  # Agent orchestration (657 lines)
└── README.md                      # This file
```

**Total:** ~6,000 lines of AI agent code

---

## 🔧 Usage

### Initialize the Service

```javascript
import QuickResponseAIService from './ai-agents/QuickResponseAIService.js';

const aiService = new QuickResponseAIService();
await aiService.initialize(socketService);
```

### Generate Response

```javascript
const response = await aiService.generateResponse(
  "Plan a trip to Tokyo",
  {
    userId: "user123",
    userProfile: {
      name: "Alex",
      interests: ["food", "culture"],
      travelStyle: ["adventurous"]
    }
  },
  socketService
);
```

### Response Format

```javascript
{
  success: true,
  message: "Hey Alex! 🗺️ Tokyo is incredible! Let me help you plan...",
  timestamp: "2025-10-14T...",
  type: "chat" | "trip_plan" | "greeting",
  metadata: {
    quickResponse: true,
    responseTime: "instant",
    systemVersion: "2.1"
  }
}
```

---

## 🧪 Testing

Test files have been moved to `/backend/src/scripts/` for proper separation:
- Use scripts for manual testing and debugging
- Production code remains clean and focused

---

## 🔑 Environment Variables

Required for full functionality:

```env
# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Data Sources
SERPAPI_API_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key
```

---

## 📊 System Stats

- **Agents:** 5 specialist agents + 1 coordinator + 2 managers = 8 components
- **Response Time:** <100ms for simple queries
- **Architecture:** Single manager pattern with specialist coordination
- **Real-time Updates:** WebSocket support for live planning updates

---

## 🎯 Design Principles

1. **Single Entry Point**: All requests go through `QuickResponseAIService`
2. **User-Facing Simplicity**: Users only interact with `ChatManagerAgent`
3. **Specialist Coordination**: Agents work behind the scenes
4. **Instant Feedback**: Quick responses while processing in background
5. **Clean Code**: All files in one directory, no unnecessary nesting

---

## 🔄 Future Improvements

- Add agent performance metrics
- Implement response caching
- Add more data sources
- Enhance personalization algorithms

---

**Last Updated:** October 14, 2025
**Architecture Version:** 2.1
**Total Lines of Code:** ~6,000
