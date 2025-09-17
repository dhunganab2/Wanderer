import { db } from '../config/database.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

async function testUserLikes() {
  console.log('🔍 Testing user likes loading...');
  
  try {
    // Test with the user ID we know has likes
    const testUserId = 'JPZ4tYsvQHbrkXR9GOCcS0srW463';
    
    console.log(`📊 Testing likes for user: ${testUserId}`);
    
    // Query likes exactly like the frontend does
    const likesQuery = query(
      collection(db, 'swipes'),
      where('userId', '==', testUserId),
      where('type', 'in', ['like', 'superlike']),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(likesQuery);
    console.log(`📊 Query snapshot size: ${querySnapshot.docs.length}`);
    
    const likes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`💕 Like document ${doc.id}:`, {
        userId: data.userId,
        swipedUserId: data.swipedUserId,
        type: data.type,
        timestamp: data.timestamp
      });
      return {
        id: doc.id,
        ...data
      };
    });
    
    console.log(`\n✅ Total likes found: ${likes.length}`);
    
    // Test with a different user ID to see if the query works
    console.log('\n🔍 Testing with a different user ID...');
    const otherUserId = 'user_1';
    
    const otherLikesQuery = query(
      collection(db, 'swipes'),
      where('userId', '==', otherUserId),
      where('type', 'in', ['like', 'superlike']),
      orderBy('timestamp', 'desc')
    );
    
    const otherQuerySnapshot = await getDocs(otherLikesQuery);
    console.log(`📊 Other user query size: ${otherQuerySnapshot.docs.length}`);
    
    // Test without the type filter to see all swipes for the user
    console.log('\n🔍 Testing all swipes for user (no type filter)...');
    const allSwipesQuery = query(
      collection(db, 'swipes'),
      where('userId', '==', testUserId),
      orderBy('timestamp', 'desc')
    );
    
    const allSwipesSnapshot = await getDocs(allSwipesQuery);
    console.log(`📊 All swipes for user: ${allSwipesSnapshot.docs.length}`);
    
    const allSwipes = allSwipesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        swipedUserId: data.swipedUserId,
        timestamp: data.timestamp
      };
    });
    
    console.log('All swipes:', allSwipes.slice(0, 5)); // Show first 5
    
  } catch (error) {
    console.error('❌ Error testing user likes:', error);
  }
}

// Run the test
testUserLikes()
  .then(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
