import React, { useState } from 'react';
import { AlertCircle, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Google Maps API Key from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface SimpleGoogleMapProps {
  height?: string;
}

const SimpleGoogleMap: React.FC<SimpleGoogleMapProps> = ({
  height = '600px'
}) => {
  const [mapError, setMapError] = useState(false);
  const [currentLocation] = useState('New+York,NY');

  // Generate Google Maps embed URL
  const generateMapUrl = () => {
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${currentLocation}&zoom=10`;
  };

  const handleMapError = () => {
    setMapError(true);
  };

  const handleRetry = () => {
    setMapError(false);
  };

  if (mapError) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full flex items-center justify-center" style={{ height }}>
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Google Maps failed to load</p>
                    <p className="text-sm">
                      This could be due to API restrictions, billing issues, or network problems.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Troubleshooting Steps:
                </h3>
                <ul className="text-sm text-muted-foreground text-left space-y-2">
                  <li>• Check if your Google Maps API key is valid</li>
                  <li>• Ensure Maps Embed API is enabled in Google Cloud Console</li>
                  <li>• Verify billing is set up for your Google Cloud project</li>
                  <li>• Check API key restrictions (HTTP referrers/IP addresses)</li>
                  <li>• Make sure your domain is whitelisted if using referrer restrictions</li>
                </ul>
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRetry} variant="outline" size="sm">
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => window.open(`https://maps.google.com/?q=${currentLocation}`, '_blank')}
                    variant="default"
                    size="sm"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full" style={{ height }}>
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
      </CardContent>
    </Card>
  );
};

export default SimpleGoogleMap;
