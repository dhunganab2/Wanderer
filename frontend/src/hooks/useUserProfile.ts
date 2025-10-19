import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from './useAuth';
import { userService, migrationService, realtimeService } from '@/services/firebaseService';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

export const useUserProfile = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const { 
    currentUser: localUser, 
    bucketList, 
    swipeHistory, 
    setCurrentUser,
    setLoading: setAppLoading 
  } = useAppStore();

  useEffect(() => {
    if (!authUser || authLoading) {
      setLoading(authLoading);
      return;
    }

    const checkUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user profile exists in Firestore or offline storage
        let userProfile = null;
        
        try {
          userProfile = await userService.getUserProfile(authUser.uid);
          console.log('User profile loaded:', userProfile ? 'Found' : 'Not found');
        } catch (error) {
          console.warn('Failed to fetch user profile from Firebase, checking offline storage:', error);
          // The userService.getUserProfile already falls back to offline storage
          // So if we get here, it means no profile exists anywhere
        }
        
        if (userProfile) {
          // User profile exists
          setUser(userProfile);
          setCurrentUser(userProfile);
          setIsNewUser(false);
          
          // Check if profile is complete
          try {
            const isComplete = await userService.isProfileComplete(authUser.uid);
            setProfileComplete(isComplete);
          } catch (error) {
            console.warn('Failed to check profile completeness:', error);
            setProfileComplete(false);
          }
          
          // Set up real-time listener for profile updates (if permissions allow)
          try {
            const unsubscribe = realtimeService.subscribeToUserProfile(authUser.uid, (updatedUser) => {
              if (updatedUser) {
                setUser(updatedUser);
                setCurrentUser(updatedUser);
              }
            });
            return () => unsubscribe();
          } catch (error) {
            console.warn('Failed to set up real-time listener:', error);
          }
        } else {
          // New user - no profile exists or can't access due to permissions
          console.log('⚠️ No profile found for user:', authUser.uid);
          setIsNewUser(true);
          setUser(null);
          setProfileComplete(false);
          
          // Check if we have local data to migrate (but only once)
          const migrationKey = `migration-done-${authUser.uid}`;
          const migrationDone = localStorage.getItem(migrationKey);
          
          if (!migrationDone && (localUser || bucketList.length > 0 || swipeHistory.length > 0)) {
            console.log('Found local data to migrate');
            try {
              await migrationService.migrateLocalDataToFirebase({
                currentUser: localUser,
                bucketList,
                swipeHistory
              });
              // Mark migration as done
              localStorage.setItem(migrationKey, 'true');
            } catch (error) {
              console.warn('Failed to migrate local data:', error);
            }
          }
        }
      } catch (err) {
        console.error('Error checking user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setLoading(false);
        setAppLoading(false);
      }
    };

    checkUserProfile();
  }, [authUser, authLoading]);

  const createUserProfile = async (profileData: Partial<User>) => {
    try {
      if (!authUser) throw new Error('User not authenticated');
      
      setLoading(true);
      setError(null);

      // Create the user profile with auth user info
      const userData = {
        ...profileData,
        id: authUser.uid,
        // Add default values if not provided
        avatar: authUser.photoURL || profileData.avatar || '',
        location: profileData.location || '',
        coordinates: profileData.coordinates,
        photos: profileData.photos || [],
        interests: profileData.interests || [],
        mutualConnections: 0,
        verified: false,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      await userService.createUserProfile(userData);
      
      // Fetch the created profile to ensure it's loaded
      const createdProfile = await userService.getUserProfile(authUser.uid);
      console.log('Created profile fetched:', createdProfile);
      
      if (createdProfile) {
        console.log('✅ Profile created and fetched successfully:', {
          id: createdProfile.id,
          name: createdProfile.name,
          age: createdProfile.age
        });
        setUser(createdProfile);
        setCurrentUser(createdProfile);
        setIsNewUser(false);
        
        // Check if profile is actually complete
        const isComplete = await userService.isProfileComplete(authUser.uid);
        console.log('✅ Profile completeness check:', isComplete);
        setProfileComplete(isComplete);
        
        // Force the state update to propagate
        return createdProfile;
      } else {
        console.error('❌ Failed to fetch created profile');
        throw new Error('Profile created but could not be retrieved');
      }
    } catch (err) {
      console.error('Error creating user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      if (!authUser || !user) throw new Error('User not authenticated or profile not loaded');
      
      setLoading(true);
      setError(null);

      await userService.updateUserProfile(authUser.uid, updates);
      
      // The real-time listener will update the local state
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompleteness = async () => {
    try {
      if (!authUser) return false;
      
      const isComplete = await userService.isProfileComplete(authUser.uid);
      setProfileComplete(isComplete);
      return isComplete;
    } catch (err) {
      console.error('Error checking profile completeness:', err);
      return false;
    }
  };

  return {
    user,
    setUser,
    loading,
    error,
    profileComplete,
    isNewUser,
    createUserProfile,
    updateUserProfile,
    checkProfileCompleteness,
    authUser
  };
};