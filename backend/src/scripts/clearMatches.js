// Clear all matches and swipes from Firebase to start fresh
import 'dotenv/config';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearMatchesAndSwipes() {
  console.log('🧹 Clearing all matches and swipes from Firebase...');

  try {
    // Clear matches
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    console.log(`📊 Found ${matchesSnapshot.docs.length} matches to delete`);
    
    for (const matchDoc of matchesSnapshot.docs) {
      await deleteDoc(doc(db, 'matches', matchDoc.id));
    }
    console.log('✅ All matches cleared');

    // Clear swipes
    const swipesSnapshot = await getDocs(collection(db, 'swipes'));
    console.log(`📊 Found ${swipesSnapshot.docs.length} swipes to delete`);
    
    for (const swipeDoc of swipesSnapshot.docs) {
      await deleteDoc(doc(db, 'swipes', swipeDoc.id));
    }
    console.log('✅ All swipes cleared');

    console.log('🎉 Database cleaned! You can now start fresh with likes and matches.');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

clearMatchesAndSwipes().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
