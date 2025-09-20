// Clear all matches and swipes from Firebase to start fresh
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
