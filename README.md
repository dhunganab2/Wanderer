# 🌍 Wanderer - Travel Companion Matching App

> Connect with like-minded travelers and discover your next adventure together!

![Wanderer Preview](https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Wanderer+Travel+App)

## ✨ Features

### 🎯 Core Functionality
- **Tinder-like Matching System** - Swipe to find travel companions
- **Real-time Match Notifications** - Instant celebrations when you match
- **Advanced Filtering** - Age, distance, travel styles, destinations
- **Interactive Map** - View travelers by location with pins
- **Profile Management** - Complete profile editing with photo uploads
- **Messages Interface** - Chat with your matches
- **Travel Planning** - Share destinations and travel dates

### 🎨 Design & UX
- **Beautiful UI** - Modern glass morphism design with custom gradients
- **Dark/Light Mode** - Complete theme switching support
- **Mobile-First** - Responsive design optimized for all devices
- **Smooth Animations** - React Spring powered gestures and transitions
- **Loading States** - Skeleton screens for better perceived performance

### 🛠 Technical Features
- **TypeScript** - Full type safety throughout the application
- **State Management** - Zustand with persistent storage
- **Component Library** - shadcn/ui for consistent design
- **Modern Build** - Vite for fast development and builds
- **Gesture Support** - @use-gesture/react for native-like interactions

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **State Management**: Zustand
- **Animations**: React Spring + @use-gesture/react
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📱 Pages & Features

### 🏠 Landing Page
- Hero section with compelling CTAs
- Feature showcase with animated cards
- Statistics and social proof
- Sample user profiles preview

### 🔍 Discover Page
- **Stack Mode**: Tinder-like card swiping
- **Grid Mode**: Browse all travelers
- **Advanced Filters**: Age, distance, travel styles, destinations
- **Match Notifications**: Celebration animations when matched

### 💕 Matches Page
- View all mutual matches
- See pending likes sent
- Search through matches
- Direct messaging from match cards

### 🗺️ Map Page
- Interactive map with traveler markers
- Location-based filtering
- User profile previews on hover
- Real-time location updates

### 💬 Messages Page
- Conversation list with previews
- Real-time chat interface
- User status indicators
- Message search functionality

### 👤 Profile Page
- Complete profile editing
- Photo upload and management
- Travel style customization
- Next trip planning

## 🎨 Design System

### Colors
- **Primary**: Sunrise Coral (#FF6B6B)
- **Secondary**: Midnight Blue (#2C3E50)
- **Accent**: Sky Blue (#74B9FF)
- **Warm**: Amber (#FDCB6E)

### Typography
- **Display**: Manrope (headings)
- **Body**: Inter (body text)

### Components
- Glass morphism cards
- Gradient backgrounds
- Smooth hover effects
- Animated loading states

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/jalshrestha/wanderer.git

# Navigate to project directory
cd wanderer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navigation.tsx  # App navigation
│   ├── TravelCard.tsx  # User profile cards
│   └── ...
├── pages/              # Route components
│   ├── Landing.tsx     # Landing page
│   ├── Discover.tsx    # Swipe interface
│   ├── Matches.tsx     # Matches management
│   └── ...
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── data/               # Sample data and constants
└── lib/                # Utility functions
```

## 🎯 Key Components

### SwipeableCard
Real swipe gestures with visual feedback:
- Drag to like/pass/super like
- Visual indicators during swipe
- Smooth spring animations
- Touch and mouse support

### FilterPanel
Advanced filtering system:
- Age range slider
- Distance radius selector
- Travel style multi-select
- Destination search with autocomplete

### TravelCard
Beautiful user profile display:
- Cover and profile photos
- Travel information
- Style tags and interests
- Mutual connections indicator

## 🌟 Screenshots

### Landing Page
![Landing](https://via.placeholder.com/600x400/74B9FF/FFFFFF?text=Landing+Page)

### Discover Page
![Discover](https://via.placeholder.com/600x400/FF6B6B/FFFFFF?text=Discover+Travelers)

### Matches Page
![Matches](https://via.placeholder.com/600x400/FDCB6E/FFFFFF?text=Your+Matches)

### Profile Page
![Profile](https://via.placeholder.com/600x400/2C3E50/FFFFFF?text=Profile+Management)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Other Platforms
The app builds to static files and can be deployed to any static hosting service.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

⭐ **Star this repository if you find it helpful!**

🌍 **Ready to find your next travel companion? Start swiping!**
