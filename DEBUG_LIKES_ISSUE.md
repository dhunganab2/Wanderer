# 🐛 DEBUG: Likes Going to Matches Instead of Likes Sent

## 🔍 **Step-by-Step Debug Process:**

### **Step 1: Clear All Local Data**
1. **Go to Discover page**
2. **Click "Clear Matches" button** (red button in debug panel)
3. **Check browser console** for detailed logs
4. **Refresh the page completely** (Cmd+R or Ctrl+R)

### **Step 2: Check Current State**
1. **Go to Matches page**
2. **Open browser console** (F12 → Console tab)
3. **Look for logs starting with 🔍**
4. **Check what data is loaded:**
   - `matches`: Should be empty or very few
   - `likes`: Should be empty initially
   - `likedUserIds`: Should be empty
   - `matchedUserIds`: Should be empty

### **Step 3: Test Like Recording**
1. **Go to Discover page**
2. **Like ONE user** (note which user)
3. **Check console logs** for:
   ```
   🔥 Liked user: [userId] by user: [yourId]
   ✅ Swipe recorded in local store
   ✅ Swipe recorded in Firebase
   👍 Like sent, waiting for them to like back
   ```

### **Step 4: Check Matches Page After Like**
1. **Go to Matches page immediately**
2. **Check console logs** for:
   ```
   🔍 Matches Debug: {
     totalMatches: 0,        // Should be 0
     pendingLikes: 1,        // Should be 1
     likedUserIds: [userId], // Should contain the user you liked
     matchedUserIds: []      // Should be empty
   }
   ```

### **Step 5: Verify Tab Contents**
1. **"Matches" tab should show (0)**
2. **"Likes Sent" tab should show (1)**
3. **Click "Likes Sent" tab**
4. **Should see the user you just liked**

## 🚨 **If Issue Persists:**

### **Check for Data Conflicts:**
In browser console, run:
```javascript
// Check current state
console.log('Store state:', useAppStore.getState());

// Check Firebase data directly
console.log('Testing Firebase...');
testUserService();

// Clear everything
clearLocalMatches();
```

### **Common Issues:**

1. **Old Persisted Data:**
   - Solution: Click "Clear Matches" and refresh page

2. **Firebase vs Local Data Conflict:**
   - Check console for "⚠️ Found local store matches"
   - Clear local storage completely

3. **Wrong Tab Logic:**
   - Check if `likedUserIds` contains your liked users
   - Check if `matchedUserIds` is empty for new likes

## 🔧 **Manual Fix:**

If the issue persists, run this in browser console:
```javascript
// Clear everything manually
localStorage.removeItem('wander-app-store');
useAppStore.setState({ matches: [], swipeHistory: [] });
location.reload();
```

## 📊 **Expected Debug Output:**

### **After Liking a User:**
```
🔥 Liked user: enhanced_user_5 by user: JPZ4tYsv...
✅ Swipe recorded in local store  
✅ Swipe recorded in Firebase
👍 Like sent, waiting for them to like back
Like sent to Maya!
```

### **On Matches Page:**
```
🔍 Matches Debug: {
  totalMatches: 0,
  mutualMatches: 0,
  matchedUserObjects: 0,
  likedUserIds: 1,
  pendingLikes: 1,
  availableUsers: 148
}

🔍 Raw data: {
  matches: [],
  likes: [{swipedUserId: "enhanced_user_5", type: "like"}],
  likedUserIds: ["enhanced_user_5"],
  matchedUserIds: []
}
```

### **Tab Counts Should Show:**
- **Matches (0)**
- **Likes Sent (1)**

## 🎯 **If Still Not Working:**

1. **Take screenshot** of console logs
2. **Check what's in each tab**
3. **Run the debug commands** above
4. **Share the console output**

The issue is likely either:
- Old persisted data not cleared
- Firebase data loading incorrectly  
- Tab logic getting confused by mixed data sources

**Try the "Clear Matches" button and full page refresh first!** 🔄
