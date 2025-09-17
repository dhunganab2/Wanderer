import { db } from '../config/database.js';
import { collection, getDocs } from 'firebase/firestore';

async function testSimpleQuery() {
  console.log('🔍 Testing simple query without indexes...');
  
  try {
    // Get all swipes without any where clauses
    const swipesQuery = collection(db, 'swipes');
    const querySnapshot = await getDocs(swipesQuery);
    
    console.log(`📊 Total swipes in database: ${querySnapshot.docs.length}`);
    
    // Filter for the specific user in JavaScript
    const testUserId = 'JPZ4tYsvQHbrkXR9GOCcS0srW463';
    const userSwipes = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(swipe => swipe.userId === testUserId);
    
    console.log(`📊 Swipes for user ${testUserId}: ${userSwipes.length}`);
    
    // Filter for likes and superlikes
    const likes = userSwipes.filter(swipe => 
      swipe.type === 'like' || swipe.type === 'superlike'
    );
    
    console.log(`💕 Likes for user: ${likes.length}`);
    
    // Show recent likes
    likes
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .forEach((like, index) => {
        console.log(`${index + 1}. ${like.type} user ${like.swipedUserId} at ${like.timestamp}`);
      });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testSimpleQuery()
  .then(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
