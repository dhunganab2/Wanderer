/**
 * Data Scout Agent
 * Specializes in gathering real-time travel data from various APIs
 * including flights, hotels, weather, and local information
 */
import BaseAgent from './BaseAgent.js';
import fetch from 'node-fetch';

export default class DataScoutAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are the DataScout, a specialist in gathering and analyzing real-time travel data.
Your expertise includes:
1. Fetching live flight data and finding the best options
2. Researching accommodation options with real pricing
3. Getting current weather data and forecasts
4. Finding local attractions, restaurants, and activities
5. Gathering transportation and logistics information
6. Researching cultural events and seasonal considerations

DATA PRIORITIES:
- Always use real APIs when available, never mock data
- Provide multiple options with different price points
- Include practical details like timing, booking links, location
- Consider seasonal factors and local conditions
- Verify data freshness and reliability

OUTPUT REQUIREMENTS:
- Structure data for easy consumption by other agents
- Include confidence levels and data sources
- Provide fallback options when primary sources fail
- Format pricing and availability clearly
- Include relevant warnings or considerations`;

    super('DataScout', 'Logistics & Data Retrieval Expert', systemPrompt);

    // API configurations - NO hardcoded fallback keys for security
    this.apiKeys = {
      serpapi: process.env.SERPAPI_API_KEY,
      openweather: process.env.OPENWEATHER_API_KEY,
      rapidapi: process.env.RAPIDAPI_KEY
    };

    // Log API key status
    console.log('🔑 DataScout API Keys Status:');
    console.log('  SERPAPI:', this.apiKeys.serpapi ? 'Available' : 'Missing');
    console.log('  OpenWeather:', this.apiKeys.openweather ? 'Available' : 'Missing');
    console.log('  RapidAPI:', this.apiKeys.rapidapi ? 'Available' : 'Missing');

    this.apiEndpoints = {
      serpapi: 'https://serpapi.com/search.json',
      openweather: 'https://api.openweathermap.org/data/2.5',
      flights: 'https://serpapi.com/search.json',
      hotels: 'https://serpapi.com/search.json'
    };
  }

  /**
   * Gather all travel data for a destination
   */
  async gatherTravelData(destination, duration, departureCity = null, travelDates = null) {
    this.updateStatus('working', `Scouring the web for the best travel data for ${destination}`);

    const dataPromises = [
      this.getFlightData(destination, departureCity, travelDates),
      this.getHotelData(destination, travelDates, duration),
      this.getWeatherData(destination),
      this.getAttractionData(destination),
      this.getLocalInsights(destination)
    ];

    try {
      const [flights, hotels, weather, attractions, insights] = await Promise.allSettled(dataPromises);

      const results = {
        flights: this.processPromiseResult(flights, []),
        hotels: this.processPromiseResult(hotels, []),
        weather: this.processPromiseResult(weather, null),
        attractions: this.processPromiseResult(attractions, []),
        insights: this.processPromiseResult(insights, {}),
        destination,
        searchTimestamp: new Date().toISOString(),
        dataSources: ['SerpAPI', 'OpenWeatherMap', 'Live APIs']
      };

      this.updateStatus('completed', `Successfully gathered comprehensive travel data for ${destination}`);
      this.results = results;
      return results;

    } catch (error) {
      console.error('DataScout error gathering travel data:', error);
      this.updateStatus('error', `Failed to gather some travel data: ${error.message}`);

      // Return fallback data structure
      this.results = {
        flights: [],
        hotels: [],
        weather: null,
        attractions: [],
        insights: {},
        destination,
        error: error.message,
        searchTimestamp: new Date().toISOString()
      };
      return this.results;
    }
  }

  /**
   * Get flight data using SerpAPI
   */
  async getFlightData(destination, departureCity = 'New York', travelDates = null) {
    console.log(`✈️ Fetching flight data for ${destination} using SerpAPI...`);

    if (!this.apiKeys.serpapi || this.apiKeys.serpapi === 'your-serpapi-key-here') {
      console.log('⚠️ SerpAPI key not configured, using fallback flight data');
      return this.getFlightFallback(destination, departureCity);
    }

    try {
      // Parse destination to get airport code or city
      const destinationCode = this.getAirportCode(destination);
      const departureCode = this.getAirportCode(departureCity);

      const params = new URLSearchParams({
        engine: 'google_flights',
        departure_id: departureCode,
        arrival_id: destinationCode,
        outbound_date: this.formatDate(travelDates?.departure || this.getDefaultDepartureDate()),
        return_date: this.formatDate(travelDates?.return || this.getDefaultReturnDate()),
        currency: 'USD',
        adults: '1',
        api_key: this.apiKeys.serpapi
      });

      const apiUrl = `${this.apiEndpoints.flights}?${params}`;
      console.log(`🔍 Flight API URL: ${apiUrl.replace(this.apiKeys.serpapi, 'API_KEY_HIDDEN')}`);

      const response = await fetch(apiUrl, {
        timeout: 10000
      });

      console.log(`📡 Flight API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Flight API error response: ${errorText.substring(0, 200)}`);
        throw new Error(`Flight API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Flight API Response:`, {
        has_best_flights: !!data.best_flights,
        best_flights_count: data.best_flights?.length || 0,
        has_other_flights: !!data.other_flights,
        other_flights_count: data.other_flights?.length || 0,
        has_error: !!data.error
      });

      if (data.error) {
        console.error(`❌ SerpAPI Error:`, data.error);
        return this.getFlightFallback(destination, departureCity);
      }

      if (data.best_flights && data.best_flights.length > 0) {
        console.log(`✅ Using ${data.best_flights.length} REAL flight options from best_flights`);
        const processedFlights = this.processFlightData(data.best_flights.slice(0, 3));
        console.log(`✈️ Processed Flight Data:`, JSON.stringify(processedFlights, null, 2));
        return processedFlights;
      } else if (data.other_flights && data.other_flights.length > 0) {
        console.log(`✅ Using ${data.other_flights.length} REAL flight options from other_flights`);
        const processedFlights = this.processFlightData(data.other_flights.slice(0, 3));
        console.log(`✈️ Processed Flight Data:`, JSON.stringify(processedFlights, null, 2));
        return processedFlights;
      } else {
        console.log('⚠️ No flight data in API response, using fallback');
        return this.getFlightFallback(destination, departureCity);
      }

    } catch (error) {
      console.error('❌ Flight API error, using fallback:', error.message);
      console.error('Stack:', error.stack);
      return this.getFlightFallback(destination, departureCity);
    }
  }

  /**
   * Get hotel data using SerpAPI
   */
  async getHotelData(destination, travelDates = null, duration = 7) {
    // Use main city for hotel search
    const hotelCity = this.getMainCity(destination);
    console.log(`🏨 Fetching hotel data for ${hotelCity} (from destination: ${destination}) using SerpAPI...`);

    if (!this.apiKeys.serpapi || this.apiKeys.serpapi === 'your-serpapi-key-here') {
      console.log('⚠️ SerpAPI key not configured, using fallback hotel data');
      return this.getHotelFallback(destination);
    }

    try {
      // Ensure dates are valid Date objects
      let checkInDate = travelDates?.checkin;
      let checkOutDate = travelDates?.checkout;
      
      console.log(`📅 Hotel dates input:`, { checkInDate, checkOutDate, duration });
      
      if (!checkInDate || !(checkInDate instanceof Date) || isNaN(checkInDate.getTime())) {
        checkInDate = this.getDefaultDepartureDate();
        console.log(`📅 Using default check-in date: ${checkInDate}`);
      }
      if (!checkOutDate || !(checkOutDate instanceof Date) || isNaN(checkOutDate.getTime())) {
        checkOutDate = this.getDefaultReturnDate(duration);
        console.log(`📅 Using default check-out date: ${checkOutDate}`);
      }

      const params = new URLSearchParams({
        engine: 'google_hotels',
        q: `hotels in ${hotelCity}`,
        check_in_date: this.formatDate(checkInDate),
        check_out_date: this.formatDate(checkOutDate),
        adults: '1',
        currency: 'USD',
        gl: 'us',
        hl: 'en',
        api_key: this.apiKeys.serpapi
      });

      const apiUrl = `${this.apiEndpoints.hotels}?${params}`;
      console.log(`🔍 Hotel API URL: ${apiUrl.replace(this.apiKeys.serpapi, 'API_KEY_HIDDEN')}`);

      const response = await fetch(apiUrl, {
        timeout: 10000
      });

      console.log(`📡 Hotel API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Hotel API error response: ${errorText.substring(0, 200)}`);
        throw new Error(`Hotel API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Hotel API Response:`, {
        has_properties: !!data.properties,
        properties_count: data.properties?.length || 0,
        has_error: !!data.error
      });

      if (data.error) {
        console.error(`❌ SerpAPI Hotel Error:`, data.error);
        return this.getHotelFallback(destination);
      }

      if (data.properties && data.properties.length > 0) {
        console.log(`✅ Using ${data.properties.length} REAL hotel options from API`);
        const processedHotels = this.processHotelData(data.properties.slice(0, 3));
        console.log(`🏨 Processed Hotel Data:`, JSON.stringify(processedHotels, null, 2));
        return processedHotels;
      } else {
        console.log('⚠️ No hotel data in API response, using fallback');
        return this.getHotelFallback(destination);
      }

    } catch (error) {
      console.error('❌ Hotel API error, using fallback:', error.message);
      console.error('Stack:', error.stack);
      return this.getHotelFallback(destination);
    }
  }

  /**
   * Get main city for weather/hotel lookups (e.g., "Italy" → "Rome", "France" → "Paris")
   */
  getMainCity(destination) {
    const cityMap = {
      'italy': 'Rome',
      'france': 'Paris',
      'spain': 'Madrid',
      'germany': 'Berlin',
      'uk': 'London',
      'united kingdom': 'London',
      'japan': 'Tokyo',
      'china': 'Beijing',
      'india': 'Delhi',
      'usa': 'New York',
      'united states': 'New York',
      'australia': 'Sydney',
      'canada': 'Toronto',
      'mexico': 'Mexico City',
      'brazil': 'Rio de Janeiro',
      'thailand': 'Bangkok',
      'vietnam': 'Hanoi',
      'korea': 'Seoul',
      'south korea': 'Seoul'
    };
    
    const normalized = destination.toLowerCase().trim();
    return cityMap[normalized] || destination;
  }

  /**
   * Get weather data using OpenWeatherMap
   */
  async getWeatherData(destination) {
    // Get specific city for weather lookup (e.g., "Italy" → "Rome")
    const weatherCity = this.getMainCity(destination);
    console.log(`🌤️ Fetching weather data for ${weatherCity} (from destination: ${destination}) using OpenWeatherMap...`);

    if (!this.apiKeys.openweather || this.apiKeys.openweather === 'your-openweather-key-here') {
      console.log('⚠️ OpenWeatherMap API key not configured, using fallback weather data');
      return this.getWeatherFallback(destination);
    }

    try {
      const currentWeatherUrl = `${this.apiEndpoints.openweather}/weather?q=${encodeURIComponent(weatherCity)}&appid=${this.apiKeys.openweather}&units=metric`;
      const forecastUrl = `${this.apiEndpoints.openweather}/forecast?q=${encodeURIComponent(weatherCity)}&appid=${this.apiKeys.openweather}&units=metric`;

      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentWeatherUrl, { timeout: 8000 }),
        fetch(forecastUrl, { timeout: 8000 })
      ]);

      let weatherData = {
        destination: destination,
        searchedCity: weatherCity,
        timestamp: new Date().toISOString()
      };

      if (currentResponse.ok) {
        const current = await currentResponse.json();
        weatherData.current = {
          temperature: Math.round(current.main.temp),
          description: current.weather[0].description,
          humidity: current.main.humidity,
          windSpeed: current.wind?.speed || 0,
          city: current.name,
          country: current.sys.country
        };
      }

      if (forecastResponse.ok) {
        const forecast = await forecastResponse.json();
        weatherData.forecast = this.processForecastData(forecast.list?.slice(0, 5) || []);
      }

      console.log(`✅ Weather data received for ${weatherData.current?.city || weatherCity}`);
      return weatherData;

    } catch (error) {
      console.log('Weather API error, using fallback:', error.message);
      return this.getWeatherFallback(destination);
    }
  }

  /**
   * Get attraction data using SerpAPI
   */
  async getAttractionData(destination) {
    console.log(`🎯 Fetching attraction data for ${destination} using SerpAPI...`);

    if (!this.apiKeys.serpapi || this.apiKeys.serpapi === 'your-serpapi-key-here') {
      console.log('⚠️ SerpAPI key not configured, using fallback attraction data');
      return this.getAttractionFallback(destination);
    }

    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: `top attractions in ${destination}`,
        api_key: this.apiKeys.serpapi
      });

      const response = await fetch(`${this.apiEndpoints.serpapi}?${params}`, {
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Attractions API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.organic_results && data.organic_results.length > 0) {
        return this.processAttractionData(data.organic_results.slice(0, 10));
      } else {
        return this.getAttractionFallback(destination);
      }

    } catch (error) {
      console.log('Attractions API error, using fallback:', error.message);
      return this.getAttractionFallback(destination);
    }
  }

  /**
   * Get restaurant data using SerpAPI
   */
  async getRestaurantData(destination) {
    console.log(`🍽️ Fetching restaurant data for ${destination} using SerpAPI...`);

    if (!this.apiKeys.serpapi || this.apiKeys.serpapi === 'your-serpapi-key-here') {
      console.log('⚠️ SerpAPI key not configured, using fallback restaurant data');
      return this.getRestaurantFallback(destination);
    }

    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: `best restaurants in ${destination}`,
        api_key: this.apiKeys.serpapi
      });

      const response = await fetch(`${this.apiEndpoints.serpapi}?${params}`, {
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`SerpAPI restaurant request failed: ${response.status}`);
      }

      const data = await response.json();
      const restaurants = this.processRestaurantData(data.organic_results || []);
      
      console.log(`✅ Found ${restaurants.length} restaurants for ${destination}`);
      
      return {
        restaurants,
        budgetInfo: {
          food: '$30-80/day',
          fineDining: '$100-200/meal',
          casual: '$15-40/meal'
        }
      };

    } catch (error) {
      console.log('Restaurant data error:', error.message);
      return this.getRestaurantFallback(destination);
    }
  }

  /**
   * Get local insights using web search
   */
  async getLocalInsights(destination) {
    try {
      const insightsPrompt = `Provide key local insights for travelers visiting ${destination}:

1. Best time to visit and seasonal considerations
2. Local customs and cultural etiquette
3. Transportation options within the city
4. Must-try local foods and dining tips
5. Safety considerations and travel tips
6. Currency and payment methods
7. Language basics and communication tips

Format as a comprehensive local guide.`;

      const insights = await this.callGemini(insightsPrompt);

      return {
        destination,
        content: insights,
        category: 'local_insights',
        generated: new Date().toISOString()
      };

    } catch (error) {
      console.log('Local insights error:', error.message);
      return {
        destination,
        content: `Local insights for ${destination}:\n\n- Research local customs and etiquette\n- Check seasonal weather patterns\n- Look into local transportation options\n- Try authentic local cuisine\n- Be aware of cultural differences\n- Have local currency ready\n- Learn basic local phrases`,
        category: 'local_insights_fallback'
      };
    }
  }

  /**
   * Data processing methods
   */
  processFlightData(flights) {
    return flights.map(flight => ({
      airline: flight.flights?.[0]?.airline || 'Multiple Airlines',
      price: flight.price || '$800-1200',
      duration: flight.total_duration || '5-8 hours',
      type: flight.flights?.length > 1 ? `${flight.flights.length} stops` : 'Direct',
      departure: flight.departure_airport?.name || 'Various',
      arrival: flight.arrival_airport?.name || 'Various',
      bookingUrl: flight.booking_token ? `https://www.google.com/travel/flights/booking?token=${flight.booking_token}` : null
    }));
  }

  processHotelData(hotels) {
    return hotels.map(hotel => ({
      name: hotel.name || 'Hotel',
      price: hotel.rate_per_night?.lowest || '$150-300/night',
      rating: hotel.overall_rating ? `${hotel.overall_rating}/5` : '4.2/5',
      location: hotel.neighborhood || 'City Center',
      amenities: hotel.amenities?.slice(0, 3) || ['WiFi', 'Breakfast', 'AC'],
      image: hotel.images?.[0]?.thumbnail || null,
      bookingUrl: hotel.serpapi_property_details_link || null
    }));
  }

  processForecastData(forecastList) {
    return forecastList.map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString(),
      temperature: Math.round(item.main.temp),
      description: item.weather[0].description,
      precipitation: item.rain ? Math.round(item.rain['3h'] || 0) : 0
    }));
  }

  processAttractionData(results) {
    return results.map(result => ({
      name: result.title,
      description: result.snippet,
      url: result.link,
      rating: this.extractRating(result.snippet),
      category: 'attraction'
    }));
  }

  processRestaurantData(results) {
    return results.map(result => ({
      name: result.title,
      description: result.snippet,
      url: result.link,
      rating: this.extractRating(result.snippet),
      category: 'restaurant'
    }));
  }

  /**
   * Fallback methods when APIs are unavailable
   */
  getFlightFallback(destination, departureCity) {
    const basePrice = this.estimateFlightPrice(destination, departureCity);
    return [
      {
        airline: 'Multiple Airlines',
        price: `$${Math.round(basePrice * 0.8)}-${Math.round(basePrice * 1.2)}`,
        duration: '5-8 hours',
        type: 'Direct/1-stop',
        departure: departureCity,
        arrival: destination
      },
      {
        airline: 'Multiple Airlines',
        price: `$${Math.round(basePrice * 0.6)}-${Math.round(basePrice * 0.9)}`,
        duration: '8-12 hours',
        type: '1-2 stops',
        departure: departureCity,
        arrival: destination
      }
    ];
  }

  getHotelFallback(destination) {
    return [
      {
        name: `Premium Hotel in ${destination}`,
        price: '$200-400/night',
        rating: '4.5/5',
        location: 'City Center',
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym']
      },
      {
        name: `Mid-Range Hotel in ${destination}`,
        price: '$100-200/night',
        rating: '4.0/5',
        location: 'Near Attractions',
        amenities: ['WiFi', 'Breakfast', 'AC']
      },
      {
        name: `Budget Hotel in ${destination}`,
        price: '$50-100/night',
        rating: '3.8/5',
        location: 'Downtown',
        amenities: ['WiFi', 'Basic amenities']
      }
    ];
  }

  getWeatherFallback(destination) {
    return {
      destination,
      current: {
        temperature: 22,
        description: 'Partly cloudy',
        humidity: 65,
        windSpeed: 3.2,
        city: destination,
        country: 'Unknown'
      },
      forecast: [
        { date: 'Today', temperature: 22, description: 'Partly cloudy', precipitation: 0 },
        { date: 'Tomorrow', temperature: 24, description: 'Sunny', precipitation: 0 },
        { date: 'Day 3', temperature: 20, description: 'Light rain', precipitation: 2 }
      ],
      note: 'Weather data unavailable - check local forecast'
    };
  }

  getAttractionFallback(destination) {
    return [
      { name: `Historic Center of ${destination}`, description: 'Explore the historic heart of the city', category: 'historic' },
      { name: `Local Market in ${destination}`, description: 'Experience local culture and cuisine', category: 'culture' },
      { name: `Museum of ${destination}`, description: 'Learn about local history and art', category: 'museum' },
      { name: `Scenic Viewpoint`, description: 'Enjoy panoramic views of the city', category: 'scenic' }
    ];
  }

  getRestaurantFallback(destination) {
    return {
      restaurants: [
        { name: `Local Favorite in ${destination}`, cuisine: 'Local', location: 'City Center', specialty: 'Traditional dishes' },
        { name: `Market Restaurant`, cuisine: 'Casual', location: 'Local Market', specialty: 'Fresh local ingredients' },
        { name: `Historic Café`, cuisine: 'Coffee & Pastries', location: 'Old Town', specialty: 'Authentic local treats' }
      ],
      budgetInfo: {
        food: '$30-80/day',
        fineDining: '$100-200/meal',
        casual: '$15-40/meal'
      }
    };
  }

  /**
   * Helper methods
   */
  processPromiseResult(promiseResult, fallback) {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value;
    } else {
      console.log('Promise rejected:', promiseResult.reason);
      return fallback;
    }
  }

  getAirportCode(location) {
    const airportCodes = {
      'new york': 'NYC',
      'los angeles': 'LAX',
      'chicago': 'CHI',
      'london': 'LON',
      'paris': 'PAR',
      'tokyo': 'NRT',
      'japan': 'NRT',
      'korea': 'ICN',
      'seoul': 'ICN',
      'italy': 'FCO',
      'rome': 'FCO'
    };

    const key = location.toLowerCase();
    return airportCodes[key] || key.substring(0, 3).toUpperCase();
  }

  estimateFlightPrice(destination, departure) {
    // Simple price estimation based on destination
    const priceMap = {
      'asia': 800,
      'europe': 600,
      'domestic': 300,
      'south america': 700,
      'africa': 900
    };

    const dest = destination.toLowerCase();
    if (dest.includes('japan') || dest.includes('korea') || dest.includes('china') || dest.includes('thailand')) {
      return priceMap.asia;
    } else if (dest.includes('italy') || dest.includes('france') || dest.includes('spain') || dest.includes('germany')) {
      return priceMap.europe;
    } else {
      return 600; // Default
    }
  }

  extractRating(snippet) {
    const ratingMatch = snippet.match(/(\d+\.?\d*)\s*\/?\s*5|\b(\d+\.?\d*)\s*stars?/i);
    return ratingMatch ? `${ratingMatch[1] || ratingMatch[2]}/5` : 'Not rated';
  }

  formatDate(date) {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  getDefaultDepartureDate() {
    const date = new Date();
    date.setDate(date.getDate() + 14); // 2 weeks from now
    return date;
  }

  getDefaultReturnDate(duration = 7) {
    const date = this.getDefaultDepartureDate();
    // Parse duration if it's a string like "4 days" or "7"
    let numDays = 7;
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+)/);
      numDays = match ? parseInt(match[1], 10) : 7;
    } else if (typeof duration === 'number') {
      numDays = duration;
    }
    date.setDate(date.getDate() + numDays);
    return date;
  }

  /**
   * Execute method - handles different types of data gathering tasks
   */
  async execute(input, context = {}) {
    const { action, destination, duration, departureCity, travelDates } = input;

    switch (action) {
      case 'gather_travel_data':
        return await this.gatherTravelData(destination, duration, departureCity, travelDates);

      case 'get_flights':
        return await this.getFlightData(destination, departureCity, travelDates);

      case 'get_hotels':
        return await this.getHotelData(destination, travelDates, duration);

      case 'get_weather':
        return await this.getWeatherData(destination);

      case 'get_attractions':
        return await this.getAttractionData(destination);

      case 'get_local_insights':
        return await this.getLocalInsights(destination);

      default:
        // Default to gathering all travel data
        return await this.gatherTravelData(destination, duration, departureCity, travelDates);
    }
  }
}