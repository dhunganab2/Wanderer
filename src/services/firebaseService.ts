import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { OfflineService } from './offlineService';
import type { 
  User, 
  Match, 
  Conversation, 
  Message, 
  BucketListItem, 
  Story, 
  TravelPlan,
  SwipeAction 
} from '@/types';

const offlineService = OfflineService.getInstance();

// User Profile Management
export const userService = {
  // Create user profile
  async createUserProfile(userData: Partial<User>): Promise<string> {
    const userId = auth.currentUser!.uid;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      
      // Filter out undefined values and provide defaults
      const profileData = {
        id: userId,
        name: userData.name || '',
        age: userData.age || 18,
        avatar: userData.avatar || '',
        location: userData.location || '',
        travelStyle: userData.travelStyle || [],
        nextDestination: userData.nextDestination || '',
        travelDates: userData.travelDates || 'TBD',
        bio: userData.bio || '',
        interests: userData.interests || [],
        photos: userData.photos || [],
        mutualConnections: 0,
        verified: false,
        joinDate: serverTimestamp(),
        lastActive: serverTimestamp(),
        // Only include coordinates if they exist
        ...(userData.coordinates && { coordinates: userData.coordinates }),
        ...(userData.coverImage && { coverImage: userData.coverImage }),
        preferences: {
          ageRange: [18, 65] as [number, number],
          maxDistance: 50,
          travelStyles: userData.travelStyle || [],
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
      
      await setDoc(userDocRef, profileData);
      return userId;
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage:', error);
      // Fallback to offline storage
      await offlineService.createUserProfile(userData, userId);
      return userId;
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    // First try offline storage since it's faster and always available
    const offlineProfile = await offlineService.getUserProfile(userId);
    if (offlineProfile) {
      console.log('Found user profile in offline storage');
      return offlineProfile;
    }

    // Then try Firebase if offline storage is empty
    try {
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const firebaseProfile = { id: userSnap.id, ...userSnap.data() } as User;
        console.log('Found user profile in Firebase, syncing to offline storage');
        // Sync to offline storage for future use
        await offlineService.createUserProfile(firebaseProfile, userId);
        return firebaseProfile;
      }
    } catch (error) {
      console.warn('Firebase unavailable:', error);
    }
    
    console.log('No user profile found');
    return null;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage:', error);
      // Fallback to offline storage
      await offlineService.updateUserProfile(userId, updates);
    }
  },

  // Get users for discovery (excluding current user and already swiped)
  async getDiscoveryUsers(currentUserId: string, swipedUserIds: string[] = []): Promise<User[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('id', '!=', currentUserId),
        limit(10)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(user => !swipedUserIds.includes(user.id));
      
      return users;
    } catch (error) {
      console.warn('Firebase unavailable for discovery users, using offline fallback:', error);
      // Fallback to offline service (will return empty array, triggering sample data)
      return await offlineService.getDiscoveryUsers(currentUserId, swipedUserIds);
    }
  },

  // Check if user profile is complete
  async isProfileComplete(userId: string): Promise<boolean> {
    try {
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
    } catch (error) {
      console.warn('Error checking profile completeness, using offline fallback:', error);
      // Fallback to offline storage
      return await offlineService.isProfileComplete(userId);
    }
  }
};

// Swipe and Matching System
export const matchingService = {
  // Record swipe action
  async recordSwipe(swipeData: { type: 'like' | 'pass' | 'superlike'; userId: string; swipedUserId: string }): Promise<void> {
    try {
      await addDoc(collection(db, 'swipes'), {
        ...swipeData,
        timestamp: serverTimestamp()
      });

      // Check for mutual like to create match
      if (swipeData.type === 'like' || swipeData.type === 'superlike') {
        await this.checkForMatch(swipeData.swipedUserId, swipeData.userId);
      }
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage for swipe:', error);
      // Fallback to offline storage
      await offlineService.recordSwipe(swipeData.userId, swipeData.swipedUserId, swipeData.type);
    }
  },

  // Check for mutual match
  async checkForMatch(userId1: string, userId2: string): Promise<void> {
    try {
      const swipesQuery = query(
        collection(db, 'swipes'),
        where('userId', '==', userId1),
        where('swipedUserId', '==', userId2),
        where('type', 'in', ['like', 'superlike'])
      );

      const querySnapshot = await getDocs(swipesQuery);
      
      if (!querySnapshot.empty) {
        // It's a match!
        const matchData: Omit<Match, 'id'> = {
          users: [userId1, userId2],
          matchedAt: new Date().toISOString(),
          status: 'pending',
          commonInterests: [], // TODO: Calculate based on user profiles
          compatibilityScore: 85 // TODO: Calculate based on algorithm
        };

        await addDoc(collection(db, 'matches'), matchData);
      }
    } catch (error) {
      console.error('Error checking for match:', error);
      throw error;
    }
  },

  // Get user matches
  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const matchesQuery = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId),
        orderBy('matchedAt', 'desc')
      );

      const querySnapshot = await getDocs(matchesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Match));
    } catch (error) {
      console.error('Error getting user matches:', error);
      throw error;
    }
  }
};

// Bucket List Management
export const bucketListService = {
  // Add item to bucket list
  async addBucketListItem(userId: string, item: Omit<BucketListItem, 'id' | 'userId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'bucketList'), {
        ...item,
        userId,
        completed: false
      });
      return docRef.id;
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage for bucket list:', error);
      // Fallback to offline storage
      return await offlineService.addBucketListItem(userId, item);
    }
  },

  // Get user bucket list
  async getUserBucketList(userId: string): Promise<BucketListItem[]> {
    try {
      const bucketListQuery = query(
        collection(db, 'bucketList'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(bucketListQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BucketListItem));
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage for bucket list:', error);
      // Fallback to offline storage
      return await offlineService.getUserBucketList(userId);
    }
  },

  // Toggle bucket list item completion
  async toggleBucketListItem(itemId: string): Promise<void> {
    try {
      const itemRef = doc(db, 'bucketList', itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (itemSnap.exists()) {
        const currentCompleted = itemSnap.data().completed;
        await updateDoc(itemRef, {
          completed: !currentCompleted,
          completedAt: !currentCompleted ? serverTimestamp() : null
        });
      }
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage for bucket list toggle:', error);
      // Fallback to offline storage
      await offlineService.toggleBucketListItem(itemId);
    }
  },

  // Delete bucket list item
  async deleteBucketListItem(itemId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'bucketList', itemId));
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage for bucket list deletion:', error);
      // Fallback to offline storage
      await offlineService.deleteBucketListItem(itemId);
    }
  }
};

// Stories Management
export const storiesService = {
  // Add story
  async addStory(userId: string, story: Omit<Story, 'id' | 'userId' | 'views' | 'timestamp' | 'expires'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'stories'), {
        ...story,
        userId,
        views: [],
        timestamp: serverTimestamp(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  },

  // Get active stories
  async getActiveStories(): Promise<Story[]> {
    try {
      const now = new Date().toISOString();
      const storiesQuery = query(
        collection(db, 'stories'),
        where('expires', '>', now),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(storiesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Story));
    } catch (error) {
      console.error('Error getting active stories:', error);
      throw error;
    }
  },

  // View story
  async viewStory(storyId: string, userId: string): Promise<void> {
    try {
      const storyRef = doc(db, 'stories', storyId);
      const storySnap = await getDoc(storyRef);
      
      if (storySnap.exists()) {
        const currentViews = storySnap.data().views || [];
        if (!currentViews.includes(userId)) {
          await updateDoc(storyRef, {
            views: [...currentViews, userId]
          });
        }
      }
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }
};

// Travel Plans Management
export const travelPlansService = {
  // Create travel plan
  async createTravelPlan(userId: string, plan: Omit<TravelPlan, 'id' | 'userId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'travelPlans'), {
        ...plan,
        userId
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating travel plan:', error);
      throw error;
    }
  },

  // Get user travel plans
  async getUserTravelPlans(userId: string): Promise<TravelPlan[]> {
    try {
      const plansQuery = query(
        collection(db, 'travelPlans'),
        where('userId', '==', userId),
        orderBy('startDate', 'desc')
      );

      const querySnapshot = await getDocs(plansQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TravelPlan));
    } catch (error) {
      console.error('Error getting travel plans:', error);
      throw error;
    }
  },

  // Update travel plan
  async updateTravelPlan(planId: string, updates: Partial<TravelPlan>): Promise<void> {
    try {
      const planRef = doc(db, 'travelPlans', planId);
      await updateDoc(planRef, updates);
    } catch (error) {
      console.error('Error updating travel plan:', error);
      throw error;
    }
  },

  // Delete travel plan
  async deleteTravelPlan(planId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'travelPlans', planId));
    } catch (error) {
      console.error('Error deleting travel plan:', error);
      throw error;
    }
  }
};

// Data Migration Helper
export const migrationService = {
  // Migrate local data to Firebase
  async migrateLocalDataToFirebase(localData: any): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Migrate user profile if exists
      if (localData.currentUser) {
        await userService.createUserProfile(localData.currentUser);
      }

      // Migrate bucket list
      if (localData.bucketList && localData.bucketList.length > 0) {
        for (const item of localData.bucketList) {
          await bucketListService.addBucketListItem(userId, {
            destination: item.destination,
            description: item.description,
            image: item.image,
            priority: item.priority,
            completed: item.completed,
            completedAt: item.completedAt,
            notes: item.notes
          });
        }
      }

      // Migrate swipe history (only valid swipes)
      if (localData.swipeHistory && localData.swipeHistory.length > 0) {
        for (const swipe of localData.swipeHistory) {
          // Only migrate swipes that have valid data
          if (swipe.type && swipe.userId && swipe.swipedUserId !== undefined) {
            try {
              await matchingService.recordSwipe({
                type: swipe.type,
                userId: userId, // Use current user's ID
                swipedUserId: swipe.userId // The person they swiped on
              });
            } catch (error) {
              console.warn('Failed to migrate swipe:', swipe, error);
            }
          }
        }
      }

      console.log('Local data migrated successfully');
    } catch (error) {
      console.error('Error migrating local data:', error);
      throw error;
    }
  }
};

// Real-time listeners
export const realtimeService = {
  // Listen to user profile changes
  subscribeToUserProfile(userId: string, callback: (user: User | null) => void) {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as User);
      } else {
        callback(null);
      }
    });
  },

  // Listen to matches
  subscribeToMatches(userId: string, callback: (matches: Match[]) => void) {
    const matchesQuery = query(
      collection(db, 'matches'),
      where('users', 'array-contains', userId)
    );
    
    return onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Match));
      callback(matches);
    });
  },

  // Listen to bucket list changes
  subscribeToBucketList(userId: string, callback: (items: BucketListItem[]) => void) {
    const bucketListQuery = query(
      collection(db, 'bucketList'),
      where('userId', '==', userId)
    );
    
    return onSnapshot(bucketListQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BucketListItem));
      callback(items);
    });
  }
};