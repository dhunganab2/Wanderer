# Setup Instructions for Enhanced AI System

## 1. Service Account Key Setup

**IMPORTANT**: Place your `serviceAccountKey.json` file in this directory:
```
/Users/jalshrestha/Desktop/Projects/Wanderer/backend/serviceAccountKey.json
```

The file should have this structure:
```json
{
  "type": "service_account",
  "project_id": "wanderer-8ecac",
  "private_key_id": "your_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@wanderer-8ecac.iam.gserviceaccount.com",
  "client_id": "your_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
  "universe_domain": "googleapis.com"
}
```

## 2. Environment Variables

Update your `.env` file in the backend directory with:

```env
# Add your Gemini API key here
GEMINI_API_KEY=your_gemini_api_key_here

# These are already configured
SERPAPI_API_KEY=5af305829c76aed0a9717b14441ce950b69651920d9c4024b74b4f642cb2db00
OPENWEATHER_API_KEY=9cc22d1a8677ceee7ecd450b6531027b
```

## 3. Switch to Full CrewAI System

Once you have the API key, edit:
`backend/src/services/aiTravelService.js` line 20

Change:
```javascript
this.pythonScriptPath = path.join(__dirname, 'test_crewai_simple.py');
```

To:
```javascript
this.pythonScriptPath = path.join(__dirname, 'crewAI_travel_system.py');
```

## 4. Test the System

1. Start the backend: `npm run dev`
2. Test with curl:
```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan a 5-day trip to Paris for me"}'
```

## Enhanced Features Now Available:

✅ **Modern AI Chat Design** - Gradient themes and animations
✅ **Smart Trip Detection** - Automatically detects trip planning requests
✅ **Multi-Agent System** - CrewAI agents for comprehensive planning
✅ **Real API Integration** - Live flight, hotel, and weather data
✅ **Interactive Trip Plans** - Rich UI for displaying detailed itineraries
✅ **Enhanced Quick Actions** - Beautiful gradient buttons for common tasks

The system will automatically:
- Fetch user profiles from Firebase
- Research live travel data
- Create personalized itineraries
- Display results in an interactive format