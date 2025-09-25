// Debug script to check what's actually in the Firebase database
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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

async function debugDatabase() {
  console.log('🔍 DEBUGGING FIREBASE DATABASE...\n');

  try {
    // Check users count
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`👥 USERS: ${usersSnapshot.docs.length} users in database`);

    // Check swipes (likes/passes)
    const swipesSnapshot = await getDocs(collection(db, 'swipes'));
    console.log(`👍 SWIPES: ${swipesSnapshot.docs.length} swipes in database`);
    
    if (swipesSnapshot.docs.length > 0) {
      console.log('\n📝 Recent swipes:');
      swipesSnapshot.docs.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.userId} ${data.type}d ${data.swipedUserId} at ${data.timestamp?.toDate?.() || 'unknown'}`);
      });
    }

    // Check matches
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    console.log(`\n💕 MATCHES: ${matchesSnapshot.docs.length} matches in database`);
    
    if (matchesSnapshot.docs.length > 0) {
      console.log('\n📝 Recent matches:');
      matchesSnapshot.docs.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`  - Match between: ${data.users?.join(' <-> ')} (${data.status})`);
      });
    }

    // Check conversations
    const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
    console.log(`\n💬 CONVERSATIONS: ${conversationsSnapshot.docs.length} conversations in database`);
    
    if (conversationsSnapshot.docs.length > 0) {
      console.log('\n📝 Conversation details:');
      conversationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ID: ${doc.id}`);
        console.log(`    Participants: ${data.participants?.join(', ')}`);
        console.log(`    Last message: "${data.lastMessage || 'none'}"`);
        console.log(`    Last message at: ${data.lastMessageAt?.toDate?.() || 'unknown'}`);
        console.log('');
      });
    }

    // Check messages
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    console.log(`📨 MESSAGES: ${messagesSnapshot.docs.length} messages in database`);
    
    if (messagesSnapshot.docs.length > 0) {
      console.log('\n📝 Recent messages:');
      const messagesQuery = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(10));
      const recentMessages = await getDocs(messagesQuery);
      
      recentMessages.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - "${data.content}" from ${data.senderId} in ${data.conversationId} at ${data.timestamp?.toDate?.() || 'unknown'}`);
      });
    } else {
      console.log('❌ NO MESSAGES FOUND - This is the problem!');
    }

    console.log('\n🔍 SUMMARY:');
    console.log(`Users: ${usersSnapshot.docs.length}`);
    console.log(`Swipes: ${swipesSnapshot.docs.length}`);
    console.log(`Matches: ${matchesSnapshot.docs.length}`);
    console.log(`Conversations: ${conversationsSnapshot.docs.length}`);
    console.log(`Messages: ${messagesSnapshot.docs.length}`);

  } catch (error) {
    console.error('❌ Error debugging database:', error);
  }
}

debugDatabase().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
