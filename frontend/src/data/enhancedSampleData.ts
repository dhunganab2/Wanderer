import type { User, Match, Message, Conversation, TravelPlan, BucketListItem, Story } from '@/types';

// Enhanced dummy data for testing algorithms and features

// Extended travel styles with more variety
export const extendedTravelStyles = [
  'backpacker', 'luxury', 'foodie', 'adventurer', 'cultural', 'photographer',
  'solo', 'group', 'budget', 'nature', 'nightlife', 'wellness', 'business',
  'family', 'romantic', 'spiritual', 'volunteer', 'sports', 'art', 'music',
  'history', 'architecture', 'beach', 'mountain', 'city', 'rural'
];

// More diverse locations with coordinates
export const locationsWithCoords = [
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, country: 'USA' },
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060, country: 'USA' },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, country: 'USA' },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278, country: 'UK' },
  { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050, country: 'Germany' },
  { name: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734, country: 'Spain' },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, country: 'Japan' },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, country: 'Australia' },
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522, country: 'France' },
  { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964, country: 'Italy' },
  { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  { name: 'Stockholm, Sweden', lat: 59.3293, lng: 18.0686, country: 'Sweden' },
  { name: 'Copenhagen, Denmark', lat: 55.6761, lng: 12.5683, country: 'Denmark' },
  { name: 'Vienna, Austria', lat: 48.2082, lng: 16.3738, country: 'Austria' },
  { name: 'Prague, Czech Republic', lat: 50.0755, lng: 14.4378, country: 'Czech Republic' },
  { name: 'Budapest, Hungary', lat: 47.4979, lng: 19.0402, country: 'Hungary' },
  { name: 'Warsaw, Poland', lat: 52.2297, lng: 21.0122, country: 'Poland' },
  { name: 'Moscow, Russia', lat: 55.7558, lng: 37.6176, country: 'Russia' },
  { name: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, country: 'UAE' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
  { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780, country: 'South Korea' },
  { name: 'Bangkok, Thailand', lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  { name: 'Ho Chi Minh City, Vietnam', lat: 10.8231, lng: 106.6297, country: 'Vietnam' },
  { name: 'Manila, Philippines', lat: 14.5995, lng: 120.9842, country: 'Philippines' },
  { name: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456, country: 'Indonesia' },
  { name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lng: 101.6869, country: 'Malaysia' },
  { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777, country: 'India' },
  { name: 'Delhi, India', lat: 28.7041, lng: 77.1025, country: 'India' },
  { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, country: 'Egypt' },
  { name: 'Cape Town, South Africa', lat: -33.9249, lng: 18.4241, country: 'South Africa' },
  { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219, country: 'Kenya' },
  { name: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
  { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333, country: 'Brazil' },
  { name: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729, country: 'Brazil' },
  { name: 'Buenos Aires, Argentina', lat: -34.6118, lng: -58.3960, country: 'Argentina' },
  { name: 'Santiago, Chile', lat: -33.4489, lng: -70.6693, country: 'Chile' },
  { name: 'Lima, Peru', lat: -12.0464, lng: -77.0428, country: 'Peru' },
  { name: 'Bogotá, Colombia', lat: 4.7110, lng: -74.0721, country: 'Colombia' },
  { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332, country: 'Mexico' },
  { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832, country: 'Canada' },
  { name: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207, country: 'Canada' },
  { name: 'Montreal, Canada', lat: 45.5017, lng: -73.5673, country: 'Canada' }
];

// Popular destinations with travel seasons
export const destinationsWithSeasons = [
  { name: 'Tokyo, Japan', bestSeason: 'spring', lat: 35.6762, lng: 139.6503 },
  { name: 'Bali, Indonesia', bestSeason: 'dry', lat: -8.3405, lng: 115.0920 },
  { name: 'Paris, France', bestSeason: 'spring', lat: 48.8566, lng: 2.3522 },
  { name: 'New York, USA', bestSeason: 'fall', lat: 40.7128, lng: -74.0060 },
  { name: 'Barcelona, Spain', bestSeason: 'summer', lat: 41.3851, lng: 2.1734 },
  { name: 'Thailand', bestSeason: 'dry', lat: 15.8700, lng: 100.9925 },
  { name: 'Morocco', bestSeason: 'spring', lat: 31.6295, lng: -7.9811 },
  { name: 'Iceland', bestSeason: 'summer', lat: 64.9631, lng: -19.0208 },
  { name: 'New Zealand', bestSeason: 'summer', lat: -40.9006, lng: 174.8860 },
  { name: 'Peru', bestSeason: 'dry', lat: -9.1900, lng: -75.0152 },
  { name: 'Vietnam', bestSeason: 'dry', lat: 14.0583, lng: 108.2772 },
  { name: 'Greece', bestSeason: 'summer', lat: 39.0742, lng: 21.8243 },
  { name: 'Portugal', bestSeason: 'summer', lat: 39.3999, lng: -8.2245 },
  { name: 'Costa Rica', bestSeason: 'dry', lat: 9.7489, lng: -83.7534 },
  { name: 'Nepal', bestSeason: 'spring', lat: 28.3949, lng: 84.1240 },
  { name: 'South Korea', bestSeason: 'spring', lat: 35.9078, lng: 127.7669 },
  { name: 'Turkey', bestSeason: 'spring', lat: 38.9637, lng: 35.2433 },
  { name: 'Egypt', bestSeason: 'winter', lat: 26.0975, lng: 30.0444 },
  { name: 'Norway', bestSeason: 'summer', lat: 60.4720, lng: 8.4689 },
  { name: 'Australia', bestSeason: 'spring', lat: -25.2744, lng: 133.7751 },
  { name: 'India', bestSeason: 'winter', lat: 20.5937, lng: 78.9629 },
  { name: 'Mexico', bestSeason: 'winter', lat: 23.6345, lng: -102.5528 },
  { name: 'Brazil', bestSeason: 'winter', lat: -14.2350, lng: -51.9253 },
  { name: 'Jordan', bestSeason: 'spring', lat: 30.5852, lng: 36.2384 },
  { name: 'Kenya', bestSeason: 'dry', lat: -0.0236, lng: 37.9062 },
  { name: 'Philippines', bestSeason: 'dry', lat: 12.8797, lng: 121.7740 },
  { name: 'Chile', bestSeason: 'summer', lat: -35.6751, lng: -71.5430 },
  { name: 'Sri Lanka', bestSeason: 'dry', lat: 7.8731, lng: 80.7718 },
  { name: 'Croatia', bestSeason: 'summer', lat: 45.1000, lng: 15.2000 },
  { name: 'Myanmar', bestSeason: 'dry', lat: 21.9162, lng: 95.9560 }
];

// Enhanced interests with categories
export const interestCategories = {
  adventure: ['Hiking', 'Rock Climbing', 'Scuba Diving', 'Skydiving', 'Bungee Jumping', 'Mountain Biking', 'Surfing', 'Skiing', 'Snowboarding', 'Paragliding'],
  culture: ['Museums', 'Art Galleries', 'Historical Sites', 'Local Festivals', 'Traditional Music', 'Dance', 'Theater', 'Literature', 'Languages', 'Archaeology'],
  food: ['Street Food', 'Fine Dining', 'Cooking Classes', 'Wine Tasting', 'Local Markets', 'Food Tours', 'Breweries', 'Coffee Culture', 'Spice Markets', 'Farm to Table'],
  nature: ['Wildlife Watching', 'Bird Watching', 'National Parks', 'Beaches', 'Mountains', 'Forests', 'Deserts', 'Lakes', 'Rivers', 'Volcanoes'],
  photography: ['Landscape Photography', 'Street Photography', 'Portrait Photography', 'Wildlife Photography', 'Astrophotography', 'Travel Photography', 'Documentary', 'Aerial Photography', 'Macro Photography', 'Night Photography'],
  wellness: ['Yoga', 'Meditation', 'Spa Retreats', 'Hot Springs', 'Massage', 'Acupuncture', 'Ayurveda', 'Detox', 'Mindfulness', 'Spiritual Retreats'],
  social: ['Nightlife', 'Bars', 'Clubs', 'Live Music', 'Concerts', 'Parties', 'Social Events', 'Networking', 'Community Events', 'Festivals'],
  sports: ['Football', 'Basketball', 'Tennis', 'Golf', 'Swimming', 'Running', 'Cycling', 'Volleyball', 'Badminton', 'Table Tennis'],
  education: ['Language Learning', 'History', 'Science', 'Technology', 'Business', 'Economics', 'Politics', 'Philosophy', 'Psychology', 'Sociology'],
  lifestyle: ['Fashion', 'Shopping', 'Design', 'Architecture', 'Interior Design', 'Gardening', 'Pets', 'Fitness', 'Health', 'Beauty']
};

// Generate comprehensive user data
export function generateEnhancedUsers(count: number = 100): User[] {
  const users: User[] = [];
  const names = [
    'Maya', 'Alex', 'Sofia', 'Jordan', 'Zara', 'Kai', 'Luna', 'Diego', 'Aria', 'Phoenix',
    'Nova', 'River', 'Sage', 'Atlas', 'Iris', 'Orion', 'Celeste', 'Jasper', 'Willow', 'Felix',
    'Aurora', 'Leo', 'Stella', 'Milo', 'Ruby', 'Ezra', 'Hazel', 'Asher', 'Violet', 'Finn',
    'Isla', 'Liam', 'Emma', 'Noah', 'Olivia', 'William', 'Ava', 'James', 'Isabella', 'Benjamin',
    'Sophia', 'Lucas', 'Charlotte', 'Henry', 'Amelia', 'Alexander', 'Mia', 'Mason', 'Harper', 'Ethan',
    'Evelyn', 'Michael', 'Abigail', 'Daniel', 'Emily', 'Jacob', 'Elizabeth', 'Logan', 'Sofia', 'Jackson',
    'Avery', 'Levi', 'Ella', 'Sebastian', 'Madison', 'Mateo', 'Scarlett', 'Jack', 'Victoria', 'Owen',
    'Aria', 'Theodore', 'Grace', 'Aiden', 'Chloe', 'Samuel', 'Camila', 'Joseph', 'Penelope', 'John',
    'Riley', 'David', 'Layla', 'Wyatt', 'Lillian', 'Matthew', 'Nora', 'Luke', 'Zoey', 'Asher'
  ];

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const age = Math.floor(Math.random() * 40) + 22; // 22-62 years old
    const location = locationsWithCoords[Math.floor(Math.random() * locationsWithCoords.length)];
    const destination = destinationsWithSeasons[Math.floor(Math.random() * destinationsWithSeasons.length)];
    
    // Generate travel styles (2-5 styles per user)
    const numStyles = Math.floor(Math.random() * 4) + 2;
    const travelStyle = extendedTravelStyles
      .sort(() => 0.5 - Math.random())
      .slice(0, numStyles) as any[];

    // Generate interests (3-8 interests per user)
    const allInterests = Object.values(interestCategories).flat();
    const numInterests = Math.floor(Math.random() * 6) + 3;
    const interests = allInterests
      .sort(() => 0.5 - Math.random())
      .slice(0, numInterests);

    // Generate travel dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 180) + 30); // 30-210 days from now
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 21) + 7); // 7-28 days trip
    
    const travelDates = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.getFullYear()}`;

    // Generate photos
    const photoCount = Math.floor(Math.random() * 6) + 2; // 2-7 photos
    const photos = Array.from({ length: photoCount }, (_, index) => 
      `https://picsum.photos/800/600?random=${i * 10 + index}`
    );

    // Generate bio based on travel styles and interests
    const bio = generateBio(travelStyle, interests, destination.name);

    const user: User = {
      id: `user_${i + 1}`,
      name,
      age,
      avatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${(i % 50) + 1}.jpg`,
      coverImage: photos[0],
      location: location.name,
      coordinates: { lat: location.lat, lng: location.lng },
      travelStyle,
      nextDestination: destination.name,
      travelDates,
      bio,
      interests,
      mutualConnections: Math.floor(Math.random() * 15),
      photos,
      verified: Math.random() > 0.3, // 70% verified
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      preferences: {
        ageRange: [Math.max(18, age - 8), Math.min(65, age + 8)] as [number, number],
        maxDistance: Math.floor(Math.random() * 200) + 25, // 25-225 km
        travelStyles: travelStyle.slice(0, Math.floor(Math.random() * 3) + 2),
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
          allowMessages: Math.random() > 0.5 ? 'matches' : 'everyone'
        }
      }
    };

    users.push(user);
  }

  return users;
}

// Generate bio based on user's travel styles and interests
function generateBio(travelStyles: string[], interests: string[], destination: string): string {
  const styleDescriptions = {
    backpacker: "Budget-conscious traveler seeking authentic experiences",
    luxury: "Luxury traveler who appreciates comfort and premium experiences",
    foodie: "Culinary enthusiast exploring local flavors and food culture",
    adventurer: "Thrill-seeker always looking for the next adrenaline rush",
    cultural: "Culture lover fascinated by history, traditions, and local customs",
    photographer: "Visual storyteller capturing the world through my lens",
    solo: "Independent explorer who values personal growth through travel",
    group: "Social traveler who believes the best experiences are shared",
    budget: "Smart traveler maximizing experiences while minimizing costs",
    nature: "Nature enthusiast seeking outdoor adventures and wildlife",
    nightlife: "Social butterfly who loves exploring the local night scene",
    wellness: "Mindful traveler combining adventure with wellness and self-care"
  };

  const interestDescriptions = {
    'Hiking': "love hiking and outdoor adventures",
    'Photography': "passionate about photography",
    'Food': "always hunting for the best local eats",
    'Culture': "fascinated by different cultures",
    'Music': "music lover and festival goer",
    'Art': "art enthusiast and gallery hopper",
    'History': "history buff and museum explorer",
    'Languages': "language learner and cultural bridge-builder"
  };

  const styleText = travelStyles.slice(0, 2).map(style => styleDescriptions[style as keyof typeof styleDescriptions] || style).join(' and ');
  const interestText = interests.slice(0, 2).map(interest => interestDescriptions[interest as keyof typeof interestDescriptions] || interest).join(', ');
  
  const bioTemplates = [
    `I'm a ${styleText} planning my next adventure to ${destination}. I ${interestText} and love connecting with fellow travelers who share my passion for exploration.`,
    `Adventure seeker heading to ${destination}! I'm a ${styleText} who ${interestText}. Looking for travel companions to create unforgettable memories together.`,
    `Travel enthusiast with a love for ${destination}. As a ${styleText}, I ${interestText} and believe the best stories are written with others.`,
    `Planning an epic journey to ${destination}! I'm a ${styleText} who ${interestText}. Seeking like-minded adventurers to explore the world together.`
  ];

  return bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
}

// Generate sample matches
export function generateSampleMatches(users: User[]): Match[] {
  const matches: Match[] = [];
  const matchCount = Math.floor(users.length * 0.3); // 30% of users have matches

  for (let i = 0; i < matchCount; i++) {
    const user1 = users[Math.floor(Math.random() * users.length)];
    const user2 = users[Math.floor(Math.random() * users.length)];
    
    if (user1.id !== user2.id) {
      const commonInterests = user1.interests.filter(interest => 
        user2.interests.includes(interest)
      );
      
      const compatibilityScore = calculateCompatibilityScore(user1, user2);
      
      matches.push({
        id: `match_${i + 1}`,
        users: [user1.id, user2.id],
        matchedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: Math.random() > 0.1 ? 'accepted' : 'pending',
        commonInterests,
        compatibilityScore
      });
    }
  }

  return matches;
}

// Generate sample conversations and messages
export function generateSampleConversations(users: User[], matches: Match[]): { conversations: Conversation[], messages: Message[] } {
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  let messageId = 1;

  matches.forEach((match, index) => {
    if (match.status === 'accepted') {
      const user1 = users.find(u => u.id === match.users[0]);
      const user2 = users.find(u => u.id === match.users[1]);
      
      if (user1 && user2) {
        const conversation: Conversation = {
          id: `conv_${index + 1}`,
          matchId: match.id,
          participants: [user1, user2],
          unreadCount: Math.floor(Math.random() * 5),
          updatedAt: new Date().toISOString()
        };

        // Generate 3-10 messages per conversation
        const messageCount = Math.floor(Math.random() * 8) + 3;
        const conversationMessages: Message[] = [];
        
        for (let i = 0; i < messageCount; i++) {
          const isFromUser1 = Math.random() > 0.5;
          const senderId = isFromUser1 ? user1.id : user2.id;
          const messageContent = generateMessageContent(match.commonInterests, user1, user2);
          
          const message: Message = {
            id: `msg_${messageId++}`,
            matchId: match.id,
            senderId,
            content: messageContent,
            timestamp: new Date(Date.now() - (messageCount - i) * 60 * 60 * 1000).toISOString(),
            read: Math.random() > 0.3,
            type: 'text'
          };
          
          conversationMessages.push(message);
        }

        // Sort messages by timestamp
        conversationMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        conversation.lastMessage = conversationMessages[conversationMessages.length - 1];
        conversations.push(conversation);
        messages.push(...conversationMessages);
      }
    }
  });

  return { conversations, messages };
}

// Generate message content based on common interests
function generateMessageContent(commonInterests: string[], user1: User, user2: User): string {
  const messageTemplates = {
    greeting: [
      "Hey! I saw we both love {interest}. Would love to connect!",
      "Hi there! I noticed we share a passion for {interest}. Let's chat!",
      "Hello! I'm excited we both enjoy {interest}. Looking forward to connecting!",
      "Hey! I see we have {interest} in common. Would love to get to know you better!"
    ],
    travel: [
      "I'm planning a trip to {destination}. Any recommendations?",
      "Have you been to {destination} before? I'm going there soon!",
      "I'm so excited about my upcoming trip to {destination}!",
      "Looking for travel buddies for {destination}. Interested?"
    ],
    interest: [
      "I love {interest} too! What's your favorite part about it?",
      "I'm really into {interest}. Do you have any tips for beginners?",
      "I've been exploring {interest} lately. Any recommendations?",
      "I'm passionate about {interest}. Would love to share experiences!"
    ],
    general: [
      "How's your day going?",
      "What's the most interesting place you've traveled to?",
      "I'm always looking for new travel companions. What's your travel style?",
      "I love meeting fellow travelers! What's your next adventure?"
    ]
  };

  const interest = commonInterests[Math.floor(Math.random() * commonInterests.length)] || 'travel';
  const destination = user1.nextDestination || user2.nextDestination || 'some amazing place';
  
  const templates = [
    ...messageTemplates.greeting.map(t => t.replace('{interest}', interest)),
    ...messageTemplates.travel.map(t => t.replace('{destination}', destination)),
    ...messageTemplates.interest.map(t => t.replace('{interest}', interest)),
    ...messageTemplates.general
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// Calculate compatibility score between two users
export function calculateCompatibilityScore(user1: User, user2: User): number {
  let score = 0;
  let factors = 0;

  // Age compatibility (20 points max)
  const ageDiff = Math.abs(user1.age - user2.age);
  const ageScore = Math.max(0, 20 - (ageDiff * 2));
  score += ageScore;
  factors++;

  // Location compatibility (15 points max)
  if (user1.coordinates && user2.coordinates) {
    const distance = calculateDistance(user1.coordinates, user2.coordinates);
    const maxDistance = Math.min(user1.preferences.maxDistance, user2.preferences.maxDistance);
    const locationScore = Math.max(0, 15 - (distance / maxDistance) * 15);
    score += locationScore;
  }
  factors++;

  // Travel style compatibility (25 points max)
  const commonStyles = user1.travelStyle.filter(style => user2.travelStyle.includes(style));
  const styleScore = (commonStyles.length / Math.max(user1.travelStyle.length, user2.travelStyle.length)) * 25;
  score += styleScore;
  factors++;

  // Interest compatibility (20 points max)
  const commonInterests = user1.interests.filter(interest => user2.interests.includes(interest));
  const interestScore = (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 20;
  score += interestScore;
  factors++;

  // Destination compatibility (20 points max)
  const destinationScore = user1.nextDestination === user2.nextDestination ? 20 : 0;
  score += destinationScore;
  factors++;

  return Math.round(score / factors);
}

// Calculate distance between two coordinates (in kilometers)
function calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate travel plans
export function generateTravelPlans(users: User[]): TravelPlan[] {
  const plans: TravelPlan[] = [];
  
  users.slice(0, 20).forEach((user, index) => {
    const destination = destinationsWithSeasons[Math.floor(Math.random() * destinationsWithSeasons.length)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 180) + 30);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 21) + 7);

    const activities = [
      'Explore local markets', 'Visit historical sites', 'Try local cuisine',
      'Take a cooking class', 'Go on a city tour', 'Visit museums',
      'Go hiking', 'Take photos', 'Meet locals', 'Go shopping'
    ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 3);

    plans.push({
      id: `plan_${index + 1}`,
      userId: user.id,
      destination: destination.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      budget: Math.floor(Math.random() * 5000) + 500,
      activities,
      accommodation: ['Hostel', 'Hotel', 'Airbnb', 'Guesthouse'][Math.floor(Math.random() * 4)],
      transportation: ['Flight', 'Train', 'Bus', 'Car'][Math.floor(Math.random() * 4)],
      notes: `Excited to explore ${destination.name}! Looking for travel companions to share this adventure.`,
      isPublic: Math.random() > 0.3
    });
  });

  return plans;
}

// Generate bucket list items
export function generateBucketListItems(users: User[]): BucketListItem[] {
  const items: BucketListItem[] = [];
  const destinations = destinationsWithSeasons.map(d => d.name);
  
  users.slice(0, 30).forEach((user, userIndex) => {
    const itemCount = Math.floor(Math.random() * 8) + 2; // 2-9 items per user
    
    for (let i = 0; i < itemCount; i++) {
      const destination = destinations[Math.floor(Math.random() * destinations.length)];
      const priorities = ['low', 'medium', 'high'] as const;
      
      items.push({
        id: `bucket_${userIndex}_${i + 1}`,
        userId: user.id,
        destination,
        description: `Visit ${destination} and experience the local culture`,
        image: `https://picsum.photos/400/300?random=${userIndex * 10 + i}`,
        priority: priorities[Math.floor(Math.random() * 3)],
        completed: Math.random() > 0.8,
        completedAt: Math.random() > 0.8 ? new Date().toISOString() : undefined,
        notes: `This is a must-visit destination for me!`
      });
    }
  });

  return items;
}

// Generate stories
export function generateStories(users: User[]): Story[] {
  const stories: Story[] = [];
  const destinations = destinationsWithSeasons.map(d => d.name);
  
  users.slice(0, 15).forEach((user, userIndex) => {
    const storyCount = Math.floor(Math.random() * 3) + 1; // 1-3 stories per user
    
    for (let i = 0; i < storyCount; i++) {
      const destination = destinations[Math.floor(Math.random() * destinations.length)];
      const captions = [
        `Amazing sunset in ${destination}! 🌅`,
        `Exploring the local culture in ${destination}`,
        `Incredible food scene here in ${destination} 🍜`,
        `Met some amazing people in ${destination}!`,
        `Beautiful architecture in ${destination} 🏛️`,
        `Adventure time in ${destination}! 🏔️`
      ];
      
      stories.push({
        id: `story_${userIndex}_${i + 1}`,
        userId: user.id,
        image: `https://picsum.photos/400/600?random=${userIndex * 20 + i}`,
        caption: captions[Math.floor(Math.random() * captions.length)],
        location: destination,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        views: [],
        expires: new Date(Date.now() + (24 - Math.random() * 12) * 60 * 60 * 1000).toISOString()
      });
    }
  });

  return stories;
}

// Export all generated data
export const enhancedUsers = generateEnhancedUsers(100);
export const sampleMatches = generateSampleMatches(enhancedUsers);
export const { conversations: sampleConversations, messages: sampleMessages } = generateSampleConversations(enhancedUsers, sampleMatches);
export const sampleTravelPlans = generateTravelPlans(enhancedUsers);
export const sampleBucketListItems = generateBucketListItems(enhancedUsers);
export const sampleStories = generateStories(enhancedUsers);
