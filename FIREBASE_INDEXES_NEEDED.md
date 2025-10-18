# Firebase Indexes Required

Please create these composite indexes by clicking the links below:

## 1. Swipes Index (userId + timestamp)
**Purpose**: Query user swipes ordered by timestamp

Click here to create: https://console.firebase.google.com/v1/r/project/wanderer-8ecac/firestore/indexes?create_composite=Ck1wcm9qZWN0cy93YW5kZXJlci04ZWNhYy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc3dpcGVzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXRpbWVzdGFtcBACGgwKCF9fbmFtZV9fEAI

## 2. Messages Index (conversationId + read + senderId)
**Purpose**: Query unread messages in a conversation

Click here to create: https://console.firebase.google.com/v1/r/project/wanderer-8ecac/firestore/indexes?create_composite=Ck9wcm9qZWN0cy93YW5kZXJlci04ZWNhYy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVzc2FnZXMvaW5kZXhlcy9fEAEaEgoOY29udmVyc2F0aW9uSWQQARoICgRyZWFkEAEaDAoIc2VuZGVySWQQARoMCghfX25hbWVfXxAB

## Instructions

1. Click on each link above (you must be logged into Firebase Console with the wanderer-8ecac project)
2. Review the index configuration
3. Click "Create Index"
4. Wait for the index to build (usually takes a few minutes)
5. Refresh your app

These indexes are required for:
- Swipes: Fetching user swipe history ordered by time
- Messages: Marking messages as read in conversations

