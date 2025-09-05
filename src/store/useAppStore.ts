import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, 
  Match, 
  Conversation, 
  FilterSettings, 
  TravelStyle,
  SwipeAction,
  BucketListItem,
  Story
} from '@/types';

interface AppStore {
  // User state
  currentUser: User | null;
  users: User[];
  
  // Matching state
  matches: Match[];
  swipeHistory: SwipeAction[];
  
  // Chat state
  conversations: Conversation[];
  
  // Filter state
  filters: FilterSettings;
  
  // UI state
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  
  // Feature state
  bucketList: BucketListItem[];
  stories: Story[];
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  
  // Swipe actions
  swipeUser: (action: SwipeAction) => void;
  addMatch: (match: Match) => void;
  
  // Filter actions
  setFilters: (filters: Partial<FilterSettings>) => void;
  resetFilters: () => void;
  
  // UI actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Bucket list actions
  addToBucketList: (item: Omit<BucketListItem, 'id'>) => void;
  removeBucketListItem: (id: string) => void;
  toggleBucketListItem: (id: string) => void;
  
  // Stories actions
  addStory: (story: Omit<Story, 'id' | 'views' | 'timestamp'>) => void;
  viewStory: (storyId: string, userId: string) => void;
}

const defaultFilters: FilterSettings = {
  ageRange: [18, 65],
  maxDistance: 50,
  travelStyles: [],
  destinations: [],
  verified: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: [],
      matches: [],
      swipeHistory: [],
      conversations: [],
      filters: defaultFilters,
      theme: 'light',
      loading: false,
      error: null,
      bucketList: [],
      stories: [],

      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      setUsers: (users) => set({ users }),
      
      addUser: (user) => set((state) => ({ 
        users: [...state.users, user] 
      })),
      
      updateUser: (userId, updates) => set((state) => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ),
        currentUser: state.currentUser?.id === userId 
          ? { ...state.currentUser, ...updates }
          : state.currentUser
      })),

      // Swipe actions
      swipeUser: (action) => set((state) => ({
        swipeHistory: [...state.swipeHistory, action]
      })),
      
      addMatch: (match) => set((state) => ({
        matches: [...state.matches, match]
      })),

      // Filter actions
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      
      resetFilters: () => set({ filters: defaultFilters }),

      // UI actions
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Bucket list actions
      addToBucketList: (item) => set((state) => ({
        bucketList: [...state.bucketList, { 
          ...item, 
          id: `bucket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
        }]
      })),
      
      removeBucketListItem: (id) => set((state) => ({
        bucketList: state.bucketList.filter(item => item.id !== id)
      })),
      
      toggleBucketListItem: (id) => set((state) => ({
        bucketList: state.bucketList.map(item =>
          item.id === id 
            ? { 
                ...item, 
                completed: !item.completed,
                completedAt: !item.completed ? new Date().toISOString() : undefined
              }
            : item
        )
      })),

      // Stories actions
      addStory: (story) => set((state) => ({
        stories: [...state.stories, {
          ...story,
          id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          views: [],
          timestamp: new Date().toISOString(),
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }]
      })),
      
      viewStory: (storyId, userId) => set((state) => ({
        stories: state.stories.map(story =>
          story.id === storyId && !story.views.includes(userId)
            ? { ...story, views: [...story.views, userId] }
            : story
        )
      })),
    }),
    {
      name: 'wander-app-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        filters: state.filters,
        theme: state.theme,
        bucketList: state.bucketList,
        swipeHistory: state.swipeHistory,
      }),
    }
  )
);

// Selector hooks for better performance
export const useCurrentUser = () => useAppStore((state) => state.currentUser);
export const useUsers = () => useAppStore((state) => state.users);
export const useMatches = () => useAppStore((state) => state.matches);
export const useFilters = () => useAppStore((state) => state.filters);
export const useTheme = () => useAppStore((state) => state.theme);
export const useBucketList = () => useAppStore((state) => state.bucketList);
export const useStories = () => useAppStore((state) => state.stories);
