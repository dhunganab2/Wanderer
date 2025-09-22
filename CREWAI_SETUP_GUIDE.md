# Wanderer CrewAI Multi-Agent Travel Planning System

## Overview

The Wanderer app now features a sophisticated multi-agent AI travel planning system powered by CrewAI. This system replaces the basic AI chat with a comprehensive trip planning assistant that can:

- **Analyze user profiles** from Firebase Firestore
- **Research live data** using SerpAPI for flights, hotels, and activities
- **Get weather forecasts** from OpenWeatherMap API
- **Create detailed itineraries** with real recommendations
- **Generate complete travel plans** with logistics, costs, and tips

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Node.js       │    │   Python        │
│   (React)       │◄──►│   Backend       │◄──►│   CrewAI        │
│                 │    │                 │    │   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                              ┌─────────┼─────────┐
                                              │         │         │
                                         Firebase   SerpAPI   Weather
                                         Firestore            API
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set up Environment Variables

Create or update `.env` files:

**Backend `.env`:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_API_KEY=5af305829c76aed0a9717b14441ce950b69651920d9c4024b74b4f642cb2db00
OPENWEATHER_API_KEY=9cc22d1a8677ceee7ecd450b6531027b
```

**Python `.env.python`:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_API_KEY=5af305829c76aed0a9717b14441ce950b69651920d9c4024b74b4f642cb2db00
OPENWEATHER_API_KEY=9cc22d1a8677ceee7ecd450b6531027b
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIREBASE_PROJECT_ID=wanderer-8ecac
LOG_LEVEL=INFO
CREWAI_TELEMETRY=false
```

### 3. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`wanderer-8ecac`)
3. Go to Project Settings → Service Accounts
4. Generate a new private key
5. Save as `backend/serviceAccountKey.json`

**Required format:**
```json
{
  "type": "service_account",
  "project_id": "wanderer-8ecac",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "...",
  "universe_domain": "googleapis.com"
}
```

### 4. API Keys Setup

#### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to both `.env` files

#### SerpAPI Key (Provided)
- Key: `5af305829c76aed0a9717b14441ce950b69651920d9c4024b74b4f642cb2db00`
- Already configured in the system

#### OpenWeatherMap Key (Provided)
- Key: `9cc22d1a8677ceee7ecd450b6531027b`
- Already configured in the system

## System Components

### CrewAI Agents

1. **ChiefTravelPlanner** (Manager)
   - Role: Lead AI Travel Consultant
   - Responsibilities: Orchestrate team, compile final plans
   - Tools: None (delegates to workers)

2. **ProfileAnalyst** (Worker)
   - Role: Traveler Preference Specialist
   - Responsibilities: Fetch and analyze user profiles from Firebase
   - Tools: Firebase Firestore connector

3. **DataScout** (Worker)
   - Role: Logistics and Data Retrieval Expert
   - Responsibilities: Find flights, hotels, weather data
   - Tools: SerpAPI, OpenWeatherMap API

4. **ItineraryArchitect** (Worker)
   - Role: Creative Itinerary Designer
   - Responsibilities: Design detailed day-by-day itineraries
   - Tools: SerpAPI for activities and restaurants

### Frontend Components

- **AITravelBuddy.tsx**: Main chat interface with enhanced trip plan support
- **TripPlanDisplay.tsx**: Rich display component for trip plans with tabs and interactive elements
- **Updated types**: Enhanced with trip plan metadata and message types

### Backend Integration

- **aiTravelService.js**: Enhanced to detect trip planning requests and interface with Python system
- **Python subprocess**: Spawns CrewAI system for complex trip planning
- **Fallback system**: Falls back to Gemini chat for non-trip-planning requests

## Usage

### For Users

1. **Regular Chat**: Ask general travel questions
   - "What are some budget travel tips?"
   - "Tell me about solo travel safety"

2. **Trip Planning**: Request comprehensive trip plans
   - "Plan a 7-day trip to Tokyo for me and my friend Sarah"
   - "Create an itinerary for a week in Paris"
   - "Plan a solo trip to Iceland for 5 days"

### Trip Planning Features

The system will automatically:
- Fetch user profiles from Firebase
- Research live flight and hotel options
- Get accurate weather forecasts
- Create personalized itineraries
- Provide budget estimates
- Include local tips and cultural insights

### Response Types

- **Chat responses**: Quick answers and advice
- **Trip plans**: Comprehensive travel plans with:
  - Executive summary
  - Flight and hotel options
  - Day-by-day itinerary
  - Weather and packing guide
  - Local insights and tips
  - Emergency information

## Testing

### Test the Python System Directly

```bash
cd backend/src/services
python3 crewAI_travel_system.py --mode interactive
```

### Test via API Mode

```bash
python3 crewAI_travel_system.py --mode api --destination "Tokyo, Japan" --travelers '["user1", "user2"]' --duration 7
```

### Test Full Integration

1. Start the backend server
2. Open the frontend
3. Open the AI chat panel
4. Ask: "Plan a 7-day trip to Tokyo for me"

## Troubleshooting

### Common Issues

1. **Python dependencies missing**
   ```bash
   pip install crewai crewai-tools langchain-google-genai firebase-admin
   ```

2. **Firebase permissions error**
   - Ensure `serviceAccountKey.json` is in the correct location
   - Check Firebase project ID matches

3. **API rate limits**
   - SerpAPI: 100 requests/month on free tier
   - OpenWeatherMap: 1000 requests/month on free tier
   - Gemini: Rate limits vary by plan

4. **Python script timeout**
   - Default timeout: 2 minutes
   - Complex trip plans may take longer
   - System falls back to regular chat

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
```

### File Permissions

Ensure Python script is executable:
```bash
chmod +x backend/src/services/crewAI_travel_system.py
```

## Performance Considerations

- **First request**: May take 30-60 seconds as agents initialize
- **Subsequent requests**: Faster due to agent caching
- **Fallback system**: Ensures chat always works even if CrewAI fails
- **Timeout handling**: Prevents hanging requests

## Security Notes

- Firebase service account key contains sensitive credentials
- Add `serviceAccountKey.json` to `.gitignore`
- API keys should be kept secure
- Use environment variables for all secrets

## Future Enhancements

Potential improvements:
- Cache trip plans in database
- User rating and feedback system
- Integration with booking platforms
- Real-time price monitoring
- Multi-language support
- Voice interface
- Mobile app integration

## API Integration Details

The system integrates with several external APIs:

### SerpAPI Integration
- **Purpose**: Search for flights, hotels, activities, restaurants
- **Usage**: Automated searches based on destination and preferences
- **Rate Limits**: 100 searches/month (free tier)

### OpenWeatherMap Integration
- **Purpose**: 5-day weather forecasts
- **Usage**: Location-based weather data for packing and activity planning
- **Rate Limits**: 1000 requests/month (free tier)

### Firebase Firestore Integration
- **Purpose**: User profile storage and retrieval
- **Usage**: Fetch traveler preferences, interests, travel style
- **Collections**: `users` collection with username as document ID

### Google Gemini Integration
- **Purpose**: Natural language processing and generation
- **Usage**: Powers both regular chat and trip plan compilation
- **Models**: `gemini-1.5-pro` for CrewAI, `gemini-1.5-flash` for chat

## Deployment Considerations

For production deployment:

1. **Environment Setup**
   - Use production API keys
   - Set up proper Firebase security rules
   - Configure rate limiting

2. **Scaling**
   - Consider API rate limits
   - Implement request queuing for high traffic
   - Cache frequently requested destinations

3. **Monitoring**
   - Log API usage and costs
   - Monitor response times
   - Track user satisfaction

4. **Security**
   - Secure API keys in production environment
   - Implement user authentication
   - Add request validation

This system represents a significant upgrade to the Wanderer app's AI capabilities, providing users with comprehensive, personalized travel planning powered by real-time data and advanced AI coordination.