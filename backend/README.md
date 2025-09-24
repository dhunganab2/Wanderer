# Wanderer Backend

A comprehensive backend API for a travel companion matching platform with advanced AI-powered trip planning capabilities.

## 🌟 Features

### Core Functionality
- **User Authentication & Profiles** - Firebase-based user management with detailed travel profiles
- **Travel Companion Matching** - Swipe-based matching system for finding travel buddies
- **Real-time Messaging** - Socket.io powered chat system for matched users
- **AI Trip Planning** - Advanced multi-agent AI system for personalized travel planning

### AI Travel Planning System
- **Instant Response System** - Lightning-fast responses (<100ms) for greetings and simple queries
- **Multi-Agent Architecture** - Specialized AI agents working together:
  - **ChatManager** - Main user interface and conversation management
  - **DataScout** - Real-time data gathering from SerpAPI and OpenWeatherMap
  - **ChiefTravelPlanner** - Comprehensive trip planning and itinerary creation
  - **ProfileAnalyst** - User preference analysis and personalization
  - **ItineraryArchitect** - Detailed day-by-day itinerary construction

### Advanced AI Features
- **API Key Rotation** - Intelligent rotation across 3 Gemini API keys for reliability
- **Real-time Status Updates** - Live progress tracking with WebSocket notifications
- **Conversation State Management** - Persistent conversation history and context
- **Personalized Recommendations** - AI-powered suggestions based on user profiles
- **Fallback Systems** - Graceful degradation when AI services are unavailable

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Firebase Project with Firestore
- Google Gemini API Keys (3 recommended for rotation)
- SerpAPI Key (for live travel data)
- OpenWeatherMap API Key

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Firebase Setup:**
   ```bash
   # Place your Firebase service account key at:
   src/services/serviceAccountKey.json
   ```

4. **Start the server:**
   ```bash
   npm start        # Production
   npm run dev      # Development with auto-reload
   ```

Server runs on `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── ai-agents/                    # AI System
│   │   ├── agents/                   # Individual AI agents
│   │   │   ├── ChatManagerAgent.js   # Main conversation manager
│   │   │   ├── DataScoutAgent.js     # Live data gathering
│   │   │   ├── ChiefTravelPlannerAgent.js
│   │   │   ├── ProfileAnalystAgent.js
│   │   │   └── ItineraryArchitectAgent.js
│   │   ├── utils/
│   │   │   └── BaseAgent.js          # Base class for all agents
│   │   ├── QuickResponseAIService.js # Fast response coordinator
│   │   └── ImprovedAITravelService.js # Legacy service
│   ├── controllers/                  # API Controllers
│   ├── routes/                       # API Routes
│   │   ├── aiV3.js                   # Latest AI endpoints (recommended)
│   │   └── aiV2.js                   # Legacy AI endpoints
│   ├── services/                     # Business logic
│   ├── models/                       # Data models
│   ├── middleware/                   # Express middleware
│   ├── config/                       # Configuration
│   └── index.js                      # Server entry point
├── package.json
├── .env.example
└── README.md
```

## 🤖 AI System Architecture

### Quick Response System
The AI system prioritizes speed and user experience:

1. **Instant Classifications** - Messages are quickly classified (greeting, trip planning, etc.)
2. **Immediate Responses** - Users get instant feedback while agents work in background
3. **Progressive Enhancement** - Simple responses are enhanced with AI-generated content
4. **Real-time Updates** - Status updates keep users informed of progress

### Agent Coordination
- **ChatManager** acts as the main interface, coordinating other agents
- **DataScout** fetches live travel data (flights, hotels, weather, attractions)
- Specialized agents work in parallel for comprehensive planning
- Results are combined into cohesive, personalized travel plans

## 🔗 API Endpoints

### AI Chat System
- `POST /api/ai/v3/chat` - Main chat endpoint (recommended)
- `GET /api/ai/v3/health` - System health check
- `GET /api/ai/v3/stats` - Performance statistics
- `DELETE /api/ai/v3/conversation/:userId` - Clear conversation state

### User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Matching System
- `POST /api/swipes` - Swipe on another user
- `GET /api/matches` - Get user matches
- `POST /api/messages` - Send message
- `GET /api/messages/:matchId` - Get conversation

## ⚙️ Configuration

### Required Environment Variables
```env
# Server
NODE_ENV=development
PORT=3001

# AI Services (3 keys for rotation)
GEMINI_API_KEY=your_primary_gemini_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_key
GEMINI_API_KEY_BACKUP_2=your_third_gemini_key

# External APIs
SERPAPI_API_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/serviceAccountKey.json

# Security
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:8080
```

## 🔧 Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with auto-reload
npm run test-firebase  # Test Firebase connection
npm run clear-matches  # Clear all matches (development)
npm run clear-messages # Clear all messages (development)
npm run debug-db       # Database debugging utilities
```

## 📊 Monitoring & Debugging

### Health Checks
- Server health: `GET /health`
- AI system health: `GET /api/ai/v3/health`
- Performance test: `GET /api/ai/v3/performance-test`

### Logging
The system provides comprehensive logging:
- API key usage and rotation
- AI agent status and coordination
- Real-time conversation flow
- Performance metrics
- Error handling and fallbacks

### Debug Endpoints
- `DELETE /api/ai/v3/debug/clear-state/:userId` - Force clear user state
- `GET /api/ai/v3/stats` - Detailed system statistics

## 🚀 Production Deployment

1. **Environment Setup:**
   - Set `NODE_ENV=production`
   - Use production Firebase project
   - Configure proper CORS origins
   - Set up API key rotation with paid tiers

2. **Performance:**
   - The system is optimized for fast responses
   - API key rotation prevents quota limits
   - WebSocket connections for real-time updates
   - Efficient conversation state management

3. **Security:**
   - JWT-based authentication
   - Helmet security headers
   - Rate limiting on API endpoints
   - Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Projects

- **Frontend:** Wanderer Vue.js application
- **Mobile:** Wanderer mobile app (if applicable)

---

**Built with ❤️ for travelers who want to explore the world together.**