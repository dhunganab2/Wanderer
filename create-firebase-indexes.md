# Firebase Index Creation Guide

## Required Indexes for imageMetadata Collection

You need to create a composite index in Firebase Console for the `imageMetadata` collection.

### Index 1: For getUserAvatar and getUserCoverImage queries
- **Collection**: `imageMetadata`
- **Fields**:
  - `isActive` (Ascending)
  - `type` (Ascending) 
  - `userId` (Ascending)
  - `uploadedAt` (Descending)

### How to Create the Index:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wanderer-8ecac`
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Set Collection ID to: `imageMetadata`
6. Add the following fields in order:
   - Field: `isActive`, Order: `Ascending`
   - Field: `type`, Order: `Ascending`
   - Field: `userId`, Order: `Ascending`
   - Field: `uploadedAt`, Order: `Descending`
7. Click **Create**

### Alternative: Use the Direct Link
Click this link to create the index directly:
https://console.firebase.google.com/v1/r/project/wanderer-8ecac/firestore/indexes?create_composite=ClRwcm9qZWN0cy93YW5kZXJlci04ZWNhYy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvaW1hZ2VNZXRhZGF0YS9pbmRleGVzL18QARoMCghpc0FjdGl2ZRABGggKBHR5cGUQARoKCgZ1c2VySWQQARoOCgp1cGxvYWRlZEF0EAIaDAoIX19uYW1lX18QAg

## Firebase Storage CORS Configuration

For local development, you may need to configure CORS for Firebase Storage:

1. Go to Firebase Console → Storage
2. Go to Rules tab
3. Make sure rules allow uploads from localhost

Current rules should be:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Testing

After creating the index:
1. Wait 2-3 minutes for the index to build
2. Try uploading images again
3. Check the console for successful uploads
