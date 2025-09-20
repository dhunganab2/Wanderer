// Core Types for Wander Travel App

export interface User {
  id: string;
  name: string;
  age: number;
  avatar: string;
  coverImage?: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  travelStyle: TravelStyle[];
  nextDestination: string;
  travelDates: string;
  bio: string;
  interests: string[];
  mutualConnections?: number;
  photos?: string[];
  verified: boolean;
  joinDate: string;
  lastActive: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  ageRange: [number, number];
  maxDistance: number;
  travelStyles: TravelStyle[];
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  matches: boolean;
  messages: boolean;
  travelUpdates: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  showLocation: boolean;
  showAge: boolean;
  showLastActive: boolean;
  allowMessages: 'everyone' | 'matches' | 'none';
}

export type TravelStyle = 
  | 'backpacker' 
  | 'luxury' 
  | 'foodie' 
  | 'adventurer' 
  | 'cultural' 
  | 'photographer' 
  | 'solo' 
  | 'group'
  | 'budget'
  | 'nature'
  | 'nightlife'
  | 'wellness';

export interface TravelPlan {
  id: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  activities: string[];
  accommodation?: string;
  transportation?: string;
  notes?: string;
  isPublic: boolean;
}

export interface Match {
  id: string;
  users: [string, string]; // user IDs
  matchedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  commonInterests: string[];
  compatibilityScore: number;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'location' | 'plan';
  metadata?: any;
}

export interface Conversation {
  id: string;
  matchId: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface FilterSettings {
  ageRange: [number, number];
  maxDistance: number;
  travelStyles: TravelStyle[];
  destinations: string[];
  dateRange?: [string, string];
  verified: boolean;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  matches: Match[];
  conversations: Conversation[];
  filters: FilterSettings;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
}

export interface SwipeAction {
  type: 'like' | 'pass' | 'superlike';
  userId: string;
  timestamp: string;
}

export interface Story {
  id: string;
  userId: string;
  image: string;
  caption?: string;
  location?: string;
  timestamp: string;
  views: string[]; // user IDs who viewed
  expires: string;
}

export interface BucketListItem {
  id: string;
  userId: string;
  destination: string;
  description?: string;
  image?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

// Messaging Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'system';
  timestamp: Date;
  read: boolean;
  matchId?: string; // For backward compatibility
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  matchId?: string; // For backward compatibility
}

// Component Props Types
export interface TravelCardProps {
  user: User;
  className?: string;
  onLike?: (userId: string) => void;
  onPass?: (userId: string) => void;
  onSuperLike?: (userId: string) => void;
  variant?: 'stack' | 'grid' | 'list';
  showActions?: boolean;
}

export interface FilterPanelProps {
  filters: FilterSettings;
  onFiltersChange: (filters: FilterSettings) => void;
  onClose: () => void;
}

export interface MapProps {
  users: User[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onUserClick?: (user: User) => void;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  age: number;
  location: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
