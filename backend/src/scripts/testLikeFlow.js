// Test the like flow to see what's happening
import 'dotenv/config';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testDatabaseState() {
  console.log('🔍 Testing current database state...');

  try {
    // Check all swipes
    const swipesSnapshot = await getDocs(collection(db, 'swipes'));
    console.log(`📊 Total swipes in database: ${swipesSnapshot.docs.length}`);
    
    swipesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  Swipe: ${data.userId} ${data.type}d ${data.swipedUserId}`);
    });

    // Check all matches
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    console.log(`📊 Total matches in database: ${matchesSnapshot.docs.length}`);
    
    matchesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  Match: ${data.users.join(' <-> ')} (status: ${data.status})`);
    });

    // Test specific user
    const testUserId = 'JPZ4tYsvQHbrkXR9GOCcS0srW463'; // Your user ID
    console.log(`\n🔍 Testing for user: ${testUserId}`);

    // Get their likes
    const userLikesQuery = query(
      collection(db, 'swipes'),
      where('userId', '==', testUserId),
      where('type', 'in', ['like', 'superlike'])
    );
    const userLikes = await getDocs(userLikesQuery);
    console.log(`📤 User sent ${userLikes.docs.length} likes:`);
    userLikes.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  Liked: ${data.swipedUserId} at ${data.timestamp?.toDate?.() || 'unknown'}`);
    });

    // Get their matches
    const userMatchesQuery = query(
      collection(db, 'matches'),
      where('users', 'array-contains', testUserId)
    );
    const userMatches = await getDocs(userMatchesQuery);
    console.log(`💕 User has ${userMatches.docs.length} matches:`);
    userMatches.docs.forEach(doc => {
      const data = doc.data();
      const otherUser = data.users.find(id => id !== testUserId);
      console.log(`  Matched with: ${otherUser} (status: ${data.status})`);
    });

  } catch (error) {
    console.error('❌ Error testing database:', error);
  }
}

testDatabaseState().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
