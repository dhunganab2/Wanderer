import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Declare Leaflet types for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    title?: string;
  }>;
  onMarkerClick?: (marker: any) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [40.7128, -74.0060], // New York City default
  zoom = 13,
  className,
  height = '80vh',
  markers = [],
  onMarkerClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS dynamically
    const loadLeafletCSS = () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    };

    // Load Leaflet JS dynamically
    const loadLeafletJS = () => {
      return new Promise((resolve, reject) => {
        if (window.L) {
          resolve(window.L);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve(window.L);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initializeMap = async () => {
      try {
        // Load Leaflet resources
        loadLeafletCSS();
        await loadLeafletJS();

        if (!mapRef.current) {
          console.error('Map container not found');
          return;
        }

        // Initialize map
        const map = window.L.map(mapRef.current).setView(center, zoom);
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        // Add default marker if no custom markers provided
        if (markers.length === 0) {
          const defaultMarker = window.L.marker(center)
            .addTo(map)
            .bindPopup('Welcome to the Map!')
            .openPopup();
          
          if (onMarkerClick) {
            defaultMarker.on('click', () => onMarkerClick(defaultMarker));
          }
        } else {
          // Add custom markers
          markers.forEach((markerData) => {
            const marker = window.L.marker(markerData.position)
              .addTo(map)
              .bindPopup(markerData.popup || markerData.title || 'Marker');
            
            if (onMarkerClick) {
              marker.on('click', () => onMarkerClick(marker));
            }
          });
        }

        // Handle window resize for responsiveness
        const handleResize = () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }
        };

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

  }, [center, zoom, markers, onMarkerClick]);

  return (
    <div 
      ref={mapRef} 
      className={cn("w-full border border-gray-300 rounded-lg", className)}
      style={{ height }}
    />
  );
};

export default LeafletMap;
