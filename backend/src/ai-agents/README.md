# Improved AI Travel Agent System v2.0

This is the next-generation AI travel planning system featuring natural conversational flow and multi-agent coordination.

## 🌟 Key Features

- **Natural Conversation Flow**: Handles conversation like the scenario you described - gathering information naturally
- **Multi-Agent Architecture**: Specialized agents work together seamlessly
- **Real API Integration**: Uses live data instead of mock responses
- **Real-time Status Updates**: WebSocket integration for live planning updates
- **Proper Code Organization**: Separated agents, clean architecture

## 🏗️ Architecture

```
ai-agents/
├── agents/                    # Individual AI agents
│   ├── ChiefTravelPlannerAgent.js    # Manager agent (handles user communication)
│   ├── ProfileAnalystAgent.js       # Analyzes user preferences
│   ├── DataScoutAgent.js            # Gathers live travel data
│   └── ItineraryArchitectAgent.js   # Designs day-by-day itineraries
├── managers/                  # Orchestration and flow management
│   ├── ConversationFlowManager.js   # Natural conversation flow
│   └── TravelPlanningOrchestrator.js # Agent coordination
├── utils/                     # Shared utilities
│   └── BaseAgent.js          # Base class for all agents
└── ImprovedAITravelService.js # Main service interface
```

## 🎯 The Natural Flow (Your Scenario)

### Step 1: Initial Conversation (ChiefTravelPlanner leads)
```
User: "plan a trip to tokyo"
ChiefTravelPlanner: "Tokyo is amazing! To get started, how many days are you thinking, and will you be traveling solo or with someone?"

User: "5 days, and I'll be going with my friend Casey"
ChiefTravelPlanner: "Perfect! A 5-day trip to Tokyo for you and Casey. My specialist team is on it!"
```

### Step 2: Parallel Research (Specialists work simultaneously)
- **ProfileAnalyst**: Fetches user profiles, analyzes preferences
- **DataScout**: Calls live APIs for flights, hotels, weather

### Step 3: Creative Briefing (Manager coordinates)
- ChiefTravelPlanner bundles all findings for the creative team

### Step 4: Itinerary Design (ItineraryArchitect creates)
- Designs day-by-day plans using all gathered intel

### Step 5: Final Assembly (Manager presents)
- ChiefTravelPlanner presents the complete plan with all components

## 🚀 Usage

### Basic Integration

```javascript
import ImprovedAITravelService from './ai-agents/ImprovedAITravelService.js';

const aiService = new ImprovedAITravelService();
await aiService.initialize(socketService);

const response = await aiService.generateResponse(
  "plan a trip to tokyo",
  {
    userId: "user123",
    userProfile: { name: "John", interests: ["food", "culture"] }
  },
  socketService
);
```

### Using the V2 Controller

```javascript
import AIControllerV2 from './controllers/aiControllerV2.js';

const controller = new AIControllerV2();

// In your route
app.post('/api/ai/v2/chat', controller.chat.bind(controller));
```

### WebSocket Status Updates

The system sends real-time updates during the planning process:

```javascript
// Status updates you'll receive
{
  stage: 'profile_analysis',
  message: '🧠 Analyzing your travel personality...',
  progress: 30,
  agents_status: [
    { name: 'ProfileAnalyst', status: 'working', task: 'Deep-diving into preferences...' },
    { name: 'DataScout', status: 'waiting', task: '⏳ Standing by...' }
  ]
}
```

## 🔧 Configuration

### Environment Variables

```bash
# AI API Keys
GEMINI_API_KEY=your-primary-gemini-key
GEMINI_API_KEY_BACKUP=your-backup-key-1
GEMINI_API_KEY_BACKUP_2=your-backup-key-2

# Real API Keys (no more mock data!)
SERPAPI_API_KEY=your-serpapi-key-for-flights-hotels
OPENWEATHER_API_KEY=your-weather-api-key

# System Configuration
USE_IMPROVED_AI=true  # Enable the v2 system
```

### System Switching

You can switch between the old and new systems:

```bash
# Switch to improved system
POST /api/ai/v2/switch-system
{ "system": "improved" }

# Switch to legacy system
POST /api/ai/v2/switch-system
{ "system": "legacy" }
```

## 🎪 Agent Details

### ChiefTravelPlanner (The Manager)
- **Role**: Lead consultant and user experience manager
- **Handles**: User communication, information gathering, final presentation
- **Personality**: Warm, enthusiastic, professionally friendly

### ProfileAnalyst (The Personality Expert)
- **Role**: Deep-dive into user preferences and travel style
- **Analyzes**: Interests, travel history, personality traits, group compatibility
- **Output**: Detailed personalization recommendations

### DataScout (The Research Specialist)
- **Role**: Gathers all real-time travel data
- **APIs Used**: SerpAPI (flights/hotels), OpenWeatherMap (weather), web search
- **Output**: Live flight options, hotel recommendations, weather, local insights

### ItineraryArchitect (The Creative Designer)
- **Role**: Crafts the day-by-day experience
- **Specializes**: Themed days, local experiences, practical logistics
- **Output**: Detailed daily plans with timing, costs, insider tips

## 🧪 Testing

Run the test script to see the conversational flow in action:

```bash
node src/ai-agents/test/testConversationalFlow.js
```

This will simulate the exact scenario you described: "plan a trip to tokyo" → gathering details → multi-agent planning.

## 📡 API Endpoints (V2)

```
POST /api/ai/v2/chat              # Main chat interface
GET  /api/ai/v2/health           # Detailed system health
GET  /api/ai/v2/stats            # Agent statuses
GET  /api/ai/v2/conversation/:id # Get conversation state
DELETE /api/ai/v2/conversation/:id # Clear conversation
POST /api/ai/v2/switch-system    # Switch AI systems
POST /api/ai/v2/reinitialize     # Restart system
```

## 🔄 Migration from V1

The new system is backward-compatible. Your existing routes will continue working, but you can gradually migrate:

1. Keep existing `/api/ai/` routes for compatibility
2. Add new `/api/ai/v2/` routes for enhanced features
3. Update frontend to use real-time status updates
4. Switch `USE_IMPROVED_AI=true` when ready

## 🐛 Debugging

- Check agent statuses: `GET /api/ai/v2/stats`
- Monitor conversation state: `GET /api/ai/v2/conversation/:userId`
- View health details: `GET /api/ai/v2/health`
- Test individual agents in the code
- Use the test script for end-to-end validation

## 🎉 Benefits Over V1

1. **Natural Conversation**: No more rigid form-filling, actual dialogue
2. **Real Data**: Live APIs instead of mock responses
3. **Specialized Expertise**: Each agent is an expert in their domain
4. **Real-time Updates**: Users see the planning process happening
5. **Better Organization**: Clean, maintainable, reviewable code
6. **Scalable**: Easy to add new agents or modify existing ones

The system now works exactly like your scenario - natural, intelligent, and coordinated! 🚀