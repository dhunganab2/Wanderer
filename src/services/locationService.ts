import type { User } from '@/types';

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

export interface LocationFilter {
  center: LocationData;
  radius: number; // in kilometers
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate bounding box for a location and radius
export function calculateBoundingBox(center: LocationData, radiusKm: number) {
  const lat = center.lat;
  const lng = center.lng;
  
  // Convert radius from km to degrees
  const latDelta = radiusKm / 111.0; // 1 degree latitude ≈ 111 km
  const lngDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));
  
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta
  };
}

// Check if a location is within a radius of another location
export function isWithinRadius(
  location1: LocationData, 
  location2: LocationData, 
  radiusKm: number
): boolean {
  const distance = calculateDistance(location1, location2);
  return distance <= radiusKm;
}

// Filter users by location
export function filterUsersByLocation(
  users: User[], 
  center: LocationData, 
  radiusKm: number
): User[] {
  return users.filter(user => {
    if (!user.coordinates) return false;
    return isWithinRadius(center, user.coordinates, radiusKm);
  });
}

// Get user's current location (browser geolocation)
export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

// Geocode an address to coordinates (mock implementation)
export async function geocodeAddress(address: string): Promise<LocationData | null> {
  // In a real app, use Google Maps Geocoding API or similar
  // For now, return mock data based on common cities
  const mockGeocoding: Record<string, LocationData> = {
    'san francisco': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
    'new york': { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
    'london': { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK' },
    'tokyo': { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
    'paris': { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
    'berlin': { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
    'barcelona': { lat: 41.3851, lng: 2.1734, city: 'Barcelona', country: 'Spain' },
    'sydney': { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia' },
    'toronto': { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada' },
    'singapore': { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore' }
  };

  const normalizedAddress = address.toLowerCase().trim();
  return mockGeocoding[normalizedAddress] || null;
}

// Reverse geocode coordinates to address (mock implementation)
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // In a real app, use Google Maps Reverse Geocoding API
  // For now, return mock data
  const mockAddresses = [
    'Downtown San Francisco, CA, USA',
    'Manhattan, New York, NY, USA',
    'Central London, UK',
    'Shibuya, Tokyo, Japan',
    'Champs-Élysées, Paris, France',
    'Mitte, Berlin, Germany',
    'Eixample, Barcelona, Spain',
    'CBD, Sydney, Australia',
    'Downtown Toronto, ON, Canada',
    'Marina Bay, Singapore'
  ];

  // Return a random address for demo purposes
  return mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
}

// Get nearby cities within a radius
export function getNearbyCities(center: LocationData, radiusKm: number): string[] {
  const majorCities = [
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
    { name: 'Sacramento', lat: 38.5816, lng: -121.4944 },
    { name: 'Fresno', lat: 36.7378, lng: -119.7871 },
    { name: 'Oakland', lat: 37.8044, lng: -122.2711 },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863 },
    { name: 'Berkeley', lat: 37.8715, lng: -122.2730 },
    { name: 'Palo Alto', lat: 37.4419, lng: -122.1430 },
    { name: 'Santa Clara', lat: 37.3541, lng: -121.9552 }
  ];

  return majorCities
    .filter(city => isWithinRadius(center, city, radiusKm))
    .map(city => city.name);
}

// Calculate travel time between two locations (mock implementation)
export function calculateTravelTime(
  from: LocationData, 
  to: LocationData, 
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): number {
  const distance = calculateDistance(from, to);
  
  // Mock travel times based on distance and mode
  const speeds = {
    driving: 50, // km/h average
    walking: 5,  // km/h average
    transit: 25  // km/h average
  };
  
  const speed = speeds[mode];
  const timeHours = distance / speed;
  
  return Math.round(timeHours * 60); // Return minutes
}

// Get location-based recommendations
export function getLocationRecommendations(
  user: User, 
  allUsers: User[], 
  maxDistance: number = 50
): User[] {
  if (!user.coordinates) return [];
  
  const nearbyUsers = filterUsersByLocation(allUsers, user.coordinates, maxDistance);
  
  // Sort by distance
  return nearbyUsers.sort((a, b) => {
    if (!a.coordinates || !b.coordinates) return 0;
    const distanceA = calculateDistance(user.coordinates, a.coordinates);
    const distanceB = calculateDistance(user.coordinates, b.coordinates);
    return distanceA - distanceB;
  });
}

// Check if two users are in the same city
export function areInSameCity(user1: User, user2: User): boolean {
  if (!user1.coordinates || !user2.coordinates) return false;
  
  const distance = calculateDistance(user1.coordinates, user2.coordinates);
  return distance <= 25; // Within 25km is considered same city
}

// Get location-based match score boost
export function getLocationScoreBoost(user1: User, user2: User): number {
  if (!user1.coordinates || !user2.coordinates) return 0;
  
  const distance = calculateDistance(user1.coordinates, user2.coordinates);
  
  if (distance <= 10) return 20;  // Same city
  if (distance <= 25) return 15;  // Nearby
  if (distance <= 50) return 10;  // Regional
  if (distance <= 100) return 5;  // Within state/province
  
  return 0; // Too far
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

// Format travel time for display
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

// Get timezone offset for a location
export function getTimezoneOffset(lat: number, lng: number): number {
  // Mock implementation - in real app, use timezone API
  const mockOffsets: Record<string, number> = {
    'usa_west': -8,   // PST
    'usa_central': -6, // CST
    'usa_east': -5,   // EST
    'uk': 0,          // GMT
    'europe': 1,      // CET
    'japan': 9,       // JST
    'australia_east': 10, // AEST
    'australia_west': 8   // AWST
  };
  
  // Simple timezone detection based on coordinates
  if (lng < -120) return mockOffsets.usa_west;
  if (lng < -90) return mockOffsets.usa_central;
  if (lng < -60) return mockOffsets.usa_east;
  if (lng < 20) return mockOffsets.uk;
  if (lng < 50) return mockOffsets.europe;
  if (lng > 120) return mockOffsets.japan;
  if (lng > 140) return mockOffsets.australia_east;
  
  return 0; // Default to GMT
}
