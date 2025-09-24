# Wanderer - AI-Powered Travel Companion Matching App

A modern travel companion matching application with advanced AI trip planning capabilities, built with React, Node.js, and Firebase.

## 🌟 Key Features

### Core App Features
- 🔐 **User Authentication** - Firebase-based secure authentication
- 🎯 **Smart Matching** - Swipe-based travel companion matching system
- 💬 **Real-time Messaging** - Socket.io powered chat for matched users
- 📱 **Responsive Design** - Modern UI with Tailwind CSS and Radix UI

### 🤖 Advanced AI Travel Planning System
- ⚡ **Instant Responses** - Lightning-fast greetings and interactions (<100ms)
- 🧠 **Multi-Agent AI Architecture** - Specialized AI agents working together:
  - **ChatManager** - Main conversation interface and coordination
  - **DataScout** - Live travel data gathering (flights, hotels, weather)
  - **ChiefTravelPlanner** - Comprehensive trip planning and itineraries
  - **ProfileAnalyst** - Personalized recommendations based on user preferences
  - **ItineraryArchitect** - Detailed day-by-day travel plans

### 🔧 AI System Features
- 🔄 **API Key Rotation** - Intelligent rotation across multiple Gemini API keys
- 📊 **Real-time Status Updates** - Live progress tracking via WebSocket
- 💾 **Conversation Memory** - Persistent conversation state management
- 🎯 **Personalization** - AI-powered suggestions based on user profiles
- 🛡️ **Graceful Fallbacks** - Continues working even when AI services are limited

## 📁 Project Structure

```
wanderer/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Application pages/routes
│   │   ├── services/          # API services and utilities
│   │   ├── store/             # State management (Zustand)
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── backend/                     # Node.js backend API with AI system
│   ├── src/
│   │   ├── ai-agents/         # Advanced AI system
│   │   │   ├── agents/        # Individual AI agents
│   │   │   ├── utils/         # Shared AI utilities
│   │   │   └── services/      # AI orchestration services
│   │   ├── controllers/       # API controllers
│   │   ├── routes/           # Express routes
│   │   ├── services/         # Business logic
│   │   └── models/           # Data models
│   └── README.md             # Detailed backend documentation
├── firebase.json              # Firebase configuration
├── firestore.rules           # Database security rules
└── package.json              # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore
- Google Gemini API keys (3 recommended for rotation)
- SerpAPI key (for live travel data)
- OpenWeatherMap API key

### Installation

1. **Clone the repository**
2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

### Configuration

1. **Backend Setup:**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your API keys
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Firebase Setup:**
   - Place your Firebase service account key at `backend/src/services/serviceAccountKey.json`

### Development

**Start both frontend and backend:**
```bash
npm run dev
```

**Or start them separately:**
```bash
# Frontend only (http://localhost:8080)
npm run dev:frontend

# Backend only (http://localhost:3001)
npm run dev:backend
```

### Building

```bash
npm run build
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Firebase SDK** - Authentication and database

### Backend
- **Node.js & Express.js** - Server framework
- **Firebase Admin SDK** - Database and auth management
- **Socket.io** - Real-time communication
- **Google Gemini AI** - Advanced AI capabilities with key rotation
- **SerpAPI** - Live travel data (flights, hotels, attractions)
- **OpenWeatherMap** - Real-time weather information
- **JWT** - Secure authentication tokens

## 📊 API Endpoints

### AI System
- `POST /api/ai/v3/chat` - Main AI chat endpoint
- `GET /api/ai/v3/health` - System health and performance
- `GET /api/ai/v3/stats` - AI system statistics

### User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/users/profile` - User profile management

### Matching & Messaging
- `POST /api/swipes` - Travel companion matching
- `GET /api/matches` - User matches
- `POST /api/messages` - Real-time messaging

## 🤖 AI System Architecture

The AI system uses a sophisticated multi-agent approach:

1. **Instant Classification** - Messages are quickly categorized (greeting, trip planning, etc.)
2. **Immediate Feedback** - Users get instant responses while agents work in background
3. **Parallel Processing** - Multiple agents gather data simultaneously
4. **Smart Coordination** - ChatManager orchestrates all agents for cohesive results
5. **Real-time Updates** - WebSocket notifications keep users informed of progress

For detailed AI system documentation, see [`backend/README.md`](backend/README.md).

## 📈 Performance & Monitoring

- **Health Checks:** `GET /health` and `GET /api/ai/v3/health`
- **Performance Testing:** `GET /api/ai/v3/performance-test`
- **Real-time Metrics:** Comprehensive logging and status tracking
- **API Key Monitoring:** Automatic rotation and usage tracking

## 🏗️ Development Scripts

```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend development server
npm run dev:backend      # Backend development server
npm run build           # Build both applications
npm run install:all     # Install all dependencies
```

## 🔧 Environment Configuration

### Backend Environment Variables (.env)
```env
# AI Services
GEMINI_API_KEY=your_primary_gemini_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_key
GEMINI_API_KEY_BACKUP_2=your_third_gemini_key

# External APIs
SERPAPI_API_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Frontend Environment Variables (.env.local)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001

# Firebase
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

## 🚀 Production Deployment

1. **Build applications:** `npm run build`
2. **Configure production environment variables**
3. **Deploy backend:** Compatible with Node.js hosting (Heroku, Railway, etc.)
4. **Deploy frontend:** Compatible with static hosting (Vercel, Netlify, etc.)
5. **Configure Firebase production project**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (both frontend and AI system)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Documentation

- **Backend AI System:** [`backend/README.md`](backend/README.md) - Detailed AI architecture documentation
- **API Documentation:** Available at `/health` and `/api/ai/v3/health` endpoints
- **Firebase Setup:** Configure using `firebase.json` and `firestore.rules`

---

**Built with ❤️ for travelers who want intelligent trip planning and meaningful connections.**