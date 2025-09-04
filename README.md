# Wanderer - Travel Companion Matching App

A modern, full-stack travel companion matching platform built with React, TypeScript, and Firebase. Connect with like-minded travelers, discover new destinations, and create unforgettable adventures together.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login/signup with email/password and Google OAuth
- **Travel Matching** - Swipeable card interface to discover travel companions
- **Real-time Messaging** - Chat with matched travelers
- **Interactive Map** - Location-based filtering and profile discovery
- **Profile Management** - Complete user profiles with photos and preferences

### Technical Features
- **Responsive Design** - Mobile-first approach with beautiful UI
- **Real-time Data** - Firebase Firestore for live updates
- **Modern Animations** - Framer Motion and custom CSS animations
- **Type Safety** - Full TypeScript implementation
- **State Management** - Zustand for efficient state handling
- **Protected Routes** - Secure navigation and authentication guards

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with strict configuration
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **shadcn/ui** - Beautiful, accessible component library
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing with protected routes

### Backend & Services
- **Firebase Authentication** - User management and OAuth
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Storage** - File and image storage
- **Firebase Analytics** - User behavior tracking

### Development Tools
- **ESLint** - Code linting with TypeScript support
- **PostCSS** - CSS processing and optimization
- **Git** - Version control with GitHub integration

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AuthProvider.tsx # Authentication context
│   ├── Navigation.tsx   # Navigation components
│   └── ...
├── pages/              # Page components
│   ├── Landing.tsx     # Homepage
│   ├── Login.tsx       # Authentication pages
│   ├── Discover.tsx    # Travel matching
│   ├── Messages.tsx    # Chat interface
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication logic
│   └── useFirestore.ts # Database operations
├── lib/                # Utility functions
│   ├── firebase.ts     # Firebase configuration
│   └── utils.ts        # Helper functions
├── store/              # State management
│   └── useAppStore.ts  # Zustand store
├── types/              # TypeScript type definitions
└── data/               # Sample data and constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jalshrestha/Wanderer.git
   cd Wanderer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config to `src/lib/firebase.ts`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:8080`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

### Color Palette
- **Sunrise Coral** - Primary brand color
- **Midnight Blue** - Secondary color
- **Warm Grays** - Neutral tones
- **Accent Colors** - Forest Green, Sky Blue, Warm Amber

### Typography
- **Display Font** - Manrope (headings)
- **Body Font** - Inter (body text)

### Components
- Glass morphism effects
- Smooth animations and transitions
- Responsive grid layouts
- Custom button variants
- Card-based design patterns

## 🔧 Configuration

### TypeScript
- Strict mode enabled for production
- Path aliases configured (`@/*` → `./src/*`)
- Comprehensive type definitions

### ESLint
- TypeScript-aware linting
- React hooks rules
- Custom rules for unused variables

### Tailwind CSS
- Custom design tokens
- Dark mode support
- Responsive breakpoints
- Custom animations

## 🚀 Deployment

### GitHub Pages
1. Build the project: `npm run build`
2. Push to GitHub repository
3. Enable GitHub Pages in repository settings

### Vercel/Netlify
1. Connect your GitHub repository
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy automatically on push

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile-optimized navigation
- Gesture support for card swiping

## 🔒 Security

- Firebase Authentication with secure rules
- Protected routes and API endpoints
- Input validation and sanitization
- HTTPS enforcement in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Firebase](https://firebase.google.com/) for backend services
- [Framer Motion](https://www.framer.com/motion/) for animations

---

**Built with ❤️ for travelers who believe the best stories are written together.**