import { db } from '../config/database.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

async function testLikes() {
  console.log('🔍 Testing likes in database...');
  
  try {
    // Get all swipes
    const swipesQuery = query(
      collection(db, 'swipes'),
      orderBy('timestamp', 'desc')
    );
    
    const swipesSnapshot = await getDocs(swipesQuery);
    const swipes = swipesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Total swipes in database: ${swipes.length}`);
    
    // Count likes vs passes
    const likes = swipes.filter(swipe => swipe.type === 'like');
    const superLikes = swipes.filter(swipe => swipe.type === 'superlike');
    const passes = swipes.filter(swipe => swipe.type === 'pass');
    
    console.log(`💕 Likes: ${likes.length}`);
    console.log(`⭐ Super Likes: ${superLikes.length}`);
    console.log(`👎 Passes: ${passes.length}`);
    
    // Show recent likes
    const recentLikes = [...likes, ...superLikes]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    console.log('\n🕒 Recent likes:');
    recentLikes.forEach((like, index) => {
      console.log(`${index + 1}. User ${like.userId} ${like.type} user ${like.swipedUserId} at ${like.timestamp}`);
    });
    
    // Get matches
    const matchesQuery = query(
      collection(db, 'matches'),
      orderBy('matchedAt', 'desc')
    );
    
    const matchesSnapshot = await getDocs(matchesQuery);
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`\n💕 Total matches: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log('\n🎉 Recent matches:');
      matches.slice(0, 3).forEach((match, index) => {
        console.log(`${index + 1}. Users ${match.users.join(' & ')} matched at ${match.matchedAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing likes:', error);
  }
}

// Run the test
testLikes()
  .then(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
