# Setup Guide

This guide will walk you through setting up Wanderer on your local machine.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Firebase project** - [Create one here](https://console.firebase.google.com/)
- **Google Gemini API key** - [Get it here](https://makersuite.google.com/app/apikey)
- **Google Maps API key** - [Get it here](https://console.cloud.google.com/apis/credentials)
- **SerpAPI key** - [Sign up here](https://serpapi.com/)
- **OpenWeatherMap API key** - [Register here](https://openweathermap.org/api)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd wanderer
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Backend Environment

```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your API keys:

```env
NODE_ENV=development
PORT=3001
GEMINI_API_KEY=your_gemini_api_key
SERPAPI_API_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### 4. Setup Firebase Service Account Key

**This is required for the backend to access Firebase services.**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Go to **"Service Accounts"** tab
5. Click **"Generate new private key"**
6. Click **"Generate key"** in the confirmation popup
7. A JSON file will download automatically

**Place the downloaded file:**
```bash
# Rename and move the downloaded file to the correct location
mv ~/Downloads/your-downloaded-key.json backend/src/services/serviceAccountKey.json
```

### 5. Configure Frontend Environment

```bash
cd frontend
cp env.example .env.local
```

Edit `.env.local` with your Firebase and Google Maps configuration:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 6. Start the Application

```bash
# From the root directory
npm run dev
```

This will start both frontend and backend servers concurrently.

## Access Your Application

- **Frontend:** http://localhost:8083
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Troubleshooting

### Common Issues

**Firebase Authentication Errors:**
- Make sure you placed `serviceAccountKey.json` in `backend/src/services/`
- Verify the file contains valid JSON (not corrupted)
- Check that your Firebase project ID matches the one in the key file

**API Connection Issues:**
- Verify all API keys are valid and have proper permissions
- Check that your Firebase project is properly configured
- Ensure all environment variables are set correctly

**Google Maps API Issues:**
- Make sure Maps Embed API is enabled in Google Cloud Console
- Verify billing is set up for your Google Cloud project
- Check API key restrictions (HTTP referrers should include `http://localhost:8083/*`)
- Ensure your API key has proper permissions

**Port Conflicts:**
- If port 3001 is busy, change `PORT` in your `.env` file
- If port 8083 is busy, the frontend will automatically use the next available port

### Getting Help

If you encounter issues not covered here:

1. Check the console logs for specific error messages
2. Verify all API keys are correct and active
3. Ensure your Firebase project has Firestore enabled
4. Make sure all dependencies are installed correctly

## Development Tips

- Use `npm run dev` to start both servers with hot reload
- Check `http://localhost:3001/health` to verify backend is running
- Monitor console logs for any initialization issues
- The service account key file should never be committed to git

## Next Steps

Once everything is running:

1. Create a user account through the frontend
2. Explore the matching system
3. Try the AI travel planning features
4. Test the real-time messaging


