# Firebase Setup Instructions

## ✅ IMPORTANT: App Now Works Without Firebase Setup!

**Good News**: The app has been updated with an offline-first system that stores all data locally until Firebase is properly configured. You can use the app immediately with full functionality!

**What Works Right Now**:
- User authentication 
- Profile creation and editing
- Swipe functionality with match detection
- Bucket list management
- All user data persistence (stored locally)

**What Will Work After Firebase Setup**:
- Data syncing across devices
- Real-time updates
- Cloud backup of user data

---

## 🚀 Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup-firebase.sh
```

This will:
1. Install Firebase CLI if needed
2. Login to your Firebase account
3. Deploy the security rules
4. Enable authentication methods

---

## 🔥 Manual Firestore Security Rules Setup

If you prefer manual setup, follow these steps:

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit https://console.firebase.google.com/
   - Select your project `wanderer-8ecac`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Go to the "Rules" tab

3. **Update the Rules**
   - Replace the existing rules with the content from `firestore.rules` file in this project
   - Click "Publish" to save the rules

### Method 2: Using Firebase CLI

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done)
   ```bash
   firebase init firestore
   ```

4. **Deploy the rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

## 🗂️ Firestore Collections Structure

The app uses these collections:

- **`users`** - User profiles and preferences
- **`swipes`** - User swipe history and preferences  
- **`matches`** - User matches and compatibility data
- **`bucketList`** - User travel bucket lists
- **`stories`** - User travel stories (24hr expiry)
- **`travelPlans`** - Trip planning and sharing
- **`messages`** - Chat messages between matched users
- **`conversations`** - Chat conversations between users

## 🔧 Authentication Setup

Make sure Authentication is enabled in your Firebase project:

1. Go to Firebase Console → Authentication
2. Click "Get started" if not already enabled
3. Go to "Sign-in method" tab
4. Enable "Email/Password" and "Google" sign-in methods

## 🛠️ Current Issues & Solutions

### Issue 1: Missing or insufficient permissions
**Solution**: Deploy the Firestore security rules as described above

### Issue 2: Undefined field values in Firestore
**Solution**: Already fixed in the code - undefined values are now filtered out

### Issue 3: React Router warnings
**Solution**: These are just warnings about future versions and don't affect functionality

## ✅ Testing the Setup

After setting up the rules:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try logging in and creating a profile
3. Check the Firestore console to see if data is being created

## 🚨 Temporary Workaround

If you can't set up the rules immediately, the app has fallback mechanisms:
- Uses sample data when Firebase data is unavailable
- Handles permission errors gracefully
- Shows appropriate error messages to users

The app will work with limited functionality until the Firebase rules are properly configured.