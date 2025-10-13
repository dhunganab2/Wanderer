import React, { useState } from 'react';
import { DesktopNavigation, Navigation as MobileNavigation } from '@/components/Navigation';
import { sampleUsers } from '@/data/sampleUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users } from 'lucide-react';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAVIIZtA7T_OxT0ar3SFxNWcjkge7qs6g4';

/**
 * Travel Map Page - Map with active travelers list
 */
export default function Map() {
  const [mapError, setMapError] = useState(false);
  const [currentLocation] = useState('New+York,NY');
  
  // Get first 8 users as active travelers
  const activeTravelers = sampleUsers.slice(0, 8);

  // Generate Google Maps embed URL
  const generateMapUrl = () => {
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${currentLocation}&zoom=10`;
  };

  const handleMapError = () => {
    setMapError(true);
  };

  if (mapError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">Google Maps failed to load</h2>
          <p className="text-muted-foreground mb-4">
            This could be due to API restrictions, billing issues, or network problems.
          </p>
          <button 
            onClick={() => setMapError(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Main Content - Split layout */}
      <div className="pt-20 md:pt-24 h-[calc(100vh-80px)] w-full flex flex-col lg:flex-row">
        {/* Map Section - Takes most of the space */}
        <div className="lg:w-[75%] h-full">
          <iframe
            src={generateMapUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps"
            onError={handleMapError}
          />
        </div>
        
        {/* Active Travelers Section - Wider sidebar */}
        <div className="lg:w-[25%] min-w-[320px] h-full overflow-y-auto">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Travelers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              {activeTravelers.map((traveler) => (
                <div key={traveler.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={traveler.avatar} alt={traveler.name} />
                    <AvatarFallback>{traveler.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{traveler.name}</h3>
                      {traveler.verified && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          ✓
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{traveler.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3" />
                      <span className="truncate">{traveler.travelDates}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {traveler.travelStyle.slice(0, 2).map((style) => (
                        <Badge key={style} variant="outline" className="text-xs px-1 py-0">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation className="md:hidden" />
    </div>
  );
}