#!/usr/bin/env node

/**
 * Script to simulate likes from other users to test the mutual matching system
 */

import 'dotenv/config';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function simulateLikes(targetUserId) {
  console.log('🎭 Simulating likes for testing mutual matches...\n');
  
  if (!targetUserId) {
    console.error('❌ Please provide a target user ID');
    console.log('Usage: npm run simulate-likes -- YOUR_USER_ID');
    process.exit(1);
  }
  
  try {
    // Get some users to simulate likes from
    const usersQuery = query(collection(db, 'users'), limit(10));
    const usersSnapshot = await getDocs(usersQuery);
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.data().id || doc.id,
      name: doc.data().name
    }));
    
    console.log(`📊 Found ${users.length} users to simulate likes from`);
    console.log(`🎯 Target user: ${targetUserId}`);
    
    // Simulate likes from 5 random users
    const likingUsers = users.slice(0, 5);
    let successCount = 0;
    
    for (const user of likingUsers) {
      if (user.id === targetUserId) {
        console.log(`⏭️ Skipping self-like for ${user.name}`);
        continue;
      }
      
      try {
        const swipeData = {
          type: 'like',
          userId: user.id,
          swipedUserId: targetUserId,
          timestamp: new Date()
        };
        
        await addDoc(collection(db, 'swipes'), swipeData);
        console.log(`✅ ${user.name} (${user.id}) liked ${targetUserId}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to create like from ${user.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully simulated ${successCount} likes!`);
    console.log('\n📱 Now when you like these users back, you should get matches:');
    likingUsers.slice(0, successCount).forEach(user => {
      console.log(`   - ${user.name} (${user.id})`);
    });
    
    console.log('\n🧪 To test:');
    console.log('1. Go to the Discover page');
    console.log('2. Like any of the users listed above');
    console.log('3. You should see a match notification!');
    console.log('4. Check the Matches page to see your new matches');
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Get target user ID from command line arguments
const targetUserId = process.argv[2];
simulateLikes(targetUserId)
  .then(() => {
    console.log('\n🏁 Simulation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Simulation failed:', error);
    process.exit(1);
  });
