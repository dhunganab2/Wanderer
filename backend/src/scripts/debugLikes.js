/**
 * Debug script to check likes and why they're not showing up
 */

import { db } from '../config/database.js';

async function debugLikes() {
  try {
    console.log('🔍 Debugging likes...');
    
    // Get all swipes
    const swipesSnapshot = await db.collection('swipes').get();
    console.log(`\n📊 Total swipes in database: ${swipesSnapshot.docs.length}`);
    
    // Group swipes by type
    const swipeTypes = {};
    const likes = [];
    
    swipesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const type = data.type;
      if (!swipeTypes[type]) swipeTypes[type] = 0;
      swipeTypes[type]++;
      
      if (type === 'like' || type === 'superlike') {
        likes.push({
          id: doc.id,
          userId: data.userId,
          swipedUserId: data.swipedUserId,
          type: data.type,
          timestamp: data.timestamp
        });
      }
    });
    
    console.log('Swipe types:', swipeTypes);
    console.log(`\n📊 Total likes: ${likes.length}`);
    
    // Show all likes
    likes.forEach((like, index) => {
      console.log(`Like ${index + 1}: ${like.userId} → ${like.swipedUserId} (${like.type})`);
    });
    
    // Check likes received for a specific user
    const testUserId = 'JPZ4tYsvQHbrkXR9GOCcS0srW463';
    console.log(`\n🔍 Checking likes received for user: ${testUserId}`);
    
    const likesForUser = likes.filter(like => like.swipedUserId === testUserId);
    console.log(`Likes for user ${testUserId}:`, likesForUser.length);
    
    likesForUser.forEach((like, index) => {
      console.log(`  ${index + 1}. From ${like.userId} (${like.type})`);
    });
    
    // Check if users exist
    console.log(`\n🔍 Checking if liking users exist in database...`);
    const uniqueLikerIds = [...new Set(likesForUser.map(like => like.userId))];
    
    for (const likerId of uniqueLikerIds) {
      try {
        const userDoc = await db.collection('users').doc(likerId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`✅ User ${likerId} exists: ${userData.name}`);
        } else {
          console.log(`❌ User ${likerId} does NOT exist in users collection`);
        }
      } catch (error) {
        console.log(`❌ Error checking user ${likerId}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugLikes()
  .then(() => {
    console.log('✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
