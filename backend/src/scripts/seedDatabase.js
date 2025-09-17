import { db } from '../config/database.js';
import { collection, addDoc, setDoc, doc, writeBatch } from 'firebase/firestore';

// Generate 30 users for seeding
const users = generateUsers(30);

// Generate related data
const matches = generateMatches(users);
const { conversations, messages } = generateConversations(users, matches);
const travelPlans = generateTravelPlans(users);
const bucketListItems = generateBucketListItems(users);
const stories = generateStories(users);

// Generate swipes data
const swipes = generateSwipes(users);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Create batch for better performance
    const batch = writeBatch(db);
    
    // 1. Seed Users
    console.log('👥 Seeding users...');
    for (const user of users) {
      const userRef = doc(db, 'users', user.id);
      // Filter out undefined values
      const cleanUser = Object.fromEntries(
        Object.entries(user).filter(([_, value]) => value !== undefined)
      );
      batch.set(userRef, {
        ...cleanUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date()
      });
    }
    
    // 2. Seed Swipes
    console.log('💫 Seeding swipes...');
    for (const swipe of swipes) {
      const swipeRef = doc(collection(db, 'swipes'));
      const cleanSwipe = Object.fromEntries(
        Object.entries(swipe).filter(([_, value]) => value !== undefined)
      );
      batch.set(swipeRef, {
        ...cleanSwipe,
        createdAt: new Date()
      });
    }
    
    // 3. Seed Matches
    console.log('💕 Seeding matches...');
    for (const match of matches) {
      const matchRef = doc(db, 'matches', match.id);
      const cleanMatch = Object.fromEntries(
        Object.entries(match).filter(([_, value]) => value !== undefined)
      );
      batch.set(matchRef, {
        ...cleanMatch,
        createdAt: new Date()
      });
    }
    
    // 4. Seed Conversations
    console.log('💬 Seeding conversations...');
    for (const conversation of conversations) {
      const convRef = doc(db, 'conversations', conversation.id);
      const cleanConversation = Object.fromEntries(
        Object.entries(conversation).filter(([_, value]) => value !== undefined)
      );
      batch.set(convRef, {
        ...cleanConversation,
        createdAt: new Date()
      });
    }
    
    // 5. Seed Messages
    console.log('📝 Seeding messages...');
    for (const message of messages) {
      const msgRef = doc(collection(db, 'messages'));
      const cleanMessage = Object.fromEntries(
        Object.entries(message).filter(([_, value]) => value !== undefined)
      );
      batch.set(msgRef, {
        ...cleanMessage,
        createdAt: new Date()
      });
    }
    
    // 6. Seed Travel Plans
    console.log('✈️ Seeding travel plans...');
    for (const plan of travelPlans) {
      const planRef = doc(collection(db, 'travelPlans'));
      const cleanPlan = Object.fromEntries(
        Object.entries(plan).filter(([_, value]) => value !== undefined)
      );
      batch.set(planRef, {
        ...cleanPlan,
        createdAt: new Date()
      });
    }
    
    // 7. Seed Bucket List Items
    console.log('🗺️ Seeding bucket list items...');
    for (const item of bucketListItems) {
      const itemRef = doc(collection(db, 'bucketList'));
      // Filter out undefined values
      const cleanItem = Object.fromEntries(
        Object.entries(item).filter(([_, value]) => value !== undefined)
      );
      batch.set(itemRef, {
        ...cleanItem,
        createdAt: new Date()
      });
    }
    
    // 8. Seed Stories
    console.log('📸 Seeding stories...');
    for (const story of stories) {
      const storyRef = doc(collection(db, 'stories'));
      const cleanStory = Object.fromEntries(
        Object.entries(story).filter(([_, value]) => value !== undefined)
      );
      batch.set(storyRef, {
        ...cleanStory,
        createdAt: new Date()
      });
    }
    
    // Commit all writes
    await batch.commit();
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded data:`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${swipes.length} swipes`);
    console.log(`   - ${matches.length} matches`);
    console.log(`   - ${conversations.length} conversations`);
    console.log(`   - ${messages.length} messages`);
    console.log(`   - ${travelPlans.length} travel plans`);
    console.log(`   - ${bucketListItems.length} bucket list items`);
    console.log(`   - ${stories.length} stories`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Generate users
function generateUsers(count) {
  const users = [];
  const names = [
    'Maya', 'Alex', 'Sofia', 'Jordan', 'Zara', 'Kai', 'Luna', 'Diego', 'Aria', 'Phoenix',
    'Nova', 'River', 'Sage', 'Atlas', 'Iris', 'Orion', 'Celeste', 'Jasper', 'Willow', 'Felix',
    'Aurora', 'Leo', 'Stella', 'Milo', 'Ruby', 'Ezra', 'Hazel', 'Asher', 'Violet', 'Finn',
    'Isla', 'Liam', 'Emma', 'Noah', 'Olivia', 'William', 'Ava', 'James', 'Isabella', 'Benjamin'
  ];

  const travelStyles = [
    'backpacker', 'luxury', 'foodie', 'adventurer', 'cultural', 'photographer',
    'solo', 'group', 'budget', 'nature', 'nightlife', 'wellness'
  ];

  const locations = [
    { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
    { name: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964 }
  ];

  const destinations = [
    'Tokyo, Japan', 'Bali, Indonesia', 'Paris, France', 'New York, USA',
    'Barcelona, Spain', 'Thailand', 'Morocco', 'Iceland', 'New Zealand',
    'Peru', 'Vietnam', 'Greece', 'Portugal', 'Costa Rica', 'Nepal'
  ];

  const interests = [
    'Photography', 'Food', 'Culture', 'Hiking', 'Adventure Sports',
    'Road Trips', 'Architecture', 'Nature', 'Music', 'Art', 'History',
    'Scuba Diving', 'Rock Climbing', 'Yoga', 'Meditation', 'Dancing'
  ];

  const bios = [
    'Digital nomad seeking authentic local experiences and fellow adventurers to explore hidden gems with.',
    'Adventure seeker planning epic journeys around the world. Looking for travel buddies who love hiking and extreme sports.',
    'Architecture enthusiast and culture lover. Planning photographic journeys through ancient cities.',
    'Food blogger exploring incredible culinary scenes. Seeking fellow foodies to discover hidden local gems.',
    'Nature lover and wildlife photographer. Always ready for the next outdoor adventure.',
    'Solo traveler who believes the best stories are written with others. Open to spontaneous adventures.',
    'Wellness enthusiast combining travel with mindfulness. Looking for companions interested in yoga retreats.',
    'History buff fascinated by ancient civilizations. Love museums, archaeological sites, and cultural immersion.',
    'Beach lover and water sports enthusiast. Always planning the next tropical getaway.',
    'Mountain climber and trekking enthusiast. Seeking adventure partners for challenging peaks.'
  ];

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const age = Math.floor(Math.random() * 30) + 22; // 22-52 years old
    const location = locations[Math.floor(Math.random() * locations.length)];
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    
    // Generate travel styles (2-4 styles per user)
    const numStyles = Math.floor(Math.random() * 3) + 2;
    const userTravelStyles = travelStyles
      .sort(() => 0.5 - Math.random())
      .slice(0, numStyles);

    // Generate interests (3-6 interests per user)
    const numInterests = Math.floor(Math.random() * 4) + 3;
    const userInterests = interests
      .sort(() => 0.5 - Math.random())
      .slice(0, numInterests);

    // Generate travel dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90) + 30);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 21) + 7);
    
    const travelDates = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.getFullYear()}`;

    // Generate photos
    const photoCount = Math.floor(Math.random() * 4) + 2; // 2-5 photos
    const photos = Array.from({ length: photoCount }, (_, index) => 
      `https://picsum.photos/800/600?random=${i * 10 + index}`
    );

    const user = {
      id: `user_${i + 1}`,
      name,
      age,
      avatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${(i % 50) + 1}.jpg`,
      coverImage: photos[0],
      location: location.name,
      coordinates: { lat: location.lat, lng: location.lng },
      travelStyle: userTravelStyles,
      nextDestination: destination,
      travelDates,
      bio: bios[Math.floor(Math.random() * bios.length)],
      interests: userInterests,
      mutualConnections: Math.floor(Math.random() * 8),
      photos,
      verified: Math.random() > 0.3, // 70% verified
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      preferences: {
        ageRange: [Math.max(18, age - 8), Math.min(65, age + 8)],
        maxDistance: Math.floor(Math.random() * 100) + 25,
        travelStyles: userTravelStyles.slice(0, Math.floor(Math.random() * 3) + 2),
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

// Generate matches
function generateMatches(users) {
  const matches = [];
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

// Generate conversations and messages
function generateConversations(users, matches) {
  const conversations = [];
  const messages = [];
  let messageId = 1;

  matches.forEach((match, index) => {
    if (match.status === 'accepted') {
      const user1 = users.find(u => u.id === match.users[0]);
      const user2 = users.find(u => u.id === match.users[1]);
      
      if (user1 && user2) {
        const conversation = {
          id: `conv_${index + 1}`,
          matchId: match.id,
          participants: [user1, user2],
          unreadCount: Math.floor(Math.random() * 5),
          updatedAt: new Date().toISOString()
        };

        // Generate 3-8 messages per conversation
        const messageCount = Math.floor(Math.random() * 6) + 3;
        const conversationMessages = [];
        
        for (let i = 0; i < messageCount; i++) {
          const isFromUser1 = Math.random() > 0.5;
          const senderId = isFromUser1 ? user1.id : user2.id;
          const messageContent = generateMessageContent(match.commonInterests, user1, user2);
          
          const message = {
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

// Generate travel plans
function generateTravelPlans(users) {
  const plans = [];
  const destinations = [
    'Tokyo, Japan', 'Bali, Indonesia', 'Paris, France', 'New York, USA',
    'Barcelona, Spain', 'Thailand', 'Morocco', 'Iceland', 'New Zealand'
  ];
  
  users.slice(0, 15).forEach((user, index) => {
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
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
      destination,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      budget: Math.floor(Math.random() * 5000) + 500,
      activities,
      accommodation: ['Hostel', 'Hotel', 'Airbnb', 'Guesthouse'][Math.floor(Math.random() * 4)],
      transportation: ['Flight', 'Train', 'Bus', 'Car'][Math.floor(Math.random() * 4)],
      notes: `Excited to explore ${destination}! Looking for travel companions to share this adventure.`,
      isPublic: Math.random() > 0.3
    });
  });

  return plans;
}

// Generate bucket list items
function generateBucketListItems(users) {
  const items = [];
  const destinations = [
    'Tokyo, Japan', 'Bali, Indonesia', 'Paris, France', 'New York, USA',
    'Barcelona, Spain', 'Thailand', 'Morocco', 'Iceland', 'New Zealand',
    'Peru', 'Vietnam', 'Greece', 'Portugal', 'Costa Rica', 'Nepal'
  ];
  
  users.slice(0, 20).forEach((user, userIndex) => {
    const itemCount = Math.floor(Math.random() * 6) + 2; // 2-7 items per user
    
    for (let i = 0; i < itemCount; i++) {
      const destination = destinations[Math.floor(Math.random() * destinations.length)];
      const priorities = ['low', 'medium', 'high'];
      
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
function generateStories(users) {
  const stories = [];
  const destinations = [
    'Tokyo, Japan', 'Bali, Indonesia', 'Paris, France', 'New York, USA',
    'Barcelona, Spain', 'Thailand', 'Morocco', 'Iceland', 'New Zealand'
  ];
  
  users.slice(0, 10).forEach((user, userIndex) => {
    const storyCount = Math.floor(Math.random() * 2) + 1; // 1-2 stories per user
    
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

// Generate swipes data
function generateSwipes(users) {
  const swipes = [];
  
  // Each user swipes on 10-20 other users
  users.forEach((user, userIndex) => {
    const swipeCount = Math.floor(Math.random() * 11) + 10; // 10-20 swipes
    const otherUsers = users.filter((_, index) => index !== userIndex);
    const shuffledUsers = otherUsers.sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(swipeCount, shuffledUsers.length); i++) {
      const targetUser = shuffledUsers[i];
      const isLike = Math.random() > 0.3; // 70% like rate
      
      swipes.push({
        id: `swipe_${user.id}_${targetUser.id}`,
        swiperId: user.id,
        targetUserId: targetUser.id,
        action: isLike ? 'like' : 'pass',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: isLike ? generateSwipeReason(user, targetUser) : null
      });
    }
  });
  
  return swipes;
}

// Generate reason for swiping
function generateSwipeReason(swiper, target) {
  const commonInterests = swiper.interests.filter(interest => 
    target.interests.includes(interest)
  );
  const commonStyles = swiper.travelStyle.filter(style => 
    target.travelStyle.includes(style)
  );
  
  const reasons = [];
  
  if (commonInterests.length > 0) {
    reasons.push(`Shared interest in ${commonInterests[0]}`);
  }
  
  if (commonStyles.length > 0) {
    reasons.push(`Similar travel style: ${commonStyles[0]}`);
  }
  
  if (swiper.nextDestination === target.nextDestination) {
    reasons.push(`Both going to ${target.nextDestination}`);
  }
  
  if (reasons.length === 0) {
    reasons.push('Interesting profile');
  }
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}

// Generate message content
function generateMessageContent(commonInterests, user1, user2) {
  const messageTemplates = [
    "Hey! I saw we both love {interest}. Would love to connect!",
    "Hi there! I noticed we share a passion for {interest}. Let's chat!",
    "Hello! I'm excited we both enjoy {interest}. Looking forward to connecting!",
    "I'm planning a trip to {destination}. Any recommendations?",
    "Have you been to {destination} before? I'm going there soon!",
    "How's your day going?",
    "What's the most interesting place you've traveled to?",
    "I'm always looking for new travel companions. What's your travel style?"
  ];

  const interest = commonInterests[Math.floor(Math.random() * commonInterests.length)] || 'travel';
  const destination = user1.nextDestination || user2.nextDestination || 'some amazing place';
  
  const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
  return template.replace('{interest}', interest).replace('{destination}', destination);
}

// Calculate compatibility score
function calculateCompatibilityScore(user1, user2) {
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

// Calculate distance between coordinates
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Run the seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };