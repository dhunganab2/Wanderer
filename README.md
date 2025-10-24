# Wanderer - AI-Powered Travel Companion Matching Platform

A comprehensive travel companion matching application with advanced AI trip planning capabilities, built with React, Node.js, and Firebase.

## Overview

Wanderer connects travelers with compatible companions and provides intelligent trip planning through a sophisticated multi-agent AI system. The platform features real-time matching, messaging, and personalized travel recommendations.

## Key Features

### Core Application
- **User Authentication** - Firebase-based secure authentication system
- **Smart Matching** - Swipe-based travel companion matching with advanced algorithms
- **Real-time Messaging** - Socket.io powered chat system for matched users
- **Responsive Design** - Modern UI built with React, Tailwind CSS, and Radix UI components
- **Location-based Discovery** - Find travel companions based on location and preferences

### AI Travel Planning System
- **Instant Response System** - Lightning-fast responses (under 100ms) for greetings and simple queries
- **Multi-Agent Architecture** - Specialized AI agents working in coordination:
  - **ChatManager** - Main conversation interface and user interaction coordinator
  - **DataScout** - Live travel data gathering (flights, hotels, weather, attractions)
  - **ChiefTravelPlanner** - Comprehensive trip planning and itinerary coordination
  - **ProfileAnalyst** - Personalized recommendations based on user preferences
  - **ItineraryArchitect** - Detailed day-by-day travel plan creation

### Advanced AI Features
- **API Key Rotation** - Intelligent rotation across multiple Gemini API keys for reliability
- **Real-time Status Updates** - Live progress tracking via WebSocket connections
- **Conversation Memory** - Persistent conversation state and context management
- **Personalization Engine** - AI-powered suggestions based on user profiles and travel history
- **Graceful Fallbacks** - System continues working even when AI services are limited

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Zustand** for state management
- **Socket.io Client** for real-time communication

### Backend
- **Node.js** with Express
- **Firebase Firestore** for database
- **Socket.io** for real-time messaging
- **Google Gemini AI** for intelligent responses
- **SerpAPI** for live travel data
- **OpenWeatherMap** for weather information

### Infrastructure
- **Firebase** for authentication and hosting
- **Firestore** for real-time database
- **Firebase Storage** for file uploads

## Project Structure

```
wanderer/
├── frontend/                           # React frontend application
│   ├── src/
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── ui/                     # Radix UI components
│   │   │   ├── AITravelBuddy.tsx       # AI chat interface
│   │   │   ├── SwipeableCard.tsx       # Matching cards
│   │   │   └── ...                     # Other components
│   │   ├── pages/                      # Application pages/routes
│   │   │   ├── Discover.tsx            # User discovery/swiping
│   │   │   ├── Messages.tsx            # Chat interface
│   │   │   ├── Map.tsx                 # Interactive map
│   │   │   └── ...                     # Other pages
│   │   ├── services/                   # API services and utilities
│   │   ├── store/                      # State management (Zustand)
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── types/                       # TypeScript type definitions
│   │   └── lib/                        # Utility libraries
│   ├── public/                         # Static assets
│   └── package.json                    # Frontend dependencies
├── backend/                            # Node.js backend API
│   ├── src/
│   │   ├── ai-agents/                  # Advanced AI system
│   │   │   ├── QuickResponseAIService.js    # Main AI service
│   │   │   ├── ChatManagerAgent.js          # Conversation manager
│   │   │   ├── DataScoutAgent.js            # Data gathering
│   │   │   ├── ChiefTravelPlannerAgent.js   # Trip planning
│   │   │   ├── ProfileAnalystAgent.js      # User analysis
│   │   │   ├── ItineraryArchitectAgent.js  # Itinerary creation
│   │   │   └── BaseAgent.js                 # Base agent class
│   │   ├── controllers/                # API controllers
│   │   ├── routes/                     # Express routes
│   │   ├── services/                   # Business logic
│   │   ├── models/                     # Data models
│   │   ├── middleware/                 # Express middleware
│   │   ├── config/                     # Configuration
│   │   └── scripts/                    # Utility scripts
│   ├── data/                           # Local data files
│   ├── package.json                    # Backend dependencies
│   └── env.example                     # Environment variables template
├── firebase.json                       # Firebase configuration
├── firestore.rules                     # Database security rules
├── firestore.indexes.json             # Database indexes
├── storage.rules                       # Storage security rules
├── .gitignore                          # Git ignore rules
└── package.json                        # Root workspace configuration
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Firebase project with Firestore enabled
- Google Gemini API keys (3 recommended for rotation)
- SerpAPI key for live travel data
- OpenWeatherMap API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd wanderer
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup:**
   ```bash
   # Backend environment
   cd backend
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Firebase Setup:**
   ```bash
   # Place your Firebase service account key at:
   backend/src/services/serviceAccountKey.json
   ```

5. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## Configuration

### Required Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# AI Services (3 keys for rotation)
GEMINI_API_KEY=your_primary_gemini_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_key
GEMINI_API_KEY_BACKUP_2=your_third_gemini_key

# External APIs
SERPAPI_API_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/serviceAccountKey.json

# Security
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### AI Chat System
- `POST /api/ai/v3/chat` - Main chat endpoint
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

## AI System Architecture

### Request Flow
```
User Message
    ↓
QuickResponseAIService
    ↓
ChatManagerAgent (classifies intent)
    ↓
    ├─→ Simple Greeting → Instant Response
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
- **Instant Responses** - Greetings and simple queries under 100ms
- **Intelligent Classification** - Automatically routes to appropriate handler
- **Background Processing** - Complex planning happens asynchronously
- **Natural Conversation** - Maintains context across multiple messages
- **Real-time Data** - Live flights, weather, and attraction information
- **Personalization** - Tailored to user preferences and travel style

## Development Scripts

### Backend
```bash
npm start              # Start production server
npm run dev            # Start development server with auto-reload
npm run test-firebase  # Test Firebase connection
npm run clear-matches  # Clear all matches (development)
npm run clear-messages # Clear all messages (development)
npm run debug-db       # Database debugging utilities
```

### Frontend
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## Monitoring and Debugging

### Health Checks
- Server health: `GET /health`
- AI system health: `GET /api/ai/v3/health`
- Performance test: `GET /api/ai/v3/performance-test`

### Debug Endpoints
- `DELETE /api/ai/v3/debug/clear-state/:userId` - Force clear user state
- `GET /api/ai/v3/stats` - Detailed system statistics

## Production Deployment

### Environment Setup
- Set `NODE_ENV=production`
- Use production Firebase project
- Configure proper CORS origins
- Set up API key rotation with paid tiers

### Performance Considerations
- System optimized for fast responses
- API key rotation prevents quota limits
- WebSocket connections for real-time updates
- Efficient conversation state management

### Security
- JWT-based authentication
- Helmet security headers
- Rate limiting on API endpoints
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

Built for travelers who want to explore the world together.