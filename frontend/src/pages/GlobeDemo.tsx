import React, { useState } from 'react';
import ThreeGlobe from '@/components/ThreeGlobe';
import ThreeNormalMapExample from '@/components/ThreeNormalMapExample';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Plane, Globe, Layers } from 'lucide-react';
import { DesktopNavigation } from '@/components/Navigation';

/**
 * Globe Demo Page
 * 
 * Demonstrates the Three.js globe component with:
 * - Interactive 3D Earth with normal mapping
 * - Travel destination markers
 * - Click interactions
 * - Responsive design
 */

interface Destination {
  lat: number;
  lng: number;
  name: string;
  travelers: number;
  description: string;
}

const destinations: Destination[] = [
  { 
    lat: 40.7128, 
    lng: -74.0060, 
    name: 'New York', 
    travelers: 1247,
    description: 'The city that never sleeps'
  },
  { 
    lat: 51.5074, 
    lng: -0.1278, 
    name: 'London', 
    travelers: 892,
    description: 'Historic capital of England'
  },
  { 
    lat: 35.6762, 
    lng: 139.6503, 
    name: 'Tokyo', 
    travelers: 1156,
    description: 'Modern metropolis meets ancient tradition'
  },
  { 
    lat: -33.8688, 
    lng: 151.2093, 
    name: 'Sydney', 
    travelers: 634,
    description: 'Harbor city with iconic opera house'
  },
  { 
    lat: 48.8566, 
    lng: 2.3522, 
    name: 'Paris', 
    travelers: 1089,
    description: 'City of light and romance'
  }
];

export default function GlobeDemo() {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [globeSize, setGlobeSize] = useState({ width: 600, height: 600 });

  const handleLocationClick = (lat: number, lng: number) => {
    const dest = destinations.find(d => 
      Math.abs(d.lat - lat) < 0.1 && Math.abs(d.lng - lng) < 0.1
    );
    if (dest) {
      setSelectedDestination(dest);
    }
  };

  const handleDestinationSelect = (dest: Destination) => {
    setSelectedDestination(dest);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Header */}
      <div className="pt-16 md:pt-20 pb-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-display">
              3D Travel Globe
            </h1>
            <p className="text-muted-foreground">
              Explore the world in 3D and discover travel destinations with fellow wanderers
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{destinations.length} destinations</span>
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {destinations.reduce((sum, dest) => sum + dest.travelers, 0)} travelers
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 3D Globe */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="globe" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="globe" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Interactive Globe
                  </TabsTrigger>
                  <TabsTrigger value="normalmap" className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Normal Map Example
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="globe">
                  <ThreeGlobe
                    width={globeSize.width}
                    height={globeSize.height}
                    onLocationClick={handleLocationClick}
                    className="h-[600px]"
                  />
                </TabsContent>
                
                <TabsContent value="normalmap">
                  <ThreeNormalMapExample
                    width={globeSize.width}
                    height={globeSize.height}
                    className="h-[600px]"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Selected Destination */}
              {selectedDestination ? (
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      {selectedDestination.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {selectedDestination.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedDestination.travelers} travelers
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Plane className="w-4 h-4 mr-1" />
                        Find Travelers
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Click on a destination</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on any red marker on the globe to see destination details
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* All Destinations */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {destinations.map((dest) => (
                      <div
                        key={dest.name}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedDestination?.name === dest.name
                            ? "bg-primary/10 border-primary/20"
                            : "bg-muted/50 border-muted hover:bg-muted"
                        }`}
                        onClick={() => handleDestinationSelect(dest)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {dest.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dest.travelers} travelers
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {dest.lat > 0 ? 'N' : 'S'} {Math.abs(dest.lat).toFixed(1)}°
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Globe Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Globe Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>🖱️ Mouse Controls:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Drag to rotate the globe</li>
                      <li>Scroll to zoom in/out</li>
                      <li>Click markers to select destinations</li>
                    </ul>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p><strong>🎯 Features:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Realistic Earth texture</li>
                      <li>Normal mapping for surface detail</li>
                      <li>Interactive destination markers</li>
                      <li>Real-time traveler counts</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
