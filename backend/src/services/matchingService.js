/**
 * Advanced Matching Service
 *
 * Backend implementation of the hybrid matching algorithm
 * Integrates with Firebase Firestore for data persistence
 */

import { db } from '../config/database.js';
import admin from 'firebase-admin';

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Advanced Matching Algorithm Class
 */
class AdvancedMatchingService {
  constructor() {
    // Component weights for hybrid scoring
    this.componentWeights = {
      contentBased: 0.35,
      collaborative: 0.25,
      graphSimilarity: 0.15,
      textSimilarity: 0.15,
      temporalRelevance: 0.05,
      diversityBonus: 0.05
    };

    // Feature weights for content-based filtering
    this.featureWeights = {
      destination: 0.25,
      travelStyle: 0.20,
      interests: 0.20,
      location: 0.15,
      age: 0.10,
      personality: 0.10
    };

    // ELO rating parameters
    this.K_FACTOR = 32;
    this.BASE_RATING = 1500;
  }

  /**
   * Main matching function - returns ranked recommendations
   */
  async findMatches(currentUserId, filters = {}, limit = 20) {
    try {
      console.log(`🎯 Finding matches for user ${currentUserId}`);
      const startTime = Date.now();

      // 1. Fetch current user data
      const currentUser = await this.getUserProfile(currentUserId);
      if (!currentUser) {
        throw new Error('Current user not found');
      }

      // 2. Fetch user's swipe history
      const userHistory = await this.getUserHistory(currentUserId);

      // 3. Fetch candidate users
      const candidates = await this.getCandidateUsers(currentUserId);
      console.log(`📋 Found ${candidates.length} candidate users`);

      // 4. Apply basic filters
      const filtered = this.applyFilters(currentUser, candidates, filters);
      console.log(`✅ ${filtered.length} candidates passed filters`);

      // 5. Calculate compatibility scores
      const scored = await Promise.all(
        filtered.map(async (candidate) => {
          const score = await this.calculateAdvancedCompatibility(
            currentUser,
            candidate,
            userHistory
          );

          return {
            user: candidate,
            score,
            rank: 0,
            category: this.categorizeMatch(score.overall),
            matchedAt: new Date()
          };
        })
      );

      // 6. Sort and apply diversity-aware ranking
      const ranked = this.diversityAwareRanking(scored, currentUser);

      // 7. Assign ranks
      ranked.forEach((match, index) => {
        match.rank = index + 1;
      });

      const endTime = Date.now();
      console.log(`🎯 Matching completed in ${endTime - startTime}ms`);

      return ranked.slice(0, limit);
    } catch (error) {
      console.error('Error in findMatches:', error);
      throw error;
    }
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return null;

      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user interaction history
   */
  async getUserHistory(userId) {
    try {
      const swipesSnapshot = await db.collection('swipes')
        .where('userId', '==', userId)
        .get();

      const swipes = new Map();
      swipesSnapshot.forEach(doc => {
        const data = doc.data();
        swipes.set(data.swipedUserId, data.type === 'like' ? 'like' : 'dislike');
      });

      // Get matches
      const matchesSnapshot = await db.collection('matches')
        .where('users', 'array-contains', userId)
        .get();

      const matches = new Set();
      matchesSnapshot.forEach(doc => {
        const data = doc.data();
        const otherUserId = data.users.find(id => id !== userId);
        if (otherUserId) matches.add(otherUserId);
      });

      return {
        userId,
        swipes,
        matches,
        conversations: new Map(),
        lastActive: new Date()
      };
    } catch (error) {
      console.error('Error fetching user history:', error);
      return {
        userId,
        swipes: new Map(),
        matches: new Set(),
        conversations: new Map(),
        lastActive: new Date()
      };
    }
  }

  /**
   * Get candidate users (all users except current user and already swiped)
   */
  async getCandidateUsers(currentUserId) {
    try {
      const usersSnapshot = await db.collection('users').get();
      const userHistory = await this.getUserHistory(currentUserId);

      const candidates = [];
      usersSnapshot.forEach(doc => {
        if (doc.id !== currentUserId && !userHistory.swipes.has(doc.id)) {
          candidates.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });

      return candidates;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  }

  /**
   * Apply basic filters to candidates
   */
  applyFilters(currentUser, candidates, filters) {
    return candidates.filter(candidate => {
      // Age range filter
      if (filters.ageRange) {
        const [minAge, maxAge] = filters.ageRange;
        if (candidate.age < minAge || candidate.age > maxAge) {
          return false;
        }
      }

      // Distance filter
      if (filters.maxDistance && currentUser.coordinates && candidate.coordinates) {
        const distance = calculateDistance(currentUser.coordinates, candidate.coordinates);
        if (distance > filters.maxDistance) {
          return false;
        }
      }

      // Verified filter
      if (filters.verified && !candidate.verified) {
        return false;
      }

      // Travel styles filter
      if (filters.travelStyles && filters.travelStyles.length > 0) {
        const hasMatch = filters.travelStyles.some(style =>
          candidate.travelStyle && candidate.travelStyle.includes(style)
        );
        if (!hasMatch) return false;
      }

      // Destinations filter
      if (filters.destinations && filters.destinations.length > 0) {
        const hasMatch = filters.destinations.some(dest =>
          candidate.nextDestination &&
          candidate.nextDestination.toLowerCase().includes(dest.toLowerCase())
        );
        if (!hasMatch) return false;
      }

      return true;
    });
  }

  /**
   * Calculate comprehensive compatibility using hybrid approach
   */
  async calculateAdvancedCompatibility(user1, user2, history) {
    // Calculate each component
    const contentBased = this.calculateContentBasedScore(user1, user2);
    const collaborative = this.calculateCollaborativeScore(user1, user2, history);
    const graphSimilarity = this.calculateGraphSimilarity(user1, user2);
    const textSimilarity = this.calculateTextSimilarity(user1, user2);
    const temporalRelevance = this.calculateTemporalRelevance(user1, user2);
    const diversityBonus = this.calculateDiversityBonus(user1, user2);

    // Calculate weighted overall score
    const overall =
      contentBased * this.componentWeights.contentBased +
      collaborative * this.componentWeights.collaborative +
      graphSimilarity * this.componentWeights.graphSimilarity +
      textSimilarity * this.componentWeights.textSimilarity +
      temporalRelevance * this.componentWeights.temporalRelevance +
      diversityBonus * this.componentWeights.diversityBonus;

    // Calculate confidence
    const confidence = this.calculateConfidence(user1, user2, history);

    // Calculate ELO rating
    const eloRating = this.calculateEloRating(user1, user2);

    // Generate reasons
    const reasons = this.generateReasons(user1, user2, {
      contentBased,
      collaborative,
      graphSimilarity,
      textSimilarity,
      temporalRelevance,
      diversityBonus
    });

    return {
      overall: Math.round(overall * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      breakdown: {
        contentBased: Math.round(contentBased * 100),
        collaborative: Math.round(collaborative * 100),
        graphSimilarity: Math.round(graphSimilarity * 100),
        textSimilarity: Math.round(textSimilarity * 100),
        temporalRelevance: Math.round(temporalRelevance * 100),
        diversityBonus: Math.round(diversityBonus * 100)
      },
      eloRating: Math.round(eloRating),
      reasons,
      improvementSuggestions: []
    };
  }

  /**
   * Content-Based Filtering: Feature similarity
   */
  calculateContentBasedScore(user1, user2) {
    const scores = {
      destination: this.destinationSimilarity(user1, user2),
      travelStyle: this.jaccardSimilarity(
        user1.travelStyle || [],
        user2.travelStyle || []
      ),
      interests: this.jaccardSimilarity(
        user1.interests || [],
        user2.interests || []
      ),
      location: this.locationSimilarity(user1, user2),
      age: this.ageSimilarity(user1.age || 25, user2.age || 25),
      personality: this.personalitySimilarity(user1.bio || '', user2.bio || '')
    };

    // Weighted sum
    return Object.entries(scores).reduce((total, [feature, score]) => {
      return total + score * this.featureWeights[feature];
    }, 0);
  }

  /**
   * Collaborative Filtering: User behavior patterns
   */
  calculateCollaborativeScore(user1, user2, history) {
    if (!history || history.swipes.size === 0) {
      return 0.5; // Neutral score for cold start
    }

    // Simple implementation: check if user has liked similar profiles
    let positiveCount = 0;
    let totalCount = 0;

    history.swipes.forEach((swipeType, swipedUserId) => {
      totalCount++;
      if (swipeType === 'like') {
        positiveCount++;
      }
    });

    if (totalCount === 0) return 0.5;

    // Return user's like ratio as collaborative signal
    return positiveCount / totalCount;
  }

  /**
   * Graph-Based Similarity: Social network analysis
   */
  calculateGraphSimilarity(user1, user2) {
    let score = 0;

    // Same travel community (destination clustering)
    if (this.inSameTravelCommunity(user1, user2)) {
      score += 0.3;
    }

    // Geographic community
    if (user1.coordinates && user2.coordinates) {
      const distance = calculateDistance(user1.coordinates, user2.coordinates);
      if (distance < 50) score += 0.2; // Same local area
    }

    // Similar travel style community
    const styleOverlap = this.jaccardSimilarity(
      user1.travelStyle || [],
      user2.travelStyle || []
    );
    score += styleOverlap * 0.5;

    return Math.min(score, 1.0);
  }

  /**
   * Text Similarity: TF-IDF Cosine Similarity
   */
  calculateTextSimilarity(user1, user2) {
    const text1 = this.extractTextFeatures(user1);
    const text2 = this.extractTextFeatures(user2);

    if (!text1 || !text2) return 0.5;

    // Simple word overlap similarity
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);

    return this.jaccardSimilarity(words1, words2);
  }

  /**
   * Temporal Relevance: Time-based factors
   */
  calculateTemporalRelevance(user1, user2) {
    let score = 0.5; // Base score

    // Travel date alignment
    if (user1.travelDates && user2.travelDates) {
      score += 0.3;
    }

    // Recent activity (both users assumed active)
    score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Diversity Bonus: Exploration vs Exploitation
   */
  calculateDiversityBonus(user1, user2) {
    const diversityScore = this.calculateDiversity(user1, user2);
    const shouldExplore = Math.random() < 0.1; // 10% exploration

    if (shouldExplore && diversityScore > 0.6) {
      return 0.8; // Boost diverse matches
    }

    return 0.5; // Neutral
  }

  /**
   * Helper: Jaccard Similarity
   */
  jaccardSimilarity(set1, set2) {
    if (!Array.isArray(set1) || !Array.isArray(set2)) return 0;
    if (set1.length === 0 && set2.length === 0) return 0;

    const intersection = set1.filter(x => set2.includes(x)).length;
    const union = new Set([...set1, ...set2]).size;

    if (union === 0) return 0;
    return intersection / union;
  }

  /**
   * Helper: Destination Similarity
   */
  destinationSimilarity(user1, user2) {
    const dest1 = (user1.nextDestination || '').toLowerCase();
    const dest2 = (user2.nextDestination || '').toLowerCase();

    if (!dest1 || !dest2) return 0.3;
    if (dest1 === dest2) return 1.0;

    // Check if they share words (e.g., "Paris, France" and "France")
    const words1 = dest1.split(/\W+/);
    const words2 = dest2.split(/\W+/);
    const overlap = words1.filter(w => words2.includes(w)).length;

    if (overlap > 0) return 0.7;

    return 0.3;
  }

  /**
   * Helper: Location Similarity
   */
  locationSimilarity(user1, user2) {
    if (!user1.coordinates || !user2.coordinates) return 0.5;

    const distance = calculateDistance(user1.coordinates, user2.coordinates);

    // Sigmoid function for smooth falloff
    return 1 / (1 + Math.exp((distance - 50) / 20));
  }

  /**
   * Helper: Age Similarity (Gaussian)
   */
  ageSimilarity(age1, age2) {
    const ageDiff = Math.abs(age1 - age2);
    const sigma = 5;

    return Math.exp(-(ageDiff * ageDiff) / (2 * sigma * sigma));
  }

  /**
   * Helper: Personality Similarity
   */
  personalitySimilarity(bio1, bio2) {
    const traits1 = this.extractPersonalityTraits(bio1);
    const traits2 = this.extractPersonalityTraits(bio2);

    return this.jaccardSimilarity(traits1, traits2);
  }

  /**
   * Helper: Extract Personality Traits
   */
  extractPersonalityTraits(bio) {
    const traits = [];
    const bioLower = bio.toLowerCase();

    const traitKeywords = {
      adventurous: ['adventure', 'explore', 'bold', 'daring'],
      social: ['social', 'outgoing', 'friendly', 'people'],
      creative: ['creative', 'art', 'music', 'design'],
      analytical: ['logical', 'analytical', 'technical', 'data'],
      empathetic: ['caring', 'empathy', 'kind', 'compassion'],
      ambitious: ['ambitious', 'driven', 'goal', 'success']
    };

    Object.entries(traitKeywords).forEach(([trait, keywords]) => {
      if (keywords.some(kw => bioLower.includes(kw))) {
        traits.push(trait);
      }
    });

    return traits;
  }

  /**
   * Helper: Extract Text Features
   */
  extractTextFeatures(user) {
    return [
      user.bio || '',
      (user.interests || []).join(' '),
      (user.travelStyle || []).join(' '),
      user.nextDestination || '',
      user.location || ''
    ].join(' ');
  }

  /**
   * Helper: Check Same Travel Community
   */
  inSameTravelCommunity(user1, user2) {
    if (!user1.nextDestination || !user2.nextDestination) return false;

    const dest1 = user1.nextDestination.toLowerCase();
    const dest2 = user2.nextDestination.toLowerCase();

    // Simple check: share first word
    return dest1.split(' ')[0] === dest2.split(' ')[0];
  }

  /**
   * Helper: Calculate Diversity
   */
  calculateDiversity(user1, user2) {
    const similarity = this.jaccardSimilarity(
      [...(user1.interests || []), ...(user1.travelStyle || [])],
      [...(user2.interests || []), ...(user2.travelStyle || [])]
    );
    return 1 - similarity;
  }

  /**
   * Helper: Calculate Confidence
   */
  calculateConfidence(user1, user2, history) {
    let confidence = 0;

    // Profile completeness
    const completeness1 = this.calculateProfileCompleteness(user1);
    const completeness2 = this.calculateProfileCompleteness(user2);
    confidence += (completeness1 + completeness2) / 2 * 0.4;

    // Historical data
    if (history && history.swipes.size > 10) {
      confidence += 0.3;
    } else if (history && history.swipes.size > 0) {
      confidence += 0.1;
    }

    // Common data points
    const commonDataPoints = this.countCommonDataPoints(user1, user2);
    confidence += Math.min(commonDataPoints / 10, 0.3);

    return Math.min(confidence, 1.0);
  }

  /**
   * Helper: Calculate Profile Completeness
   */
  calculateProfileCompleteness(user) {
    let score = 0;
    if (user.bio && user.bio.length > 20) score += 0.2;
    if (user.interests && user.interests.length >= 3) score += 0.2;
    if (user.travelStyle && user.travelStyle.length >= 2) score += 0.2;
    if (user.coordinates) score += 0.2;
    if (user.nextDestination) score += 0.2;
    return score;
  }

  /**
   * Helper: Count Common Data Points
   */
  countCommonDataPoints(user1, user2) {
    let count = 0;
    if ((user1.interests || []).length > 0 && (user2.interests || []).length > 0) count++;
    if ((user1.travelStyle || []).length > 0 && (user2.travelStyle || []).length > 0) count++;
    if (user1.coordinates && user2.coordinates) count++;
    if (user1.nextDestination && user2.nextDestination) count++;
    return count;
  }

  /**
   * Helper: Calculate ELO Rating
   */
  calculateEloRating(user1, user2) {
    // Start with base ratings
    const rating1 = user1.eloRating || this.BASE_RATING;
    const rating2 = user2.eloRating || this.BASE_RATING;

    // Return average
    return (rating1 + rating2) / 2;
  }

  /**
   * Helper: Categorize Match Quality
   */
  categorizeMatch(score) {
    if (score >= 0.9) return 'perfect';
    if (score >= 0.8) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.6) return 'potential';
    return 'exploratory';
  }

  /**
   * Helper: Generate Reasons
   */
  generateReasons(user1, user2, breakdown) {
    const reasons = [];

    // Sort by score
    const sorted = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    sorted.forEach(([component, score]) => {
      if (score > 0.7) {
        reasons.push(this.getReasonForComponent(component, user1, user2));
      }
    });

    if (reasons.length === 0) {
      reasons.push('Compatible travel preferences');
    }

    return reasons;
  }

  /**
   * Helper: Get Reason for Component
   */
  getReasonForComponent(component, user1, user2) {
    const reasonMap = {
      contentBased: 'Strong match on travel preferences and interests',
      collaborative: `Users with similar taste also liked ${user2.name || 'this profile'}`,
      graphSimilarity: 'Part of the same travel community',
      textSimilarity: 'Similar personality and travel style',
      temporalRelevance: 'Planning trips around the same time',
      diversityBonus: 'Offers a fresh perspective on travel'
    };

    return reasonMap[component] || 'Compatible profile';
  }

  /**
   * Diversity-Aware Ranking (MMR Algorithm)
   */
  diversityAwareRanking(matches, currentUser) {
    if (matches.length === 0) return [];

    const lambda = 0.7; // Balance between relevance and diversity
    const ranked = [];
    const remaining = [...matches].sort((a, b) => b.score.overall - a.score.overall);

    // Add highest scoring match first
    ranked.push(remaining.shift());

    // For each subsequent position
    while (remaining.length > 0) {
      let maxScore = -Infinity;
      let maxIndex = 0;

      // Calculate MMR for each remaining candidate
      remaining.forEach((candidate, index) => {
        const relevance = candidate.score.overall;

        // Calculate diversity (dissimilarity to already ranked)
        const diversity = Math.min(
          ...ranked.map(r =>
            1 - this.calculateSimilarityScore(candidate.user, r.user)
          )
        );

        // MMR score
        const mmrScore = lambda * relevance + (1 - lambda) * diversity;

        if (mmrScore > maxScore) {
          maxScore = mmrScore;
          maxIndex = index;
        }
      });

      // Add best MMR candidate
      ranked.push(remaining.splice(maxIndex, 1)[0]);
    }

    return ranked;
  }

  /**
   * Helper: Calculate Similarity Score
   */
  calculateSimilarityScore(user1, user2) {
    return this.jaccardSimilarity(
      [...(user1.interests || []), ...(user1.travelStyle || [])],
      [...(user2.interests || []), ...(user2.travelStyle || [])]
    );
  }

  /**
   * Record swipe action
   */
  async recordSwipe(swipeData) {
    try {
      const { userId, swipedUserId, type } = swipeData;

      // Check for existing swipes from this user to this target user
      const existingSwipesSnapshot = await db.collection('swipes')
        .where('userId', '==', userId)
        .where('swipedUserId', '==', swipedUserId)
        .get();

      // If there are existing swipes, delete them to avoid duplicates
      if (!existingSwipesSnapshot.empty) {
        console.log(`🧹 Cleaning up ${existingSwipesSnapshot.docs.length} existing swipes before adding new one`);
        const batch = db.batch();
        existingSwipesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // Save new swipe to Firestore
      await db.collection('swipes').add({
        userId,
        swipedUserId,
        type,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Check for mutual match
      if (type === 'like' || type === 'superlike') {
        const isMatch = await this.checkMutualLike(userId, swipedUserId);

        if (isMatch) {
          // Create match
          await this.createMatch(userId, swipedUserId);
          return { match: true, matchId: `${userId}_${swipedUserId}` };
        }
      }

      return { match: false };
    } catch (error) {
      console.error('Error recording swipe:', error);
      throw error;
    }
  }

  /**
   * Check for mutual like
   */
  async checkMutualLike(userId1, userId2) {
    try {
      const snapshot = await db.collection('swipes')
        .where('userId', '==', userId2)
        .where('swipedUserId', '==', userId1)
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.type === 'like' || data.type === 'superlike') {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking mutual like:', error);
      return false;
    }
  }

  /**
   * Create a match
   */
  async createMatch(userId1, userId2) {
    try {
      // Check if match already exists to prevent duplicates
      const existingMatchesSnapshot = await db.collection('matches')
        .where('users', 'array-contains', userId1)
        .get();

      // Check if any existing match contains both users
      const matchExists = existingMatchesSnapshot.docs.some(doc => {
        const data = doc.data();
        return data.users.includes(userId1) && data.users.includes(userId2);
      });

      if (matchExists) {
        console.log(`✅ Match already exists between ${userId1} and ${userId2}`);
        return;
      }

      const matchData = {
        users: [userId1, userId2],
        status: 'accepted',  // Both users liked each other
        matchedAt: new Date().toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: null,
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        }
      };

      await db.collection('matches').add(matchData);

      console.log(`✨ Created match between ${userId1} and ${userId2}`);
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  /**
   * Get user's matches
   */
  async getUserMatches(userId) {
    try {
      const snapshot = await db.collection('matches')
        .where('users', 'array-contains', userId)
        .get();

      const matches = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Return the match data in the format the frontend expects
        matches.push({
          id: doc.id,
          users: data.users,  // Include both user IDs
          status: data.status || 'accepted',  // Include status
          matchedAt: data.matchedAt,
          createdAt: data.createdAt,
          lastMessageAt: data.lastMessageAt,
          unreadCount: data.unreadCount?.[userId] || 0,
          commonInterests: data.commonInterests || [],
          compatibilityScore: data.compatibilityScore || 0
        });
      }

      return matches;
    } catch (error) {
      console.error('Error getting user matches:', error);
      return [];
    }
  }

  /**
   * Calculate compatibility between two users
   */
  async getCompatibility(userId1, userId2) {
    try {
      const user1 = await this.getUserProfile(userId1);
      const user2 = await this.getUserProfile(userId2);

      if (!user1 || !user2) {
        throw new Error('User not found');
      }

      const history = await this.getUserHistory(userId1);
      const score = await this.calculateAdvancedCompatibility(user1, user2, history);

      return score;
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      throw error;
    }
  }

  /**
   * Get likes received by a user (people who liked this user)
   */
  async getLikesReceived(userId) {
    try {
      console.log(`📥 Getting likes received for user: ${userId}`);

      // Query: Find all swipes where swipedUserId is the current user
      const snapshot = await db.collection('swipes')
        .where('swipedUserId', '==', userId)
        .where('type', 'in', ['like', 'superlike'])
        .get();

      console.log(`Found ${snapshot.docs.length} total likes for user ${userId}`);

      // Get all existing matches to exclude them
      const matchesSnapshot = await db.collection('matches')
        .where('users', 'array-contains', userId)
        .get();

      const matchedUserIds = new Set();
      matchesSnapshot.forEach(doc => {
        const data = doc.data();
        data.users.forEach(uid => {
          if (uid !== userId) {
            matchedUserIds.add(uid);
          }
        });
      });

      console.log(`User ${userId} has ${matchedUserIds.size} existing matches`);

      // Use a Map to deduplicate likes by userId (keep the most recent one)
      const likesMap = new Map();

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Only include if not already matched
        if (!matchedUserIds.has(data.userId)) {
          const likerUser = await this.getUserProfile(data.userId);
          if (likerUser) {
            // Check if we already have a like from this user
            if (likesMap.has(data.userId)) {
              // Keep the most recent like (compare timestamps)
              const existingLike = likesMap.get(data.userId);
              const existingTimestamp = existingLike.timestamp?.toDate ? existingLike.timestamp.toDate() : new Date(existingLike.timestamp);
              const currentTimestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
              
              if (currentTimestamp > existingTimestamp) {
                likesMap.set(data.userId, {
                  id: doc.id,
                  user: likerUser,
                  type: data.type,
                  timestamp: data.timestamp,
                  swipedUserId: userId,
                  userId: data.userId
                });
                console.log(`Updated like from ${likerUser.name} (${data.userId}) with more recent timestamp`);
              } else {
                console.log(`Keeping existing like from ${likerUser.name} (${data.userId}) - more recent`);
              }
            } else {
              // First like from this user
              likesMap.set(data.userId, {
                id: doc.id,
                user: likerUser,
                type: data.type,
                timestamp: data.timestamp,
                swipedUserId: userId,
                userId: data.userId
              });
              console.log(`Added like from ${likerUser.name} (${data.userId})`);
            }
          } else {
            console.log(`Could not fetch user profile for ${data.userId}`);
          }
        } else {
          console.log(`Skipping ${data.userId} - already matched`);
        }
      }

      // Convert Map to Array and sort by timestamp (most recent first)
      const likes = Array.from(likesMap.values()).sort((a, b) => {
        const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timestampB - timestampA;
      });

      console.log(`✅ Found ${likes.length} unique likes received (excluding ${matchedUserIds.size} already matched)`);
      return likes;
    } catch (error) {
      console.error('Error getting likes received:', error);
      return [];
    }
  }

  /**
   * Clean up duplicate swipes in the database
   */
  async cleanupDuplicateSwipes() {
    try {
      console.log('🧹 Starting cleanup of duplicate swipes...');
      
      // Get all swipes grouped by userId and swipedUserId
      const allSwipesSnapshot = await db.collection('swipes').get();
      const swipeGroups = new Map();
      
      allSwipesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.userId}_${data.swipedUserId}`;
        
        if (!swipeGroups.has(key)) {
          swipeGroups.set(key, []);
        }
        swipeGroups.get(key).push({
          id: doc.id,
          ...data
        });
      });
      
      console.log(`Found ${swipeGroups.size} unique user pairs with swipes`);
      
      let totalRemoved = 0;
      const batch = db.batch();
      
      // For each group, keep only the most recent swipe
      for (const [key, swipes] of swipeGroups.entries()) {
        if (swipes.length > 1) {
          console.log(`Found ${swipes.length} swipes for ${key}, keeping most recent`);
          
          // Sort by timestamp (most recent first)
          swipes.sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return timeB - timeA;
          });
          
          // Keep the first (most recent) and delete the rest
          const toKeep = swipes[0];
          const toDelete = swipes.slice(1);
          
          console.log(`Keeping swipe ${toKeep.id}, deleting ${toDelete.length} duplicates`);
          
          toDelete.forEach(swipe => {
            batch.delete(db.collection('swipes').doc(swipe.id));
            totalRemoved++;
          });
        }
      }
      
      if (totalRemoved > 0) {
        await batch.commit();
        console.log(`✅ Cleanup complete: removed ${totalRemoved} duplicate swipes`);
      } else {
        console.log('✅ No duplicate swipes found');
      }
      
      return { removed: totalRemoved };
    } catch (error) {
      console.error('Error cleaning up duplicate swipes:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const matchingService = new AdvancedMatchingService();
