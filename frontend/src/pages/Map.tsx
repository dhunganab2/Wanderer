import React, { useState } from 'react';
import { MapPin, Users, Search, Heart, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DesktopNavigation, Navigation as MobileNavigation } from '@/components/Navigation';
import LeafletMap from '@/components/LeafletMap';
import { sampleUsers } from '@/data/sampleUsers';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

/**
 * Travel Map Page - Shows travelers on an interactive Leaflet map
 * 
 * This page demonstrates how to use the LeafletMap component with real OpenStreetMap tiles
 */
export default function Map() {
  const { users } = useAppStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // NYC default
  const [mapZoom, setMapZoom] = useState(13);

  // Convert users to map markers
  const mapMarkers = users
    .filter(user => user.coordinates)
    .map(user => ({
      position: [user.coordinates!.lat, user.coordinates!.lng] as [number, number],
      popup: `${user.name}, ${user.age} • ${user.location}`,
      title: user.name
    }));

  // Add sample users if no real users with coordinates
  const sampleMarkers = sampleUsers.slice(0, 5).map(user => ({
    position: [40.7128 + (Math.random() - 0.5) * 0.1, -74.0060 + (Math.random() - 0.5) * 0.1] as [number, number],
    popup: `${user.name}, ${user.age} • ${user.location}`,
    title: user.name
  }));

  const allMarkers = mapMarkers.length > 0 ? mapMarkers : sampleMarkers;

  const handleMarkerClick = (marker: any) => {
    console.log('Marker clicked:', marker);
    // You can add logic here to show user details
  };

  const handleSearch = () => {
    // Simple search functionality
    const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filteredUsers.length > 0 && filteredUsers[0].coordinates) {
      setMapCenter([filteredUsers[0].coordinates.lat, filteredUsers[0].coordinates.lng]);
      setMapZoom(15);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Header */}
      <div className="pt-20 md:pt-24 pb-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-elevated backdrop-blur-xl border border-sunrise-coral/20 mb-6">
              <MapPin className="w-4 h-4 text-sunrise-coral" />
              <span className="text-sm font-semibold text-foreground">Interactive Travel Map</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-display">
              Discover Travelers
              <br />
              <span className="text-gradient-primary">Around the World</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore our interactive map to find fellow travelers in your area or discover new destinations.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <Input
                placeholder="Search by location or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="hero" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4 md:px-6 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <LeafletMap
                    center={mapCenter}
                    zoom={mapZoom}
                    height="600px"
                    markers={allMarkers}
                    onMarkerClick={handleMarkerClick}
                    className="rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Map Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Navigation className="w-6 h-6 text-sunrise-coral" />
                    <h3 className="text-lg font-semibold text-foreground">Map Features</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Real-time traveler locations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Interactive zoom and pan
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Click markers for details
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Mobile-friendly design
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Traveler Stats */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-sunrise-coral" />
                    <h3 className="text-lg font-semibold text-foreground">Active Travelers</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Online Now</span>
                      <span className="font-semibold text-foreground">{allMarkers.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">This Week</span>
                      <span className="font-semibold text-foreground">{allMarkers.length * 3}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Users</span>
                      <span className="font-semibold text-foreground">{users.length + sampleUsers.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setMapCenter([40.7128, -74.0060])}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Center on NYC
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setMapCenter([51.5074, -0.1278])}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Center on London
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setMapCenter([35.6762, 139.6503])}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Center on Tokyo
                    </Button>
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