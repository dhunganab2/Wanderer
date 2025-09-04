import type { User, TravelStyle } from '@/types';

const travelStyles: TravelStyle[] = [
  'backpacker', 'luxury', 'foodie', 'adventurer', 'cultural', 
  'photographer', 'solo', 'group', 'budget', 'nature', 'nightlife', 'wellness'
];

const destinations = [
  'Tokyo, Japan', 'Bali, Indonesia', 'Paris, France', 'New York, USA',
  'Barcelona, Spain', 'Thailand', 'Morocco', 'Iceland', 'New Zealand',
  'Peru', 'Vietnam', 'Greece', 'Portugal', 'Costa Rica', 'Nepal',
  'South Korea', 'Turkey', 'Egypt', 'Norway', 'Australia', 'India',
  'Mexico', 'Brazil', 'Jordan', 'Kenya', 'Philippines', 'Chile',
  'Sri Lanka', 'Croatia', 'Myanmar'
];

const interests = [
  'Photography', 'Food', 'Culture', 'Hiking', 'Adventure Sports',
  'Road Trips', 'Architecture', 'Nature', 'Music', 'Art', 'History',
  'Scuba Diving', 'Rock Climbing', 'Yoga', 'Meditation', 'Dancing',
  'Cooking', 'Languages', 'Wildlife', 'Beaches', 'Mountains', 'Cities'
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'London, UK',
  'Berlin, Germany', 'Barcelona, Spain', 'Toronto, Canada', 'Sydney, Australia',
  'Tokyo, Japan', 'Singapore', 'Amsterdam, Netherlands', 'Stockholm, Sweden',
  'Copenhagen, Denmark', 'Melbourne, Australia', 'Vancouver, Canada',
  'Paris, France', 'Rome, Italy', 'Dubai, UAE', 'Hong Kong', 'Seoul, South Korea'
];

const bios = [
  'Digital nomad seeking authentic local experiences and fellow adventurers to explore hidden gems with. Love street food markets and off-the-beaten-path destinations.',
  'Adventure seeker planning epic journeys around the world. Looking for travel buddies who love hiking, extreme sports, and chasing sunrises.',
  'Architecture enthusiast and culture lover. Planning photographic journeys through ancient cities and modern marvels.',
  'Food blogger exploring incredible culinary scenes. Seeking fellow foodies to discover hidden local gems and cooking classes together.',
  'Nature lover and wildlife photographer. Always ready for the next outdoor adventure and conservation project.',
  'Solo traveler who believes the best stories are written with others. Open to spontaneous adventures and deep conversations.',
  'Wellness enthusiast combining travel with mindfulness. Looking for companions interested in yoga retreats and spiritual journeys.',
  'History buff fascinated by ancient civilizations. Love museums, archaeological sites, and cultural immersion experiences.',
  'Beach lover and water sports enthusiast. Always planning the next tropical getaway or island-hopping adventure.',
  'Mountain climber and trekking enthusiast. Seeking adventure partners for challenging peaks and breathtaking landscapes.',
  'Art and music lover exploring creative scenes worldwide. Interested in festivals, galleries, and local artistic communities.',
  'Sustainable traveler passionate about eco-tourism and responsible travel. Looking for like-minded environmental advocates.',
  'Language learner using travel to practice and immerse in different cultures. Love connecting with locals and learning traditions.',
  'Luxury traveler who appreciates fine experiences while staying culturally curious and respectful of local customs.',
  'Budget backpacker proving you can see the world without breaking the bank. Always looking for travel hacks and local insights.'
];

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTravelDates(): string {
  const start = new Date();
  start.setDate(start.getDate() + Math.floor(Math.random() * 90) + 30); // 30-120 days from now
  const end = new Date(start);
  end.setDate(end.getDate() + Math.floor(Math.random() * 21) + 7); // 7-28 days trip
  
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
}

function generateCoordinates(location: string): { lat: number; lng: number } {
  // Simplified coordinate mapping - in real app, use geocoding API
  const coordinateMap: Record<string, { lat: number; lng: number }> = {
    'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
    'New York, NY': { lat: 40.7128, lng: -74.0060 },
    'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
    'London, UK': { lat: 51.5074, lng: -0.1278 },
    'Berlin, Germany': { lat: 52.5200, lng: 13.4050 },
    'Barcelona, Spain': { lat: 41.3851, lng: 2.1734 },
    'Toronto, Canada': { lat: 43.6532, lng: -79.3832 },
    'Sydney, Australia': { lat: -33.8688, lng: 151.2093 },
    'Tokyo, Japan': { lat: 35.6762, lng: 139.6503 },
    'Singapore': { lat: 1.3521, lng: 103.8198 },
  };
  
  return coordinateMap[location] || { lat: 0, lng: 0 };
}

export const sampleUsers: User[] = [
  {
    id: '1',
    name: 'Maya',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8c5?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
    coverImage: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73700?w=800&h=600&fit=crop&auto=format&q=80',
    location: 'San Francisco, CA',
    coordinates: generateCoordinates('San Francisco, CA'),
    travelStyle: ['backpacker', 'foodie', 'photographer'],
    nextDestination: 'Tokyo, Japan',
    travelDates: 'March 15-25, 2024',
    bio: bios[0],
    interests: ['Photography', 'Food', 'Culture'],
    mutualConnections: 3,
    photos: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73700?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop&auto=format&q=80'
    ],
    verified: true,
    joinDate: '2023-08-15',
    lastActive: '2024-01-15T10:30:00Z',
    preferences: {
      ageRange: [25, 35],
      maxDistance: 50,
      travelStyles: ['backpacker', 'foodie', 'cultural'],
      notifications: {
        matches: true,
        messages: true,
        travelUpdates: true,
        marketing: false
      },
      privacy: {
        showLocation: true,
        showAge: true,
        showLastActive: true,
        allowMessages: 'matches'
      }
    }
  },
  // Generate more users programmatically
  ...Array.from({ length: 29 }, (_, index) => {
    const id = (index + 2).toString();
    const nameOptions = [
      'Alex', 'Sofia', 'Jordan', 'Zara', 'Kai', 'Luna', 'Diego', 'Aria',
      'Phoenix', 'Nova', 'River', 'Sage', 'Atlas', 'Iris', 'Orion', 'Celeste',
      'Jasper', 'Willow', 'Felix', 'Aurora', 'Leo', 'Stella', 'Milo', 'Ruby',
      'Ezra', 'Hazel', 'Asher', 'Violet', 'Finn', 'Isla'
    ];
    
    const name = nameOptions[index % nameOptions.length];
    const age = Math.floor(Math.random() * 30) + 22; // 22-52 years old
    const location = getRandomItem(locations);
    const userTravelStyles = getRandomItems(travelStyles, Math.floor(Math.random() * 4) + 2);
    const userInterests = getRandomItems(interests, Math.floor(Math.random() * 5) + 3);
    const destination = getRandomItem(destinations);
    const bio = getRandomItem(bios);
    
    const avatarId = (index % 50) + 1;
    const coverId = (index % 100) + 1;
    
    return {
      id,
      name,
      age,
      avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${avatarId}.jpg`,
      coverImage: `https://picsum.photos/800/600?random=${coverId}`,
      location,
      coordinates: generateCoordinates(location),
      travelStyle: userTravelStyles,
      nextDestination: destination,
      travelDates: generateTravelDates(),
      bio,
      interests: userInterests,
      mutualConnections: Math.floor(Math.random() * 8),
      photos: [
        `https://picsum.photos/800/600?random=${coverId}`,
        `https://picsum.photos/800/600?random=${coverId + 100}`,
        `https://picsum.photos/800/600?random=${coverId + 200}`
      ],
      verified: Math.random() > 0.3, // 70% verified
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      preferences: {
        ageRange: [Math.max(18, age - 10), Math.min(65, age + 10)] as [number, number],
        maxDistance: Math.floor(Math.random() * 100) + 25,
        travelStyles: getRandomItems(travelStyles, Math.floor(Math.random() * 3) + 2),
        notifications: {
          matches: Math.random() > 0.2,
          messages: Math.random() > 0.1,
          travelUpdates: Math.random() > 0.3,
          marketing: Math.random() > 0.7
        },
        privacy: {
          showLocation: Math.random() > 0.2,
          showAge: Math.random() > 0.1,
          showLastActive: Math.random() > 0.4,
          allowMessages: getRandomItem(['everyone', 'matches', 'none'] as const)
        }
      }
    } as User;
  })
];

export const travelStyleOptions = [
  { id: 'backpacker', label: 'Backpacker', icon: '🎒', description: 'Budget-friendly, authentic experiences' },
  { id: 'luxury', label: 'Luxury Seeker', icon: '✨', description: 'Premium comfort and experiences' },
  { id: 'foodie', label: 'Foodie', icon: '🍜', description: 'Culinary adventures and local cuisine' },
  { id: 'adventurer', label: 'Adventurer', icon: '🏔️', description: 'Extreme sports and outdoor activities' },
  { id: 'cultural', label: 'Culture Explorer', icon: '🏛️', description: 'Museums, history, and local traditions' },
  { id: 'photographer', label: 'Photographer', icon: '📸', description: 'Capturing beautiful moments and landscapes' },
  { id: 'solo', label: 'Solo Traveler', icon: '🚶', description: 'Independent exploration and self-discovery' },
  { id: 'group', label: 'Group Traveler', icon: '👥', description: 'Social experiences with fellow travelers' },
  { id: 'budget', label: 'Budget Conscious', icon: '💰', description: 'Smart spending and value travel' },
  { id: 'nature', label: 'Nature Lover', icon: '🌿', description: 'Wildlife, parks, and natural wonders' },
  { id: 'nightlife', label: 'Nightlife Enthusiast', icon: '🌃', description: 'Bars, clubs, and evening entertainment' },
  { id: 'wellness', label: 'Wellness Traveler', icon: '🧘', description: 'Yoga, meditation, and health-focused trips' },
];
