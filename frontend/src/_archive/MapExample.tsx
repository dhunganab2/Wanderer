import React, { useState } from 'react';
import InteractiveMap, { MapMarker } from '@/components/InteractiveMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { DesktopNavigation } from '@/components/Navigation';

/**
 * Example page demonstrating how to use the InteractiveMap component
 * 
 * This page shows:
 * - How to add markers to the map
 * - How to handle marker clicks
 * - How to customize the map center and zoom
 * - How to add/remove markers dynamically
 */

// Example markers data
const EXAMPLE_MARKERS: MapMarker[] = [
  {
    lat: 40.7128,
    lng: -74.0060,
    title: "New York City",
    description: "The Big Apple - Central Park, Times Square, and more!"
  },
  {
    lat: 40.7589,
    lng: -73.9851,
    title: "Times Square",
    description: "The crossroads of the world"
  },
  {
    lat: 40.7829,
    lng: -73.9654,
    title: "Central Park",
    description: "843 acres of green space in Manhattan"
  },
  {
    lat: 40.6892,
    lng: -74.0445,
    title: "Statue of Liberty",
    description: "Symbol of freedom and democracy"
  }
];

export default function MapExample() {
  const [markers, setMarkers] = useState<MapMarker[]>(EXAMPLE_MARKERS);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Handle marker click
  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    console.log('Marker clicked:', marker);
  };

  // Add a new marker
  const addRandomMarker = () => {
    const newMarker: MapMarker = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Random location near NYC
      lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      title: `Random Location ${markers.length + 1}`,
      description: `This is marker number ${markers.length + 1}`
    };
    setMarkers([...markers, newMarker]);
  };

  // Remove a marker
  const removeMarker = (index: number) => {
    setMarkers(markers.filter((_, i) => i !== index));
    if (selectedMarker === markers[index]) {
      setSelectedMarker(null);
    }
  };

  // Clear all markers
  const clearAllMarkers = () => {
    setMarkers([]);
    setSelectedMarker(null);
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
              Interactive Map Example
            </h1>
            <p className="text-muted-foreground">
              Demonstrating the InteractiveMap component with Google Maps integration
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Button onClick={addRandomMarker} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Random Marker
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAllMarkers}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {markers.length} marker{markers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <InteractiveMap
                center={{ lat: 40.7128, lng: -74.0060 }} // New York City
                zoom={12}
                markers={markers}
                onMarkerClick={handleMarkerClick}
                height="h-[600px]"
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Selected Marker Info */}
              {selectedMarker ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Selected Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedMarker.title}
                    </h3>
                    {selectedMarker.description && (
                      <p className="text-muted-foreground mb-4">
                        {selectedMarker.description}
                      </p>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <p>Latitude: {selectedMarker.lat.toFixed(6)}</p>
                      <p>Longitude: {selectedMarker.lng.toFixed(6)}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Click on a marker</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on any marker on the map to see its details
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* All Markers List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Markers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {markers.map((marker, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selectedMarker === marker
                            ? "bg-primary/10 border-primary/20"
                            : "bg-muted/50 border-muted"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {marker.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMarker(marker)}
                            className="h-8 w-8 p-0"
                          >
                            <MapPin className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMarker(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {markers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No markers yet</p>
                        <p className="text-xs">Click "Add Random Marker" to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Instructions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p><strong>• Click markers</strong> to see details</p>
                    <p><strong>• Drag the map</strong> to explore</p>
                    <p><strong>• Use zoom controls</strong> to zoom in/out</p>
                    <p><strong>• Add markers</strong> with the button above</p>
                    <p><strong>• Remove markers</strong> with the trash icon</p>
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
