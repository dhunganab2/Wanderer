import { useState, useEffect, useCallback, useRef } from 'react';
import { matchingService } from '@/services/firebaseService';
import type { Match } from '@/types';

// Cache to prevent duplicate API calls
interface MatchingCache {
  matches: { data: any[]; timestamp: number } | null;
  likesReceived: { data: any[]; timestamp: number } | null;
  userLikes: { data: any[]; timestamp: number } | null;
}

const cache: MatchingCache = {
  matches: null,
  likesReceived: null,
  userLikes: null,
};

// Pending promises to prevent duplicate concurrent requests
const pendingRequests: {
  matches: Promise<any> | null;
  likesReceived: Promise<any> | null;
  userLikes: Promise<any> | null;
} = {
  matches: null,
  likesReceived: null,
  userLikes: null,
};

const CACHE_DURATION = 30000; // 30 seconds cache

// Helper to check if cache is valid
const isCacheValid = (cacheEntry: { data: any[]; timestamp: number } | null): boolean => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
};

export const useMatchingData = (userId: string | null) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [likesReceived, setLikesReceived] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Track the last userId to detect changes
  const lastUserIdRef = useRef<string | null>(null);

  // Memoized fetch function that uses cache and deduplicates requests
  const fetchMatches = useCallback(async (uid: string): Promise<any[]> => {
    // Check cache first
    if (isCacheValid(cache.matches)) {
      console.log('📦 Using cached matches data');
      return cache.matches!.data;
    }

    // If there's a pending request, wait for it
    if (pendingRequests.matches) {
      console.log('⏳ Waiting for existing matches request...');
      return pendingRequests.matches;
    }

    // Create new request
    console.log('🔄 Fetching fresh matches data');
    pendingRequests.matches = matchingService.getUserMatches(uid);

    try {
      const data = await pendingRequests.matches;
      cache.matches = { data, timestamp: Date.now() };
      return data;
    } finally {
      pendingRequests.matches = null;
    }
  }, []);

  const fetchLikesReceived = useCallback(async (uid: string): Promise<any[]> => {
    if (isCacheValid(cache.likesReceived)) {
      console.log('📦 Using cached likes received data');
      return cache.likesReceived!.data;
    }

    if (pendingRequests.likesReceived) {
      console.log('⏳ Waiting for existing likes received request...');
      return pendingRequests.likesReceived;
    }

    console.log('🔄 Fetching fresh likes received data');
    pendingRequests.likesReceived = matchingService.getLikesReceived(uid);

    try {
      const data = await pendingRequests.likesReceived;
      cache.likesReceived = { data, timestamp: Date.now() };
      return data;
    } finally {
      pendingRequests.likesReceived = null;
    }
  }, []);

  const fetchUserLikes = useCallback(async (uid: string): Promise<any[]> => {
    if (isCacheValid(cache.userLikes)) {
      console.log('📦 Using cached user likes data');
      return cache.userLikes!.data;
    }

    if (pendingRequests.userLikes) {
      console.log('⏳ Waiting for existing user likes request...');
      return pendingRequests.userLikes;
    }

    console.log('🔄 Fetching fresh user likes data');
    pendingRequests.userLikes = matchingService.getUserLikes(uid);

    try {
      const data = await pendingRequests.userLikes;
      cache.userLikes = { data, timestamp: Date.now() };
      return data;
    } finally {
      pendingRequests.userLikes = null;
    }
  }, []);

  // Load all data
  const loadData = useCallback(async (uid: string, forceRefresh: boolean = false) => {
    if (!uid) return;

    try {
      setLoading(true);
      setError(null);

      // Clear cache if force refresh
      if (forceRefresh) {
        console.log('🔄 Force refresh - clearing cache');
        cache.matches = null;
        cache.likesReceived = null;
        cache.userLikes = null;
      }

      // Fetch all data in parallel with caching
      const [matchesData, likesReceivedData, userLikesData] = await Promise.all([
        fetchMatches(uid),
        fetchLikesReceived(uid),
        fetchUserLikes(uid),
      ]);

      // Only update state if component is still mounted
      if (isMounted.current) {
        setMatches(matchesData);
        setLikesReceived(likesReceivedData);
        setUserLikes(userLikesData);
      }
    } catch (err) {
      console.error('Error loading matching data:', err);
      if (isMounted.current) {
        setError(err as Error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchMatches, fetchLikesReceived, fetchUserLikes]);

  // Refresh function for manual updates
  const refresh = useCallback(() => {
    if (userId) {
      return loadData(userId, true);
    }
  }, [userId, loadData]);

  // Invalidate cache for a specific data type
  const invalidateCache = useCallback((type?: 'matches' | 'likesReceived' | 'userLikes') => {
    if (type) {
      cache[type] = null;
      console.log(`🗑️ Invalidated ${type} cache`);
    } else {
      cache.matches = null;
      cache.likesReceived = null;
      cache.userLikes = null;
      console.log('🗑️ Invalidated all caches');
    }
  }, []);

  // Load data when userId changes
  useEffect(() => {
    isMounted.current = true;

    // Only load if userId has changed
    if (userId && userId !== lastUserIdRef.current) {
      console.log('👤 User changed, loading matching data for:', userId);
      lastUserIdRef.current = userId;
      loadData(userId);
    } else if (userId && userId === lastUserIdRef.current) {
      // User is the same, check if we need to load from cache
      if (isCacheValid(cache.matches) && isCacheValid(cache.likesReceived) && isCacheValid(cache.userLikes)) {
        console.log('📦 Using all cached data');
        setMatches(cache.matches!.data);
        setLikesReceived(cache.likesReceived!.data);
        setUserLikes(cache.userLikes!.data);
        setLoading(false);
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [userId, loadData]);

  return {
    matches,
    likesReceived,
    userLikes,
    loading,
    error,
    refresh,
    invalidateCache,
  };
};

