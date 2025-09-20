#!/usr/bin/env node

/**
 * Test script to verify Firebase connection and user count
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCh-VRUsmkM61tSuxu6NaKhQDhIJTt3HNo",
  authDomain: "wanderer-8ecac.firebaseapp.com",
  projectId: "wanderer-8ecac",
  storageBucket: "wanderer-8ecac.firebasestorage.app",
  messagingSenderId: "441088789276",
  appId: "1:441088789276:web:5922cf14a6a5be961808d9",
  measurementId: "G-0M8HXZPRH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...\n');
  
  try {
    // Test with different limits to see what's happening
    const limits = [50, 100, 150, 200];
    
    for (const limitCount of limits) {
      console.log(`📊 Testing with limit ${limitCount}:`);
      
      const usersQuery = query(collection(db, 'users'), limit(limitCount));
      const querySnapshot = await getDocs(usersQuery);
      
      console.log(`  ✅ Retrieved ${querySnapshot.docs.length} users`);
      
      // Sample first few users
      const sampleUsers = querySnapshot.docs.slice(0, 3).map(doc => {
        const data = doc.data();
        return {
          id: data.id || doc.id,
          name: data.name,
          location: data.location
        };
      });
      
      console.log(`  📝 Sample users:`, sampleUsers);
      console.log('');
    }
    
    // Test without any limit
    console.log('📊 Testing without limit:');
    const allUsersQuery = collection(db, 'users');
    const allUsersSnapshot = await getDocs(allUsersQuery);
    console.log(`  ✅ Total users without limit: ${allUsersSnapshot.docs.length}`);
    
    console.log('\n🎉 Firebase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    process.exit(1);
  }
}

// Run test
testFirebaseConnection()
  .then(() => {
    console.log('\n🏁 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
