/**
 * Chief Travel Planner Agent
 * The manager agent that orchestrates the entire trip planning process
 * and handles user communication
 */
import BaseAgent from '../utils/BaseAgent.js';

export default class ChiefTravelPlannerAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are the ChiefTravelPlanner, the lead AI Travel Consultant for the Wanderer app.
Your role is to:
1. Communicate directly with users in a warm, friendly, and professional manner
2. Gather missing trip information through natural conversation
3. Coordinate with specialist agents (ProfileAnalyst, DataScout, ItineraryArchitect)
4. Compile comprehensive travel plans from agent outputs
5. Present final plans in an engaging, personalized way

COMMUNICATION STYLE:
- Warm, enthusiastic, and genuinely excited about travel
- Professional but approachable - like a knowledgeable friend
- Use natural conversation flow, not robotic responses
- Show genuine interest in the user's travel dreams
- Ask follow-up questions that demonstrate active listening
- Use travel emojis naturally but not excessively

CONVERSATION MANAGEMENT:
- When info is missing, ask ONE question at a time for natural flow
- Build on previous responses - show you're listening
- Reference user's profile and preferences when relevant
- Acknowledge what they've shared before asking for more

AGENT COORDINATION:
- You manage the workflow between specialist agents
- Present their findings in a cohesive, storytelling manner
- Always credit the team's collaborative work
- Ensure the final plan reflects all agent insights

Remember: You're creating dream trips, not just itineraries. Make it magical! ✈️`;

    super('ChiefTravelPlanner', 'Lead AI Travel Consultant & User Experience Manager', systemPrompt);
  }

  /**
   * Handle initial trip planning conversation
   */
  async handleInitialRequest(message, userContext, conversationState) {
    this.updateStatus('working', 'Analyzing trip request and gathering details');

    const extractedInfo = conversationState.extractedInfo || {};
    const userProfile = userContext.userProfile || {};

    // Check what information we have and what we need
    const requiredInfo = ['destination', 'duration', 'travelers'];
    const missingInfo = requiredInfo.filter(field => !extractedInfo[field] ||
      (Array.isArray(extractedInfo[field]) && extractedInfo[field].length === 0));

    if (missingInfo.length > 0) {
      // Generate natural follow-up question
      const followUpPrompt = this.buildFollowUpPrompt(extractedInfo, missingInfo, userProfile, message);
      const response = await this.callGemini(followUpPrompt);

      this.updateStatus('completed', 'Generated follow-up question for missing information');
      this.results = {
        type: 'follow_up_question',
        message: response,
        missingInfo,
        extractedInfo
      };

      return this.results;
    } else {
      // We have all needed info - ready to start planning
      this.updateStatus('completed', 'Trip request complete - ready to coordinate planning');
      this.results = {
        type: 'ready_to_plan',
        extractedInfo,
        message: `Perfect! I have everything I need. Let me rally my specialist team to create your amazing ${extractedInfo.destination} adventure!`
      };

      return this.results;
    }
  }

  /**
   * Handle follow-up responses during information gathering
   */
  async handleFollowUp(message, userContext, conversationState) {
    this.updateStatus('working', 'Processing follow-up response');

    const currentInfo = conversationState.extractedInfo || {};
    const userProfile = userContext.userProfile || {};

    // Analyze the user's response and extract new information
    const analysisPrompt = this.buildAnalysisPrompt(message, currentInfo, userProfile);
    const analysisResponse = await this.callGemini(analysisPrompt);

    let updatedInfo;
    try {
      // Try to parse JSON response
      const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        updatedInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON in response');
      }
    } catch (error) {
      // Fallback analysis
      updatedInfo = this.fallbackAnalysis(message, currentInfo);
    }

    // Merge with existing information
    const mergedInfo = { ...currentInfo, ...updatedInfo };

    // Check what's still missing
    const requiredInfo = ['destination', 'duration', 'travelers'];
    const stillMissing = requiredInfo.filter(field => !mergedInfo[field] ||
      (Array.isArray(mergedInfo[field]) && mergedInfo[field].length === 0));

    if (stillMissing.length > 0) {
      // Still need more information
      const followUpPrompt = this.buildFollowUpPrompt(mergedInfo, stillMissing, userProfile, message);
      const response = await this.callGemini(followUpPrompt);

      this.updateStatus('completed', 'Generated additional follow-up question');
      this.results = {
        type: 'follow_up_question',
        message: response,
        missingInfo: stillMissing,
        extractedInfo: mergedInfo
      };
    } else {
      // We have everything - ready to plan!
      const readyPrompt = this.buildReadyPrompt(mergedInfo, userProfile);
      const response = await this.callGemini(readyPrompt);

      this.updateStatus('completed', 'All information gathered - ready to coordinate planning');
      this.results = {
        type: 'ready_to_plan',
        extractedInfo: mergedInfo,
        message: response
      };
    }

    return this.results;
  }

  /**
   * Coordinate with specialist agents to create trip plan
   */
  async coordinatePlanCreation(tripDetails, agentResults) {
    this.updateStatus('working', 'Coordinating with specialist team to compile comprehensive plan');

    const profileAnalysis = agentResults.ProfileAnalyst;
    const dataResearch = agentResults.DataScout;
    const itinerary = agentResults.ItineraryArchitect;

    // Create comprehensive plan by combining all agent results
    const compilationPrompt = this.buildCompilationPrompt(tripDetails, profileAnalysis, dataResearch, itinerary);
    const compiledPlan = await this.callGemini(compilationPrompt);

    this.updateStatus('completed', 'Compiled comprehensive travel plan from all specialist insights');

    this.results = {
      type: 'complete_trip_plan',
      compiledPlan,
      agentCredits: {
        ProfileAnalyst: profileAnalysis?.summary || 'Analyzed traveler preferences and style',
        DataScout: dataResearch?.summary || 'Researched live travel data and options',
        ItineraryArchitect: itinerary?.summary || 'Designed personalized day-by-day experience'
      },
      rawAgentData: agentResults
    };

    return this.results;
  }

  /**
   * Handle plan modification requests
   */
  async handlePlanModification(modificationRequest, currentPlan, userContext) {
    this.updateStatus('working', 'Processing plan modification request');

    const modificationPrompt = `${this.systemPrompt}

CURRENT TRIP PLAN:
${JSON.stringify(currentPlan, null, 2)}

USER MODIFICATION REQUEST: "${modificationRequest}"

USER CONTEXT:
${this.buildUserContextString(userContext)}

TASK:
The user wants to modify their existing trip plan. Analyze their request and provide a natural, conversational response that:

1. Acknowledges their specific modification request
2. Explains what you can adjust
3. Asks any clarifying questions if needed
4. Maintains enthusiasm about their trip

If the modification is straightforward, provide the adjusted recommendation.
If it requires more information, ask natural follow-up questions.

Keep the tone warm and collaborative - you're working together to perfect their dream trip!

RESPONSE:`;

    const response = await this.callGemini(modificationPrompt);

    this.updateStatus('completed', 'Generated modification response');
    this.results = {
      type: 'modification_response',
      message: response,
      originalRequest: modificationRequest
    };

    return this.results;
  }

  /**
   * Build follow-up question prompt
   */
  buildFollowUpPrompt(extractedInfo, missingInfo, userProfile, userMessage) {
    return `${this.systemPrompt}

CONVERSATION CONTEXT:
User Message: "${userMessage}"

INFORMATION WE HAVE:
${Object.entries(extractedInfo).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`).join('\n')}

INFORMATION WE STILL NEED:
${missingInfo.join(', ')}

USER PROFILE:
${this.buildUserContextString({ userProfile })}

TASK:
Generate a natural, warm follow-up question to get the missing information.

GUIDELINES:
- Ask for ONE piece of information at a time for natural conversation flow
- Acknowledge what they've already shared
- Show genuine enthusiasm for their trip
- Reference their profile/interests when relevant
- Keep it conversational, not like a form

Focus on the most important missing information first: ${missingInfo[0]}

RESPONSE:`;
  }

  /**
   * Build analysis prompt for follow-up responses
   */
  buildAnalysisPrompt(userMessage, currentInfo, userProfile) {
    return `Analyze this user response and extract travel information.

USER MESSAGE: "${userMessage}"

CURRENT INFORMATION:
${JSON.stringify(currentInfo, null, 2)}

USER PROFILE:
${this.buildUserContextString({ userProfile })}

Extract any new travel information from their message and return ONLY a JSON object with these fields:
{
  "destination": "extracted destination or null",
  "duration": "extracted duration (e.g., '5 days') or null",
  "travelers": ["array of traveler names or empty array"],
  "budget": "extracted budget info or null",
  "interests": ["any new interests mentioned"],
  "startDate": "any mentioned dates or null"
}

If the message is just a destination name like "Japan", set destination to that.
If it's just a number like "5" or "5 days", set duration appropriately.
Return valid JSON only.`;
  }

  /**
   * Build ready-to-plan prompt
   */
  buildReadyPrompt(completeInfo, userProfile) {
    return `${this.systemPrompt}

COMPLETE TRIP INFORMATION:
${JSON.stringify(completeInfo, null, 2)}

USER PROFILE:
${this.buildUserContextString({ userProfile })}

TASK:
Generate an enthusiastic message announcing that you have all the information needed and are about to start the planning process with your specialist team.

The message should:
1. Confirm the key trip details (destination, duration, travelers)
2. Show excitement about the specific destination
3. Reference their interests/profile when relevant
4. Explain that your specialist team is getting to work
5. Set expectations for the planning process

Keep it warm, personalized, and exciting!

RESPONSE:`;
  }

  /**
   * Build compilation prompt for final plan
   */
  buildCompilationPrompt(tripDetails, profileAnalysis, dataResearch, itinerary) {
    return `${this.systemPrompt}

TRIP DETAILS:
${JSON.stringify(tripDetails, null, 2)}

SPECIALIST AGENT RESULTS:

PROFILE ANALYST FINDINGS:
${JSON.stringify(profileAnalysis, null, 2)}

DATA SCOUT RESEARCH:
${JSON.stringify(dataResearch, null, 2)}

ITINERARY ARCHITECT DESIGN:
${JSON.stringify(itinerary, null, 2)}

TASK:
Compile these specialist findings into a comprehensive, engaging trip plan presentation.

Create a response that:
1. Presents the plan as a cohesive story
2. Highlights how it matches their personal travel style
3. Integrates all the specialist research seamlessly
4. Maintains excitement and personal touch
5. Includes practical next steps
6. Credits the collaborative team effort

Format as a structured plan that's both informative and inspiring.
Make it feel like a personalized travel masterpiece!

RESPONSE:`;
  }

  /**
   * Helper methods
   */
  buildUserContextString(userContext) {
    const profile = userContext.userProfile || {};
    const parts = [];

    if (profile.name) parts.push(`Name: ${profile.name}`);
    if (profile.age) parts.push(`Age: ${profile.age}`);
    if (profile.location) parts.push(`Location: ${profile.location}`);
    if (profile.interests) parts.push(`Interests: ${profile.interests.join(', ')}`);
    if (profile.travelStyle) parts.push(`Travel Style: ${profile.travelStyle.join(', ')}`);
    if (profile.bucketList) parts.push(`Bucket List: ${profile.bucketList.join(', ')}`);

    return parts.join('\n');
  }

  /**
   * Fallback analysis for when JSON parsing fails
   */
  fallbackAnalysis(message, currentInfo) {
    const updates = {};
    const lowerMessage = message.toLowerCase().trim();

    // Simple destination extraction
    if (!currentInfo.destination && /^[a-zA-Z\s,.-]+$/.test(message.trim()) &&
        message.trim().length > 2 && message.trim().length < 50) {
      updates.destination = message.trim();
    }

    // Simple duration extraction
    const durationMatch = message.match(/(\d+)\s*(?:day|days|week|weeks)/i);
    if (durationMatch && !currentInfo.duration) {
      const num = parseInt(durationMatch[1]);
      const unit = durationMatch[0].toLowerCase();
      updates.duration = unit.includes('week') ? `${num * 7} days` : `${num} days`;
    }

    // Solo/group indicators
    if (!currentInfo.travelers || currentInfo.travelers.length === 0) {
      if (/\b(solo|alone|by myself)\b/i.test(message)) {
        updates.travelers = ['solo'];
      } else if (/\b(with|friends|family|partner)\b/i.test(message)) {
        updates.travelers = ['group'];
      }
    }

    return updates;
  }

  async execute(input, context = {}) {
    const { action, message, userContext, conversationState, tripDetails, agentResults, currentPlan } = input;

    switch (action) {
      case 'handle_initial_request':
        return await this.handleInitialRequest(message, userContext, conversationState);

      case 'handle_follow_up':
        return await this.handleFollowUp(message, userContext, conversationState);

      case 'coordinate_plan_creation':
        return await this.coordinatePlanCreation(tripDetails, agentResults);

      case 'handle_plan_modification':
        return await this.handlePlanModification(message, currentPlan, userContext);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}