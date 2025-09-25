#!/usr/bin/env node

/**
 * Migration script to populate Firebase Firestore with 100 enhanced users
 * This script should be run once to migrate the sample data to the database
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCh-VRUsmkM61tSuxu6NaKhQDhIJTt3HNo",
  authDomain: "wanderer-8ecac.firebaseapp.com",
  projectId: "wanderer-8ecac",
  storageBucket: "wanderer-8ecac.firebasestorage.app",
  messagingSenderId: "441088789276",
  appId: "1:441088789276:web:5922cf14a6a5be961808d9",
  measurementId: "G-0M8HXZPRH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enhanced sample data generation (copied from frontend)
const extendedTravelStyles = [
  'backpacker', 'luxury', 'foodie', 'adventurer', 'cultural', 'photographer',
  'solo', 'group', 'budget', 'nature', 'nightlife', 'wellness', 'business',
  'family', 'romantic', 'spiritual', 'volunteer', 'sports', 'art', 'music',
  'history', 'architecture', 'beach', 'mountain', 'city', 'rural'
];

const locationsWithCoords = [
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

const destinationsWithSeasons = [
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

const interestCategories = {
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

// Generate bio based on user's travel styles and interests
function generateBio(travelStyles, interests, destination) {
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

  const styleText = travelStyles.slice(0, 2).map(style => styleDescriptions[style] || style).join(' and ');
  const interestText = interests.slice(0, 2).map(interest => interestDescriptions[interest] || interest).join(', ');
  
  const bioTemplates = [
    `I'm a ${styleText} planning my next adventure to ${destination}. I ${interestText} and love connecting with fellow travelers who share my passion for exploration.`,
    `Adventure seeker heading to ${destination}! I'm a ${styleText} who ${interestText}. Looking for travel companions to create unforgettable memories together.`,
    `Travel enthusiast with a love for ${destination}. As a ${styleText}, I ${interestText} and believe the best stories are written with others.`,
    `Planning an epic journey to ${destination}! I'm a ${styleText} who ${interestText}. Seeking like-minded adventurers to explore the world together.`
  ];

  return bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
}

// Generate enhanced users
function generateEnhancedUsers(count = 100) {
  const users = [];
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
      .slice(0, numStyles);

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

    const user = {
      id: `enhanced_user_${i + 1}`,
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
        ageRange: [Math.max(18, age - 8), Math.min(65, age + 8)],
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

// Check if users already exist in Firestore
async function checkExistingUsers() {
  try {
    const usersQuery = query(collection(db, 'users'), where('id', '>=', 'enhanced_user_1'));
    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.length;
  } catch (error) {
    console.warn('Error checking existing users:', error);
    return 0;
  }
}

// Migrate users to Firestore
async function migrateUsersToFirestore() {
  console.log('🚀 Starting migration of enhanced users to Firestore...');
  
  try {
    // Check if users already exist
    const existingCount = await checkExistingUsers();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing enhanced users in Firestore.`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to continue and potentially create duplicates? (y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Migration cancelled by user.');
        process.exit(0);
      }
    }

    // Generate users
    console.log('📝 Generating 100 enhanced users...');
    const users = generateEnhancedUsers(100);
    console.log(`✅ Generated ${users.length} users`);

    // Migrate users in batches
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`📤 Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)} (users ${i + 1}-${Math.min(i + batchSize, users.length)})`);

      // Process batch
      const promises = batch.map(async (user) => {
        try {
          const userRef = doc(db, 'users', user.id);
          await setDoc(userRef, user);
          return { success: true, user: user.id };
        } catch (error) {
          console.error(`❌ Error uploading user ${user.id}:`, error.message);
          return { success: false, user: user.id, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      
      // Count results
      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${successCount} users`);
    if (errorCount > 0) {
      console.log(`❌ Failed to migrate: ${errorCount} users`);
    }
    console.log(`📊 Total users in database: ${successCount} enhanced users`);
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const finalCount = await checkExistingUsers();
    console.log(`✅ Verification complete: Found ${finalCount} enhanced users in Firestore`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsersToFirestore()
    .then(() => {
      console.log('✨ Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateUsersToFirestore, generateEnhancedUsers };
