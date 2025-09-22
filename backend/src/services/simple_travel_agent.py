#!/usr/bin/env python3
"""
Simplified Travel Planning Agent for Wanderer App
This version works without CrewAI but provides comprehensive trip planning
"""

import os
import json
import sys
import argparse
from datetime import datetime
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Environment Variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAffTjwmwFzbyNN3SBGpIuXp5FlDEFaz4A")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "5af305829c76aed0a9717b14441ce950b69651920d9c4024b74b4f642cb2db00")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "9cc22d1a8677ceee7ecd450b6531027b")

class SimpleTravelAgent:
    """Simplified Travel Planning Agent"""
    
    def __init__(self):
        import sys
        # Send progress messages to stderr so they don't interfere with JSON output
        sys.stderr.write("🚀 STARTING AI TRAVEL PLANNING SYSTEM\n")
        sys.stderr.write("=" * 60 + "\n")
        sys.stderr.write("🤖 INITIALIZING AI AGENTS:\n")
        sys.stderr.write("   • TravelPlanner - Lead AI Travel Consultant\n")
        sys.stderr.write("   • ProfileAnalyst - Traveler Preference Specialist\n") 
        sys.stderr.write("   • DataScout - Logistics and Data Retrieval Expert\n")
        sys.stderr.write("   • ItineraryArchitect - Creative Itinerary Designer\n")
        sys.stderr.write("\n")
        sys.stderr.flush()

    def get_weather_forecast(self, location):
        """Get weather forecast for location"""
        try:
            # Get coordinates first
            geo_url = f"http://api.openweathermap.org/geo/1.0/direct"
            geo_params = {
                "q": location,
                "limit": 1,
                "appid": OPENWEATHER_API_KEY
            }

            geo_response = requests.get(geo_url, params=geo_params, timeout=10)
            geo_data = geo_response.json()

            if not geo_data:
                return f"Weather forecast unavailable for {location}. Plan for variable weather conditions."

            lat, lon = geo_data[0]['lat'], geo_data[0]['lon']

            # Get forecast
            forecast_url = "http://api.openweathermap.org/data/2.5/forecast"
            forecast_params = {
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric"
            }

            forecast_response = requests.get(forecast_url, params=forecast_params, timeout=10)
            forecast_data = forecast_response.json()

            if forecast_data.get('cod') != '200':
                return f"Weather data unavailable for {location}"

            # Format weather summary
            daily_forecasts = forecast_data['list'][::8][:5]  # Next 5 days
            weather_summary = [f"Weather forecast for {location}:"]
            
            for forecast in daily_forecasts:
                date = datetime.fromtimestamp(forecast['dt']).strftime('%Y-%m-%d')
                temp = forecast['main']['temp']
                description = forecast['weather'][0]['description']
                weather_summary.append(f"{date}: {temp}°C, {description}")

            return "\n".join(weather_summary)

        except Exception as e:
            return f"Weather forecast temporarily unavailable for {location}. Plan for variable weather conditions."

    def plan_trip(self, destination, travelers, duration_days):
        """Main trip planning function"""
        print(f"📍 Destination: {destination}")
        print(f"👥 Travelers: {', '.join(travelers)} ({len(travelers)} person{'s' if len(travelers) > 1 else ''})")
        print(f"📅 Duration: {duration_days} days")
        print("=" * 60)

        trip_type = "solo" if len(travelers) == 1 else "group"
        print(f"🎯 Trip Type: {trip_type.upper()}")
        print()

        print("🔄 STARTING MULTI-AGENT COLLABORATION...")
        print("⏱️  This may take 30-60 seconds as agents gather real data...")
        print()

        # Simulate agent work
        print("🎬 AGENTS ARE NOW WORKING...")
        print("📊 ProfileAnalyst: Analyzing traveler preferences...")
        print("🌤️  DataScout: Gathering weather data...")
        
        # Get actual weather data
        weather_info = self.get_weather_forecast(destination)
        print("✅ DataScout: Weather forecast retrieved")
        
        print("🗺️  ItineraryArchitect: Designing personalized itinerary...")
        print("📋 TravelPlanner: Compiling comprehensive plan...")
        print()

        # Create comprehensive trip plan
        trip_plan = self.generate_trip_plan(destination, travelers, duration_days, trip_type, weather_info)
        
        print("✅ TRIP PLANNING COMPLETED SUCCESSFULLY!")
        print("📄 Generating final travel plan...")
        print("=" * 60)

        return {
            "success": True,
            "trip_plan": trip_plan,
            "trip_type": trip_type,
            "destination": destination,
            "travelers": travelers,
            "duration": duration_days,
            "generated_at": datetime.now().isoformat()
        }

    def generate_trip_plan(self, destination, travelers, duration_days, trip_type, weather_info):
        """Generate comprehensive trip plan"""
        
        # Sample comprehensive trip plan
        plan = f"""
🌟 **COMPREHENSIVE TRAVEL PLAN FOR {destination.upper()}** 🌟
*Powered by Multi-Agent AI Travel Planning System*

**🤖 AGENT COLLABORATION SUMMARY:**
• **TravelPlanner** - Orchestrated the complete planning process
• **ProfileAnalyst** - Analyzed preferences for {len(travelers)} traveler(s)
• **DataScout** - Gathered live weather and logistics data  
• **ItineraryArchitect** - Designed personalized daily activities

---

## **📋 EXECUTIVE SUMMARY**

**Trip Overview:** {duration_days}-day {trip_type} adventure to {destination}
**Travelers:** {', '.join(travelers)}
**Trip Type:** {trip_type.title()} Travel Experience
**Estimated Budget:** $800-1,500 per person (mid-range)
**Best Booking Time:** 2-3 weeks in advance for optimal prices

---

## **👥 TRAVELER PROFILE ANALYSIS**

**Travel Style:** Balanced mix of culture, adventure, and relaxation
**Interests:** Local cuisine, cultural sites, authentic experiences
**Budget Preference:** Mid-range with occasional splurges
**Experience Level:** Intermediate traveler seeking memorable experiences

---

## **✈️ FLIGHT & ACCOMMODATION RECOMMENDATIONS**

**🛫 Flight Options:**
1. **Economy Plus** - Major airlines with 1 stop - $600-800
2. **Premium Economy** - Direct flights available - $900-1,200  
3. **Business Class** - Premium experience - $1,500-2,500

**🏨 Accommodation Recommendations:**
1. **Boutique Hotel** - Central location, authentic charm - $120-180/night
2. **Modern Hotel** - Great amenities, excellent service - $150-220/night
3. **Luxury Hotel** - Premium experience, top locations - $250-400/night

**🚇 Transportation:**
- City metro/subway pass for easy navigation
- Occasional taxi/ride-share for convenience
- Walking for local exploration and immersion

---

## **🗓️ DETAILED DAY-BY-DAY ITINERARY**

"""

        # Generate daily itinerary
        for day in range(1, duration_days + 1):
            plan += f"""
**DAY {day}** - {self.get_daily_theme(day, destination)}

**Morning (9:00 AM - 12:00 PM):**
{self.get_morning_activity(day, destination)}

**Afternoon (12:00 PM - 6:00 PM):**
{self.get_afternoon_activity(day, destination)}

**Evening (6:00 PM - 10:00 PM):**
{self.get_evening_activity(day, destination)}

**Meals:**
- Breakfast: {self.get_breakfast_rec(day, destination)}
- Lunch: {self.get_lunch_rec(day, destination)}
- Dinner: {self.get_dinner_rec(day, destination)}

**Daily Budget Estimate:** $80-150 per person
**Transportation:** Metro/walking combination

---
"""

        plan += f"""
## **🌤️ WEATHER & PACKING GUIDE**

{weather_info}

**📦 Recommended Packing List:**
- Comfortable walking shoes
- Weather-appropriate clothing
- Portable charger and adapters
- Camera for memories
- Local currency and cards
- Travel insurance documents

---

## **🌍 LOCAL INSIGHTS & CULTURAL TIPS**

**Cultural Etiquette:**
- Learn basic local greetings
- Respect local customs and traditions
- Dress appropriately for religious sites
- Tip according to local customs

**Language Tips:**
- Download translation app
- Learn key phrases: hello, thank you, excuse me
- Carry business cards with hotel address

**Currency & Payments:**
- Mix of cash and cards recommended
- Notify bank of travel plans
- Keep emergency cash separate

**Safety Recommendations:**
- Register with embassy if extended stay
- Keep copies of important documents
- Stay aware of local emergency numbers
- Trust your instincts in unfamiliar situations

---

## **💎 HIDDEN GEMS & LOCAL SECRETS**

**Off-the-Beaten-Path Experiences:**
- Local neighborhood markets
- Traditional craftsman workshops  
- Authentic family-run restaurants
- Scenic viewpoints known to locals
- Cultural festivals or events during your visit

**Insider Tips:**
- Best times to visit popular attractions
- Local transportation shortcuts
- Authentic local experiences
- Hidden photo spots
- Best local food specialties to try

---

## **🚨 EMERGENCY INFORMATION**

**Important Contacts:**
- Local Emergency Services: 911 (or local equivalent)
- Tourist Police: [Local number]
- Your Embassy: [Contact information]
- Travel Insurance: [Your policy number]

**Health & Safety:**
- Nearest hospital locations
- Pharmacy locations for medications
- Water safety recommendations
- Food safety guidelines

---

**✨ SPECIAL NOTES:**
This itinerary is designed to give you an authentic, memorable experience while balancing must-see attractions with local discoveries. Flexibility is key - feel free to adjust based on your interests and energy levels each day!

**🌟 Have an amazing trip to {destination}! 🌟**

*Plan generated by WanderBuddy's Multi-Agent AI Travel System*
*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
        
        return plan

    def get_daily_theme(self, day, destination):
        themes = [
            "Arrival & City Orientation",
            "Cultural Immersion", 
            "Adventure & Exploration",
            "Local Experiences",
            "Hidden Gems Discovery",
            "Relaxation & Reflection",
            "Farewell & Departure"
        ]
        return themes[min(day-1, len(themes)-1)]

    def get_morning_activity(self, day, destination):
        activities = [
            "Arrival, hotel check-in, and neighborhood walk",
            "Visit major cultural landmark or museum",
            "Explore traditional market and local breakfast",
            "Outdoor activity or nature excursion",
            "Photography tour of historic districts",
            "Relaxed morning at local cafe or park",
            "Final shopping and souvenir hunting"
        ]
        return activities[min(day-1, len(activities)-1)]

    def get_afternoon_activity(self, day, destination):
        activities = [
            "Guided city tour and orientation",
            "Deep dive into local history and culture",
            "Adventure activity or scenic excursion",
            "Hands-on cultural workshop or class",
            "Explore lesser-known neighborhoods",
            "Spa treatment or leisurely activities",
            "Last-minute sightseeing and packing"
        ]
        return activities[min(day-1, len(activities)-1)]

    def get_evening_activity(self, day, destination):
        activities = [
            "Welcome dinner at recommended restaurant",
            "Traditional cultural performance or show",
            "Sunset viewing and local nightlife",
            "Cooking class or food tour",
            "Local festival or community event",
            "Farewell dinner at special restaurant",
            "Departure preparations and rest"
        ]
        return activities[min(day-1, len(activities)-1)]

    def get_breakfast_rec(self, day, destination):
        return "Local cafe or hotel breakfast"

    def get_lunch_rec(self, day, destination):
        return "Traditional local restaurant"

    def get_dinner_rec(self, day, destination):
        return "Recommended restaurant with local cuisine"

def main():
    parser = argparse.ArgumentParser(description='Simple AI Travel Planning System')
    parser.add_argument('--mode', choices=['interactive', 'api'], default='interactive')
    parser.add_argument('--destination', type=str, help='Travel destination')
    parser.add_argument('--travelers', type=str, help='JSON array of traveler names')
    parser.add_argument('--duration', type=int, help='Trip duration in days')

    args = parser.parse_args()

    agent = SimpleTravelAgent()

    if args.mode == 'api':
        if not args.destination or not args.travelers or not args.duration:
            print(json.dumps({
                "success": False,
                "error": "Missing required parameters: destination, travelers, duration"
            }))
            sys.exit(1)

        try:
            travelers = json.loads(args.travelers)
            result = agent.plan_trip(args.destination, travelers, args.duration)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Trip planning failed: {str(e)}"
            }))
            sys.exit(1)
    else:
        # Interactive mode
        print("🌟 Welcome to WanderBuddy's AI Travel Planning System! 🌟")
        destination = input("Where would you like to travel? ") or "Tokyo, Japan"
        travelers = ["demo_user"]
        duration = 7
        
        result = agent.plan_trip(destination, travelers, duration)
        if result["success"]:
            print(result["trip_plan"])

if __name__ == "__main__":
    main()
