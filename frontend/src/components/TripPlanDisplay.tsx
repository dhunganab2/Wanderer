import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Plane,
  Hotel,
  Camera,
  Utensils,
  Clock,
  Cloud,
  Heart,
  ExternalLink,
  Check,
  CheckCircle2,
  ArrowRight,
  Backpack,
  Info,
  Gift,
  AlertCircle,
  BookOpen,
  Star,
  Sparkles,
  Target,
  Palette,
  Sun,
  Umbrella,
  Shield,
  Globe,
  Phone,
  CreditCard,
  Map,
  Languages,
  Lightbulb,
  TrendingUp,
  Coffee,
  Building,
  Wifi,
  Car,
  Train
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface TripPlanDisplayProps {
  content: string;
  metadata?: {
    destination?: string;
    travelers?: string[];
    duration?: number;
    trip_type?: 'solo' | 'group';
    rawData?: any;
    userProfile?: {
      name?: string;
      age?: number;
      location?: string;
      travelStyle?: string[];
      interests?: string[];
      bucketList?: string[];
      travelExperience?: string;
      preferredBudget?: string;
    };
  };
  className?: string;
}

interface ParsedTripPlan {
  summary?: string;
  destination?: string;
  travelers?: string[];
  duration?: number;
  trip_type?: string;
  itinerary?: DayPlan[];
  weather?: string;
  tips?: string[];
  budget?: string;
}

interface DayPlan {
  day: number;
  theme?: string;
  date?: string;
  morning?: {
    time: string;
    activity: string;
    location: string;
    description: string;
    cost_estimate: string;
    duration?: string;
    restaurant_recommendation?: string;
  };
  afternoon?: {
    time: string;
    activity: string;
    location: string;
    description: string;
    cost_estimate: string;
    restaurant_recommendation?: string;
  };
  evening?: {
    time: string;
    activity: string;
    location: string;
    description: string;
    cost_estimate: string;
    dining?: string;
  };
  daily_budget?: string;
  transportation?: string[];
  insider_tip?: string;
}


// Helper function to extract destination from itinerary text
const extractDestinationFromText = (text: string): string | null => {
  if (!text) return null;
  
  // Look for city names in the text (Tokyo, New York, etc.)
  const cityMatches = text.match(/(?:through|to|in|at|visit)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/g);
  if (cityMatches && cityMatches.length > 0) {
    // Extract the city name from the first match
    const match = cityMatches[0].match(/(?:through|to|in|at|visit)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/);
    if (match && match[1]) {
      const city = match[1].trim();
      // Filter out common words that aren't cities
      if (!city.match(/^(Day|Morning|Afternoon|Evening|Night|Airport|Hotel|Station|Temple|Museum|Garden|Park|District|Center|Building|Palace|Castle|Bridge|River|Street|Avenue|Road|Market|Mall|Store|Restaurant|Cafe|Bar|Club)$/i)) {
        return city;
      }
    }
  }
  
  // Look for "Journey Through [City]" pattern
  const journeyMatch = text.match(/Journey Through ([A-Z][a-zA-Z\s]+)/);
  if (journeyMatch && journeyMatch[1]) {
    return journeyMatch[1].trim();
  }
  
  return null;
};

// Helper function to extract duration from itinerary text
const extractDurationFromText = (text: string): string | null => {
  if (!text) return null;
  
  // Look for "3-Day" pattern at the beginning
  const dayMatch = text.match(/(\d+)-Day/i);
  if (dayMatch && dayMatch[1]) {
    return dayMatch[1];
  }
  
  // Look for "Day 1", "Day 2", "Day 3" to count days
  const dayMatches = text.match(/\*\*Day (\d+):/g);
  if (dayMatches && dayMatches.length > 0) {
    const maxDay = Math.max(...dayMatches.map(match => {
      const dayNum = match.match(/\*\*Day (\d+):/);
      return dayNum ? parseInt(dayNum[1]) : 0;
    }));
    return maxDay.toString();
  }
  
  return null;
};

// Enhanced interfaces for database-fetched data
interface DatabaseUserProfile {
  name?: string;
  age?: number;
  location?: string;
  travelStyle?: string[];
  interests?: string[];
  bucketList?: string[];
  travelExperience?: string;
  preferredBudget?: string;
  userId?: string;
}

interface DatabaseTripData {
  trip_summary?: {
    destination?: string;
    travelers?: string[];
    duration?: number;
    estimated_budget?: string;
  };
  itinerary_narrative?: {
    daily_plans?: any[];
  };
  weather_and_packing?: {
    current_conditions?: string;
  };
  local_insights?: {
    cultural_tips?: string[];
  };
  destination?: string;
  duration?: number;
  budget?: string;
  weather?: string;
  tips?: string[];
}

const TripPlanDisplay: React.FC<TripPlanDisplayProps> = ({
  content,
  metadata,
  className,
  onSelectionComplete
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'logistics' | 'essentials'>('overview');
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  // Helper function to get user display name with proper fallbacks
  const getUserDisplayName = (): string => {
    // Priority order for user name:
    // 1. User profile name from database
    // 2. Travelers array from plan
    // 3. Travelers array from metadata
    // 4. Return null if no data available
    if (metadata?.userProfile?.name) {
      return metadata.userProfile.name;
    }

    if (tripPlan.travelers && tripPlan.travelers.length > 0) {
      return tripPlan.travelers[0];
    }

    if (metadata?.travelers && metadata.travelers.length > 0) {
      return metadata.travelers[0];
    }

    return 'Solo traveler';
  };

  // Helper function to get user-specific budget preferences
  const getUserBudget = (): string => {
    // First check if we have parsed budget from rawData
    if (tripPlan.budget) {
      return tripPlan.budget;
    }

    // Check rawData directly
    if (metadata?.rawData?.estimated_budget) {
      return metadata.rawData.estimated_budget;
    }

    if (metadata?.userProfile?.preferredBudget) {
      return metadata.userProfile.preferredBudget;
    }

    return 'Budget not available';
  };

  // Helper function to parse text-based itinerary into structured format
  const parseTextItinerary = (text: string, duration: number): DayPlan[] => {
    const days: DayPlan[] = [];
    
    // Split by day markers (e.g., "**Day 1:", "Day 2:", etc.)
    const dayMatches = text.match(/\*\*Day \d+:.*?\*\*[\s\S]*?(?=\*\*Day \d+:|$)/g);
    
    if (dayMatches) {
      dayMatches.forEach((dayText, index) => {
        const dayNumber = index + 1;
        const titleMatch = dayText.match(/\*\*Day \d+:\s*(.*?)\*\*/);
        const title = titleMatch ? titleMatch[1].trim() : `Day ${dayNumber}`;
        
        // Extract the main content after the title
        const content = dayText.replace(/\*\*Day \d+:.*?\*\*/, '').trim();
        
        days.push({
          day: dayNumber,
          theme: title,
          morning: {
            activity: title,
            description: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            location: metadata?.rawData?.destination || 'Destination',
            time: 'Full Day',
            cost_estimate: 'See budget breakdown'
          }
        });
      });
    } else {
      // Fallback: create simple day structure
      for (let i = 1; i <= duration; i++) {
        days.push({
          day: i,
          theme: `Day ${i}`,
          morning: {
            activity: `Day ${i} Activities`,
            description: text.substring(0, 300) + '...',
            location: metadata?.rawData?.destination || 'Destination',
            time: 'Full Day',
            cost_estimate: 'See budget breakdown'
          }
        });
      }
    }
    
    return days;
  };

  // Parse the trip plan content with proper backend data extraction
  const parseTripPlan = (content: string): ParsedTripPlan => {
    console.log('🔧 TripPlanDisplay: Parsing trip plan...');
    console.log('🔧 Content length:', content.length);
    console.log('🔧 Metadata received:', JSON.stringify(metadata, null, 2));
    console.log('🔧 Raw data in metadata:', JSON.stringify(metadata?.rawData, null, 2));
    
    const parsedPlan: ParsedTripPlan = {};

    // Check if we have structured data from backend
    if (metadata?.rawData) {
      console.log('✅ Found rawData in metadata!');
      const rawData = metadata.rawData;

      // Extract destination from rawData first, then parse from itinerary_text if needed
      parsedPlan.destination = rawData.tripInfo?.destination ||
                       rawData.destination ||
                       extractDestinationFromText(rawData.itinerary_text) ||
                       metadata.destination ||
                       null;

      console.log('🔧 Extracted destination:', parsedPlan.destination);

      // Handle travelers from tripInfo.companions or travelers array
      if (rawData.tripInfo?.companions) {
        parsedPlan.travelers = [rawData.tripInfo.companions];
      } else if (metadata?.userProfile?.name) {
        parsedPlan.travelers = [metadata.userProfile.name];
      } else if (metadata?.travelers) {
        parsedPlan.travelers = metadata.travelers;
      } else {
        parsedPlan.travelers = null;
      }

      // Extract duration from rawData first, then parse from itinerary_text if needed
      const durationStr = rawData.duration || 
                         rawData.tripInfo?.duration || 
                         extractDurationFromText(rawData.itinerary_text) ||
                         metadata.duration;
      console.log('🔧 Duration extraction - rawData.duration:', rawData.duration);
      console.log('🔧 Duration extraction - extracted from text:', extractDurationFromText(rawData.itinerary_text));
      console.log('🔧 Duration extraction - durationStr:', durationStr);
      if (typeof durationStr === 'string') {
        const match = durationStr.match(/(\d+)/);
        parsedPlan.duration = match ? parseInt(match[1]) : null;
      } else {
        parsedPlan.duration = durationStr || null;
      }
      console.log('🔧 Final extracted duration:', parsedPlan.duration);

      parsedPlan.trip_type = rawData.tripInfo?.travelStyle?.[0] ||
                      metadata.trip_type ||
                      'solo';

      // Extract budget from rawData.estimated_budget or budget_breakdown
      parsedPlan.budget = rawData.estimated_budget ||
                   rawData.tripInfo?.budget ||
                   metadata.userProfile?.preferredBudget ||
                   null;
      console.log('🔧 Extracted budget:', parsedPlan.budget);

      // Extract weather from recommendations.weather or weather_info
      parsedPlan.weather = rawData.recommendations?.weather ||
                    rawData.weather_info ||
                    rawData.weather ||
                    null;
      console.log('🔧 Extracted weather:', parsedPlan.weather);

      // Extract tips from recommendations.travelTips or packing_tips
      parsedPlan.tips = rawData.recommendations?.travelTips ||
                 rawData.packing_tips ||
                 rawData.tips ||
                 [];
      console.log('🔧 Extracted tips count:', parsedPlan.tips?.length);

      // Extract accommodations from budget_breakdown or recommendations
      parsedPlan.accommodations = rawData.recommendations?.accommodation ||
                           rawData.accommodation ||
                           (rawData.budget_breakdown?.accommodation ? 
                             [{ name: 'Budget Accommodation', price: rawData.budget_breakdown.accommodation }] : 
                             []);
      console.log('🔧 Extracted accommodations:', parsedPlan.accommodations);

      // Extract flights info from budget_breakdown or transportation
      parsedPlan.flights = rawData.transportation?.flights ||
                    rawData.flights ||
                    (rawData.budget_breakdown ? 
                      [{ airline: 'Multiple Airlines', price: 'See budget breakdown' }] : 
                      []);
      console.log('🔧 Extracted flights:', parsedPlan.flights);

      // Parse itinerary from actual backend structure
      if (rawData.itinerary && Array.isArray(rawData.itinerary)) {
        console.log('🔧 Using structured itinerary data');
        parsedPlan.itinerary = rawData.itinerary.map((day: any) => {
          const dayPlan: DayPlan = {
            day: day.day || 1,
            theme: day.title || null,
          };

          // Extract activities and convert to morning/afternoon/evening format
          if (day.activities && Array.isArray(day.activities)) {
            const activities = day.activities;

            // Find morning activity (before 12:00)
            const morningActivity = activities.find((act: any) => {
              const time = act.time || '';
              const hour = parseInt(time.split(':')[0]) || 0;
              return hour < 12;
            });

            if (morningActivity) {
              dayPlan.morning = {
                time: morningActivity.time || '',
                activity: morningActivity.name || '',
                location: morningActivity.location || '',
                description: morningActivity.description || '',
                cost_estimate: morningActivity.cost || '',
                duration: morningActivity.duration || '',
              };
            }

            // Find afternoon activity (12:00-17:00)
            const afternoonActivity = activities.find((act: any) => {
              const time = act.time || '';
              const hour = parseInt(time.split(':')[0]) || 0;
              return hour >= 12 && hour < 17;
            });

            if (afternoonActivity) {
              dayPlan.afternoon = {
                time: afternoonActivity.time || '',
                activity: afternoonActivity.name || '',
                location: afternoonActivity.location || '',
                description: afternoonActivity.description || '',
                cost_estimate: afternoonActivity.cost || '',
              };
            }

            // Find evening activity (17:00+)
            const eveningActivity = activities.find((act: any) => {
              const time = act.time || '';
              const hour = parseInt(time.split(':')[0]) || 0;
              return hour >= 17;
            });

            if (eveningActivity) {
              dayPlan.evening = {
                time: eveningActivity.time || '',
                activity: eveningActivity.name || '',
                location: eveningActivity.location || '',
                description: eveningActivity.description || '',
                cost_estimate: eveningActivity.cost || '',
              };
            }
          }

          // Calculate daily budget from activities
          const totalCost = day.activities?.reduce((sum: number, act: any) => {
            const cost = act.cost || '';
            const match = cost.match(/€?(\d+)/);
            return sum + (match ? parseInt(match[1]) : 0);
          }, 0) || 0;

          dayPlan.daily_budget = totalCost > 0 ? `€${totalCost}` : null;

          return dayPlan;
        });
      } else if (rawData.itinerary_text && typeof rawData.itinerary_text === 'string') {
        // Parse the text-based itinerary into structured format
        console.log('🔧 Using text-based itinerary data');
        parsedPlan.itinerary = parseTextItinerary(rawData.itinerary_text, parsedPlan.duration || 5);
      } else {
        console.log('🔧 No itinerary data found, using empty array');
        parsedPlan.itinerary = [];
      }
      
      console.log('🔧 Final parsed plan:', JSON.stringify(parsedPlan, null, 2));
    } else {
      console.log('❌ No rawData found in metadata, using fallback parsing');
      // Fallback to basic content parsing if no rawData
      parsedPlan.destination = metadata?.destination || 'Unknown';
      parsedPlan.duration = metadata?.duration ? parseInt(metadata.duration) : null;
      parsedPlan.travelers = metadata?.travelers || null;
      parsedPlan.trip_type = metadata?.trip_type || null;
      parsedPlan.budget = null;
      parsedPlan.weather = null;
      parsedPlan.tips = [];
      parsedPlan.accommodations = [];
      parsedPlan.flights = [];
      parsedPlan.itinerary = [];
    }

    return parsedPlan;
  };

  const tripPlan = parseTripPlan(content);

  // Derive weather details from backend data
  const parsedWeather = (() => {
    const text = tripPlan.weather || '';

    // Check if weather data is unavailable
    if (!text || text.toLowerCase().includes('not available') || text.toLowerCase().includes('data not available')) {
      return {
        temperature: 'Not available',
        description: 'Weather data not available'
      };
    }

    const tempMatch = text.match(/(-?\d+(?:\.\d+)?)\s*°?C/i);
    const descMatch = text.match(/:\s*([^,]+),\s*([^,]+)/) || text.match(/,\s*([^,]+)\s*,?/);
    return {
      temperature: tempMatch ? `${Math.round(parseFloat(tempMatch[1]))}°C` : 'Not available',
      description: descMatch ? (descMatch[2] || descMatch[1]).trim() : text
    };
  })();

  // Derived data from backend structure
  const packingRecommendations: string[] = metadata?.rawData?.recommendations?.packingList || [];

  const bestActivityTimes: string = metadata?.rawData?.recommendations?.bestActivityTimes || '';

  const culturalTips: string[] = metadata?.rawData?.recommendations?.culturalNotes || [];

  // Handle language basics from backend
  const languageBasics: Array<{ phrase: string; meaning: string }> = [];

  const safetyNotes: string[] = metadata?.rawData?.recommendations?.safetyInfo ? [metadata.rawData.recommendations.safetyInfo] : [];

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
      } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const handleConfirmSelections = () => {
    if (onSelectionComplete) {
      onSelectionComplete({
        selectedFlight: selectedFlight || undefined,
        selectedHotel: selectedHotel || undefined
      });
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Modern Trip Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Summary Card */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-gray-800/90 p-8 border border-orange-500/30 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
              </div>
                <h2 className="text-2xl font-bold text-white">Trip Summary</h2>
            </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-300">Destination</p>
                  <p className="text-xl font-bold text-white">{tripPlan.destination || 'Not available'}</p>
            </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-300">Duration</p>
                  <p className="text-xl font-bold text-white">{tripPlan.duration ? `${tripPlan.duration} days` : 'Not available'}</p>
          </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-300">Travelers</p>
                  <p className="text-xl font-bold text-white">{getUserDisplayName()}</p>
          </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-300">Budget</p>
                  <p className="text-xl font-bold text-white">{getUserBudget()}</p>
    </div>
              </div>
              
              <div className="p-4 bg-gray-700/40 backdrop-blur-sm rounded-2xl border border-gray-600/50">
                <p className="text-sm text-gray-300 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-orange-500" />
                  <span className="font-medium">Trip Type:</span>
                  <span className="ml-2 font-bold text-white">Cultural & Food Adventure</span>
                </p>
                  </div>
                    </div>
                      </div>
                  </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-purple-600/20 to-purple-700/10 rounded-2xl border border-purple-500/30">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white">Weather</h3>
            </div>
            <p className="text-2xl font-bold text-purple-400 mb-1">{parsedWeather.temperature}</p>
            <p className="text-sm text-gray-300">{parsedWeather.description}</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-forest-green/10 to-forest-green/5 rounded-2xl border border-forest-green/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-forest-green/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-forest-green" />
              </div>
              <h3 className="font-bold text-foreground">Highlights</h3>
            </div>
                              <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Check className="w-4 h-4 text-forest-green" />
                <span>Cultural experiences</span>
                                </div>
              <div className="flex items-center space-x-2 text-sm">
                <Check className="w-4 h-4 text-forest-green" />
                <span>Local cuisine</span>
                              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Check className="w-4 h-4 text-forest-green" />
                <span>Authentic activities</span>
                          </div>
                        </div>
                                </div>
                              </div>
                          </div>

      {/* Modern Personalized Highlights */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-sunrise-coral to-sunrise-teal flex items-center justify-center shadow-lg">
            <Palette className="w-5 h-5 text-white" />
                        </div>
          <h2 className="text-2xl font-bold text-foreground">Personalized Highlights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Utensils,
              title: `Local Food Experiences`,
              description: `Taste authentic ${tripPlan.destination} cuisine and street food`,
              color: "from-sunrise-coral to-sunrise-coral/80",
              bgColor: "from-sunrise-coral/10 to-sunrise-coral/5",
              borderColor: "border-sunrise-coral/20"
            },
            {
              icon: Building,
              title: `Iconic Landmarks`,
              description: `Handpicked must-see sights around ${tripPlan.destination}`,
              color: "from-sky-blue to-sky-blue/80",
              bgColor: "from-sky-blue/10 to-sky-blue/5",
              borderColor: "border-sky-blue/20"
            },
            {
              icon: Coffee,
              title: "Neighborhood Walks",
              description: "Explore vibrant local districts and markets",
              color: "from-forest-green to-forest-green/80",
              bgColor: "from-forest-green/10 to-forest-green/5",
              borderColor: "border-forest-green/20"
            },
            {
              icon: Heart,
              title: "Cultural Immersion",
              description: "Authentic activities curated to your interests",
              color: "from-sunset-pink to-sunset-pink/80",
              bgColor: "from-sunset-pink/10 to-sunset-pink/5",
              borderColor: "border-sunset-pink/20"
            }
          ].map((highlight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 border transition-all duration-300 hover:scale-105 hover:shadow-lg",
                highlight.bgColor,
                highlight.borderColor
              )}
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300",
                  highlight.color
                )}>
                  <highlight.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-sunrise-coral transition-colors">
                    {highlight.title}
                            </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {highlight.description}
                  </p>
                                </div>
                              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            </motion.div>
          ))}
                          </div>
                        </div>

      {/* Modern Weather & Packing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weather Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-blue/10 via-sky-blue/5 to-sky-blue/10 p-8 border border-sky-blue/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-blue/20 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-sky-blue to-sky-blue/80 flex items-center justify-center shadow-lg">
                <Cloud className="w-6 h-6 text-white" />
                          </div>
              <h2 className="text-2xl font-bold text-foreground">Weather & Packing</h2>
                        </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-sky-blue/20">
                <div className="flex items-center space-x-3">
                  <Sun className="w-6 h-6 text-sky-blue" />
                          <div>
                    <p className="text-lg font-bold text-foreground">{parsedWeather.temperature}</p>
                    <p className="text-sm text-muted-foreground capitalize">{parsedWeather.description}</p>
                          </div>
                        </div>
              </div>
              
              {packingRecommendations.length > 0 && (
                <div className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-sky-blue/20">
                  <div className="flex items-center space-x-3">
                    <Umbrella className="w-6 h-6 text-sky-blue" />
                            <div>
                      <p className="text-lg font-bold text-foreground">Packing tip</p>
                      <p className="text-sm text-muted-foreground">{packingRecommendations[0]}</p>
                            </div>
                          </div>
                            </div>
              )}
                        </div>
                    </div>
        </div>

        {/* Packing Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sunset-pink/10 via-sunset-pink/5 to-sunset-pink/10 p-8 border border-sunset-pink/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sunset-pink/20 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-sunset-pink to-sunset-pink/80 flex items-center justify-center shadow-lg">
                <Backpack className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Essential Packing</h2>
            </div>
            
            <div className="space-y-4">
              {packingRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {packingRecommendations.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-sunset-pink/20"
                    >
                      <Check className="w-5 h-5 text-forest-green" />
                      <span className="text-sm font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              ) : null}
              
              {bestActivityTimes && (
                <div className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-sunset-pink/20">
                  <p className="text-sm flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-sunset-pink" />
                    <span><strong>Best Activity Times:</strong> {bestActivityTimes}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogistics = () => (
    <div className="space-y-8">
      {/* Flight Options */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-blue to-sky-blue/70 flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Flight Options</h2>
            <p className="text-muted-foreground">Select your preferred flight for the best travel experience</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          <div className="p-8 text-center bg-gray-800/30 rounded-2xl border border-gray-600/20">
            <p className="text-gray-400">Flight options will be available here once your trip planning is complete.</p>
          </div>
        </div>
      </div>

      {/* Hotel Options */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Accommodation Options</h2>
            <p className="text-gray-300">Choose where you'll rest and recharge during your adventure</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          <div className="p-8 text-center bg-gray-800/30 rounded-2xl border border-gray-600/20">
            <p className="text-gray-400">Accommodation options will be available here once your trip planning is complete.</p>
          </div>
            </div>
      </div>

    </div>
  );

  const renderItinerary = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-forest-green to-forest-green/70 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
              </div>
                <div>
          <h2 className="text-2xl font-bold text-foreground">Daily Itinerary</h2>
          <p className="text-muted-foreground">Your day-by-day adventure guide</p>
        </div>
      </div>

      <div className="space-y-4">
        {tripPlan.itinerary && tripPlan.itinerary.length > 0 ? tripPlan.itinerary.map((day) => (
          <Card key={day.day} className="border border-border/50 shadow-soft overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleDay(day.day)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-forest-green to-forest-green/70 flex items-center justify-center text-white font-bold">
                    {day.day}
                  </div>
                  <div>
                    <CardTitle className="text-lg">DAY {day.day}: {day.theme}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Budget: {day.daily_budget} • Click to expand details
                    </p>
                  </div>
                </div>
                {expandedDays.has(day.day) ? 
                  <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                }
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedDays.has(day.day) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="space-y-6">
                    {/* Morning */}
                    {day.morning && (
                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-sunrise-coral/10 to-transparent rounded-xl">
                        <Sun className="w-6 h-6 text-sunrise-coral mt-1" />
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-2 flex items-center">
                            🌅 MORNING ({day.morning.time})
                          </h4>
                          <div className="space-y-2">
                            <p className="font-semibold">{day.morning.activity}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {day.morning.location}
                            </p>
                            <p className="text-sm">{day.morning.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-forest-green font-medium">
                                <DollarSign className="w-4 h-4 mr-1" />
                                Cost: {day.morning.cost_estimate}
                              </span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="w-4 h-4 mr-1" />
                                Duration: 3 hours
                              </span>
                            </div>
                          </div>
                        </div>
                </div>
                    )}

                    {/* Afternoon */}
                    {day.afternoon && (
                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-sky-blue/10 to-transparent rounded-xl">
                        <Sun className="w-6 h-6 text-sky-blue mt-1" />
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-2 flex items-center">
                            ☀️ AFTERNOON ({day.afternoon.time})
                          </h4>
                          <div className="space-y-2">
                            <p className="font-semibold">{day.afternoon.activity}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {day.afternoon.location}
                            </p>
                            <p className="text-sm">{day.afternoon.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-forest-green font-medium">
                                <DollarSign className="w-4 h-4 mr-1" />
                                Cost: {day.afternoon.cost_estimate}
                              </span>
                              {day.afternoon.restaurant_recommendation && (
                                <span className="flex items-center text-sunrise-coral">
                                  <Utensils className="w-4 h-4 mr-1" />
                                  Lunch: {day.afternoon.restaurant_recommendation}
                                </span>
              )}
            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evening */}
                    {day.evening && (
                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-sunset-pink/10 to-transparent rounded-xl">
                        <Utensils className="w-6 h-6 text-sunset-pink mt-1" />
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-2 flex items-center">
                            🌙 EVENING ({day.evening.time})
                          </h4>
                          <div className="space-y-2">
                            <p className="font-semibold">{day.evening.activity}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {day.evening.location}
                            </p>
                            <p className="text-sm">{day.evening.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-forest-green font-medium">
                                <DollarSign className="w-4 h-4 mr-1" />
                                Cost: {day.evening.cost_estimate}
                              </span>
                              {day.evening.dining && (
                                <span className="flex items-center text-sunset-pink">
                                  <Utensils className="w-4 h-4 mr-1" />
                                  Dinner: {day.evening.dining}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Insider Tip */}
                    {day.insider_tip && (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl">
                        <p className="text-sm flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                          <strong className="text-yellow-800">💡 INSIDER TIP:</strong> 
                          <span className="ml-1 text-yellow-700">{day.insider_tip}</span>
                        </p>
                      </div>
                    )}

                    {/* Transportation & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/30">
                      <div className="flex items-center space-x-2">
                        <Train className="w-4 h-4 text-sky-blue" />
                        <span className="text-sm"><strong>Transport:</strong> Metro day pass</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-forest-green" />
                        <span className="text-sm"><strong>Daily Budget:</strong> {day.daily_budget}</span>
                      </div>
                    </div>
        </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
      </Card>
        )) : null}
      </div>
    </div>
  );

  const renderEssentials = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sunset-pink to-sunset-pink/70 flex items-center justify-center">
          <Backpack className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Travel Essentials</h2>
          <p className="text-muted-foreground">Everything you need to know for a smooth journey</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Packing List */}
        <Card className="border border-border/50 shadow-soft">
        <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Backpack className="w-5 h-5 text-sunset-pink" />
              <span>Packing List</span>
          </CardTitle>
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center text-sunrise-coral">
                  <Camera className="w-4 h-4 mr-2" />
                  Clothing
                </h4>
                <div className="space-y-2">
                  {packingRecommendations.length > 0 ? packingRecommendations.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-forest-green" />
                      <span>{item}</span>
                    </div>
                  )) : null}
              </div>
              </div>
                <div>
                <h4 className="font-semibold mb-3 flex items-center text-sky-blue">
                  <Phone className="w-4 h-4 mr-2" />
                  Electronics
                </h4>
                <div className="space-y-2">
                  {packingRecommendations.length > 4 ? packingRecommendations.slice(4, 8).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-forest-green" />
                      <span>{item}</span>
                    </div>
                  )) : null}
                </div>
                </div>
                <div>
                <h4 className="font-semibold mb-3 flex items-center text-forest-green">
                  <Gift className="w-4 h-4 mr-2" />
                  Extras
                </h4>
                <div className="space-y-2">
                  {packingRecommendations.length > 8 ? packingRecommendations.slice(8, 12).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-forest-green" />
                      <span>{item}</span>
                    </div>
                  )) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


        {/* Cultural Tips & Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border/50 shadow-soft">
        <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-sky-blue" />
                <span>Cultural Tips</span>
          </CardTitle>
        </CardHeader>
            <CardContent className="space-y-3">
              {culturalTips.length > 0 ? culturalTips.map((tip, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-sky-blue/5 to-transparent rounded-xl">
                  <Globe className="w-4 h-4 text-sky-blue" />
                  <span className="text-sm">{tip}</span>
                  </div>
                )) : null}
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Languages className="w-5 h-5 text-sunset-pink" />
                <span>Language Basics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {languageBasics.length > 0 ? languageBasics.map((phrase, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-sunset-pink/5 to-transparent rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">{phrase.phrase}</span>
                    <span className="text-muted-foreground">{phrase.meaning}</span>
              </div>

                </div>
              )) : null}
        </CardContent>
      </Card>
        </div>

        {/* Safety Notes */}
        <Card className="border border-border/50 shadow-soft">
        <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-forest-green" />
              <span>Safety Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safetyNotes.length > 0 ? safetyNotes.map((tip, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-forest-green/5 to-transparent rounded-xl">
                  <Shield className="w-4 h-4 text-forest-green" />
                  <span className="text-sm">{tip}</span>
                </div>
              )) : null}
              </div>
          </CardContent>
        </Card>
            </div>
    </div>
  );

  return (
    <div className={cn("w-full max-w-7xl mx-auto space-y-6", className)}>
      {/* Modern Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-gray-800/90 p-8 border border-orange-500/30 backdrop-blur-sm"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-gradient-to-br from-orange-500/5 to-transparent"></div>
                </div>
        
        <div className="relative text-center space-y-6">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
              </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Your Perfect Adventure
            </h1>
            </div>
            
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            🌟 Hey {getUserDisplayName()}! I've crafted the perfect {tripPlan.duration}-day {tripPlan.destination} adventure tailored to your love for culture, food, and authentic experiences!
          </p>
          
          {/* Modern Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-700/60 backdrop-blur-sm rounded-2xl border border-gray-600/40">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
                </div>
              <div className="text-left">
                <p className="text-sm text-gray-400">Duration</p>
                <p className="font-bold text-white">{tripPlan.duration} days</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-700/60 backdrop-blur-sm rounded-2xl border border-gray-600/40">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-400" />
          </div>
              <div className="text-left">
                <p className="text-sm text-gray-400">Travelers</p>
                <p className="font-bold text-white">{getUserDisplayName()}</p>
    </div>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-700/60 backdrop-blur-sm rounded-2xl border border-gray-600/40">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-400">Budget</p>
                <p className="font-bold text-white">{getUserBudget()}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Tab Navigation */}
      <div className="relative mb-8">
        <div className="flex space-x-1 bg-gray-800/50 p-1.5 rounded-2xl border border-gray-600/30 backdrop-blur-sm">
          {[
            { id: 'overview', label: 'Overview', icon: Target, color: 'from-orange-500 to-yellow-500' },
            { id: 'logistics', label: 'Logistics', icon: Plane, color: 'from-purple-500 to-purple-600' },
            { id: 'itinerary', label: 'Itinerary', icon: Calendar, color: 'from-orange-400 to-orange-500' },
            { id: 'essentials', label: 'Essentials', icon: Backpack, color: 'from-yellow-500 to-orange-500' },
          ].map(({ id, label, icon: Icon, color }) => (
            <motion.button
            key={id}
            className={cn(
                "relative flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
              activeTab === id
                  ? "text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
            )}
            onClick={() => setActiveTab(id as any)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="activeTab"
                  className={cn("absolute inset-0 rounded-xl bg-gradient-to-r", color)}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={cn("w-5 h-5 relative z-10", activeTab === id ? "text-white" : "text-gray-300")} />
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'logistics' && renderLogistics()}
          {activeTab === 'itinerary' && renderItinerary()}
          {activeTab === 'essentials' && renderEssentials()}
        </motion.div>
      </AnimatePresence>

      {/* Final Call-to-Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 p-8 bg-gradient-to-r from-sunrise-coral/10 via-sunrise-teal/10 to-sunrise-coral/10 border-2 border-sunrise-coral/20 rounded-3xl text-center"
      >
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="w-8 h-8 text-sunrise-coral" />
          <h2 className="text-3xl font-bold text-foreground">Your Perfect Adventure is Ready!</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-sm">
          <div className="flex items-center justify-center space-x-1">
            <Check className="w-4 h-4 text-forest-green" />
            <span>Personalized itinerary</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Check className="w-4 h-4 text-forest-green" />
            <span>Real-time options</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Check className="w-4 h-4 text-forest-green" />
            <span>Weather-appropriate</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Check className="w-4 h-4 text-forest-green" />
            <span>Cultural tips</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Check className="w-4 h-4 text-forest-green" />
            <span>Budget estimates</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button className="bg-gradient-sunrise text-white hover:shadow-glow transition-all duration-300">
            <Phone className="w-4 h-4 mr-2" />
            Get Booking Assistance
        </Button>
          <Button variant="outline" className="border-sunrise-coral text-sunrise-coral hover:bg-sunrise-coral/10">
            <ArrowRight className="w-4 h-4 mr-2" />
            Save to Phone
          </Button>
          <Button variant="outline" className="border-sky-blue text-sky-blue hover:bg-sky-blue/10">
          <ExternalLink className="w-4 h-4 mr-2" />
            Email Itinerary
          </Button>
          <Button variant="outline" className="border-forest-green text-forest-green hover:bg-forest-green/10">
            <Palette className="w-4 h-4 mr-2" />
            Modify Plan
        </Button>
      </div>
      </motion.div>
    </div>
  );
};

export default TripPlanDisplay;