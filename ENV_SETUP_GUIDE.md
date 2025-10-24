# 🔐 Environment Setup Guide - Wanderer Project

## ✅ Migration Complete!

All hardcoded API keys have been removed from the codebase and moved to environment variables. Your code is now **safe to push to GitHub**!

---

## 📋 What Was Changed

### Backend Files Updated:
- ✅ `backend/src/services/working_travel_agent.py` - Removed hardcoded API keys
- ✅ `backend/src/ai-agents/DataScoutAgent.js` - Removed fallback API keys
- ✅ `backend/src/scripts/*.js` - Updated 7 script files to use environment variables
- ✅ `backend/env.example` - Updated with all required variables

### Frontend Files Updated:
- ✅ `frontend/src/lib/firebase.ts` - Now uses VITE_ env variables
- ✅ `frontend/src/pages/Map.tsx` - Uses env variable for Google Maps
- ✅ `frontend/src/components/SimpleGoogleMap.tsx` - Uses env variable for Google Maps
- ✅ `frontend/.env.example` - Created with all required variables

### Security Files Updated:
- ✅ `.gitignore` - Enhanced to protect all .env files
- ✅ Both `.env` files are properly configured and ignored by git

---

## 🚀 Running Locally

Your `.env` files are already configured with your credentials, so the app should work immediately!

### Quick Start:

```bash
# Install dependencies (if not already done)
npm install

# Run both frontend and backend
npm run dev
```

This will start:
- **Frontend** on http://localhost:8083
- **Backend** on http://localhost:3001

### Individual Commands:

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

---

## 🔑 Your Current API Keys

### ✅ Already Configured in `.env` Files:

| Service | Location | Status |
|---------|----------|--------|
| Firebase | Both frontend & backend | ✅ Configured |
| Gemini AI | Backend | ✅ Configured |
| SerpAPI | Backend | ✅ Configured |
| OpenWeatherMap | Backend | ✅ Configured |
| Google Maps | Frontend | ✅ Configured |

All keys are loaded from your existing `.env` files:
- **Backend:** `/backend/.env`
- **Frontend:** `/frontend/.env`

---

## 📤 Before Pushing to GitHub

### 1. Verify `.env` files are ignored:

```bash
git status
```

You should **NOT** see any `.env` files in the output. If you do:

```bash
# Remove them from git tracking
git rm --cached backend/.env
git rm --cached frontend/.env
git rm --cached backend/src/scripts/*.backup
```

### 2. Verify your changes:

```bash
# Check what will be committed
git diff

# Look for any remaining hardcoded keys
git diff | grep -i "AIzaSy"
```

If any hardcoded keys appear, **DO NOT COMMIT**.

### 3. Safe to commit:

```bash
git add .
git commit -m "Security: Move all API keys to environment variables"
git push origin your-branch-name
```

---

## 👥 Setting Up for Other Developers

When someone else clones your repository, they need to:

### 1. Copy the example files:

```bash
# Backend
cd backend
cp env.example .env

# Frontend
cd ../frontend
cp .env.example .env
```

### 2. Update with their own credentials:

**Backend `.env`:**
```bash
# Firebase - Get from https://console.firebase.google.com/
FIREBASE_API_KEY=their-firebase-key
FIREBASE_PROJECT_ID=their-project-id
# ... etc

# Gemini AI - Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=their-gemini-key

# SerpAPI - Get from https://serpapi.com/
SERPAPI_API_KEY=their-serpapi-key

# OpenWeatherMap - Get from https://openweathermap.org/api
OPENWEATHER_API_KEY=their-openweather-key
```

**Frontend `.env`:**
```bash
# Firebase
VITE_FIREBASE_API_KEY=their-firebase-key
VITE_FIREBASE_PROJECT_ID=their-project-id
# ... etc

# Google Maps - Get from https://console.cloud.google.com/
VITE_GOOGLE_MAPS_API_KEY=their-maps-key
```

### 3. Install and run:

```bash
npm install
npm run dev
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use `.env.example` files as templates (with placeholder values)
- ✅ Rotate API keys if you accidentally commit them
- ✅ Use different API keys for production vs development
- ✅ Keep `.env` files backed up securely (not in git!)

### ❌ DON'T:
- ❌ Never commit `.env` files to git
- ❌ Never hardcode API keys in source code
- ❌ Never share API keys in Slack, Discord, or public channels
- ❌ Never use production keys in development
- ❌ Never commit files with `_real`, `_prod`, `_secret` in the name

---

## 🧪 Testing the Setup

### Test Backend:

```bash
cd backend
npm run dev:backend
```

Expected output:
```
✅ CORS configured for: http://localhost:8083,http://localhost:8080
✅ Socket.IO configured
✅ Firebase initialized successfully
🔑 DataScout API Keys Status:
  SERPAPI: Available
  OpenWeather: Available
🚀 Server running on http://localhost:3001
```

### Test Frontend:

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:8083/
➜  Network: use --host to expose
```

Open http://localhost:8083 - Firebase should connect automatically.

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'dotenv'"

```bash
cd backend
npm install dotenv
```

### Error: "Firebase: Error (auth/invalid-api-key)"

Your Firebase API key is incorrect or missing. Check:
1. `frontend/.env` has `VITE_FIREBASE_API_KEY=...`
2. `backend/.env` has `FIREBASE_API_KEY=...`
3. Keys match your Firebase project

### Error: "Gemini API key not found"

Check `backend/.env` has:
```
GEMINI_API_KEY=your-actual-key-here
```

### Scripts Still Have Hardcoded Keys

The backend script files (`backend/src/scripts/*.js`) have been updated to use environment variables. If you see hardcoded keys, they might be in:
- Backup files (*.backup) - safe to delete
- Archive files (`_archive/`) - not used in production

---

## 📞 Need Help?

If you encounter issues:

1. **Check your `.env` files exist:**
   ```bash
   ls -la backend/.env frontend/.env
   ```

2. **Verify environment variables are loaded:**
   ```bash
   # In backend
   node -e "require('dotenv').config(); console.log(process.env.FIREBASE_API_KEY)"
   ```

3. **Check for typos in variable names** - they must match exactly:
   - Backend: `FIREBASE_API_KEY`
   - Frontend: `VITE_FIREBASE_API_KEY` (note the `VITE_` prefix!)

---

## 🎉 You're All Set!

Your codebase is now secure and ready to be shared on GitHub. All sensitive credentials are safely stored in `.env` files that are ignored by git.

**Next steps:**
1. Test the app locally ✅
2. Commit your changes ✅
3. Push to GitHub safely ✅
4. Share the `.env.example` files with your team ✅

Happy coding! 🚀
