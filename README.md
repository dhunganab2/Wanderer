# Wanderer - Travel Companion Matching App

A modern travel companion matching application built with React, Node.js, and Firebase.

## Project Structure

```
wanderer/
├── frontend/          # React frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/          # Node.js backend API
│   ├── src/          # Source code
│   └── package.json  # Backend dependencies
├── docs/             # Documentation
└── package.json      # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install:all
   ```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them separately:
```bash
# Frontend only (runs on http://localhost:8080)
npm run dev:frontend

# Backend only (runs on http://localhost:3001)
npm run dev:backend
```

### Building

Build both frontend and backend:
```bash
npm run build
```

## Features

- 🔐 User authentication with Firebase
- 🗺️ Interactive maps with Google Maps
- 💬 Real-time messaging
- 🎯 Smart matching algorithm
- 📱 Responsive design
- 🚀 PWA capabilities

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Firebase SDK
- React Router
- Zustand (state management)

### Backend
- Node.js
- Express.js
- Firebase Admin SDK
- CORS & Helmet
- JWT authentication

## Environment Setup

1. Copy `frontend/.env.example` to `frontend/.env.local`
2. Copy `backend/env.example` to `backend/.env`
3. Configure your Firebase credentials
4. Update API endpoints as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details