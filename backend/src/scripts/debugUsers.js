/**
 * Debug script to check all users in the database
 */

import { db } from '../config/database.js';

async function debugUsers() {
  try {
    console.log('🔍 Debugging users...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`\n📊 Total users in database: ${usersSnapshot.docs.length}`);
    
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`User ${index + 1}: ${doc.id} - ${data.name} (${data.age})`);
    });
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugUsers()
  .then(() => {
    console.log('✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
