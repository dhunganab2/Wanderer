import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Star,
  Filter,
  Search,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMatchingData } from '@/hooks/useMatchingData';
import { sampleUsers } from '@/data/sampleUsers';
import { userService, matchingService } from '@/services/firebaseService';
import { cn } from '@/lib/utils';
import type { User, Match } from '@/types';

export default function Matches() {
  const { users, setUsers } = useAppStore();
  const { authUser } = useUserProfile();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [matchSuccess, setMatchSuccess] = useState<string | null>(null);
  const [likingBack, setLikingBack] = useState<string | null>(null);

  // Use the new matching data hook with caching and deduplication
  const {
    matches,
    likesReceived,
    userLikes: likes,
    loading,
    refresh: refreshMatchingData,
    invalidateCache,
  } = useMatchingData(authUser?.uid || null);

  // Load users from database
  useEffect(() => {
    const loadUsers = async () => {
      if (!authUser) {
        console.log('No auth user, skipping users load');
        return;
      }

      try {
        console.log('🔄 Loading users for user:', authUser.uid);
        const dbUsers = await userService.getDiscoveryUsers('', []);
        console.log('✅ Loaded users:', dbUsers.length);
        setUsers(dbUsers);
      } catch (error) {
        console.error('❌ Error loading users:', error);
        setUsers([]);
      }
    };

    loadUsers();
  }, [authUser, setUsers]);

  // Get actual mutual matches from database (only show these in Matches tab)
  const mutualMatches = matches.filter(match => match.status === 'accepted');
  
  // Get users that were liked but not matched yet (show these in Likes Sent tab)
  const likedUserIds = likes.map(like => like.swipedUserId);

  // Use users from store
  const availableUsers = users;
  
  // Get matched user objects (only real mutual matches)
  const matchedUserObjects = mutualMatches.map(match => {
    const userId = match.users.find(id => id !== authUser?.uid);
    return availableUsers.find(user => user.id === userId);
  }).filter(Boolean) as User[];
  
  // Get pending likes (liked but not matched) - these go to "Likes Sent" tab
  const matchedUserIds = mutualMatches.flatMap(match => match.users);
  const pendingLikes = availableUsers.filter(user => {
    const isLiked = likedUserIds.includes(user.id);
    const isMatched = matchedUserIds.includes(user.id);
    console.log(`User ${user.name}: liked=${isLiked}, matched=${isMatched}`);
    return isLiked && !isMatched; // Only show if liked but not matched
  });

  // Debug logging
  console.log('🔍 Matches Debug:', {
    totalMatches: matches.length,
    mutualMatches: mutualMatches.length,
    matchedUserObjects: matchedUserObjects.length,
    likedUserIds: likedUserIds.length,
    pendingLikes: pendingLikes.length,
    availableUsers: availableUsers.length,
    authUser: authUser?.uid
  });
  
  console.log('🔍 Raw data:', {
    'matches': matches.map(m => ({ id: m.id, users: m.users, status: m.status })),
    'likes': likes.map(l => ({ swipedUserId: l.swipedUserId, type: l.type })),
    'likedUserIds': likedUserIds,
    'matchedUserIds': matchedUserIds
  });

  console.log('🔍 Detailed analysis:');
  console.log('📊 Total likes from DB:', likes.length);
  console.log('📊 Total matches from DB:', matches.length);
  console.log('📊 Mutual matches (status=accepted):', mutualMatches.length);
  console.log('📊 Users in Matches tab:', matchedUserObjects.length);
  console.log('📊 Users in Likes Sent tab:', pendingLikes.length);
  
  // Check if there are any local store matches interfering
  const localStoreMatches = useAppStore.getState().matches;
  if (localStoreMatches && localStoreMatches.length > 0) {
    console.warn('⚠️ Found local store matches that should be cleared:', localStoreMatches.length);
  }

  const superLikedUserIds = likes
    .filter(like => like.type === 'superlike')
    .map(like => like.swipedUserId);

  const filteredMatches = matchedUserObjects.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nextDestination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = (userId: string) => {
    console.log('Starting chat with user:', userId);
    
    // Find the user to get their details
    const user = availableUsers.find(u => u.id === userId);
    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    // Navigate to messages with user info for starting conversation
    navigate('/messages', { 
      state: { 
        startConversationWith: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      }
    });
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Handle Like Back - when you like someone who already liked you
  const handleLikeBack = async (userId: string) => {
    if (!authUser || likingBack === userId) return;

    try {
      setLikingBack(userId);
      console.log('💖 Liking back user:', userId);

      // Record the like AND check for match using backend API
      const result = await matchingService.recordSwipeWithBackend({
        type: 'like',
        userId: authUser.uid,
        swipedUserId: userId
      });

      console.log('Backend swipe result:', result);

      if (result.match) {
        console.log('🎉 IT\'S A MATCH! Match ID:', result.matchId);
      }

      // Invalidate cache and refresh data from backend
      console.log('🔄 Refreshing data after like back...');
      invalidateCache(); // Clear all caches to force fresh data
      await refreshMatchingData(); // Fetch fresh data

      if (result.match) {
        console.log('🎉 Match created! Showing success message');
        // Show success message
        const matchedUser = likesReceived.find(like => like.user.id === userId)?.user;
        if (matchedUser) {
          setMatchSuccess(`🎉 It's a match with ${matchedUser.name}!`);
          // Clear success message after 3 seconds
          setTimeout(() => setMatchSuccess(null), 3000);
        }
      }

    } catch (error) {
      console.error('Error liking back user:', error);
      // Still refresh data even if there was an error
      try {
        invalidateCache();
        await refreshMatchingData();
      } catch (refreshError) {
        console.error('Error refreshing data after error:', refreshError);
      }
    } finally {
      setLikingBack(null);
    }
  };

  // Refresh data from database
  const refreshData = async () => {
    if (!authUser) return;
    
    try {
      console.log('🔄 Refreshing all data from backend...');
      
      // Invalidate cache and refresh
      invalidateCache();
      await refreshMatchingData();

      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return `${Math.floor(diffInHours / 168)}w ago`;
    }
  };

  const MatchCard: React.FC<{ user: User; isSuperLike?: boolean; isPending?: boolean; likeData?: any }> = ({ 
    user, 
    isSuperLike = false,
    isPending = false,
    likeData
  }) => {
    const matchTime = likeData?.timestamp || new Date().toISOString();

    const handleUndoLike = async () => {
      if (!authUser) return;
      try {
        await matchingService.unlikeUser(authUser.uid, user.id);
        // Optimistically update local state
        setLikes(prev => prev.filter(l => l.swipedUserId !== user.id));
        // Optionally refresh from server
        const refreshedLikes = await matchingService.getUserLikes(authUser.uid);
        setLikes(refreshedLikes);
      } catch (e) {
        console.error('Failed to unlike user:', e);
      }
    };

    return (
      <Card className="overflow-hidden hover:shadow-medium transition-all duration-300 hover-lift">
        <div className="relative">
          <img 
            src={user.coverImage || user.avatar} 
            alt={user.name}
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Match indicators */}
          <div className="absolute top-2 left-2 flex gap-2">
            {isSuperLike && (
              <Badge variant="secondary" className="bg-blue-500/90 text-white border-0">
                <Star className="w-3 h-3 mr-1" fill="currentColor" />
                Super Like
              </Badge>
            )}
            {isPending && (
              <Badge variant="secondary" className="bg-orange-500/90 text-white border-0">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
            {!isPending && (
              <Badge variant="secondary" className="bg-green-500/90 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Match!
              </Badge>
            )}
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-6 left-4">
            <Avatar className="w-12 h-12 border-3 border-background">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-8 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                {user.name}, {user.age}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <MapPin className="w-3 h-3" />
                {user.location}
              </div>
              {matchTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="w-3 h-3" />
                  Matched {formatTimeAgo(matchTime)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-1 text-sm text-primary">
              <Calendar className="w-3 h-3" />
              Next: {user.nextDestination}
            </div>
          </div>

          <p className="text-sm text-foreground line-clamp-2 mb-4">
            {user.bio}
          </p>

          <div className="flex gap-2">
            {!isPending && (
              <Button 
                variant="hero" 
                size="sm" 
                className="flex-1"
                onClick={() => handleStartChat(user.id)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            )}
            {isPending ? (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleUndoLike}
                >
                  Undo Like
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewProfile(user.id)}
                >
                  View Profile
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("flex-1", isPending && "w-full")}
                onClick={() => handleViewProfile(user.id)}
              >
                View Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">
                Your Matches
              </h1>
              <p className="text-muted-foreground">
                Connect with travelers who liked you back
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('🔄 Force clearing all caches and refreshing...');
                  // Clear any potential caches
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => {
                        caches.delete(name);
                      });
                    });
                  }
                  // Force refresh
                  window.location.reload();
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Force Refresh
              </Button>
            </div>
          </div>

          {/* Success Message */}
          {matchSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-600 font-medium text-center">{matchSuccess}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="matches" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Matches ({matchedUserObjects.length})
              </TabsTrigger>
              <TabsTrigger value="received" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Likes Received ({likesReceived.filter(like => like.user).length})
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Likes Sent ({pendingLikes.length})
              </TabsTrigger>
            </TabsList>

            {/* Mutual Matches */}
            <TabsContent value="matches">
              {filteredMatches.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMatches.map((user) => (
                    <div 
                      key={user.id}
                      className="animate-fade-up"
                    >
                      <MatchCard 
                        user={user} 
                        isSuperLike={superLikedUserIds.includes(user.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : mutualMatches.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-gradient-sunrise/10 flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4 font-display">
                    No matches yet
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Start swiping on the Discover page to find travelers who share your interests and destinations.
                  </p>
                  <div className="space-y-3">
                    <Button variant="hero" asChild>
                      <a href="/discover">Start Discovering</a>
                    </Button>
                    <Button variant="outline" onClick={refreshData} className="block mx-auto">
                      Refresh Data
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No matches found for "{searchQuery}"</p>
                </div>
              )}
            </TabsContent>

            {/* Pending Likes */}
            <TabsContent value="likes">
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your likes...</p>
                </div>
              ) : pendingLikes.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pendingLikes.map((user) => {
                    const likeData = likes.find(like => like.swipedUserId === user.id);
                    return (
                      <div 
                        key={user.id}
                        className="animate-fade-up"
                      >
                        <MatchCard 
                          user={user} 
                          isSuperLike={superLikedUserIds.includes(user.id)}
                          isPending={true}
                          likeData={likeData}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-gradient-sunrise/10 flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4 font-display">
                    No pending likes
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Like travelers on the Discover page and they'll appear here while you wait for them to like you back.
                  </p>
                  <Button variant="hero" asChild>
                    <a href="/discover">Start Swiping</a>
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Likes Received - People who liked you */}
            <TabsContent value="received">
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading likes received...</p>
                </div>
              ) : likesReceived.filter(like => like.user).length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {likesReceived.filter(like => like.user).map((like) => (
                    <Card key={like.id} className="overflow-hidden hover:shadow-medium transition-all duration-300 hover-lift">
                      <div className="relative">
                        <img
                          src={like.user.avatar}
                          alt={like.user.name}
                          className="w-full h-64 object-cover"
                        />
                        {like.type === 'superlike' && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Super Like
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground font-display">{like.user.name}, {like.user.age}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            {like.user.location}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Next: {like.user.nextDestination}</span>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={() => handleLikeBack(like.user.id)}
                            disabled={likingBack === like.user.id}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white disabled:opacity-50"
                          >
                            <Heart className="w-4 h-4 mr-2 fill-current" />
                            {likingBack === like.user.id ? 'Liking...' : 'Like Back'}
                          </Button>
                          <Button
                            onClick={() => handleViewProfile(like.user.id)}
                            variant="outline"
                            className="w-full"
                          >
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-gradient-sunrise/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4 font-display">
                    No likes received yet
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Keep swiping and engaging! When someone likes you, they'll appear here.
                  </p>
                  <Button variant="hero" asChild>
                    <a href="/discover">Start Discovering</a>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
      
    </div>
  );
}
