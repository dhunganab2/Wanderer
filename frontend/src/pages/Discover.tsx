import React, { useState, useMemo, useEffect } from 'react';
import { Heart, X, MapPin, Calendar, Filter, Grid, RotateCcw, Star, Sparkles, Map, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TravelCard } from '@/components/TravelCard';
import { SwipeableCard } from '@/components/SwipeableCard';
import { TravelCardSkeleton, TravelCardGridSkeleton, TravelCardStackSkeleton } from '@/components/TravelCardSkeleton';
import { FilterPanel } from '@/components/FilterPanel';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { useAppStore } from '@/store/useAppStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMatchingData } from '@/hooks/useMatchingData';
import { userService, matchingService } from '@/services/firebaseService';
import { matchingAlgorithm } from '@/services/matchingAlgorithm';
import { getCurrentLocation } from '@/services/locationService';
import { enhancedUsers } from '@/data/enhancedSampleData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DebugInfo } from '@/components/DebugInfo';
import type { User, FilterSettings } from '@/types';
import type { MatchRecommendation } from '@/services/matchingAlgorithm';

export default function Discover() {
  const [viewMode, setViewMode] = useState<'stack' | 'grid'>('stack');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [discoveryUsers, setDiscoveryUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [matchRecommendations, setMatchRecommendations] = useState<MatchRecommendation[]>([]);
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [discoveryMode, setDiscoveryMode] = useState<'algorithm' | 'location' | 'random'>('algorithm');

  // Track users that have been swiped in this session (persists across useEffect reruns)
  const [localSwipedUsers, setLocalSwipedUsers] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('localSwipedUsers');
    console.log('🔧 INITIALIZING localSwipedUsers from localStorage:', saved);
    const set = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    console.log('🔧 Initialized localSwipedUsers Set:', Array.from(set));
    return set;
  });

  const { filters, swipeUser, swipeHistory, setUsers, resetSwipeHistory, addMatch } = useAppStore();
  const { user: currentUser, authUser } = useUserProfile();

  // Save localSwipedUsers to localStorage whenever it changes
  useEffect(() => {
    const arrayToSave = Array.from(localSwipedUsers);
    console.log('💾 SAVING localSwipedUsers to localStorage:', arrayToSave);
    localStorage.setItem('localSwipedUsers', JSON.stringify(arrayToSave));
    console.log('💾 Saved successfully. Verifying:', localStorage.getItem('localSwipedUsers'));
  }, [localSwipedUsers]);
  
  // Use cached matching data hook
  const { matches: cachedMatches } = useMatchingData(authUser?.uid || null);

  // Load user's current location
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.warn('Could not get user location:', error);
      }
    };

    loadUserLocation();
  }, []);

  // Load discovery users with enhanced algorithm
  useEffect(() => {
    const loadDiscoveryUsers = async () => {
      if (!authUser) return;

      try {
        setLoadingUsers(true);

        console.log('🔄 ===== USEEFFECT TRIGGERED =====');
        console.log('🔄 localSwipedUsers at start:', Array.from(localSwipedUsers));
        console.log('🔄 localStorage localSwipedUsers:', localStorage.getItem('localSwipedUsers'));

        // Load swipes and matches from database
        // We should exclude:
        // 1. Users we've PASSED on (swiped left)
        // 2. Users we're already MATCHED with
        // We should NOT exclude users we've LIKED (they need to see us to swipe back)

        // Fetch both in parallel
        const [dbSwipes, dbMatches] = await Promise.all([
          matchingService.getUserSwipes(authUser.uid),
          matchingService.getUserMatches(authUser.uid)
        ]);

        console.log('🎯 DEBUG dbMatches from DB:', dbMatches);
        console.log('🎯 DEBUG dbMatches length:', dbMatches?.length);

        // Get user IDs to exclude from discovery
        const passedUserIds = dbSwipes
          .filter(swipe => swipe.type === 'pass')
          .map(swipe => (swipe as any).swipedUserId);

        // Get matched user IDs directly from database (don't rely on cache)
        const matchedUserIds = dbMatches
          .filter(match => {
            console.log('🎯 Checking match:', match.id, 'status:', match.status, 'users:', match.users);
            return match.status === 'accepted';
          })
          .flatMap(match => {
            console.log('🎯 Extracting users from match:', match.users);
            return match.users;
          })
          .filter(id => {
            const isNotCurrentUser = id !== authUser.uid;
            console.log('🎯 User ID:', id, 'isNotCurrentUser:', isNotCurrentUser);
            return isNotCurrentUser;
          });

        // Combine passed and matched users to exclude
        const excludedUserIds = [...new Set([...passedUserIds, ...matchedUserIds])];

        let users: User[] = [];

        console.log('🔍 Loading discovery users...');
        console.log('Auth user ID:', authUser.uid);
        console.log('Total swipes from DB:', dbSwipes.length);
        console.log('Passed users to exclude (DB):', passedUserIds.length, passedUserIds);
        console.log('Matched users to exclude:', matchedUserIds.length, matchedUserIds);
        console.log('Total excluded user IDs (DB):', excludedUserIds.length, excludedUserIds);
        console.log('Local swiped users (session):', localSwipedUsers.size, Array.from(localSwipedUsers));
        console.log('Discovery mode:', discoveryMode);
        
        try {
          // First try to load from Firebase
          console.log('🔥 Attempting to load users from Firebase...');
          
          switch (discoveryMode) {
            case 'algorithm':
              if (currentUser) {
                users = await userService.getEnhancedDiscoveryUsers(authUser.uid, excludedUserIds, filters, 150);
              } else {
                users = await userService.getDiscoveryUsers(authUser.uid, excludedUserIds);
              }
              break;

            case 'location':
              if (userLocation) {
                users = await userService.getLocationBasedUsers(authUser.uid, userLocation, filters.maxDistance, excludedUserIds);
              } else {
                users = await userService.getDiscoveryUsers(authUser.uid, excludedUserIds);
              }
              break;

            case 'random':
            default:
              users = await userService.getDiscoveryUsers(authUser.uid, excludedUserIds);
              break;
          }
          
          console.log('✅ Successfully loaded users from Firebase:', users.length);
          
          // If Firebase returns no users, fall back to enhanced sample data
          if (users.length === 0) {
            console.log('⚠️ No users from Firebase, falling back to enhanced sample data');
            throw new Error('No users found in Firebase');
          }
          
        } catch (firebaseError) {
          console.warn('❌ Firebase loading failed, using enhanced sample data:', firebaseError);

          // Fallback to enhanced sample data (exclude passes and matches only)
          users = enhancedUsers.filter(user => {
            const isNotCurrentUser = user.id !== authUser.uid;
            const notExcluded = !excludedUserIds.includes(user.id);
            return isNotCurrentUser && notExcluded;
          });
        }
        
        // Keep all available users for better discovery experience
        console.log('📊 Users loaded from API/Firebase:', users.length);
        console.log('📊 User IDs loaded:', users.map(u => u.id));

        // Filter out locally swiped users (from this session)
        console.log('🧹 Filtering localSwipedUsers...');
        console.log('🧹 localSwipedUsers before filter:', Array.from(localSwipedUsers));
        const filteredFromLocal = users.filter(u => {
          const isSwipedLocally = localSwipedUsers.has(u.id);
          if (isSwipedLocally) {
            console.log(`❌ Filtering out locally swiped user: ${u.id} (${u.name})`);
          }
          return !isSwipedLocally;
        });
        console.log(`🔍 Filtered ${users.length - filteredFromLocal.length} locally swiped users from list`);
        console.log('📊 Final user count after local filter:', filteredFromLocal.length);
        console.log('📊 Final user IDs:', filteredFromLocal.map(u => u.id));

        // Always store users in global state for Matches page
        setUsers(filteredFromLocal);
        setDiscoveryUsers(filteredFromLocal);

        // Reset to start of the new filtered list
        setCurrentCardIndex(0);
        console.log('✅ Updated discoveryUsers state with', filteredFromLocal.length, 'users');

        // Calculate match recommendations for each user
        if (currentUser && users.length > 0) {
          const recommendations = matchingAlgorithm.findMatches(currentUser, users, filters, users.length);
          setMatchRecommendations(recommendations);
          console.log('🎯 Generated recommendations:', recommendations.length);
        }
        
      } catch (error) {
        console.error('❌ Error in loadDiscoveryUsers:', error);

        // Final fallback to sample users
        try {
          const [dbSwipes, dbMatches] = await Promise.all([
            matchingService.getUserSwipes(authUser.uid),
            matchingService.getUserMatches(authUser.uid)
          ]);

          const passedIds = dbSwipes.filter(s => s.type === 'pass').map(s => (s as any).swipedUserId);
          const matchedIds = dbMatches
            .filter(m => m.status === 'accepted')
            .flatMap(m => m.users)
            .filter(id => id !== authUser.uid);

          const excludedIds = [...new Set([...passedIds, ...matchedIds])];

          const fallbackUsers = enhancedUsers.filter(user =>
            user.id !== authUser.uid && !excludedIds.includes(user.id)
          );
          console.log('🔄 Fallback users available:', fallbackUsers.length);

          setUsers(fallbackUsers);
          setDiscoveryUsers(fallbackUsers);
          console.log('🔄 Using fallback users:', fallbackUsers.length);
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          setDiscoveryUsers([]);
        }
      } finally {
        setLoadingUsers(false);
      }
    };

    loadDiscoveryUsers();
  }, [authUser, filters, discoveryMode, userLocation, currentUser]);

  // Filter users based on current filter settings
  const filteredUsers = useMemo(() => {
    return discoveryUsers.filter(user => {
      // Age filter
      if (user.age < filters.ageRange[0] || user.age > filters.ageRange[1]) {
        return false;
      }

      // Verified filter
      if (filters.verified && !user.verified) {
        return false;
      }

      // Travel styles filter
      if (filters.travelStyles.length > 0) {
        const hasMatchingStyle = filters.travelStyles.some(style => 
          user.travelStyle.includes(style)
        );
        if (!hasMatchingStyle) return false;
      }

      // Destinations filter
      if (filters.destinations.length > 0) {
        const hasMatchingDestination = filters.destinations.some(dest => 
          user.nextDestination.toLowerCase().includes(dest.toLowerCase()) ||
          user.location.toLowerCase().includes(dest.toLowerCase())
        );
        if (!hasMatchingDestination) return false;
      }

      return true;
    });
  }, [filters, discoveryUsers]);

  const handleLike = async (userId: string) => {
    if (!authUser) {
      toast.error('Please log in to like users');
      return;
    }

    try {
      console.log('❤️ ===== HANDLELIKE STARTED =====');
      console.log('❤️ Liked user:', userId, 'by user:', authUser.uid);
      console.log('❤️ localSwipedUsers BEFORE adding:', Array.from(localSwipedUsers));

      // Record swipe in local store
      swipeUser({ type: 'like', userId, timestamp: new Date().toISOString() });
      console.log('✅ Swipe recorded in local store');

      // Add to local swiped users set (persists across useEffect reruns)
      setLocalSwipedUsers(prev => {
        const newSet = new Set(prev).add(userId);
        console.log('❤️ localSwipedUsers AFTER adding:', Array.from(newSet));
        console.log('❤️ Will save to localStorage:', JSON.stringify(Array.from(newSet)));
        return newSet;
      });

      // Immediately remove from discovery list to prevent re-appearance
      setDiscoveryUsers(prev => {
        console.log('❤️ discoveryUsers BEFORE removal:', prev.length, prev.map(u => u.id));
        const filtered = prev.filter(u => u.id !== userId);
        console.log('❤️ discoveryUsers AFTER removal:', filtered.length, filtered.map(u => u.id));
        console.log(`✅ Removed liked user ${userId} from discovery list. Remaining: ${filtered.length}`);
        return filtered;
      });

      // Record swipe via backend API (handles match detection automatically)
      const result = await matchingService.recordSwipeWithBackend({
        type: 'like',
        userId: authUser.uid,
        swipedUserId: userId
      });
      console.log('✅ Swipe recorded via backend API, result:', result);

      const user = filteredUsers.find(u => u.id === userId);

      // Check if this created a match
      if (result.match) {
        console.log('🎉 IT\'S A MATCH! Match ID:', result.matchId);
        if (user) {
          setMatchedUser(user);
          setShowMatchNotification(true);
          addMatch({
            id: result.matchId || `${authUser.uid}_${userId}`,
            users: [authUser.uid, userId],
            matchedAt: new Date().toISOString(),
            status: 'accepted',
            commonInterests: [],
            compatibilityScore: 0
          });
          toast.success(`🎉 It's a match with ${user.name}!`);

          setTimeout(() => {
            setShowMatchNotification(false);
            setMatchedUser(null);
          }, 3000);
        }
      } else {
        // Just a like, not a match yet
        if (user) {
          console.log('👍 Like sent to user:', user.name, user.id);
          toast.success(`Like sent to ${user.name}!`);
          console.log('ℹ️ Like recorded - they will see this in "Likes Received" and can like back to create a match');
        } else {
          console.warn('⚠️ User not found in filteredUsers:', userId);
          toast.success(`Like sent!`);
        }
      }

    } catch (error) {
      console.error('❌ Error liking user:', error);
      toast.error('Failed to like user. Please try again.');
    }

    if (viewMode === 'stack') {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePass = async (userId: string) => {
    if (!authUser) {
      toast.error('Please log in to pass users');
      return;
    }

    try {
      console.log('❌ ===== HANDLEPASS STARTED =====');
      console.log('❌ Passed user:', userId, 'by user:', authUser.uid);
      console.log('❌ localSwipedUsers BEFORE adding:', Array.from(localSwipedUsers));

      // Record swipe in local store
      swipeUser({ type: 'pass', userId, timestamp: new Date().toISOString() });
      console.log('✅ Pass recorded in local store');

      // Add to local swiped users set (persists across useEffect reruns)
      setLocalSwipedUsers(prev => {
        const newSet = new Set(prev).add(userId);
        console.log('❌ localSwipedUsers AFTER adding:', Array.from(newSet));
        console.log('❌ Will save to localStorage:', JSON.stringify(Array.from(newSet)));
        return newSet;
      });

      // Immediately remove from discovery list to prevent re-appearance
      setDiscoveryUsers(prev => {
        console.log('❌ discoveryUsers BEFORE removal:', prev.length, prev.map(u => u.id));
        const filtered = prev.filter(u => u.id !== userId);
        console.log('❌ discoveryUsers AFTER removal:', filtered.length, filtered.map(u => u.id));
        console.log(`✅ Removed passed user ${userId} from discovery list. Remaining: ${filtered.length}`);
        return filtered;
      });

      // Record swipe via backend API
      await matchingService.recordSwipeWithBackend({
        type: 'pass',
        userId: authUser.uid,
        swipedUserId: userId
      });
      console.log('✅ Pass recorded via backend API');

    } catch (error) {
      console.error('❌ Error passing user:', error);
      toast.error('Failed to pass user. Please try again.');
    }

    if (viewMode === 'stack') {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handleSuperLike = async (userId: string) => {
    if (!authUser) {
      toast.error('Please log in to super like users');
      return;
    }

    try {
      console.log('⭐ Super liked user:', userId, 'by user:', authUser.uid);

      // Record swipe in local store
      swipeUser({ type: 'superlike', userId, timestamp: new Date().toISOString() });
      console.log('✅ Super like recorded in local store');

      // Add to local swiped users set (persists across useEffect reruns)
      setLocalSwipedUsers(prev => new Set(prev).add(userId));

      // Immediately remove from discovery list to prevent re-appearance
      setDiscoveryUsers(prev => {
        const filtered = prev.filter(u => u.id !== userId);
        console.log(`✅ Removed super-liked user ${userId} from discovery list. Remaining: ${filtered.length}`);
        return filtered;
      });

      // Record swipe via backend API (handles match detection automatically)
      const result = await matchingService.recordSwipeWithBackend({
        type: 'superlike',
        userId: authUser.uid,
        swipedUserId: userId
      });
      console.log('✅ Super like recorded via backend API, result:', result);

      const user = filteredUsers.find(u => u.id === userId);

      // Check if this created a match
      if (result.match) {
        console.log('🎉 IT\'S A SUPER MATCH! Match ID:', result.matchId);
        if (user) {
          setMatchedUser(user);
          setShowMatchNotification(true);
          addMatch({
            id: result.matchId || `${authUser.uid}_${userId}`,
            users: [authUser.uid, userId],
            matchedAt: new Date().toISOString(),
            status: 'accepted',
            commonInterests: [],
            compatibilityScore: 0
          });
          toast.success(`🎉 It's a Super Match with ${user.name}! ⭐`);

          setTimeout(() => {
            setShowMatchNotification(false);
            setMatchedUser(null);
          }, 3000);
        }
      } else {
        // Just a super like, not a match yet
        if (user) {
          console.log('⭐ Super like sent to user:', user.name, user.id);
          toast.success(`Super like sent to ${user.name}! ⭐`);
          console.log('ℹ️ Super like recorded - they will see this in "Likes Received" and can like back to create a match');
        } else {
          console.warn('⚠️ User not found in filteredUsers:', userId);
          toast.success(`Super like sent! ⭐`);
        }
      }

    } catch (error) {
      console.error('❌ Error super liking user:', error);
      toast.error('Failed to super like user. Please try again.');
    }

    if (viewMode === 'stack') {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const currentCard = filteredUsers[currentCardIndex];
    if (!currentCard) return;

    switch (direction) {
      case 'left':
        handlePass(currentCard.id);
        break;
      case 'right':
        handleLike(currentCard.id);
        break;
      case 'up':
        handleSuperLike(currentCard.id);
        break;
    }
  };

  const handleReset = () => {
    setCurrentCardIndex(0);
    localStorage.setItem('currentCardIndex', '0');

    // Clear local swiped users
    setLocalSwipedUsers(new Set());
    localStorage.removeItem('localSwipedUsers');

    resetSwipeHistory();

    // Trigger useEffect to reload users after resetting swipe history
    setLoadingUsers(true);
  };

  const handleApplyFilters = (newFilters: FilterSettings) => {
    setIsLoading(true);
    // Simulate loading time for filter application
    setTimeout(() => {
      setCurrentCardIndex(0); // Reset to first card when filters change
      setIsLoading(false);
    }, 500);
  };

  const currentCard = filteredUsers[currentCardIndex];
  const hasMoreCards = currentCardIndex < filteredUsers.length;
  
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 65) count++;
    if (filters.maxDistance !== 50) count++;
    if (filters.travelStyles.length > 0) count++;
    if (filters.destinations.length > 0) count++;
    if (filters.verified) count++;
    return count;
  };

  // Get compatibility score for current card
  const getCurrentCardCompatibility = () => {
    if (!currentUser || !currentCard) return null;
    const recommendation = matchRecommendations.find(rec => rec.user.id === currentCard.id);
    
    // If we have a recommendation, use it; otherwise calculate on-the-fly
    if (recommendation) {
      return recommendation.score;
    } else {
      // Calculate compatibility on-the-fly
      const compatibility = matchingAlgorithm.calculateCompatibility(currentUser, currentCard);
      return compatibility;
    }
  };

  const currentCompatibility = getCurrentCardCompatibility();

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Main Content */}
      <div className="pt-20 pb-6">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-1 animate-fade-up px-4">
            {getActiveFilterCount() > 0 && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-elevated backdrop-blur-xl border border-sunrise-coral/30">
                  <Sparkles className="w-4 h-4 text-sunrise-coral animate-pulse" />
                  <span className="text-sunrise-coral font-semibold">
                    {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active - Finding your perfect matches
                  </span>
                </div>
              </div>
            )}
            
          </div>

          {/* Enhanced Discovery Mode Selector with View Controls */}
          <div className="mb-2 animate-slide-up px-4" style={{animationDelay: '0.4s'}}>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Discovery Mode Buttons */}
              <div className="flex gap-2 p-2 glass-card-elevated rounded-2xl backdrop-blur-2xl border border-white/20 shadow-elevation overflow-x-auto">
                <Button
                  variant={discoveryMode === 'algorithm' ? 'hero' : 'ghost'}
                  size="sm"
                  onClick={() => setDiscoveryMode('algorithm')}
                  className="flex items-center gap-2 px-4 transition-all duration-500 group whitespace-nowrap"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-sunrise flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-4 h-4 text-white group-hover:animate-pulse-soft" />
                  </div>
                  <span className="font-bold text-sm">Smart Match</span>
                </Button>
                <Button
                  variant={discoveryMode === 'location' ? 'elegant' : 'ghost'}
                  size="sm"
                  onClick={() => setDiscoveryMode('location')}
                  className="flex items-center gap-2 px-4 transition-all duration-500 group whitespace-nowrap"
                  disabled={!userLocation}
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-ocean flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Map className="w-4 h-4 text-white group-hover:animate-pulse-soft" />
                  </div>
                  <span className="font-bold text-sm">Nearby</span>
                </Button>
                <Button
                  variant={discoveryMode === 'random' ? 'premium' : 'ghost'}
                  size="sm"
                  onClick={() => setDiscoveryMode('random')}
                  className="flex items-center gap-2 px-4 transition-all duration-500 group whitespace-nowrap"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-sunset flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-4 h-4 text-white group-hover:animate-pulse-soft" />
                  </div>
                  <span className="font-bold text-sm">Explore</span>
                </Button>
              </div>

              {/* View Mode Controls with Filter */}
              <div className="flex items-center gap-2">
                <div className="flex glass-card-elevated rounded-xl p-1 backdrop-blur-2xl border border-white/20 shadow-elevation">
                  <Button
                    variant={viewMode === 'stack' ? 'premium' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('stack')}
                    className="px-3 transition-all duration-500 group"
                  >
                    <Heart className="w-4 h-4 group-hover:animate-pulse-soft" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'premium' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3 transition-all duration-500 group"
                  >
                    <Grid className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  </Button>
                </div>
                
                <Button
                  variant={getActiveFilterCount() > 0 ? "hero" : "floating"}
                  size="icon"
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "relative shadow-elevation hover:shadow-glow transition-all duration-500 group w-10 h-10",
                    getActiveFilterCount() > 0 && "animate-pulse-soft"
                  )}
                >
                  <Filter className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  {getActiveFilterCount() > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-sunrise text-white text-xs font-bold rounded-full flex items-center justify-center shadow-elevation">
                      {getActiveFilterCount()}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Content based on view mode */}
          {loadingUsers || isLoading ? (
            viewMode === 'stack' ? (
              <TravelCardStackSkeleton />
            ) : (
              <TravelCardGridSkeleton count={8} />
            )
          ) : viewMode === 'stack' ? (
            <div className="flex items-center justify-center h-[calc(100vh-240px)] py-2">
              {hasMoreCards ? (
                <div className="w-full max-w-7xl mx-auto px-6">
                  {/* Main Content Container - Premium Layout */}
                  <div className="flex items-center justify-center gap-8 w-full">
                    
                    {/* Card Container - Centered */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {/* Card Stack Effect */}
                        <div className="relative z-10">
                          <SwipeableCard
                            user={currentCard}
                            onSwipe={handleSwipe}
                            className="animate-scale-in"
                          >
                            <TravelCard
                              user={currentCard}
                              variant="stack"
                              showActions={false}
                            />
                          </SwipeableCard>
                        </div>
                        
                        {/* Next card preview */}
                        {filteredUsers[currentCardIndex + 1] && (
                          <div className="absolute top-2 left-2 right-2 z-0 opacity-30 scale-95">
                            <TravelCard
                              user={filteredUsers[currentCardIndex + 1]}
                              variant="stack"
                              showActions={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Compatibility Score - Modern Design */}
                    {currentCompatibility && (
                      <div className="hidden lg:flex flex-col justify-center">
                        <div className="relative">
                          {/* Glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-sunrise-coral/20 rounded-2xl blur-xl"></div>
                          <div className="relative backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl bg-gradient-to-br from-background/90 to-background/70 w-48">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-gradient-to-br from-primary/20 to-sunrise-coral/20 rounded-lg">
                                <Sparkles className="w-5 h-5 text-primary" />
                              </div>
                              <span className="text-sm font-bold text-foreground tracking-wide">MATCH SCORE</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-3">
                              <span className="text-4xl font-black bg-gradient-to-br from-primary to-sunrise-coral bg-clip-text text-transparent">
                                {currentCompatibility.overall}
                              </span>
                              <span className="text-xl font-bold text-muted-foreground">%</span>
                            </div>
                            <div className="text-sm text-muted-foreground leading-relaxed">
                              {currentCompatibility.reasons.slice(0, 2).join(' • ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Counter - Top Right */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className="backdrop-blur-md rounded-full px-3 py-1 border border-white/20 shadow-lg" style={{backgroundColor: 'hsl(var(--background) / 0.95)'}}>
                      <span className="text-sm font-medium text-muted-foreground">
                        {currentCardIndex + 1} / {filteredUsers.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Premium Design */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-5 z-30">
                    <div className="relative group/pass">
                      <div className="absolute inset-0 bg-red-500/30 rounded-full blur-lg group-hover/pass:blur-xl transition-all"></div>
                      <Button
                        variant="floating"
                        size="icon"
                        onClick={() => handlePass(currentCard.id)}
                        className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full backdrop-blur-xl bg-background/40 border-2 border-red-500/40 hover:border-red-500/80 hover:scale-110 hover:bg-red-500/20 transition-all duration-500 shadow-2xl"
                      >
                        <X className="w-7 h-7 sm:w-8 sm:h-8 text-red-500 group-hover/pass:rotate-90 transition-transform duration-500" strokeWidth={2.5} />
                      </Button>
                    </div>

                    <div className="relative group/star">
                      <div className="absolute inset-0 bg-sky-blue/40 rounded-full blur-lg group-hover/star:blur-xl transition-all"></div>
                      <Button
                        variant="floating"
                        size="icon"
                        onClick={() => handleSuperLike(currentCard.id)}
                        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full backdrop-blur-xl bg-gradient-to-br from-sky-blue/90 to-midnight-blue/90 border-2 border-sky-blue/60 hover:border-sky-blue hover:scale-110 transition-all duration-500 shadow-2xl"
                      >
                        <Star className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover/star:rotate-12 transition-transform duration-300" fill="currentColor" strokeWidth={2} />
                      </Button>
                    </div>

                    <div className="relative group/like">
                      <div className="absolute inset-0 bg-sunrise-coral/30 rounded-full blur-lg group-hover/like:blur-xl transition-all"></div>
                      <Button
                        variant="hero"
                        size="icon"
                        onClick={() => handleLike(currentCard.id)}
                        className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full backdrop-blur-xl bg-gradient-to-br from-sunrise-coral to-warm-amber border-2 border-sunrise-coral/60 hover:border-sunrise-coral hover:scale-110 transition-all duration-500 shadow-2xl"
                      >
                        <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover/like:scale-110 transition-transform duration-300" fill="currentColor" strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center animate-fade-up">
                  <div className="w-24 h-24 rounded-full bg-gradient-sunrise/10 flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4 font-display">
                    You're all caught up!
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    You've seen all the travelers in your area. Check back later for new matches, or expand your search radius.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="hero" onClick={handleReset} className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      See Again
                    </Button>
                    <Button variant="outline" onClick={() => setLoadingUsers(true)} className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Reload Users
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Adjust Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user, index) => {
                const recommendation = matchRecommendations.find(rec => rec.user.id === user.id);
                const isLiked = swipeHistory.some(swipe => swipe.userId === user.id && swipe.type === 'like');
                const isPassed = swipeHistory.some(swipe => swipe.userId === user.id && swipe.type === 'pass');
                
                // Calculate compatibility score on-the-fly if no recommendation exists
                const compatibilityScore = recommendation ? recommendation.score.overall : 
                  (currentUser ? matchingAlgorithm.calculateCompatibility(currentUser, user).overall : 0);
                const compatibilityReasons = recommendation ? recommendation.reasons : 
                  (currentUser ? matchingAlgorithm.calculateCompatibility(currentUser, user).reasons : ['Compatible profile']);
                
                return (
                  <div 
                    key={user.id}
                    className={cn(
                      "animate-fade-up relative",
                      isLiked && "ring-2 ring-green-500/50",
                      isPassed && "opacity-50"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <TravelCard
                      user={user}
                      variant="grid"
                      onLike={handleLike}
                      onPass={handlePass}
                      className="w-full"
                    />
                    
                    {/* Liked/Passed Indicator */}
                    {isLiked && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full">
                        <Heart className="w-4 h-4" fill="currentColor" />
                      </div>
                    )}
                    {isPassed && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                    
                    {/* Always show compatibility score */}
                    <div className="mt-2 p-2 rounded-lg" style={{backgroundColor: 'hsl(var(--muted) / 0.5)'}}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Compatibility</span>
                        <span className="font-medium text-primary">
                          {compatibilityScore}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {compatibilityReasons.slice(0, 1).join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Match Notification */}
      {showMatchNotification && matchedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm animate-fade-in" style={{backgroundColor: 'rgba(0, 0, 0, 0.8)'}}>
          <div className="relative max-w-sm mx-4 bg-background rounded-3xl p-8 text-center shadow-2xl animate-scale-in">
            {/* Celebration effects */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-sunrise rounded-full animate-ping opacity-75" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-sky-blue rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }} />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-warm-amber rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }} />
            
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-sunrise rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
                It's a Match! 🎉
              </h2>
              <p className="text-muted-foreground">
                You and {matchedUser.name} liked each other
              </p>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 text-center">
                <img 
                  src={currentUser?.avatar || ''} 
                  alt="You"
                  className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary"
                />
                <p className="text-sm font-medium">You</p>
              </div>
              
              <div className="relative">
                <Heart className="w-8 h-8 text-primary animate-pulse" fill="currentColor" />
              </div>
              
              <div className="flex-1 text-center">
                <img 
                  src={matchedUser.avatar} 
                  alt={matchedUser.name}
                  className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary"
                />
                <p className="text-sm font-medium">{matchedUser.name}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowMatchNotification(false);
                  setMatchedUser(null);
                }}
              >
                Keep Swiping
              </Button>
              <Button 
                variant="hero" 
                className="flex-1"
                onClick={() => {
                  setShowMatchNotification(false);
                  setMatchedUser(null);
                  window.location.href = '/matches';
                }}
              >
                Say Hello
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
      />

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
    </div>
  );
}
