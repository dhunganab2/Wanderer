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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { useAppStore } from '@/store/useAppStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { sampleUsers } from '@/data/sampleUsers';
import { cn } from '@/lib/utils';
import type { User, Match } from '@/types';

export default function Matches() {
  const { matches, swipeHistory, users, swipeUser, setUsers, addMatch } = useAppStore();
  const { authUser } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');

  // Load users if not already loaded
  useEffect(() => {
    if (users.length === 0) {
      // Import enhanced users and set them
      import('@/data/enhancedSampleData').then(({ enhancedUsers }) => {
        setUsers(enhancedUsers.slice(0, 20));
      });
    }
  }, [users.length, setUsers]);

  // Get actual matches from the store
  const mutualMatches = matches.filter(match => match.status === 'accepted');
  
  // Get users that were liked but not matched yet
  const likedUserIds = swipeHistory
    .filter(swipe => swipe.type === 'like' || swipe.type === 'superlike')
    .map(swipe => swipe.userId);

  // Use users from store if available, otherwise fallback to sample users
  const availableUsers = users.length > 0 ? users : sampleUsers;
  
  // Get matched user objects
  const matchedUserObjects = mutualMatches.map(match => {
    const userId = match.users.find(id => id !== authUser?.uid);
    return availableUsers.find(user => user.id === userId);
  }).filter(Boolean) as User[];
  
  // Get pending likes (liked but not matched)
  const matchedUserIds = mutualMatches.flatMap(match => match.users);
  const pendingLikes = availableUsers.filter(user => 
    likedUserIds.includes(user.id) && !matchedUserIds.includes(user.id)
  );

  // Debug logging
  console.log('Matches Debug:', {
    totalMatches: matches.length,
    mutualMatches: mutualMatches.length,
    matchedUserObjects: matchedUserObjects.length,
    likedUserIds: likedUserIds.length,
    pendingLikes: pendingLikes.length,
    availableUsers: availableUsers.length,
    authUser: authUser?.uid
  });

  const superLikedUserIds = swipeHistory
    .filter(swipe => swipe.type === 'superlike')
    .map(swipe => swipe.userId);

  const filteredMatches = matchedUserObjects.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nextDestination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = (userId: string) => {
    // In a real app, this would navigate to chat with that user
    console.log('Starting chat with user:', userId);
    // You could navigate to /messages with a specific user ID
  };

  // Add some test matches for demo purposes
  const addTestMatches = () => {
    const testSwipes = [
      { type: 'like' as const, userId: 'user_1', timestamp: new Date().toISOString() },
      { type: 'like' as const, userId: 'user_2', timestamp: new Date().toISOString() },
      { type: 'superlike' as const, userId: 'user_3', timestamp: new Date().toISOString() },
    ];
    
    testSwipes.forEach(swipe => {
      // Add to swipe history if not already present
      if (!swipeHistory.some(s => s.userId === swipe.userId)) {
        swipeUser(swipe);
      }
    });

    // Also add test matches directly
    const testMatches = [
      {
        id: `test_match_${Date.now()}`,
        users: [authUser?.uid || 'test_user', 'user_1'],
        matchedAt: new Date().toISOString(),
        status: 'accepted' as const,
        commonInterests: ['Travel', 'Adventure', 'Photography'],
        compatibilityScore: 85
      },
      {
        id: `test_match_${Date.now() + 1}`,
        users: [authUser?.uid || 'test_user', 'user_2'],
        matchedAt: new Date().toISOString(),
        status: 'accepted' as const,
        commonInterests: ['Culture', 'Food', 'Music'],
        compatibilityScore: 92
      }
    ];

    testMatches.forEach(match => {
      addMatch(match);
    });

    console.log('Added test matches:', testMatches);
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

  const MatchCard: React.FC<{ user: User; isSuperLike?: boolean; isPending?: boolean }> = ({ 
    user, 
    isSuperLike = false,
    isPending = false
  }) => {
    const matchTime = swipeHistory.find(swipe => swipe.userId === user.id)?.timestamp;

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
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("flex-1", isPending && "w-full")}
            >
              View Profile
            </Button>
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
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">
              Your Matches
            </h1>
            <p className="text-muted-foreground">
              Connect with travelers who liked you back
            </p>
          </div>

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
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Matches ({matchedUserObjects.length})
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
                    <Button variant="outline" onClick={addTestMatches} className="block mx-auto">
                      Add Test Matches (Demo)
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
              {pendingLikes.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pendingLikes.map((user) => (
                    <div 
                      key={user.id}
                      className="animate-fade-up"
                    >
                      <MatchCard 
                        user={user} 
                        isSuperLike={superLikedUserIds.includes(user.id)}
                        isPending={true}
                      />
                    </div>
                  ))}
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
          </Tabs>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
      
    </div>
  );
}
