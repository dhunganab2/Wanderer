import { db } from '../config/database.js';
import { collection, getDocs } from 'firebase/firestore';

async function testFrontendFlow() {
  console.log('🔍 Testing frontend flow simulation...');
  
  try {
    const testUserId = 'JPZ4tYsvQHbrkXR9GOCcS0srW463';
    
    // Simulate getUserLikes function
    console.log('📊 Testing getUserLikes...');
    const swipesQuery = collection(db, 'swipes');
    const swipesSnapshot = await getDocs(swipesQuery);
    console.log('Total swipes in database:', swipesSnapshot.docs.length);
    
    const likes = swipesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(swipe => 
        swipe.userId === testUserId && 
        (swipe.type === 'like' || swipe.type === 'superlike')
      );
    
    console.log('✅ Likes found:', likes.length);
    
    // Simulate getUserMatches function
    console.log('📊 Testing getUserMatches...');
    const matchesQuery = collection(db, 'matches');
    const matchesSnapshot = await getDocs(matchesQuery);
    console.log('Total matches in database:', matchesSnapshot.docs.length);
    
    const matches = matchesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(match => 
        match.users.includes(testUserId) && 
        match.status === 'accepted'
      );
    
    console.log('✅ Matches found:', matches.length);
    
    // Show what the frontend should display
    console.log('\n🎯 Frontend should display:');
    console.log(`- Likes Sent: ${likes.length} likes`);
    console.log(`- Matches: ${matches.length} matches`);
    
    // Show some sample data
    if (likes.length > 0) {
      console.log('\n💕 Sample likes:');
      likes.slice(0, 3).forEach((like, index) => {
        console.log(`${index + 1}. ${like.type} user ${like.swipedUserId} at ${like.timestamp}`);
      });
    }
    
    if (matches.length > 0) {
      console.log('\n🎉 Sample matches:');
      matches.slice(0, 3).forEach((match, index) => {
        console.log(`${index + 1}. Users ${match.users.join(' & ')} matched at ${match.matchedAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testFrontendFlow()
  .then(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
