/**
 * Profile Analyst Agent
 * Specializes in analyzing user profiles and travel preferences
 * to personalize the travel experience
 */
import BaseAgent from '../utils/BaseAgent.js';

export default class ProfileAnalystAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are the ProfileAnalyst, a specialist in understanding travelers and personalizing their experiences.
Your expertise includes:
1. Analyzing user profiles to understand travel preferences
2. Identifying travel personalities and styles
3. Matching destinations and activities to user interests
4. Understanding budget preferences and constraints
5. Recognizing cultural and experiential preferences

ANALYSIS APPROACH:
- Look beyond surface interests to understand deeper motivations
- Consider travel style combinations (e.g., adventurous + wellness)
- Factor in age, location, and experience level
- Identify potential challenges or special needs
- Suggest experiences that align with personality

OUTPUT REQUIREMENTS:
- Provide actionable insights for other agents
- Include specific recommendations based on analysis
- Highlight both preferences and potential concerns
- Suggest personalization opportunities
- Maintain respect for individual differences`;

    super('ProfileAnalyst', 'Traveler Preference Specialist & Personalization Expert', systemPrompt);
  }

  /**
   * Analyze user profile and travel preferences
   */
  async analyzeProfile(userProfile, tripContext = {}) {
    this.updateStatus('working', 'Deep-diving into travel personality and preferences');

    const analysisPrompt = this.buildProfileAnalysisPrompt(userProfile, tripContext);
    const analysisResult = await this.callGemini(analysisPrompt);

    let analysis;
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in analysis');
      }
    } catch (error) {
      console.warn('Failed to parse ProfileAnalyst JSON, using fallback');
      analysis = this.createFallbackAnalysis(userProfile, tripContext);
    }

    this.updateStatus('completed', 'Completed comprehensive traveler profile analysis');

    this.results = {
      ...analysis,
      summary: `Identified ${analysis.travelPersonality} traveler with ${analysis.primaryInterests?.length || 0} key interests`,
      timestamp: new Date().toISOString()
    };

    return this.results;
  }

  /**
   * Generate activity recommendations based on profile
   */
  async generateActivityRecommendations(userProfile, destination, duration) {
    this.updateStatus('working', 'Generating personalized activity recommendations');

    const recommendationPrompt = this.buildRecommendationPrompt(userProfile, destination, duration);
    const recommendations = await this.callGemini(recommendationPrompt);

    this.updateStatus('completed', 'Generated personalized activity recommendations');

    return {
      type: 'activity_recommendations',
      recommendations,
      basedOn: {
        interests: userProfile.interests,
        travelStyle: userProfile.travelStyle,
        destination,
        duration
      }
    };
  }

  /**
   * Analyze group compatibility (for group trips)
   */
  async analyzeGroupCompatibility(travelerProfiles) {
    if (!travelerProfiles || travelerProfiles.length <= 1) {
      return { type: 'solo_analysis', message: 'Solo travel analysis' };
    }

    this.updateStatus('working', 'Analyzing group travel compatibility');

    const compatibilityPrompt = this.buildGroupCompatibilityPrompt(travelerProfiles);
    const compatibilityAnalysis = await this.callGemini(compatibilityPrompt);

    this.updateStatus('completed', 'Completed group compatibility analysis');

    return {
      type: 'group_compatibility',
      analysis: compatibilityAnalysis,
      groupSize: travelerProfiles.length,
      travelerCount: travelerProfiles.length
    };
  }

  /**
   * Build profile analysis prompt
   */
  buildProfileAnalysisPrompt(userProfile, tripContext) {
    return `${this.systemPrompt}

ANALYZE THIS TRAVELER PROFILE:

USER PROFILE:
- Name: ${userProfile.name || 'Not specified'}
- Age: ${userProfile.age || 'Not specified'}
- Location: ${userProfile.location || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Travel Style: ${userProfile.travelStyle?.join(', ') || 'Not specified'}
- Bucket List: ${userProfile.bucketList?.join(', ') || 'Not specified'}
- Travel Experience: ${userProfile.travelExperience || 'Not specified'}
- Preferred Budget: ${userProfile.preferredBudget || 'Not specified'}

TRIP CONTEXT:
- Destination: ${tripContext.destination || 'Not specified'}
- Duration: ${tripContext.duration || 'Not specified'}
- Trip Type: ${tripContext.tripType || 'Not specified'}

ANALYSIS TASK:
Provide a comprehensive analysis in JSON format:

{
  "travelPersonality": "primary travel personality type",
  "primaryInterests": ["top 3-5 interests from analysis"],
  "travelStyleAnalysis": "detailed analysis of their travel approach",
  "experienceLevel": "beginner|intermediate|experienced",
  "budgetProfile": "budget|mid-range|luxury",
  "personalityTraits": ["key traits that affect travel choices"],
  "motivations": ["what drives their travel decisions"],
  "preferences": {
    "accommodation": "preferred accommodation style and why",
    "activities": "types of activities they'd most enjoy",
    "pace": "preferred trip pace (relaxed|moderate|packed)",
    "socialLevel": "social preferences (solo time vs group activities)"
  },
  "considerations": ["special considerations or potential challenges"],
  "personalizationOpportunities": ["specific ways to customize their experience"],
  "destinationSuitability": {
    "perfectMatches": ["why this destination suits them"],
    "potentialConcerns": ["aspects to be mindful of"],
    "recommendations": ["specific recommendations for this traveler"]
  }
}

Base your analysis on psychological insights and travel behavior patterns.`;
  }

  /**
   * Build activity recommendation prompt
   */
  buildRecommendationPrompt(userProfile, destination, duration) {
    return `${this.systemPrompt}

USER PROFILE:
${this.buildUserProfileString(userProfile)}

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${duration}

TASK:
Generate specific activity recommendations that perfectly match this traveler's profile.

Consider:
- Their interests and travel style
- The destination's unique offerings
- Duration constraints
- Their experience level and preferences

Provide 8-12 specific activity recommendations with brief explanations of why each suits them.
Focus on authentic experiences that align with their personality.

Format as a natural, conversational list of recommendations.`;
  }

  /**
   * Build group compatibility prompt
   */
  buildGroupCompatibilityPrompt(travelerProfiles) {
    const profileStrings = travelerProfiles.map((profile, index) =>
      `TRAVELER ${index + 1}:\n${this.buildUserProfileString(profile)}`
    ).join('\n\n');

    return `${this.systemPrompt}

ANALYZE GROUP TRAVEL COMPATIBILITY:

${profileStrings}

ANALYSIS TASK:
Analyze how well this group would travel together and provide insights for planning.

Consider:
- Shared interests and compatible travel styles
- Potential areas of conflict or different preferences
- How to balance different needs and interests
- Group dynamics and decision-making considerations
- Activity recommendations that work for everyone

Provide practical insights for creating a harmonious group travel experience.`;
  }

  /**
   * Create fallback analysis when JSON parsing fails
   */
  createFallbackAnalysis(userProfile, tripContext) {
    const interests = userProfile.interests || [];
    const travelStyle = userProfile.travelStyle || [];
    const age = userProfile.age || 25;

    // Simple analysis based on available data
    let travelPersonality = 'Explorer';
    if (travelStyle.includes('luxury')) travelPersonality = 'Luxury Traveler';
    else if (travelStyle.includes('budget') || travelStyle.includes('backpacker')) travelPersonality = 'Budget Explorer';
    else if (travelStyle.includes('adventure')) travelPersonality = 'Adventure Seeker';
    else if (travelStyle.includes('wellness')) travelPersonality = 'Wellness Traveler';

    let experienceLevel = 'intermediate';
    if (age < 25) experienceLevel = 'beginner';
    else if (userProfile.travelExperience === 'extensive') experienceLevel = 'experienced';

    let budgetProfile = 'mid-range';
    if (travelStyle.includes('luxury')) budgetProfile = 'luxury';
    else if (travelStyle.includes('budget') || travelStyle.includes('backpacker')) budgetProfile = 'budget';

    return {
      travelPersonality,
      primaryInterests: interests.slice(0, 3),
      travelStyleAnalysis: `${travelPersonality} who enjoys ${interests.join(', ')} with a ${travelStyle.join(' and ')} approach`,
      experienceLevel,
      budgetProfile,
      personalityTraits: ['curious', 'open-minded'],
      motivations: ['exploration', 'new experiences'],
      preferences: {
        accommodation: budgetProfile === 'luxury' ? 'high-end hotels' : budgetProfile === 'budget' ? 'hostels or budget accommodations' : 'comfortable mid-range options',
        activities: interests.length > 0 ? `Activities related to ${interests.join(', ')}` : 'Diverse cultural and recreational activities',
        pace: 'moderate',
        socialLevel: travelStyle.includes('group') ? 'enjoys group activities' : 'balanced social interaction'
      },
      considerations: age < 25 ? ['First-time travel considerations', 'Budget consciousness'] : [],
      personalizationOpportunities: [`Focus on ${interests[0] || 'cultural experiences'}`, 'Local authentic experiences'],
      destinationSuitability: {
        perfectMatches: [`Great destination for ${interests[0] || 'exploration'}`],
        potentialConcerns: [],
        recommendations: ['Focus on authentic local experiences', 'Balance must-see attractions with personal interests']
      }
    };
  }

  /**
   * Helper method to build user profile string
   */
  buildUserProfileString(userProfile) {
    const parts = [];

    if (userProfile.name) parts.push(`Name: ${userProfile.name}`);
    if (userProfile.age) parts.push(`Age: ${userProfile.age}`);
    if (userProfile.location) parts.push(`Location: ${userProfile.location}`);
    if (userProfile.interests && userProfile.interests.length > 0) {
      parts.push(`Interests: ${userProfile.interests.join(', ')}`);
    }
    if (userProfile.travelStyle && userProfile.travelStyle.length > 0) {
      parts.push(`Travel Style: ${userProfile.travelStyle.join(', ')}`);
    }
    if (userProfile.bucketList && userProfile.bucketList.length > 0) {
      parts.push(`Bucket List: ${userProfile.bucketList.slice(0, 5).join(', ')}`);
    }
    if (userProfile.travelExperience) {
      parts.push(`Travel Experience: ${userProfile.travelExperience}`);
    }
    if (userProfile.preferredBudget) {
      parts.push(`Budget Preference: ${userProfile.preferredBudget}`);
    }

    return parts.join('\n');
  }

  /**
   * Execute method - handles different types of profile analysis tasks
   */
  async execute(input, context = {}) {
    const { action, userProfile, tripContext, travelerProfiles, destination, duration } = input;

    switch (action) {
      case 'analyze_profile':
        return await this.analyzeProfile(userProfile, tripContext);

      case 'generate_activity_recommendations':
        return await this.generateActivityRecommendations(userProfile, destination, duration);

      case 'analyze_group_compatibility':
        return await this.analyzeGroupCompatibility(travelerProfiles);

      default:
        // Default to profile analysis
        return await this.analyzeProfile(userProfile, tripContext);
    }
  }
}