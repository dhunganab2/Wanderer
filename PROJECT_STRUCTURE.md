# Wanderer Project Structure

> **Last Updated:** October 2025
> **Version:** 1.0.0

This document provides a comprehensive overview of the Wanderer project structure, making it easy for anyone to understand and navigate the codebase.

---

## 📁 Root Directory

```
wanderer/
├── frontend/              # React TypeScript frontend application
├── backend/               # Node.js Express backend API
├── .gitignore            # Git ignore rules (includes security patterns)
├── package.json          # Root workspace configuration
├── README.md             # Main project documentation
├── PROJECT_STRUCTURE.md  # This file
├── firebase.json         # Firebase hosting configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules         # Firebase storage security rules
└── setup-firebase.sh     # Firebase setup script
```

---

## 🎨 Frontend Structure

**Location:** `/frontend`
**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS

### Directory Organization

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AuthProvider.tsx
│   │   ├── Navigation.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── SwipeableCard.tsx
│   │   ├── TravelCard.tsx
│   │   ├── AITravelBuddy.tsx
│   │   ├── LeafletMap.tsx
│   │   └── _archive/       # Deprecated components
│   │
│   ├── pages/              # Application pages/routes
│   │   ├── Index.tsx       # Landing/home page
│   │   ├── Login.tsx       # User authentication
│   │   ├── Signup.tsx      # User registration
│   │   ├── Discover.tsx    # Main swipe/discovery page
│   │   ├── Messages.tsx    # Real-time messaging
│   │   ├── Matches.tsx     # Matched users view
│   │   ├── Profile.tsx     # User profile management
│   │   ├── AITravelPlanner.tsx  # AI travel planning
│   │   ├── Map.tsx         # Interactive map view
│   │   ├── NotFound.tsx    # 404 page
│   │   └── _archive/       # Old page versions
│   │
│   ├── services/           # API and business logic
│   │   ├── firebaseService.ts      # Firebase operations
│   │   ├── realtimeMessaging.ts    # WebSocket messaging
│   │   ├── matchingAlgorithm.ts    # User matching logic
│   │   ├── aiTravelService.ts      # AI API integration
│   │   ├── imageService.ts         # Image upload/processing
│   │   └── locationService.ts      # Geolocation utilities
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useUserProfile.ts       # User profile hook
│   │   ├── useAITravelBuddy.ts     # AI chat hook
│   │   ├── useFirestore.ts         # Firestore operations
│   │   └── use-toast.ts            # Toast notifications
│   │
│   ├── store/              # State management (Zustand)
│   │   └── useAppStore.ts          # Global app state
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts                # Main types
│   │   └── aiChat.ts               # AI chat types
│   │
│   ├── lib/                # Library configurations
│   │   ├── firebase.ts             # Firebase initialization
│   │   └── utils.ts                # Utility functions
│   │
│   ├── data/               # Static/sample data
│   │   ├── sampleUsers.ts
│   │   └── enhancedSampleData.ts
│   │
│   ├── utils/              # Utility functions
│   │   ├── messageUtils.ts
│   │   └── debugHelpers.ts
│   │
│   ├── assets/             # Static assets (images, icons)
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
│
├── public/                 # Public static files
│   ├── favicon.ico
│   ├── robots.txt
│   └── placeholder.svg
│
├── package.json            # Frontend dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── components.json         # shadcn/ui configuration
```

### Key Frontend Features

#### Components Organization
- **`/components`** - Reusable React components
- **`/components/ui`** - shadcn/ui design system components
- **`/components/_archive`** - Deprecated components (kept for reference)

#### Pages & Routing
- All routes defined in `App.tsx`
- Protected routes use `ProtectedRoute` wrapper
- Public routes: `/`, `/login`, `/signup`
- Protected routes: `/discover`, `/messages`, `/matches`, `/profile`, `/ai-travel-planner`, `/map`

#### State Management
- **Zustand** for global state (`useAppStore`)
- **React Query** for server state caching
- **Custom hooks** for reusable logic

---

## ⚙️ Backend Structure

**Location:** `/backend`
**Tech Stack:** Node.js, Express, Firebase Admin SDK, Socket.io

### Directory Organization

```
backend/
├── src/
│   ├── ai-agents/              # Advanced multi-agent AI system
│   │   ├── agents/            # Individual AI agents
│   │   │   ├── ChatManagerAgent.js         # Main conversation coordinator
│   │   │   ├── ChiefTravelPlannerAgent.js  # Trip planning expert
│   │   │   ├── DataScoutAgent.js           # Live data gatherer
│   │   │   ├── ItineraryArchitectAgent.js  # Itinerary designer
│   │   │   └── ProfileAnalystAgent.js      # User preference analyst
│   │   │
│   │   ├── managers/          # Orchestration layer
│   │   │   ├── ConversationFlowManager.js  # Natural conversation flow
│   │   │   └── TravelPlanningOrchestrator.js # Agent coordination
│   │   │
│   │   ├── utils/             # Shared AI utilities
│   │   │   └── BaseAgent.js               # Base class for agents
│   │   │
│   │   ├── test/              # AI system tests
│   │   │   ├── testConversationalFlow.js
│   │   │   └── testQuickResponse.js
│   │   │
│   │   ├── QuickResponseAIService.js  # Main AI service (current)
│   │   ├── README.md                  # AI system documentation
│   │   └── package.json               # AI agent dependencies
│   │
│   ├── controllers/           # Request handlers
│   │   ├── userController.js
│   │   ├── matchingController.js
│   │   ├── messagingController.js
│   │   └── bucketListController.js
│   │
│   ├── routes/                # API route definitions
│   │   ├── users.js
│   │   ├── matching.js
│   │   ├── messaging.js
│   │   ├── bucketlist.js
│   │   └── aiV3.js            # Current AI routes
│   │
│   ├── services/              # Business logic services
│   │   ├── userService.js
│   │   ├── socketService.js
│   │   └── working_travel_agent.py  # Python AI agent integration
│   │
│   ├── models/                # Data models
│   │   ├── User.js
│   │   ├── Match.js
│   │   └── Swipe.js
│   │
│   ├── middleware/            # Express middleware
│   │   └── socketAuth.js      # Socket.io authentication
│   │
│   ├── config/                # Configuration files
│   │   └── database.js        # Database configuration
│   │
│   ├── scripts/               # Utility scripts
│   │   ├── seedDatabase.js
│   │   ├── migrateEnhancedUsers.js
│   │   ├── testFirebaseConnection.js
│   │   └── clearMatches.js
│   │
│   ├── _archive/              # Deprecated backend files
│   │   ├── ai.js              # Old AI route v1
│   │   ├── aiV2.js            # Old AI route v2
│   │   ├── aiController.js    # Old AI controller v1
│   │   ├── aiControllerV2.js  # Old AI controller v2
│   │   ├── ImprovedAITravelService.js
│   │   └── README.md          # Archive documentation
│   │
│   └── index.js               # Express app entry point
│
├── data/                      # Local data storage (development)
│   ├── users.json
│   ├── conversations.json
│   └── messages.json
│
├── .env                       # Environment variables (not in git)
├── env.example                # Environment variables template
├── package.json               # Backend dependencies
├── nodemon.json               # Nodemon configuration
└── README.md                  # Backend documentation
```

### Key Backend Features

#### AI System Architecture
The AI system uses a **multi-agent architecture**:

1. **ChatManagerAgent** - Main interface, coordinates all agents
2. **DataScoutAgent** - Gathers live travel data (flights, hotels, weather)
3. **ChiefTravelPlannerAgent** - Plans comprehensive trips
4. **ItineraryArchitectAgent** - Creates detailed day-by-day itineraries
5. **ProfileAnalystAgent** - Analyzes user preferences

**Benefits:**
- ⚡ Instant responses (<100ms)
- 🔄 Background processing with real-time updates
- 🔑 Intelligent API key rotation
- 🛡️ Graceful fallbacks

#### API Routes
- **`/api/users`** - User management
- **`/api/matching`** - Swipe and matching logic
- **`/api/messaging`** - Real-time messaging
- **`/api/bucketlist`** - Travel bucket lists
- **`/api/ai`** - AI chat and travel planning (v3)

#### Real-time Communication
- **Socket.io** for WebSocket connections
- Real-time messaging between matched users
- Live AI agent status updates

---

## 🗂️ Archive Directories

Both frontend and backend have `_archive/` directories containing deprecated code:

### Purpose
- ✅ Historical reference
- ✅ Alternative implementations
- ✅ Evolution documentation
- ✅ Rollback capability

### Guideline
- **Keep:** Files are documented and don't affect bundle size
- **Review:** Periodically check if still useful
- **Document:** Always include README.md explaining what's archived and why

---

## 📝 Configuration Files

### Root Level
- **`.gitignore`** - Comprehensive ignore patterns including security files
- **`package.json`** - Workspace configuration with scripts
- **`firebase.json`** - Firebase hosting and functions config
- **`firestore.rules`** - Database security rules
- **`firestore.indexes.json`** - Database indexes
- **`storage.rules`** - Storage security rules

### Frontend
- **`vite.config.ts`** - Vite build configuration
- **`tailwind.config.ts`** - Tailwind CSS customization
- **`tsconfig.json`** - TypeScript compiler options
- **`components.json`** - shadcn/ui component config

### Backend
- **`nodemon.json`** - Auto-restart configuration
- **`.env`** - Environment variables (not in git)
- **`env.example`** - Environment template

---

## 🔐 Security & Environment

### Protected Files (Not in Git)
- `.env` files (frontend & backend)
- `serviceAccountKey.json` - Firebase admin credentials
- `node_modules/` - Dependencies
- `venv/` - Python virtual environment
- `dist/`, `build/` - Build outputs
- `*.log` - Log files

### Environment Variables Required

**Backend:**
```env
GEMINI_API_KEY=your_gemini_api_key
SERPAPI_API_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key
FIREBASE_PROJECT_ID=your_firebase_project
JWT_SECRET=your_jwt_secret
```

**Frontend:**
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_FIREBASE_PROJECT_ID=your_firebase_project
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

---

## 🚀 Getting Started

### Install Dependencies
```bash
npm run install:all
```

### Development
```bash
# Start both frontend and backend
npm run dev

# Or separately:
npm run dev:frontend  # Frontend only (port 8080)
npm run dev:backend   # Backend only (port 3001)
```

### Build
```bash
npm run build
```

---

## 📚 Key Documentation

- **`/README.md`** - Main project overview and setup
- **`/backend/README.md`** - Backend architecture and AI system details
- **`/backend/src/ai-agents/README.md`** - AI multi-agent system documentation
- **`/backend/src/_archive/README.md`** - Deprecated backend files
- **`/frontend/src/_archive/README.md`** - Deprecated frontend files
- **`/PROJECT_STRUCTURE.md`** - This file

---

## 🎯 Code Organization Principles

1. **Separation of Concerns**
   - Frontend and backend are completely separate
   - Clear boundaries between UI, logic, and data

2. **Feature-based Organization**
   - Related files are grouped together
   - Easy to locate functionality

3. **Clear Naming Conventions**
   - Descriptive file and folder names
   - TypeScript for type safety

4. **Archive Strategy**
   - Old code kept in `_archive/` directories
   - Well-documented with README files

5. **Documentation First**
   - README files in key directories
   - Inline comments for complex logic
   - Type definitions for clarity

---

## 🔄 Evolution & Versioning

### Current Versions
- **Frontend:** React 18 with TypeScript
- **Backend:** Node.js with Express
- **AI System:** Multi-agent v3 (QuickResponseAIService)
- **Database:** Firebase Firestore

### Deprecated (In Archive)
- AI v1 & v2 routes and controllers
- Original Discover and Messages pages
- Demo/example components

---

## 📞 Need Help?

- **Project Issues:** Check GitHub Issues
- **AI System:** See `/backend/src/ai-agents/README.md`
- **API Documentation:** Visit `/health` and `/api` endpoints
- **Code Review:** All files are well-organized and documented

---

**Last Updated:** October 14, 2025
**Maintained by:** Wanderer Team
