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
import { matchingAlgorithm } from './matchingAlgorithm';
import { calculateDistance } from './locationService';
import type { 
  User, 
  Match, 
  Conversation, 
  Message, 
  BucketListItem, 
  Story, 
  TravelPlan,
  SwipeAction,
  FilterSettings
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
    try {
      console.log('🔍 Fetching user profile for:', userId);
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const firebaseProfile = { 
          ...data,
          id: data.id || userSnap.id  // Use data.id if available, fallback to doc.id
        } as User;
        console.log('✅ Found user profile:', firebaseProfile.name);
        return firebaseProfile;
      }
      
      console.log('❌ User profile not found');
      return null;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
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
      console.log('🔍 Fetching discovery users from Firebase...');
      console.log('Current user ID:', currentUserId);
      console.log('Swiped user IDs to exclude:', swipedUserIds.length);
      
      // Get all users first (since we can't use != with other filters efficiently)
      // Increased limit to get all users from database
      const usersQuery = query(collection(db, 'users'), limit(200));
      
      const querySnapshot = await getDocs(usersQuery);
      console.log('📊 Total users found in Firebase:', querySnapshot.docs.length);
      
      const users = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return { 
            ...data,
            id: data.id || doc.id  // Use data.id if available, fallback to doc.id
          } as User;
        })
        .filter(user => {
          const isNotCurrentUser = user.id !== currentUserId;
          const notSwiped = !swipedUserIds.includes(user.id);
          const hasRequiredFields = user.name && user.age && user.location;
          
          return isNotCurrentUser && notSwiped && hasRequiredFields;
        });
      
      console.log('✅ Filtered discovery users:', users.length);
      return users; // Return all available users
    } catch (error) {
      console.error('❌ Error fetching discovery users from Firebase:', error);
      throw error;
    }
  },

  // Get enhanced discovery users with compatibility scoring
  async getEnhancedDiscoveryUsers(
    currentUserId: string,
    swipedUserIds: string[] = [],
    filters: FilterSettings,
    limit: number = 100
  ): Promise<User[]> {
    try {
      // Try to get recommendations from backend API first (uses advanced algorithm)
      try {
        console.log('🚀 Attempting to use backend advanced matching algorithm...');
        const recommendations = await matchingService.getAdvancedRecommendations(
          currentUserId,
          {
            ageRange: filters.ageRange,
            maxDistance: filters.maxDistance,
            verified: filters.verified,
            travelStyles: filters.travelStyles,
            destinations: filters.destinations
          },
          limit
        );

        if (recommendations && recommendations.length > 0) {
          console.log('✅ Using backend advanced matching algorithm with', recommendations.length, 'recommendations');
          return recommendations.map((rec: any) => rec.user);
        }
      } catch (backendError) {
        console.warn('⚠️ Backend API not available, falling back to client-side algorithm:', backendError);
      }

      // Fallback to client-side algorithm
      console.log('📱 Using client-side matching algorithm');

      // Get current user
      const currentUser = await this.getUserProfile(currentUserId);
      if (!currentUser) return [];

      // Get all users
      const allUsers = await this.getDiscoveryUsers(currentUserId, swipedUserIds);

      // Use matching algorithm to find best matches
      const recommendations = matchingAlgorithm.findMatches(currentUser, allUsers, filters, limit);

      return recommendations.map(rec => rec.user);
    } catch (error) {
      console.warn('Error getting enhanced discovery users:', error);
      return await this.getDiscoveryUsers(currentUserId, swipedUserIds);
    }
  },

  // Get location-based discovery users
  async getLocationBasedUsers(
    currentUserId: string,
    center: { lat: number; lng: number },
    radiusKm: number,
    swipedUserIds: string[] = []
  ): Promise<User[]> {
    try {
      const allUsers = await this.getDiscoveryUsers(currentUserId, swipedUserIds);
      
      return allUsers.filter(user => {
        if (!user.coordinates) return false;
        const distance = calculateDistance(center, user.coordinates);
        return distance <= radiusKm;
      });
    } catch (error) {
      console.warn('Error getting location-based users:', error);
      return [];
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

      console.log(`✅ Swipe recorded: ${swipeData.userId} ${swipeData.type}d ${swipeData.swipedUserId}`);
      
      // Don't automatically check for matches - let the UI handle this explicitly
      // This ensures likes go to "Likes Sent" first, and only become matches when both users like each other
      
    } catch (error) {
      console.warn('Firebase unavailable, using offline storage for swipe:', error);
      // Fallback to offline storage
      await offlineService.recordSwipe(swipeData.userId, swipeData.swipedUserId, swipeData.type);
    }
  },

  // Unlike a previously liked user (remove like/superlike swipe docs)
  async unlikeUser(userId: string, swipedUserId: string): Promise<void> {
    try {
      // Load all swipes and delete the ones that represent this like
      const swipesCol = collection(db, 'swipes');
      const snapshot = await getDocs(swipesCol);

      const toDelete = snapshot.docs.filter(d => {
        const data = d.data() as any;
        return (
          data.userId === userId &&
          data.swipedUserId === swipedUserId &&
          (data.type === 'like' || data.type === 'superlike')
        );
      });

      for (const docSnap of toDelete) {
        await deleteDoc(doc(db, 'swipes', docSnap.id));
      }
    } catch (error) {
      console.error('Error unliking user:', error);
      throw error;
    }
  },

  // Get user's swipe history from database
  async getUserSwipes(userId: string): Promise<SwipeAction[]> {
    try {
      console.log('📥 Fetching swipes for user:', userId);

      // Get all swipes and filter in JavaScript to avoid index issues
      // Using orderBy with where requires a composite index which may not exist
      const swipesQuery = collection(db, 'swipes');
      const querySnapshot = await getDocs(swipesQuery);
      console.log('📊 Total swipes in database:', querySnapshot.docs.length);

      const swipes = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SwipeAction & { swipedUserId: string }))
        .filter(swipe => swipe.userId === userId)
        .sort((a, b) => {
          // Sort by timestamp descending (most recent first)
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });

      console.log('✅ Found', swipes.length, 'swipes for user', userId);
      console.log('📋 Swipe breakdown:', {
        likes: swipes.filter(s => s.type === 'like').length,
        passes: swipes.filter(s => s.type === 'pass').length,
        superlikes: swipes.filter(s => s.type === 'superlike').length
      });

      return swipes;
    } catch (error) {
      console.error('❌ Error loading user swipes:', error);
      return [];
    }
  },

  // Get user's likes (likes and superlikes sent)
  async getUserLikes(userId: string): Promise<SwipeAction[]> {
    try {
      console.log('Querying likes for user:', userId);
      
      // Get all swipes and filter in JavaScript to avoid index issues
      const swipesQuery = collection(db, 'swipes');
      const querySnapshot = await getDocs(swipesQuery);
      console.log('Total swipes in database:', querySnapshot.docs.length);
      
      // Filter for the specific user and likes/superlikes in JavaScript
      const likes = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          } as SwipeAction & { swipedUserId: string };
        })
        .filter(swipe => 
          swipe.userId === userId && 
          (swipe.type === 'like' || swipe.type === 'superlike')
        );
      
      // Sort manually by timestamp
      likes.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA; // Descending order
      });
      
      console.log('Processed likes for user', userId, ':', likes.length);
      return likes;
    } catch (error) {
      console.error('Error loading user likes:', error);
      return [];
    }
  },

  // Get user's matches from database
  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      console.log('Querying matches for user:', userId);
      
      // Try backend API first
      try {
        const response = await fetch(`/api/matching/matches/${userId}?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const matches = await response.json();
          console.log('✅ Received matches from backend:', matches.length);
          return matches;
        }
      } catch (apiError) {
        console.warn('Backend API not available, using Firestore fallback:', apiError);
      }
      
      // Fallback: Get all matches and filter in JavaScript to avoid index issues
      const matchesQuery = collection(db, 'matches');
      const querySnapshot = await getDocs(matchesQuery);
      console.log('Total matches in database:', querySnapshot.docs.length);
      
      // Filter for the specific user and accepted matches in JavaScript
      const matches = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Match))
        .filter(match => 
          match.users.includes(userId) && 
          match.status === 'accepted'
        );
      
      // Sort manually by matchedAt
      matches.sort((a, b) => {
        const timeA = new Date(a.matchedAt).getTime();
        const timeB = new Date(b.matchedAt).getTime();
        return timeB - timeA; // Descending order
      });
      
      console.log('Processed matches for user', userId, ':', matches.length);
      return matches;
    } catch (error) {
      console.error('Error loading user matches:', error);
      return [];
    }
  },

  // Check for mutual match with enhanced compatibility scoring
  async checkForMatch(userId1: string, userId2: string): Promise<boolean> {
    try {
      console.log('🔍 Checking for mutual match between:', userId1, 'and', userId2);
      
      // Check if userId2 has liked userId1
      const reverseSwipesQuery = query(
        collection(db, 'swipes'),
        where('userId', '==', userId2),
        where('swipedUserId', '==', userId1),
        where('type', 'in', ['like', 'superlike'])
      );

      const reverseQuerySnapshot = await getDocs(reverseSwipesQuery);
      console.log('🔍 Found reverse swipes:', reverseQuerySnapshot.docs.length);
      
      if (!reverseQuerySnapshot.empty) {
        console.log('🎉 Mutual like found! Creating match...');
        
        // Check if match already exists
        const existingMatchQuery = query(
          collection(db, 'matches'),
          where('users', 'array-contains', userId1)
        );
        
        const existingMatches = await getDocs(existingMatchQuery);
        const matchExists = existingMatches.docs.some(doc => {
          const data = doc.data();
          return data.users.includes(userId2);
        });
        
        if (matchExists) {
          console.log('✅ Match already exists');
          return true;
        }
        
        // Get both users for compatibility calculation
        const [user1, user2] = await Promise.all([
          userService.getUserProfile(userId1),
          userService.getUserProfile(userId2)
        ]);

        if (user1 && user2) {
          // Calculate compatibility score
          const compatibility = matchingAlgorithm.calculateCompatibility(user1, user2);
          
          // Calculate common interests
          const commonInterests = user1.interests.filter(interest => 
            user2.interests.includes(interest)
          );

          // Create the match!
          const matchData: Omit<Match, 'id'> = {
            users: [userId1, userId2],
            matchedAt: new Date().toISOString(),
            status: 'accepted', // Set as accepted since both liked each other
            commonInterests,
            compatibilityScore: compatibility.overall
          };

          await addDoc(collection(db, 'matches'), matchData);
          console.log('✅ Match created in Firebase database');
          return true;
        }
      }
      
      console.log('👍 No mutual match yet');
      return false;
    } catch (error) {
      console.error('Error checking for match:', error);
      throw error;
    }
  },

  // Get recommendations from backend API using advanced matching algorithm
  async getAdvancedRecommendations(
    userId: string,
    filters?: {
      ageRange?: [number, number];
      maxDistance?: number;
      verified?: boolean;
      travelStyles?: string[];
      destinations?: string[];
    },
    limit: number = 20
  ): Promise<any[]> {
    try {
      console.log('🎯 Fetching advanced recommendations from backend API for user:', userId);

      // Build query parameters
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (filters?.ageRange) params.append('ageRange', JSON.stringify(filters.ageRange));
      if (filters?.maxDistance) params.append('maxDistance', filters.maxDistance.toString());
      if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());
      if (filters?.travelStyles) params.append('travelStyles', JSON.stringify(filters.travelStyles));
      if (filters?.destinations) params.append('destinations', JSON.stringify(filters.destinations));

      const response = await fetch(`/api/matching/${userId}/recommendations?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const recommendations = await response.json();
      console.log('✅ Received recommendations from backend:', recommendations.length);

      return recommendations;
    } catch (error) {
      console.error('❌ Error fetching advanced recommendations:', error);
      throw error;
    }
  },

  // Record swipe on backend and check for match
  async recordSwipeWithBackend(swipeData: {
    type: 'like' | 'pass' | 'superlike';
    userId: string;
    swipedUserId: string;
  }): Promise<{ match: boolean; matchId?: string }> {
    try {
      // First record in Firestore (existing behavior)
      await this.recordSwipe(swipeData);

      // Then send to backend API for match checking
      const response = await fetch('/api/matching/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(swipeData)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error recording swipe with backend:', error);
      // Fall back to local match checking
      if (swipeData.type === 'like' || swipeData.type === 'superlike') {
        const isMatch = await this.checkForMatch(swipeData.userId, swipeData.swipedUserId);
        return { match: isMatch };
      }
      return { match: false };
    }
  },

  // Get likes received (people who liked you)
  async getLikesReceived(userId: string): Promise<any[]> {
    try {
      console.log('📥 Fetching likes received for user:', userId);

      const response = await fetch(`/api/matching/likes-received/${userId}?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const likesReceived = await response.json();
      console.log('✅ Received likes from backend:', likesReceived.length);

      return likesReceived;
    } catch (error) {
      console.error('❌ Error fetching likes received:', error);
      // Fallback: query Firestore directly
      try {
        console.log('🔄 Using Firestore fallback for likes received');
        const swipesQuery = query(
          collection(db, 'swipes'),
          where('swipedUserId', '==', userId)
        );

        const snapshot = await getDocs(swipesQuery);
        
        // Get all existing matches to exclude them
        const matchesQuery = query(
          collection(db, 'matches'),
          where('users', 'array-contains', userId)
        );
        const matchesSnapshot = await getDocs(matchesQuery);
        
        const matchedUserIds = new Set();
        matchesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          data.users.forEach((uid: string) => {
            if (uid !== userId) {
              matchedUserIds.add(uid);
            }
          });
        });

        const likes: any[] = [];
        const likesMap = new Map();

        for (const doc of snapshot.docs) {
          const data = doc.data();
          if ((data.type === 'like' || data.type === 'superlike') && !matchedUserIds.has(data.userId)) {
            // Fetch the user who liked this person
            const likerUser = await userService.getUserProfile(data.userId);
            if (likerUser) {
              // Deduplicate likes from the same user (keep most recent)
              if (likesMap.has(data.userId)) {
                const existingLike = likesMap.get(data.userId);
                const existingTimestamp = existingLike.timestamp?.toDate ? existingLike.timestamp.toDate() : new Date(existingLike.timestamp);
                const currentTimestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                
                if (currentTimestamp > existingTimestamp) {
                  likesMap.set(data.userId, {
                    id: doc.id,
                    user: likerUser,
                    type: data.type,
                    timestamp: data.timestamp,
                    swipedUserId: userId,
                    userId: data.userId
                  });
                }
              } else {
                likesMap.set(data.userId, {
                  id: doc.id,
                  user: likerUser,
                  type: data.type,
                  timestamp: data.timestamp,
                  swipedUserId: userId,
                  userId: data.userId
                });
              }
            }
          }
        }

        const finalLikes = Array.from(likesMap.values()).sort((a, b) => {
          const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return timestampB.getTime() - timestampA.getTime();
        });

        console.log('✅ Fallback returned', finalLikes.length, 'likes received (filtered)');
        return finalLikes;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return [];
      }
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

  // Listen to matches (temporarily disabled to avoid permission errors)
  subscribeToMatches(userId: string, callback: (matches: Match[]) => void) {
    // Temporarily disabled to avoid permission errors
    // TODO: Re-enable once Firebase rules are properly configured
    console.log('Matches subscription disabled to avoid permission errors');
    callback([]);
    return () => {}; // Return empty unsubscribe function
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