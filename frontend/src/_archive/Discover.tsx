import React, { useState, useMemo, useEffect } from 'react';
import { Heart, X, MapPin, Calendar, Filter, Grid, RotateCcw, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TravelCard } from '@/components/TravelCard';
import { SwipeableCard } from '@/components/SwipeableCard';
import { TravelCardSkeleton, TravelCardGridSkeleton, TravelCardStackSkeleton } from '@/components/TravelCardSkeleton';
import { FilterPanel } from '@/components/FilterPanel';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { useAppStore } from '@/store/useAppStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { userService, matchingService } from '@/services/firebaseService';
import { sampleUsers } from '@/data/sampleUsers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { User, FilterSettings } from '@/types';



export default function Discover() {
  const [viewMode, setViewMode] = useState<'stack' | 'grid'>('stack');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [discoveryUsers, setDiscoveryUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const { filters, swipeUser, swipeHistory } = useAppStore();
  const { user: currentUser, authUser } = useUserProfile();

  // Load discovery users from Firebase
  useEffect(() => {
    const loadDiscoveryUsers = async () => {
      if (!authUser) return;
      
      try {
        setLoadingUsers(true);
        
        // Get swiped user IDs to exclude them
        const swipedUserIds = swipeHistory.map(swipe => swipe.userId);
        
        // Get users from Firebase database
        const firebaseUsers = await userService.getDiscoveryUsers(authUser.uid, swipedUserIds);
        setDiscoveryUsers(firebaseUsers);
        
      } catch (error) {
        console.error('Error loading discovery users:', error);
        // Show error state instead of fallback data
        setDiscoveryUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadDiscoveryUsers();
  }, [authUser, swipeHistory]);

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
      
      // Check if it's a mutual match
      // The Firebase service will handle match detection
      const user = filteredUsers.find(u => u.id === userId);
      if (user && Math.random() > 0.4) { // Simulate match for demo
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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Main Content */}
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">
                Discover Travelers
              </h1>
              <p className="text-muted-foreground">
                {loadingUsers ? 'Loading travelers...' : isLoading ? 'Applying filters...' : `${filteredUsers.length} travelers found`}
                {getActiveFilterCount() > 0 && (
                  <span className="ml-2 text-primary">
                    • {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsFilterOpen(true)}
                className={cn(
                  getActiveFilterCount() > 0 && "border-primary text-primary"
                )}
              >
                <Filter className="w-5 h-5" />
              </Button>
              
              <div className="hidden sm:flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'stack' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('stack')}
                  className="px-4"
                >
                  Stack
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-4"
                >
                  <Grid className="w-4 h-4 mr-2" />
                  Grid
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
              {filteredUsers.map((user, index) => (
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
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions - Stack Mode Only */}
          {viewMode === 'stack' && hasMoreCards && (
            <div className="fixed bottom-32 md:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-8 md:gap-12 z-50">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => handlePass(currentUser.id)}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all shadow-strong"
              >
                <X className="w-8 h-8 md:w-10 md:h-10" />
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => handleSuperLike(currentUser.id)}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 bg-blue-500/90 text-white hover:bg-blue-600 hover:scale-110 transition-all shadow-strong"
              >
                <Star className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
              </Button>
              <Button
                variant="hero"
                size="icon-lg"
                onClick={() => handleLike(currentUser.id)}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full hover:scale-110 transition-all shadow-strong"
              >
                <Heart className="w-8 h-8 md:w-10 md:h-10" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Match Notification */}
      {showMatchNotification && matchedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
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
                  src={sampleUsers[0].avatar} 
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