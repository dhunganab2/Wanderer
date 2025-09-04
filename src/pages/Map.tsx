import React, { useState } from 'react';
import { 
  MapPin, 
  Filter, 
  Search, 
  Navigation as NavigationIcon,
  Users,
  Heart,
  MessageCircle,
  Calendar,
  Layers,
  Target,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { cn } from '@/lib/utils';
import { sampleUsers } from '@/data/sampleUsers';
import type { User } from '@/types';

// Mock map component since we don't have a real map library
const MapContainer: React.FC<{
  children: React.ReactNode;
  center: { lat: number; lng: number };
  zoom: number;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn("relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950", className)}>
      {/* Mock map background with grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Mock roads/paths */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <path
          d="M 0 200 Q 200 100 400 200 T 800 150"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-blue-400"
        />
        <path
          d="M 100 0 Q 300 200 500 400 T 900 600"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-green-400"
        />
      </svg>
      
      {children}
    </div>
  );
};

const UserMarker: React.FC<{
  user: User;
  position: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
}> = ({ user, position, isSelected, onClick }) => {
  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110",
        isSelected && "scale-125 z-20"
      )}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      onClick={onClick}
    >
      {/* Pulse animation for online users */}
      {Math.random() > 0.5 && (
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      )}
      
      {/* User avatar marker */}
      <div className={cn(
        "w-12 h-12 rounded-full border-3 border-white shadow-strong overflow-hidden",
        isSelected && "border-primary"
      )}>
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Location pin */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className={cn(
          "w-3 h-3 rotate-45 border border-white",
          isSelected ? "bg-primary" : "bg-muted"
        )} />
      </div>
    </div>
  );
};

export default function Map() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(10);

  // Filter users based on search
  const filteredUsers = sampleUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nextDestination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate mock positions for users (in a real app, these would come from coordinates)
  const userPositions = filteredUsers.map((user, index) => ({
    user,
    position: {
      x: 20 + (index % 5) * 15 + Math.random() * 10,
      y: 20 + Math.floor(index / 5) * 20 + Math.random() * 15
    }
  }));

  const handleUserMarkerClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleLikeUser = (userId: string) => {
    console.log('Liked user:', userId);
    // In a real app, this would send a like
  };

  const handleMessageUser = (userId: string) => {
    console.log('Message user:', userId);
    // In a real app, this would open chat
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      <div className="pt-20 pb-24 h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Travelers Near You
              </h1>
              <p className="text-muted-foreground">
                Discover {filteredUsers.length} travelers in your area
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Layers className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <NavigationIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search travelers or destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom}
            className="w-full h-full"
          >
            {/* User Markers */}
            {userPositions.map(({ user, position }) => (
              <UserMarker
                key={user.id}
                user={user}
                position={position}
                isSelected={selectedUser?.id === user.id}
                onClick={() => handleUserMarkerClick(user)}
              />
            ))}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-background/90 backdrop-blur-sm"
                onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-background/90 backdrop-blur-sm"
                onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-background/90 backdrop-blur-sm"
                onClick={() => setMapCenter({ lat: 37.7749, lng: -122.4194 })}
              >
                <Target className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground">Offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
          </MapContainer>

          {/* Selected User Card */}
          {selectedUser && (
            <Card className="absolute bottom-4 right-4 w-80 glass-card animate-scale-in">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {selectedUser.name}, {selectedUser.age}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                        className="text-muted-foreground"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {selectedUser.location}
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Calendar className="w-3 h-3" />
                        Next: {selectedUser.nextDestination}
                      </div>
                      {selectedUser.mutualConnections && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {selectedUser.mutualConnections} mutual connections
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-foreground mt-2 line-clamp-2">
                      {selectedUser.bio}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedUser.travelStyle.slice(0, 3).map((style) => (
                        <Badge key={style} variant="secondary" className="text-xs">
                          {style}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessageUser(selectedUser.id)}
                        className="flex-1"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => handleLikeUser(selectedUser.id)}
                        className="flex-1"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Like
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
    </div>
  );
}
