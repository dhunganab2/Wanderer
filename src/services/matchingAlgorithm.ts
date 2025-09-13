import type { User, Match, FilterSettings } from '@/types';
import { calculateDistance } from './locationService';

export interface CompatibilityScore {
  overall: number;
  breakdown: {
    age: number;
    location: number;
    travelStyle: number;
    interests: number;
    destination: number;
    personality: number;
  };
  reasons: string[];
}

export interface MatchRecommendation {
  user: User;
  score: CompatibilityScore;
  reasons: string[];
  mutualConnections: number;
  distance: number;
}

export class MatchingAlgorithm {
  private weights = {
    age: 0.15,
    location: 0.20,
    travelStyle: 0.25,
    interests: 0.20,
    destination: 0.15,
    personality: 0.05
  };

  // Calculate comprehensive compatibility score
  calculateCompatibility(user1: User, user2: User): CompatibilityScore {
    const breakdown = {
      age: this.calculateAgeCompatibility(user1, user2),
      location: this.calculateLocationCompatibility(user1, user2),
      travelStyle: this.calculateTravelStyleCompatibility(user1, user2),
      interests: this.calculateInterestsCompatibility(user1, user2),
      destination: this.calculateDestinationCompatibility(user1, user2),
      personality: this.calculatePersonalityCompatibility(user1, user2)
    };

    const overall = Object.entries(breakdown).reduce((total, [key, score]) => {
      return total + (score * this.weights[key as keyof typeof this.weights]);
    }, 0);

    const reasons = this.generateCompatibilityReasons(user1, user2, breakdown);

    return {
      overall: Math.round(overall),
      breakdown,
      reasons
    };
  }

  // Age compatibility (0-100)
  private calculateAgeCompatibility(user1: User, user2: User): number {
    const ageDiff = Math.abs(user1.age - user2.age);
    const maxAgeDiff = 10; // Maximum acceptable age difference
    
    if (ageDiff <= 2) return 100;
    if (ageDiff <= 5) return 90;
    if (ageDiff <= 8) return 75;
    if (ageDiff <= 12) return 60;
    if (ageDiff <= 15) return 40;
    return Math.max(0, 100 - (ageDiff - maxAgeDiff) * 5);
  }

  // Location compatibility (0-100)
  private calculateLocationCompatibility(user1: User, user2: User): number {
    if (!user1.coordinates || !user2.coordinates) return 50;
    
    const distance = calculateDistance(user1.coordinates, user2.coordinates);
    const maxDistance = Math.min(user1.preferences.maxDistance, user2.preferences.maxDistance);
    
    if (distance <= 10) return 100; // Same city
    if (distance <= 25) return 90;  // Nearby
    if (distance <= 50) return 80;  // Regional
    if (distance <= maxDistance) return Math.max(60, 100 - (distance / maxDistance) * 40);
    
    return Math.max(0, 60 - ((distance - maxDistance) / 50) * 30);
  }

  // Travel style compatibility (0-100)
  private calculateTravelStyleCompatibility(user1: User, user2: User): number {
    const commonStyles = user1.travelStyle.filter(style => user2.travelStyle.includes(style));
    const totalStyles = new Set([...user1.travelStyle, ...user2.travelStyle]).size;
    
    if (commonStyles.length === 0) return 20;
    if (commonStyles.length === 1) return 40;
    if (commonStyles.length === 2) return 70;
    if (commonStyles.length >= 3) return 90;
    
    return (commonStyles.length / totalStyles) * 100;
  }

  // Interests compatibility (0-100)
  private calculateInterestsCompatibility(user1: User, user2: User): number {
    const commonInterests = user1.interests.filter(interest => user2.interests.includes(interest));
    const totalInterests = new Set([...user1.interests, ...user2.interests]).size;
    
    if (commonInterests.length === 0) return 30;
    if (commonInterests.length === 1) return 50;
    if (commonInterests.length === 2) return 70;
    if (commonInterests.length >= 3) return 90;
    
    return (commonInterests.length / totalInterests) * 100;
  }

  // Destination compatibility (0-100)
  private calculateDestinationCompatibility(user1: User, user2: User): number {
    const dest1 = user1.nextDestination.toLowerCase();
    const dest2 = user2.nextDestination.toLowerCase();
    
    if (dest1 === dest2) return 100;
    
    // Check for similar destinations (same country/region)
    const similarDestinations = this.getSimilarDestinations(dest1);
    if (similarDestinations.some(dest => dest2.includes(dest))) return 80;
    
    // Check for same continent
    const continent1 = this.getContinent(dest1);
    const continent2 = this.getContinent(dest2);
    if (continent1 && continent2 && continent1 === continent2) return 60;
    
    return 30; // Different destinations
  }

  // Personality compatibility (0-100) - based on bio analysis
  private calculatePersonalityCompatibility(user1: User, user2: User): number {
    const bio1 = user1.bio.toLowerCase();
    const bio2 = user2.bio.toLowerCase();
    
    const personalityKeywords = {
      adventurous: ['adventure', 'explore', 'thrill', 'excitement', 'bold'],
      social: ['social', 'meet', 'people', 'friends', 'community', 'together'],
      cultural: ['culture', 'history', 'tradition', 'local', 'authentic'],
      nature: ['nature', 'outdoor', 'hiking', 'wildlife', 'environment'],
      creative: ['art', 'music', 'photography', 'creative', 'design'],
      spiritual: ['spiritual', 'mindful', 'meditation', 'wellness', 'peace']
    };
    
    let compatibility = 0;
    let matches = 0;
    
    Object.entries(personalityKeywords).forEach(([trait, keywords]) => {
      const hasTrait1 = keywords.some(keyword => bio1.includes(keyword));
      const hasTrait2 = keywords.some(keyword => bio2.includes(keyword));
      
      if (hasTrait1 && hasTrait2) {
        compatibility += 20;
        matches++;
      } else if (hasTrait1 || hasTrait2) {
        compatibility += 5;
      }
    });
    
    return Math.min(100, compatibility + (matches * 10));
  }

  // Generate compatibility reasons
  private generateCompatibilityReasons(user1: User, user2: User, breakdown: any): string[] {
    const reasons: string[] = [];
    
    if (breakdown.age >= 80) {
      reasons.push(`Similar age range (${user1.age} & ${user2.age})`);
    }
    
    if (breakdown.location >= 80) {
      reasons.push('Located close to each other');
    } else if (breakdown.location >= 60) {
      reasons.push('Within reasonable distance');
    }
    
    const commonStyles = user1.travelStyle.filter(style => user2.travelStyle.includes(style));
    if (commonStyles.length >= 2) {
      reasons.push(`Share ${commonStyles.length} travel styles: ${commonStyles.join(', ')}`);
    }
    
    const commonInterests = user1.interests.filter(interest => user2.interests.includes(interest));
    if (commonInterests.length >= 2) {
      reasons.push(`Have ${commonInterests.length} common interests`);
    }
    
    if (breakdown.destination >= 80) {
      reasons.push(`Both planning to visit ${user1.nextDestination}`);
    } else if (breakdown.destination >= 60) {
      reasons.push('Planning trips to similar regions');
    }
    
    if (breakdown.personality >= 70) {
      reasons.push('Compatible personalities and values');
    }
    
    return reasons;
  }

  // Get similar destinations
  private getSimilarDestinations(destination: string): string[] {
    const destinationGroups = {
      'japan': ['tokyo', 'osaka', 'kyoto', 'japan'],
      'thailand': ['bangkok', 'chiang mai', 'phuket', 'thailand'],
      'spain': ['barcelona', 'madrid', 'seville', 'spain'],
      'italy': ['rome', 'florence', 'venice', 'milan', 'italy'],
      'france': ['paris', 'lyon', 'nice', 'france'],
      'germany': ['berlin', 'munich', 'hamburg', 'germany'],
      'australia': ['sydney', 'melbourne', 'brisbane', 'australia'],
      'usa': ['new york', 'los angeles', 'san francisco', 'chicago', 'usa'],
      'uk': ['london', 'edinburgh', 'manchester', 'uk'],
      'canada': ['toronto', 'vancouver', 'montreal', 'canada']
    };
    
    for (const [group, destinations] of Object.entries(destinationGroups)) {
      if (destinations.some(dest => destination.includes(dest))) {
        return destinations.filter(dest => dest !== destination);
      }
    }
    
    return [];
  }

  // Get continent from destination
  private getContinent(destination: string): string | null {
    const continentMap: Record<string, string> = {
      'japan': 'asia', 'china': 'asia', 'korea': 'asia', 'thailand': 'asia',
      'india': 'asia', 'singapore': 'asia', 'indonesia': 'asia', 'vietnam': 'asia',
      'france': 'europe', 'spain': 'europe', 'italy': 'europe', 'germany': 'europe',
      'uk': 'europe', 'netherlands': 'europe', 'sweden': 'europe', 'denmark': 'europe',
      'usa': 'north america', 'canada': 'north america', 'mexico': 'north america',
      'australia': 'oceania', 'new zealand': 'oceania',
      'brazil': 'south america', 'argentina': 'south america', 'chile': 'south america',
      'egypt': 'africa', 'south africa': 'africa', 'kenya': 'africa', 'morocco': 'africa'
    };
    
    for (const [country, continent] of Object.entries(continentMap)) {
      if (destination.includes(country)) {
        return continent;
      }
    }
    
    return null;
  }

  // Find potential matches for a user
  findMatches(user: User, candidates: User[], filters: FilterSettings, limit: number = 20): MatchRecommendation[] {
    const recommendations: MatchRecommendation[] = [];
    
    for (const candidate of candidates) {
      // Skip if it's the same user
      if (candidate.id === user.id) continue;
      
      // Apply basic filters
      if (!this.passesBasicFilters(user, candidate, filters)) continue;
      
      // Calculate compatibility
      const score = this.calculateCompatibility(user, candidate);
      
      // Calculate distance
      const distance = user.coordinates && candidate.coordinates 
        ? calculateDistance(user.coordinates, candidate.coordinates)
        : 0;
      
      // Calculate mutual connections (simulated)
      const mutualConnections = Math.floor(Math.random() * 10);
      
      recommendations.push({
        user: candidate,
        score,
        reasons: score.reasons,
        mutualConnections,
        distance
      });
    }
    
    // Sort by compatibility score and return top matches
    return recommendations
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, limit);
  }

  // Check if candidate passes basic filters
  private passesBasicFilters(user: User, candidate: User, filters: FilterSettings): boolean {
    // Age filter
    if (candidate.age < filters.ageRange[0] || candidate.age > filters.ageRange[1]) {
      return false;
    }
    
    // Verified filter
    if (filters.verified && !candidate.verified) {
      return false;
    }
    
    // Travel styles filter
    if (filters.travelStyles.length > 0) {
      const hasMatchingStyle = filters.travelStyles.some(style => 
        candidate.travelStyle.includes(style)
      );
      if (!hasMatchingStyle) return false;
    }
    
    // Destinations filter
    if (filters.destinations.length > 0) {
      const hasMatchingDestination = filters.destinations.some(dest => 
        candidate.nextDestination.toLowerCase().includes(dest.toLowerCase()) ||
        candidate.location.toLowerCase().includes(dest.toLowerCase())
      );
      if (!hasMatchingDestination) return false;
    }
    
    // Distance filter
    if (user.coordinates && candidate.coordinates) {
      const distance = calculateDistance(user.coordinates, candidate.coordinates);
      if (distance > filters.maxDistance) return false;
    }
    
    // Date range filter
    if (filters.dateRange) {
      const candidateDate = this.parseTravelDate(candidate.travelDates);
      if (candidateDate) {
        const [startDate, endDate] = filters.dateRange;
        if (candidateDate < new Date(startDate) || candidateDate > new Date(endDate)) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Parse travel date from string
  private parseTravelDate(dateString: string): Date | null {
    try {
      // Try to parse various date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try to parse "Mar 15-25, 2024" format
      const match = dateString.match(/(\w{3})\s+(\d{1,2})-(\d{1,2}),\s+(\d{4})/);
      if (match) {
        const [, month, startDay, endDay, year] = match;
        const monthMap: Record<string, number> = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const monthIndex = monthMap[month];
        if (monthIndex !== undefined) {
          return new Date(parseInt(year), monthIndex, parseInt(startDay));
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  // Get match quality insights
  getMatchQualityInsights(match: MatchRecommendation): string[] {
    const insights: string[] = [];
    
    if (match.score.overall >= 90) {
      insights.push('Excellent match! High compatibility across all areas.');
    } else if (match.score.overall >= 80) {
      insights.push('Great match! Very compatible with strong potential.');
    } else if (match.score.overall >= 70) {
      insights.push('Good match! Solid compatibility with room for growth.');
    } else if (match.score.overall >= 60) {
      insights.push('Decent match! Some compatibility with potential.');
    } else {
      insights.push('Limited match. Consider if shared interests align.');
    }
    
    if (match.distance <= 25) {
      insights.push('Located close by - easy to meet up!');
    } else if (match.distance <= 100) {
      insights.push('Within reasonable distance for meetups.');
    }
    
    if (match.mutualConnections > 5) {
      insights.push(`You have ${match.mutualConnections} mutual connections!`);
    }
    
    return insights;
  }
}

// Create singleton instance
export const matchingAlgorithm = new MatchingAlgorithm();
