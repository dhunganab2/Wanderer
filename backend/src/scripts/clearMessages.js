// Clear all fake messages and conversations from Firebase
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

async function clearMessagesAndConversations() {
  console.log('🧹 Clearing all messages and conversations from Firebase...');

  try {
    // Clear messages
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    console.log(`📊 Found ${messagesSnapshot.docs.length} messages to delete`);
    
    for (const messageDoc of messagesSnapshot.docs) {
      await deleteDoc(doc(db, 'messages', messageDoc.id));
    }
    console.log('✅ All messages cleared');

    // Clear conversations
    const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
    console.log(`📊 Found ${conversationsSnapshot.docs.length} conversations to delete`);
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      await deleteDoc(doc(db, 'conversations', conversationDoc.id));
    }
    console.log('✅ All conversations cleared');

    console.log('🎉 Message database cleaned! You can now start fresh with real conversations.');
    
  } catch (error) {
    console.error('❌ Error clearing message data:', error);
  }
}

clearMessagesAndConversations().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
