#!/usr/bin/env node

/**
 * Verification script to check the migrated user data in Firebase Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, where } from 'firebase/firestore';

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

async function verifyMigration() {
  console.log('🔍 Verifying migration data in Firebase Firestore...\n');
  
  try {
    // Get all users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.docs.length;
    
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Count enhanced users specifically
    const enhancedUsersQuery = query(
      collection(db, 'users'),
      where('id', '>=', 'enhanced_user_1')
    );
    const enhancedSnapshot = await getDocs(enhancedUsersQuery);
    const enhancedUsers = enhancedSnapshot.docs.length;
    
    console.log(`🎯 Enhanced users: ${enhancedUsers}`);
    
    // Sample a few users to check data integrity
    console.log('\n📝 Sample user data:');
    const sampleUsers = usersSnapshot.docs.slice(0, 3);
    
    sampleUsers.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`\n${index + 1}. User ID: ${userData.id || doc.id}`);
      console.log(`   Name: ${userData.name}`);
      console.log(`   Age: ${userData.age}`);
      console.log(`   Location: ${userData.location}`);
      console.log(`   Travel Styles: ${userData.travelStyle?.join(', ')}`);
      console.log(`   Interests: ${userData.interests?.slice(0, 3).join(', ')}...`);
      console.log(`   Photos: ${userData.photos?.length || 0} photos`);
      console.log(`   Verified: ${userData.verified}`);
    });
    
    // Check data completeness
    console.log('\n🔍 Data completeness check:');
    let validUsers = 0;
    let incompleteUsers = [];
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const requiredFields = ['name', 'age', 'location', 'travelStyle', 'interests', 'bio'];
      const missingFields = requiredFields.filter(field => !userData[field] || (Array.isArray(userData[field]) && userData[field].length === 0));
      
      if (missingFields.length === 0) {
        validUsers++;
      } else {
        incompleteUsers.push({
          id: userData.id || doc.id,
          name: userData.name,
          missingFields
        });
      }
    });
    
    console.log(`✅ Complete users: ${validUsers}/${totalUsers} (${Math.round((validUsers/totalUsers) * 100)}%)`);
    
    if (incompleteUsers.length > 0) {
      console.log(`⚠️  Incomplete users: ${incompleteUsers.length}`);
      incompleteUsers.slice(0, 3).forEach(user => {
        console.log(`   - ${user.name || user.id}: Missing ${user.missingFields.join(', ')}`);
      });
    }
    
    // Check swipes and matches
    const swipesSnapshot = await getDocs(collection(db, 'swipes'));
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    
    console.log(`\n💕 Swipes in database: ${swipesSnapshot.docs.length}`);
    console.log(`🎯 Matches in database: ${matchesSnapshot.docs.length}`);
    
    // Travel styles distribution
    console.log('\n🎨 Travel styles distribution:');
    const travelStyleCount = {};
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.travelStyle && Array.isArray(userData.travelStyle)) {
        userData.travelStyle.forEach(style => {
          travelStyleCount[style] = (travelStyleCount[style] || 0) + 1;
        });
      }
    });
    
    const sortedStyles = Object.entries(travelStyleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedStyles.forEach(([style, count]) => {
      console.log(`   ${style}: ${count} users`);
    });
    
    console.log('\n✅ Migration verification completed successfully!');
    console.log('\n🎉 Summary:');
    console.log(`   - Total users: ${totalUsers}`);
    console.log(`   - Enhanced users: ${enhancedUsers}`);
    console.log(`   - Complete profiles: ${validUsers}`);
    console.log(`   - Data integrity: ${Math.round((validUsers/totalUsers) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyMigration()
  .then(() => {
    console.log('\n🏁 Verification script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  });
