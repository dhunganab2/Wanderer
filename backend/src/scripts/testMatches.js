import { db } from '../config/database.js';
import { collection, getDocs } from 'firebase/firestore';

async function testMatches() {
  console.log('🔍 Testing matches loading...');
  
  try {
    const testUserId = 'JPZ4tYsvQHbrkXR9GOCcS0srW463';
    
    // Get all matches and filter in JavaScript
    const matchesQuery = collection(db, 'matches');
    const querySnapshot = await getDocs(matchesQuery);
    
    console.log(`📊 Total matches in database: ${querySnapshot.docs.length}`);
    
    // Filter for the specific user and accepted matches
    const userMatches = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(match => 
        match.users.includes(testUserId) && 
        match.status === 'accepted'
      );
    
    console.log(`💕 Matches for user ${testUserId}: ${userMatches.length}`);
    
    // Show recent matches
    userMatches
      .sort((a, b) => new Date(b.matchedAt) - new Date(a.matchedAt))
      .slice(0, 5)
      .forEach((match, index) => {
        console.log(`${index + 1}. Users ${match.users.join(' & ')} matched at ${match.matchedAt}`);
      });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testMatches()
  .then(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
