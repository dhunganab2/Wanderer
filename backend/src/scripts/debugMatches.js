/**
 * Debug script to check matches and likes received
 */

import { matchingService } from '../services/matchingService.js';
import { db } from '../config/database.js';

async function debugMatches() {
  try {
    console.log('🔍 Debugging matches and likes received...');
    
    // Get all matches
    const matchesSnapshot = await db.collection('matches').get();
    console.log(`\n📊 Total matches in database: ${matchesSnapshot.docs.length}`);
    
    matchesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Match ${index + 1}: ${data.users.join(' ↔ ')} (Status: ${data.status})`);
    });
    
    // Get all swipes
    const swipesSnapshot = await db.collection('swipes').get();
    console.log(`\n📊 Total swipes in database: ${swipesSnapshot.docs.length}`);
    
    // Group swipes by type
    const swipeTypes = {};
    swipesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const type = data.type;
      if (!swipeTypes[type]) swipeTypes[type] = 0;
      swipeTypes[type]++;
    });
    
    console.log('Swipe types:', swipeTypes);
    
    // Check a specific user's likes received
    const testUserId = 'JPZ4tYsvQHbrkXR9GOCcS0srW463'; // Replace with actual user ID
    console.log(`\n🔍 Checking likes received for user: ${testUserId}`);
    
    const likesReceived = await matchingService.getLikesReceived(testUserId);
    console.log(`Likes received: ${likesReceived.length}`);
    
    likesReceived.forEach((like, index) => {
      console.log(`  ${index + 1}. ${like.user.name} (${like.userId}) - Type: ${like.type}`);
    });
    
    // Check user's matches
    const userMatches = await matchingService.getUserMatches(testUserId);
    console.log(`\nUser matches: ${userMatches.length}`);
    
    userMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.user.name} - Status: ${match.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugMatches()
  .then(() => {
    console.log('✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
