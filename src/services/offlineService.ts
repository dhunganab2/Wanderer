import type { User, BucketListItem, SwipeAction, Match, Story, TravelPlan } from '@/types';

// Offline storage service that syncs with Firebase when available
export class OfflineService {
  private static instance: OfflineService;
  private storageKey = 'wanderer-offline-data';

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private getOfflineData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : this.getDefaultOfflineData();
    } catch (error) {
      console.error('Error loading offline data:', error);
      return this.getDefaultOfflineData();
    }
  }

  private getDefaultOfflineData() {
    return {
      userProfile: null,
      bucketList: [],
      swipeHistory: [],
      matches: [],
      stories: [],
      travelPlans: [],
      lastSync: null,
      pendingWrites: []
    };
  }

  private saveOfflineData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // User Profile Methods
  async getUserProfile(userId: string): Promise<User | null> {
    const data = this.getOfflineData();
    return data.userProfile?.id === userId ? data.userProfile : null;
  }

  async createUserProfile(profileData: Partial<User>, userId: string): Promise<void> {
    const data = this.getOfflineData();
    
    // Create complete user profile with proper defaults
    const completeProfile: User = {
      id: userId,
      name: profileData.name || '',
      age: profileData.age || 18,
      avatar: profileData.avatar || '',
      location: profileData.location || 'Location not set',
      coordinates: profileData.coordinates || undefined,
      travelStyle: profileData.travelStyle || [],
      nextDestination: profileData.nextDestination || 'Not specified',
      travelDates: profileData.travelDates || 'TBD',
      bio: profileData.bio || '',
      interests: profileData.interests || [],
      photos: profileData.photos || [],
      coverImage: profileData.coverImage || undefined,
      mutualConnections: 0,
      verified: false,
      joinDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      preferences: {
        ageRange: [18, 65] as [number, number],
        maxDistance: 50,
        travelStyles: profileData.travelStyle || [],
        notifications: {
          matches: true,
          messages: true,
          travelUpdates: true,
          marketing: false
        },
        privacy: {
          showLocation: true,
          showAge: true,
          showLastActive: true,
          allowMessages: 'matches' as const
        }
      }
    };

    data.userProfile = completeProfile;
    data.pendingWrites.push({
      type: 'createProfile',
      data: completeProfile,
      timestamp: Date.now()
    });

    this.saveOfflineData(data);
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const data = this.getOfflineData();
    
    if (data.userProfile?.id === userId) {
      data.userProfile = { 
        ...data.userProfile, 
        ...updates,
        lastActive: new Date().toISOString()
      };
      
      data.pendingWrites.push({
        type: 'updateProfile',
        userId,
        data: updates,
        timestamp: Date.now()
      });

      this.saveOfflineData(data);
    }
  }

  // Bucket List Methods
  async addBucketListItem(userId: string, item: Omit<BucketListItem, 'id' | 'userId'>): Promise<string> {
    const data = this.getOfflineData();
    const itemId = `bucket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const bucketListItem: BucketListItem = {
      ...item,
      id: itemId,
      userId
    };

    data.bucketList.push(bucketListItem);
    data.pendingWrites.push({
      type: 'addBucketListItem',
      data: bucketListItem,
      timestamp: Date.now()
    });

    this.saveOfflineData(data);
    return itemId;
  }

  async getUserBucketList(userId: string): Promise<BucketListItem[]> {
    const data = this.getOfflineData();
    return data.bucketList.filter((item: BucketListItem) => item.userId === userId);
  }

  async toggleBucketListItem(itemId: string): Promise<void> {
    const data = this.getOfflineData();
    const itemIndex = data.bucketList.findIndex((item: BucketListItem) => item.id === itemId);
    
    if (itemIndex !== -1) {
      data.bucketList[itemIndex] = {
        ...data.bucketList[itemIndex],
        completed: !data.bucketList[itemIndex].completed,
        completedAt: !data.bucketList[itemIndex].completed ? new Date().toISOString() : undefined
      };

      data.pendingWrites.push({
        type: 'toggleBucketListItem',
        itemId,
        timestamp: Date.now()
      });

      this.saveOfflineData(data);
    }
  }

  async deleteBucketListItem(itemId: string): Promise<void> {
    const data = this.getOfflineData();
    data.bucketList = data.bucketList.filter((item: BucketListItem) => item.id !== itemId);
    
    data.pendingWrites.push({
      type: 'deleteBucketListItem',
      itemId,
      timestamp: Date.now()
    });

    this.saveOfflineData(data);
  }

  // Swipe Methods
  async recordSwipe(userId: string, swipedUserId: string, type: 'like' | 'pass' | 'superlike'): Promise<void> {
    const data = this.getOfflineData();
    
    const swipe: SwipeAction & { swipedUserId: string } = {
      type,
      userId: swipedUserId, // This matches the existing SwipeAction interface
      timestamp: new Date().toISOString(),
      swipedUserId // Add the actual swiped user ID
    };

    data.swipeHistory.push(swipe);
    data.pendingWrites.push({
      type: 'recordSwipe',
      data: { userId, swipedUserId, type },
      timestamp: Date.now()
    });

    this.saveOfflineData(data);
  }

  async getUserSwipeHistory(userId: string): Promise<SwipeAction[]> {
    const data = this.getOfflineData();
    return data.swipeHistory.filter((swipe: any) => swipe.userId === userId || swipe.swipedUserId === userId);
  }

  // Travel Plans Methods
  async createTravelPlan(userId: string, plan: Omit<TravelPlan, 'id' | 'userId'>): Promise<string> {
    const data = this.getOfflineData();
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const travelPlan: TravelPlan = {
      ...plan,
      id: planId,
      userId
    };

    data.travelPlans.push(travelPlan);
    data.pendingWrites.push({
      type: 'createTravelPlan',
      data: travelPlan,
      timestamp: Date.now()
    });

    this.saveOfflineData(data);
    return planId;
  }

  async getUserTravelPlans(userId: string): Promise<TravelPlan[]> {
    const data = this.getOfflineData();
    return data.travelPlans.filter((plan: TravelPlan) => plan.userId === userId);
  }

  // Stories Methods
  async addStory(userId: string, story: Omit<Story, 'id' | 'userId' | 'views' | 'timestamp' | 'expires'>): Promise<string> {
    const data = this.getOfflineData();
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newStory: Story = {
      ...story,
      id: storyId,
      userId,
      views: [],
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    data.stories.push(newStory);
    data.pendingWrites.push({
      type: 'addStory',
      data: newStory,
      timestamp: Date.now()
    });

    this.saveOfflineData(data);
    return storyId;
  }

  // Sync Methods
  getPendingWrites() {
    const data = this.getOfflineData();
    return data.pendingWrites;
  }

  clearPendingWrites() {
    const data = this.getOfflineData();
    data.pendingWrites = [];
    data.lastSync = Date.now();
    this.saveOfflineData(data);
  }

  // Check if profile is complete
  async isProfileComplete(userId: string): Promise<boolean> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      console.log('Profile completeness check: No user found');
      return false;
    }

    const requiredFields = ['name', 'age', 'bio', 'travelStyle'];
    const isComplete = requiredFields.every(field => {
      const value = user[field as keyof User];
      const isValid = value !== undefined && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true);
      console.log(`Field ${field}:`, value, 'Valid:', isValid);
      return isValid;
    });
    
    console.log('Profile completeness result:', isComplete);
    return isComplete;
  }

  // Get discovery users (fallback to sample users)
  async getDiscoveryUsers(currentUserId: string, swipedUserIds: string[] = []): Promise<User[]> {
    // In offline mode, we'll return empty array since we don't have other users
    // This will trigger the fallback to sample users in the Discover component
    return [];
  }

  // Export all data for debugging
  exportData() {
    return this.getOfflineData();
  }

  // Clear all offline data
  clearAllData() {
    localStorage.removeItem(this.storageKey);
  }
}