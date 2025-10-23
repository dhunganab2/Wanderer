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


