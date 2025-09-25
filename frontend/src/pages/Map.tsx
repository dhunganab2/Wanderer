import React, { useState, useEffect, useRef } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MapPin, Users, Filter, Search, Navigation, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DesktopNavigation, Navigation as MobileNavigation } from '@/components/Navigation';
import { sampleUsers } from '@/data/sampleUsers';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAWTPpdmE_vLEeDblFM1_ELxcdOIj68IuQ';

// Fallback map component for when Google Maps is not available
const FallbackMap: React.FC<{ users: User[]; onMarkerClick: (user: User) => void; selectedUser: User | null }> = ({ 
  users, 
  onMarkerClick, 
  selectedUser 
}) => (
  <div className="w-full h-full bg-muted/20 flex items-center justify-center relative">
    <div className="text-center p-8">
      <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Map Unavailable</h3>
      <p className="text-muted-foreground mb-4">
        Google Maps requires billing to be enabled. Using list view instead.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        {users.map((user) => (
          <Card 
            key={user.id} 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedUser?.id === user.id && "ring-2 ring-primary"
            )}
            onClick={() => onMarkerClick(user)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{user.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{user.nextDestination}</p>
                  {user.coordinates && (
                    <p className="text-xs text-muted-foreground">
                      📍 {user.coordinates.lat.toFixed(2)}, {user.coordinates.lng.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Map component
interface MapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  users: User[];
  onMarkerClick: (user: User) => void;
  selectedUser: User | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  center, 
  zoom, 
  users, 
  onMarkerClick, 
  selectedUser 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ weight: '2.00' }]
          },
          {
            featureType: 'all',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#9c9c9c' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'landscape',
            elementType: 'all',
            stylers: [{ color: '#f2f2f2' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry.fill',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'landscape.man_made',
            elementType: 'geometry.fill',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'poi',
            elementType: 'all',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'road',
            elementType: 'all',
            stylers: [{ saturation: -100 }, { lightness: 45 }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.fill',
            stylers: [{ color: '#eeeeee' }]
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#7b7b7b' }]
          },
          {
            featureType: 'road',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'all',
            stylers: [{ visibility: 'simplified' }]
          },
          {
            featureType: 'road.arterial',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'all',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'water',
            elementType: 'all',
            stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry.fill',
            stylers: [{ color: '#c8d7d4' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#070707' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#ffffff' }]
          }
        ]
      });
      setMap(newMap);
    }
  }, [ref, map, center, zoom]);

  // Update markers when users change
  useEffect(() => {
    if (map && users.length > 0) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      // Create new markers
      const newMarkers = users.map(user => {
        const marker = new google.maps.Marker({
          position: user.coordinates,
          map,
          title: `${user.name}, ${user.age}`,
          icon: {
            url: user.avatar,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          },
          animation: google.maps.Animation.DROP
        });

        // Add click listener
        marker.addListener('click', () => {
          onMarkerClick(user);
        });

        return marker;
      });

      setMarkers(newMarkers);
    }
  }, [map, users, onMarkerClick]);

  // Highlight selected user marker
  useEffect(() => {
    if (selectedUser && markers.length > 0) {
      markers.forEach(marker => {
        const user = users.find(u => u.coordinates.lat === marker.getPosition()?.lat());
        if (user?.id === selectedUser.id) {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => marker.setAnimation(null), 2000);
        }
      });
    }
  }, [selectedUser, markers, users]);

  return <div ref={ref} className="w-full h-full rounded-lg" />;
};

// Loading component
const LoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

// Error component
const ErrorComponent: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">Failed to load map</p>
      <p className="text-sm text-muted-foreground mt-2">Please check your internet connection</p>
    </div>
  </div>
);

// Main Map page component
export default function Map() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 37.7749,
    lng: -122.4194
  });
  const [mapZoom, setMapZoom] = useState(10);

  const { filters } = useAppStore();

  // State for users from database
  const [mapUsers, setMapUsers] = useState<User[]>([]);
  const [loadingMapUsers, setLoadingMapUsers] = useState(true);

  // Load users from database
  useEffect(() => {
    const loadMapUsers = async () => {
      try {
        setLoadingMapUsers(true);
        const users = await userService.getDiscoveryUsers('', []); // Get all users for map
        setMapUsers(users);
      } catch (error) {
        console.error('Error loading map users:', error);
        setMapUsers([]);
      } finally {
        setLoadingMapUsers(false);
      }
    };

    loadMapUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = mapUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.nextDestination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAge = user.age >= filters.ageRange[0] && user.age <= filters.ageRange[1];
    const matchesVerified = !filters.verified || user.verified;
    
    return matchesSearch && matchesAge && matchesVerified;
  });

  const handleMarkerClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleLike = (userId: string) => {
    console.log('Liked user:', userId);
    setSelectedUser(null);
  };

  const handlePass = (userId: string) => {
    console.log('Passed user:', userId);
    setSelectedUser(null);
  };

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />;
      case Status.FAILURE:
        // Check if it's a billing error and show fallback
        return <FallbackMap 
          users={filteredUsers} 
          onMarkerClick={handleMarkerClick} 
          selectedUser={selectedUser} 
        />;
      case Status.SUCCESS:
        return (
          <MapComponent
            center={mapCenter}
            zoom={mapZoom}
            users={filteredUsers}
            onMarkerClick={handleMarkerClick}
            selectedUser={selectedUser}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Header */}
      <div className="pt-16 md:pt-20 pb-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-display">
                Travel Map
              </h1>
              <p className="text-muted-foreground">
                Discover travelers near you and around the world
              </p>
            </div>
            
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search travelers, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{filteredUsers.length} travelers</span>
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Live locations</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4 md:px-6 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="h-[500px] md:h-[600px] overflow-hidden">
                <CardContent className="p-0 h-full">
                  <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Selected User Card */}
              {selectedUser ? (
                <Card className="animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedUser.name}, {selectedUser.age}
                        </h3>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <MapPin className="w-3 h-3 mr-1" />
                          {selectedUser.location}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {selectedUser.bio}
                    </p>
                    
                    <div className="flex gap-2 mb-4">
                      {selectedUser.travelStyle.slice(0, 2).map((style, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePass(selectedUser.id)}
                        className="flex-1"
                      >
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLike(selectedUser.id)}
                        className="flex-1 bg-gradient-sunrise"
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        Like
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Click on a marker</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on any traveler's location to see their profile
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Nearby Travelers */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Nearby Travelers</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredUsers.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedUser?.id === user.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedUser(user)}
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.name}, {user.age}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.location}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(Math.random() * 10)}km
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation className="md:hidden" />
    </div>
  );
}