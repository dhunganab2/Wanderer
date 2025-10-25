/**
 * Chief Travel Planner Agent
 * The manager agent that orchestrates the entire trip planning process
 * and handles user communication
 */
import BaseAgent from './BaseAgent.js';

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

}