# AI Agent Setup Guide

## Issues Fixed ✅

1. **Environment Configuration**: Fixed `.env.python` file structure
2. **Python Script Path**: Updated to use proper CrewAI system instead of test script
3. **Environment Loading**: Created wrapper script for proper env loading
4. **Error Handling**: Added proper error messages for missing API keys

## Required Setup Steps

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AIzaSy...`)

### 2. Configure Environment Variables
Edit `backend/.env.python` and replace:
```
GEMINI_API_KEY=AIzaSyBH-example-key-replace-with-your-key
```
with your actual API key:
```
GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
```

### 3. Firebase Service Account Key
The system is looking for `serviceAccountKey.json`. Either:
- Add your Firebase service account key file
- Or modify the code to use environment variables instead

### 4. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

## Test the System

After setup, test with:
```bash
cd backend/src/services
python3 run_crewai.py --mode api --destination "Tokyo, Japan" --travelers '["test_user"]' --duration 7
```

## How It Works Now

1. **User sends message** → Frontend detects trip planning request
2. **Node.js service** → Calls Python CrewAI system via `run_crewai.py`
3. **Python wrapper** → Loads environment variables and runs main CrewAI script
4. **CrewAI agents** → Work together to create comprehensive trip plan:
   - **ProfileAnalyst**: Fetches user data from Firebase
   - **DataScout**: Gets flights, hotels, weather from live APIs
   - **ItineraryArchitect**: Creates detailed day-by-day itinerary
   - **ChiefPlanner**: Compiles everything into final plan
5. **Response** → Returns formatted trip plan to frontend

## What to Expect

When working properly, the AI agent will:
- Create personalized 7-day itineraries
- Include real flight and hotel options
- Provide weather forecasts
- Give daily activity recommendations
- Include budget estimates
- Offer cultural insights and tips

The response time is typically 30-60 seconds for a complete trip plan.