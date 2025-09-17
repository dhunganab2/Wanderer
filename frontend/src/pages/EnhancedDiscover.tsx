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
import { userService, matchingService } from '@/services/firebaseService';
import { matchingAlgorithm } from '@/services/matchingAlgorithm';
import { getCurrentLocation } from '@/services/locationService';
import { enhancedUsers } from '@/data/enhancedSampleData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DebugInfo } from '@/components/DebugInfo';
import { ChatLayout } from '@/components/ChatLayout';
import type { User, FilterSettings, MatchRecommendation } from '@/types';

export default function EnhancedDiscover() {
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
  
  const { filters, swipeUser, swipeHistory, setUsers, resetSwipeHistory, addMatch } = useAppStore();
  const { user: currentUser, authUser } = useUserProfile();

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
        
        // Get swiped user IDs to exclude them
        const swipedUserIds = swipeHistory.map(swipe => swipe.userId);
        
        let users: User[] = [];
        
        // Always use enhanced users since Firebase has permission issues
        console.log('Enhanced users available:', enhancedUsers.length);
        console.log('Auth user ID:', authUser.uid);
        console.log('Swiped user IDs:', swipedUserIds);
        
        // Filter out the current user and already swiped users
        users = enhancedUsers.filter(user => {
          const isNotCurrentUser = user.id !== authUser.uid;
          const notSwiped = !swipedUserIds.includes(user.id);
          console.log(`User ${user.id}: isNotCurrentUser=${isNotCurrentUser}, notSwiped=${notSwiped}`);
          return isNotCurrentUser && notSwiped;
        });
        
        // Limit to 20 users for better performance
        users = users.slice(0, 20);
        
        console.log('Loaded users:', users.length, 'Swiped users:', swipedUserIds.length);

        // Always store users in global state for Matches page
        setUsers(users);
        setDiscoveryUsers(users);
        
        // Calculate match recommendations for each user
        if (currentUser && users.length > 0) {
          const recommendations = matchingAlgorithm.findMatches(currentUser, users, filters, users.length);
          setMatchRecommendations(recommendations);
        }
      } catch (error) {
        console.error('Error loading discovery users:', error);
        // Fallback to sample users
        const fallbackUsers = enhancedUsers.filter(user => 
          user.id !== authUser.uid && !swipeHistory.map(s => s.userId).includes(user.id)
        ).slice(0, 20);
        setUsers(fallbackUsers);
        setDiscoveryUsers(fallbackUsers);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadDiscoveryUsers();
  }, [authUser, swipeHistory, filters, discoveryMode, userLocation, currentUser]);

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
      console.log('Liked user:', userId);
      
      // Record swipe in local store
      swipeUser({ type: 'like', userId, timestamp: new Date().toISOString() });
      
      // Record swipe in Firebase
      await matchingService.recordSwipe({
        type: 'like',
        userId: authUser.uid,
        swipedUserId: userId
      });
      
      // Always create a match for demo purposes (100% match rate)
      const user = filteredUsers.find(u => u.id === userId);
      if (user) {
        console.log('Creating match for user:', user.name, user.id);
        
        // Always create match in local store (Firebase will be handled separately)
        const newMatch = {
          id: `match_${Date.now()}`,
          users: [authUser.uid, userId],
          matchedAt: new Date().toISOString(),
          status: 'accepted' as const,
          commonInterests: user.interests?.slice(0, 3) || ['Travel', 'Adventure'], // Get first 3 interests
          compatibilityScore: Math.floor(Math.random() * 40) + 60 // 60-100%
        };
        
        console.log('Adding match to store:', newMatch);
        addMatch(newMatch);
        
        // Try to create match in Firebase (but don't fail if it doesn't work)
        try {
          await matchingService.checkForMatch(authUser.uid, userId);
          console.log('Match created in Firebase successfully');
        } catch (firebaseError) {
          console.warn('Firebase match creation failed, but local match created:', firebaseError);
        }
        
        setMatchedUser(user);
        setShowMatchNotification(true);
        toast.success(`It's a match with ${user.name}! 🎉`);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowMatchNotification(false);
          setMatchedUser(null);
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error liking user:', error);
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
      console.log('Passed user:', userId);
      
      // Record swipe in local store
      swipeUser({ type: 'pass', userId, timestamp: new Date().toISOString() });
      
      // Record swipe in Firebase
      await matchingService.recordSwipe({
        type: 'pass',
        userId: authUser.uid,
        swipedUserId: userId
      });
      
    } catch (error) {
      console.error('Error passing user:', error);
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
      console.log('Super liked user:', userId);
      
      // Record swipe in local store
      swipeUser({ type: 'superlike', userId, timestamp: new Date().toISOString() });
      
      // Record swipe in Firebase
      await matchingService.recordSwipe({
        type: 'superlike',
        userId: authUser.uid,
        swipedUserId: userId
      });
      
      // Super likes have higher match chance (80%)
      const user = filteredUsers.find(u => u.id === userId);
      if (user && Math.random() > 0.2) { // Simulate match for demo
        setMatchedUser(user);
        setShowMatchNotification(true);
        toast.success(`It's a Super Match with ${user.name}! ⭐`);
        
        setTimeout(() => {
          setShowMatchNotification(false);
          setMatchedUser(null);
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error super liking user:', error);
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
    resetSwipeHistory();
    // Reload users after resetting swipe history
    loadDiscoveryUsers();
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
    return recommendation?.score || null;
  };

  const currentCompatibility = getCurrentCardCompatibility();

  return (
    <ChatLayout>
      <div className="h-full bg-background overflow-y-auto">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Main Content */}
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-16 animate-fade-up">
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
          <div className="mb-16 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              {/* Discovery Mode Buttons */}
              <div className="flex gap-4 p-4 glass-card-elevated rounded-3xl backdrop-blur-2xl border border-white/20 shadow-elevation">
                <Button
                  variant={discoveryMode === 'algorithm' ? 'hero' : 'ghost'}
                  size="lg"
                  onClick={() => setDiscoveryMode('algorithm')}
                  className="flex items-center gap-4 px-8 transition-all duration-500 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-sunrise flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-5 h-5 text-white group-hover:animate-pulse-soft" />
                  </div>
                  <span className="font-bold text-lg">Smart Match</span>
                </Button>
                <Button
                  variant={discoveryMode === 'location' ? 'elegant' : 'ghost'}
                  size="lg"
                  onClick={() => setDiscoveryMode('location')}
                  className="flex items-center gap-4 px-8 transition-all duration-500 group"
                  disabled={!userLocation}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-ocean flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Map className="w-5 h-5 text-white group-hover:animate-pulse-soft" />
                  </div>
                  <span className="font-bold text-lg">Nearby</span>
                </Button>
                <Button
                  variant={discoveryMode === 'random' ? 'premium' : 'ghost'}
                  size="lg"
                  onClick={() => setDiscoveryMode('random')}
                  className="flex items-center gap-4 px-8 transition-all duration-500 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-sunset flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-5 h-5 text-white group-hover:animate-pulse-soft" />
                  </div>
                  <span className="font-bold text-lg">Explore</span>
                </Button>
              </div>

              {/* View Mode Controls with Filter */}
              <div className="flex items-center gap-4">
                <div className="flex glass-card-elevated rounded-3xl p-3 backdrop-blur-2xl border border-white/20 shadow-elevation">
                  <Button
                    variant={viewMode === 'stack' ? 'premium' : 'ghost'}
                    size="lg"
                    onClick={() => setViewMode('stack')}
                    className="px-8 transition-all duration-500 group"
                  >
                    <Heart className="w-5 h-5 mr-3 group-hover:animate-pulse-soft" />
                    Stack
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'premium' : 'ghost'}
                    size="lg"
                    onClick={() => setViewMode('grid')}
                    className="px-8 transition-all duration-500 group"
                  >
                    <Grid className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    Grid
                  </Button>
                </div>
                
                <Button
                  variant={getActiveFilterCount() > 0 ? "hero" : "floating"}
                  size="icon-xl"
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "relative shadow-elevation hover:shadow-glow transition-all duration-500 group",
                    getActiveFilterCount() > 0 && "animate-pulse-soft"
                  )}
                >
                  <Filter className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
                  {getActiveFilterCount() > 0 && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-sunrise text-white text-sm font-bold rounded-full flex items-center justify-center shadow-elevation animate-bounce-gentle">
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
            <div className="flex justify-center items-center min-h-96">
              {hasMoreCards ? (
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
                  
                  {/* Compatibility Score */}
                  {currentCompatibility && (
                    <div className="absolute top-4 right-4 backdrop-blur-sm rounded-lg p-3 border" style={{backgroundColor: 'hsl(var(--background) / 0.9)'}}>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Compatibility</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {currentCompatibility.overall}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentCompatibility.reasons.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {/* Card counter */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                    <p className="text-muted-foreground mb-4">
                      {currentCardIndex + 1} of {filteredUsers.length}
                    </p>
                    <div className="flex gap-2">
                      {filteredUsers.slice(0, 10).map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            index <= currentCardIndex 
                              ? "bg-primary" 
                              : "bg-muted"
                          )}
                        />
                      ))}
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
                    <Button variant="outline" onClick={() => loadDiscoveryUsers()} className="flex items-center gap-2">
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
                return (
                  <div 
                    key={user.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <TravelCard
                      user={user}
                      variant="grid"
                      onLike={handleLike}
                      onPass={handlePass}
                      className="w-full"
                    />
                    {recommendation && (
                      <div className="mt-2 p-2 rounded-lg" style={{backgroundColor: 'hsl(var(--muted) / 0.5)'}}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Compatibility</span>
                          <span className="font-medium text-primary">
                            {recommendation.score.overall}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {recommendation.reasons.slice(0, 1).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Enhanced Quick Actions - Stack Mode Only */}
          {viewMode === 'stack' && hasMoreCards && (
            <div className="fixed bottom-32 md:bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-8 md:gap-12 z-50 animate-fade-up" style={{animationDelay: '0.8s'}}>
              <Button
                variant="floating"
                size="icon-2xl"
                onClick={() => handlePass(currentCard.id)}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full glass-card-elevated border-red-500/30 hover:border-red-500/60 hover:scale-125 transition-all duration-500 shadow-elevation group hover:shadow-glow"
              >
                <X className="w-10 h-10 md:w-12 md:h-12 text-red-500 group-hover:rotate-90 transition-transform duration-500" />
              </Button>

              <Button
                variant="floating"
                size="icon-xl"
                onClick={() => handleSuperLike(currentCard.id)}
                className="w-18 h-18 md:w-20 md:h-20 rounded-full glass-card-elevated bg-gradient-to-br from-sky-blue to-midnight-blue border-sky-blue/40 hover:scale-125 transition-all duration-500 shadow-elevation group hover:shadow-glow"
              >
                <Star className="w-8 h-8 md:w-9 md:h-9 text-white group-hover:animate-pulse-soft transition-all duration-300" fill="currentColor" />
              </Button>

              <Button
                variant="hero"
                size="icon-2xl"
                onClick={() => handleLike(currentCard.id)}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full glass-card-elevated bg-gradient-sunrise border-sunrise-coral/40 hover:scale-125 transition-all duration-500 shadow-elevation group hover:shadow-glow hover:animate-glow"
              >
                <Heart className="w-10 h-10 md:w-12 md:h-12 text-white group-hover:scale-110 group-hover:animate-pulse-soft transition-all duration-300" fill="currentColor" />
              </Button>
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
    </ChatLayout>
  );
}
