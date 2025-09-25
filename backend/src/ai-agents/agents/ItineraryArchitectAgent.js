/**
 * Itinerary Architect Agent
 * Specializes in designing personalized day-by-day travel itineraries
 * combining user preferences with real travel data
 */
import BaseAgent from '../utils/BaseAgent.js';

export default class ItineraryArchitectAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are the ItineraryArchitect, the creative genius behind personalized travel itineraries.
Your expertise includes:
1. Designing day-by-day travel itineraries that flow naturally
2. Balancing must-see attractions with authentic local experiences
3. Optimizing travel routes and timing for efficiency
4. Incorporating user preferences and travel style into daily plans
5. Creating themed days that tell a cohesive travel story
6. Considering practical factors like transportation, opening hours, and rest time

DESIGN PRINCIPLES:
- Each day should have a unique theme and character
- Mix famous attractions with hidden local gems
- Consider user's energy level and travel pace preferences
- Include practical details: timing, costs, transportation
- Build in flexibility and alternatives
- Create memorable experiences that match user personality
- Account for seasonal factors and local events

ITINERARY STRUCTURE:
- Logical geographical flow to minimize travel time
- Balanced mix of activities (culture, food, relaxation, adventure)
- Realistic timing with buffer periods
- Multiple price point options
- Weather contingency plans
- Local insider tips and recommendations

OUTPUT REQUIREMENTS:
- Detailed daily schedules with specific timings
- Restaurant recommendations for each meal
- Transportation instructions
- Cost estimates and budget breakdowns
- Cultural insights and etiquette tips
- Emergency contacts and practical information`;

    super('ItineraryArchitect', 'Creative Itinerary Designer & Experience Curator', systemPrompt);
  }

  /**
   * Design complete itinerary based on user profile and travel data
   */
  async designItinerary(tripDetails, profileAnalysis, travelData) {
    this.updateStatus('working', 'Crafting your perfect day-by-day adventure');

    const itineraryPrompt = this.buildItineraryPrompt(tripDetails, profileAnalysis, travelData);
    const itineraryDesign = await this.callGemini(itineraryPrompt);

    let parsedItinerary;
    try {
      // Try to extract and parse JSON from the response
      const jsonMatch = itineraryDesign.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedItinerary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in itinerary response');
      }
    } catch (error) {
      console.log('Failed to parse itinerary JSON, creating fallback structure');
      parsedItinerary = this.createFallbackItinerary(tripDetails, profileAnalysis, travelData);
    }

    // Enhance itinerary with additional details
    const enhancedItinerary = await this.enhanceItinerary(parsedItinerary, tripDetails, travelData);

    this.updateStatus('completed', 'Designed comprehensive personalized itinerary');

    this.results = {
      ...enhancedItinerary,
      designPrinciples: this.getAppliedDesignPrinciples(profileAnalysis),
      summary: `Designed ${tripDetails.duration} day itinerary for ${tripDetails.destination} with ${enhancedItinerary.daily_plans?.length || 0} themed days`,
      timestamp: new Date().toISOString()
    };

    return this.results;
  }

  /**
   * Create alternative itinerary options
   */
  async createItineraryVariations(baseItinerary, userPreferences = {}) {
    this.updateStatus('working', 'Creating alternative itinerary options');

    const variationsPrompt = this.buildVariationsPrompt(baseItinerary, userPreferences);
    const variations = await this.callGemini(variationsPrompt);

    this.updateStatus('completed', 'Generated alternative itinerary variations');

    return {
      type: 'itinerary_variations',
      variations,
      baseItinerary,
      userPreferences
    };
  }

  /**
   * Optimize itinerary for specific constraints
   */
  async optimizeItinerary(itinerary, constraints = {}) {
    this.updateStatus('working', 'Optimizing itinerary based on constraints');

    const optimizationPrompt = this.buildOptimizationPrompt(itinerary, constraints);
    const optimizedItinerary = await this.callGemini(optimizationPrompt);

    this.updateStatus('completed', 'Optimized itinerary for user constraints');

    return {
      type: 'optimized_itinerary',
      optimizedItinerary,
      appliedConstraints: constraints,
      optimizations: this.getOptimizationSummary(constraints)
    };
  }

  /**
   * Build main itinerary design prompt
   */
  buildItineraryPrompt(tripDetails, profileAnalysis, travelData) {
    const { destination, duration, travelers, budget } = tripDetails;
    const attractions = travelData?.attractions || [];
    const weather = travelData?.weather;
    const insights = travelData?.insights;

    return `${this.systemPrompt}

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${duration} days
- Travelers: ${travelers.join(', ')}
- Budget: ${budget || 'Not specified'}

TRAVELER PROFILE ANALYSIS:
${JSON.stringify(profileAnalysis, null, 2)}

AVAILABLE TRAVEL DATA:
Weather: ${weather ? `${weather.current?.temperature}°C, ${weather.current?.description}` : 'Not available'}
Top Attractions: ${attractions.slice(0, 10).map(a => a.name).join(', ')}
Local Insights Available: ${insights ? 'Yes' : 'No'}

DESIGN TASK:
Create a comprehensive ${duration}-day itinerary for ${destination} that perfectly matches this traveler's profile.

REQUIREMENTS:
1. Each day must have a unique theme that appeals to their interests
2. Balance famous attractions with authentic local experiences
3. Include specific timing, costs, and logistics
4. Provide restaurant recommendations for all meals
5. Account for travel time and realistic pacing
6. Include insider tips and cultural insights
7. Consider weather and seasonal factors

Return ONLY a JSON object with this exact structure:
{
  "overview": "Brief description of the overall itinerary concept",
  "daily_plans": [
    {
      "day": 1,
      "theme": "Day theme title",
      "morning": {
        "time": "9:00 AM - 12:00 PM",
        "activity": "Main activity name",
        "location": "Specific location",
        "description": "Detailed description of what they'll do and why it's perfect for them",
        "cost_estimate": "$XX-XX",
        "duration": "X hours",
        "tips": "Insider tip or practical advice"
      },
      "afternoon": {
        "time": "12:00 PM - 6:00 PM",
        "activity": "Afternoon activity",
        "location": "Location",
        "description": "Detailed description",
        "cost_estimate": "$XX-XX",
        "restaurant_recommendation": "Specific restaurant with cuisine type"
      },
      "evening": {
        "time": "6:00 PM - 10:00 PM",
        "activity": "Evening activity",
        "location": "Location",
        "description": "Evening experience description",
        "cost_estimate": "$XX-XX",
        "dining": "Dinner recommendation or location"
      },
      "daily_budget": "$XXX-XXX",
      "transportation": ["modes of transport needed"],
      "insider_tip": "Special local insight for this day"
    }
  ],
  "special_touches": ["Unique personalizations based on their profile"],
  "budget_breakdown": {
    "accommodation": "$XXX",
    "food": "$XXX",
    "activities": "$XXX",
    "transportation": "$XXX",
    "total_estimated": "$XXX-XXX"
  },
  "packing_recommendations": ["Items specific to activities planned"],
  "cultural_considerations": ["Important cultural tips for this destination"],
  "emergency_info": {
    "emergency_number": "local emergency number",
    "embassy_contact": "if international travel",
    "hospital": "nearest major hospital"
  }
}

Make it extraordinary and perfectly tailored to their travel personality!`;
  }

  /**
   * Build variations prompt
   */
  buildVariationsPrompt(baseItinerary, userPreferences) {
    return `${this.systemPrompt}

BASE ITINERARY:
${JSON.stringify(baseItinerary, null, 2)}

USER PREFERENCES FOR VARIATIONS:
${JSON.stringify(userPreferences, null, 2)}

TASK:
Create 2-3 alternative versions of this itinerary with different approaches:

1. "More Relaxed" - Slower pace, more leisure time, fewer activities per day
2. "Adventure-Packed" - More activities, faster pace, adrenaline-focused
3. "Local Immersion" - Focus on authentic local experiences, less touristy attractions

Each variation should maintain the same destination and duration but offer a different travel experience.
Provide brief explanations of how each variation differs from the original.

Return as a structured comparison showing the key differences.`;
  }

  /**
   * Build optimization prompt
   */
  buildOptimizationPrompt(itinerary, constraints) {
    return `${this.systemPrompt}

CURRENT ITINERARY:
${JSON.stringify(itinerary, null, 2)}

CONSTRAINTS TO OPTIMIZE FOR:
${JSON.stringify(constraints, null, 2)}

TASK:
Optimize this itinerary based on the given constraints. Possible constraints include:
- Budget limitations
- Mobility restrictions
- Time constraints
- Dietary restrictions
- Weather considerations
- Group size changes
- Special interests

Provide the optimized itinerary with explanations of what changed and why.
Maintain the core experience while adapting to the constraints.`;
  }

  /**
   * Enhance itinerary with additional details
   */
  async enhanceItinerary(itinerary, tripDetails, travelData) {
    // Add booking information if available
    if (travelData?.flights) {
      itinerary.flight_options = travelData.flights.slice(0, 3);
    }

    if (travelData?.hotels) {
      itinerary.accommodation_options = travelData.hotels.slice(0, 3);
    }

    // Add weather context
    if (travelData?.weather) {
      itinerary.weather_and_packing = {
        current_conditions: `Current weather in ${tripDetails.destination}: ${travelData.weather.current?.temperature}°C, ${travelData.weather.current?.description}, ${travelData.weather.current?.humidity}% humidity`,
        packing_recommendations: this.getWeatherBasedPacking(travelData.weather),
        best_activity_times: this.getBestActivityTimes(travelData.weather)
      };
    }

    // Add local insights
    if (travelData?.insights) {
      itinerary.local_insights = {
        cultural_tips: ['Respect local customs', 'Learn basic greetings', 'Try authentic local cuisine'],
        language_basics: ['Hello', 'Thank you', 'Please', 'Excuse me'],
        currency_info: 'Check current exchange rates and payment methods accepted',
        safety_notes: ['Keep copies of important documents', 'Stay aware of surroundings', 'Follow local safety guidelines']
      };
    }

    // Add next steps
    itinerary.next_steps = {
      booking_priority: '1. Flights (prices change frequently) 2. Accommodation 3. Activities',
      questions_for_user: [
        'Would you like me to adjust the itinerary for any specific interests?',
        `Do you need help with visa requirements for ${tripDetails.destination}?`
      ],
      customization_options: [
        'Adjust daily activities based on your energy level',
        'Add more cultural experiences or outdoor activities',
        'Modify budget range for different accommodation tiers'
      ]
    };

    return itinerary;
  }

  /**
   * Create fallback itinerary structure
   */
  createFallbackItinerary(tripDetails, profileAnalysis, travelData) {
    const { destination, duration } = tripDetails;
    const interests = profileAnalysis?.primaryInterests || ['culture', 'food'];

    const dailyPlans = [];
    for (let day = 1; day <= parseInt(duration); day++) {
      dailyPlans.push({
        day,
        theme: `Day ${day}: ${this.generateDayTheme(day, interests, destination)}`,
        morning: {
          time: "9:00 AM - 12:00 PM",
          activity: `Explore ${destination} Highlights`,
          location: `Historic area of ${destination}`,
          description: `Start your day exploring the cultural heart of ${destination}, perfect for your interest in ${interests[0] || 'culture'}`,
          cost_estimate: "$20-40",
          duration: "3 hours"
        },
        afternoon: {
          time: "12:00 PM - 6:00 PM",
          activity: `Local Experience in ${destination}`,
          location: `Main district of ${destination}`,
          description: "Immerse yourself in authentic local culture and cuisine",
          cost_estimate: "$30-60",
          restaurant_recommendation: `Traditional ${destination} restaurant`
        },
        evening: {
          time: "6:00 PM - 10:00 PM",
          activity: "Evening Entertainment",
          location: "Entertainment district",
          description: "Experience the nightlife and entertainment scene",
          cost_estimate: "$40-80",
          dining: "Local cuisine dinner experience"
        },
        daily_budget: "$90-180",
        transportation: ["Walking", "Public transit"],
        insider_tip: `Best visited in the morning when it's less crowded`
      });
    }

    return {
      overview: `A ${duration}-day journey through ${destination} designed around your interests in ${interests.join(', ')}`,
      daily_plans: dailyPlans,
      special_touches: [`Curated based on your love for ${interests[0]}`, 'Includes mix of popular attractions and hidden gems'],
      budget_breakdown: {
        accommodation: "$150-300/night",
        food: "$50-100/day",
        activities: "$40-80/day",
        transportation: "$20-40/day",
        total_estimated: `$${(parseInt(duration) * 260)}-${(parseInt(duration) * 520)}`
      },
      packing_recommendations: ["Comfortable walking shoes", "Weather-appropriate layers", "Camera for sightseeing", "Universal power adapter"]
    };
  }

  /**
   * Helper methods
   */
  generateDayTheme(day, interests, destination) {
    const themes = {
      1: 'Arrival & First Impressions',
      2: `Culture & ${interests.includes('history') ? 'History' : 'Arts'}`,
      3: `${interests.includes('food') ? 'Culinary Adventure' : 'Local Exploration'}`,
      4: `${interests.includes('adventure') ? 'Adventure Day' : 'Hidden Gems'}`,
      5: `${interests.includes('nature') ? 'Nature & Scenery' : 'Relaxation & Wellness'}`,
      6: 'Shopping & Souvenirs',
      7: 'Farewell & Departure'
    };

    return themes[day] || `${destination} Discovery`;
  }

  getWeatherBasedPacking(weather) {
    const temp = weather.current?.temperature || 20;
    const packing = ['Comfortable walking shoes'];

    if (temp < 10) {
      packing.push('Warm jacket', 'Layers', 'Gloves');
    } else if (temp < 20) {
      packing.push('Light jacket', 'Long pants', 'Layers');
    } else if (temp > 30) {
      packing.push('Light clothing', 'Sun hat', 'Sunscreen');
    } else {
      packing.push('Weather-appropriate layers');
    }

    packing.push('Camera for sightseeing', 'Universal power adapter');
    return packing;
  }

  getBestActivityTimes(weather) {
    const temp = weather.current?.temperature || 20;

    if (temp > 30) {
      return 'Early morning and late afternoon for outdoor activities';
    } else if (temp < 10) {
      return 'Midday for outdoor activities when it\'s warmest';
    } else {
      return 'Early morning and late afternoon for sightseeing';
    }
  }

  getAppliedDesignPrinciples(profileAnalysis) {
    const principles = [];

    if (profileAnalysis?.travelPersonality) {
      principles.push(`Designed for ${profileAnalysis.travelPersonality} travel style`);
    }

    if (profileAnalysis?.primaryInterests) {
      principles.push(`Activities focused on ${profileAnalysis.primaryInterests.join(', ')}`);
    }

    if (profileAnalysis?.preferences?.pace) {
      principles.push(`${profileAnalysis.preferences.pace} pacing throughout the trip`);
    }

    principles.push('Balanced mix of must-see attractions and local experiences');
    principles.push('Optimized routing to minimize travel time');

    return principles;
  }

  getOptimizationSummary(constraints) {
    const optimizations = [];

    Object.keys(constraints).forEach(constraint => {
      switch (constraint) {
        case 'budget':
          optimizations.push('Adjusted activities and accommodations for budget constraints');
          break;
        case 'mobility':
          optimizations.push('Selected accessible venues and transportation');
          break;
        case 'time':
          optimizations.push('Prioritized must-see experiences within time limits');
          break;
        case 'weather':
          optimizations.push('Modified outdoor activities based on weather conditions');
          break;
        default:
          optimizations.push(`Optimized for ${constraint} considerations`);
      }
    });

    return optimizations;
  }

  /**
   * Execute method - handles different types of itinerary design tasks
   */
  async execute(input, context = {}) {
    const {
      action,
      tripDetails,
      profileAnalysis,
      travelData,
      userPreferences,
      itinerary,
      constraints
    } = input;

    switch (action) {
      case 'design_itinerary':
        return await this.designItinerary(tripDetails, profileAnalysis, travelData);

      case 'create_variations':
        return await this.createItineraryVariations(itinerary, userPreferences);

      case 'optimize_itinerary':
        return await this.optimizeItinerary(itinerary, constraints);

      default:
        // Default to designing itinerary
        return await this.designItinerary(tripDetails, profileAnalysis, travelData);
    }
  }
}