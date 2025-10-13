/**
 * Conversation Flow Manager
 * Handles natural dialogue flow and conversation state management
 */
export default class ConversationFlowManager {
  constructor() {
    this.conversationStates = new Map();
    this.conversationHistory = new Map();

    // Conversation stages
    this.STAGES = {
      GREETING: 'greeting',
      GATHERING_DETAILS: 'gathering_details',
      PLANNING_IN_PROGRESS: 'planning_in_progress',
      PROPOSAL_REVIEW: 'proposal_review',
      BOOKING_ASSISTANCE: 'booking_assistance',
      COMPLETED: 'completed'
    };
  }

  /**
   * Analyze user message and determine conversation intent and next action
   */
  async analyzeMessage(message, userContext = {}) {
    const userId = userContext.userId;
    const currentState = this.getConversationState(userId);

    // Get conversation history for context
    const history = this.getConversationHistory(userId, 5);

    const analysis = {
      intent: null,
      confidence: 0,
      extractedInfo: {},
      nextAction: null,
      conversationStage: currentState?.stage || this.STAGES.GREETING,
      needsMoreInfo: false,
      missingFields: []
    };

    // Analyze based on current conversation stage
    switch (currentState?.stage) {
      case this.STAGES.GATHERING_DETAILS:
        return this.analyzeGatheringStage(message, currentState, analysis);

      case this.STAGES.PLANNING_IN_PROGRESS:
        return this.analyzePlanningStage(message, currentState, analysis);

      case this.STAGES.PROPOSAL_REVIEW:
        return this.analyzeProposalStage(message, currentState, analysis);

      default:
        return this.analyzeInitialStage(message, userContext, analysis, history);
    }
  }

  /**
   * Analyze initial stage (greeting or first trip request)
   */
  analyzeInitialStage(message, userContext, analysis, history) {
    const lowerMessage = message.toLowerCase().trim();

    // Greeting patterns
    if (this.isGreeting(lowerMessage)) {
      analysis.intent = 'greeting';
      analysis.confidence = 0.95;
      analysis.nextAction = 'respond_greeting';
      return analysis;
    }

    // Trip planning patterns
    const tripPatterns = [
      /plan\s+(?:a\s+|an\s+)?(?:trip|vacation|holiday|journey)/i,
      /(?:i\s+)?(?:want|need|would like)\s+to\s+(?:plan|go|visit|travel)/i,
      /(?:help\s+me\s+)?(?:plan|organize|book)\s+(?:a\s+|my\s+)?trip/i,
      /going\s+to\s+([a-zA-Z\s]+)/i,
      /traveling\s+to\s+([a-zA-Z\s]+)/i
    ];

    for (const pattern of tripPatterns) {
      if (pattern.test(message)) {
        analysis.intent = 'trip_planning_request';
        analysis.confidence = 0.9;

        // Extract information
        const extracted = this.extractTripDetails(message, userContext);
        analysis.extractedInfo = extracted;

        // Determine if we have enough info (including new required fields)
        const requiredFields = ['destination', 'duration', 'travelers', 'departureCity', 'budgetPreference'];
        const missingFields = requiredFields.filter(field => !extracted[field]);

        if (missingFields.length === 0) {
          analysis.nextAction = 'start_planning';
          analysis.needsMoreInfo = false;
        } else {
          analysis.nextAction = 'gather_details';
          analysis.needsMoreInfo = true;
          analysis.missingFields = missingFields;
          analysis.conversationStage = this.STAGES.GATHERING_DETAILS;
        }

        return analysis;
      }
    }

    // General travel questions
    if (lowerMessage.includes('destination') || lowerMessage.includes('where should') || lowerMessage.includes('recommend')) {
      analysis.intent = 'destination_recommendation';
      analysis.confidence = 0.8;
      analysis.nextAction = 'provide_recommendations';
      return analysis;
    }

    // Weather questions
    if (lowerMessage.includes('weather')) {
      analysis.intent = 'weather_inquiry';
      analysis.confidence = 0.85;
      analysis.nextAction = 'provide_weather_info';
      return analysis;
    }

    // Default to general chat
    analysis.intent = 'general_chat';
    analysis.confidence = 0.6;
    analysis.nextAction = 'general_response';
    return analysis;
  }

  /**
   * Analyze gathering details stage
   */
  analyzeGatheringStage(message, currentState, analysis) {
    analysis.conversationStage = this.STAGES.GATHERING_DETAILS;

    const currentInfo = currentState.extractedInfo || {};
    const newInfo = this.extractTripDetails(message, {});

    // Merge information
    const mergedInfo = { ...currentInfo };

    // Update with new information
    Object.keys(newInfo).forEach(key => {
      if (newInfo[key] && (!mergedInfo[key] || newInfo[key].length > 0)) {
        mergedInfo[key] = newInfo[key];
      }
    });

    // Handle simple responses
    if (this.isSimpleDestinationResponse(message)) {
      mergedInfo.destination = message.trim();
    }

    if (this.isSimpleDurationResponse(message)) {
      const match = message.match(/(\d+)/);
      if (match) {
        mergedInfo.duration = `${match[1]} days`;
      }
    }

    analysis.extractedInfo = mergedInfo;

    // Check what's still missing (including new required fields)
    const requiredFields = ['destination', 'duration', 'travelers', 'departureCity', 'budgetPreference'];
    const missingFields = requiredFields.filter(field => !mergedInfo[field] ||
      (Array.isArray(mergedInfo[field]) && mergedInfo[field].length === 0));

    if (missingFields.length === 0) {
      analysis.intent = 'complete_trip_request';
      analysis.nextAction = 'start_planning';
      analysis.needsMoreInfo = false;
      analysis.conversationStage = this.STAGES.PLANNING_IN_PROGRESS;
    } else {
      analysis.intent = 'partial_trip_info';
      analysis.nextAction = 'ask_for_missing_info';
      analysis.needsMoreInfo = true;
      analysis.missingFields = missingFields;
    }

    return analysis;
  }

  /**
   * Analyze planning in progress stage
   */
  analyzePlanningStage(message, currentState, analysis) {
    // User is trying to interact while planning is in progress
    analysis.conversationStage = this.STAGES.PLANNING_IN_PROGRESS;
    analysis.intent = 'planning_status_inquiry';
    analysis.nextAction = 'provide_planning_update';
    return analysis;
  }

  /**
   * Analyze proposal review stage
   */
  analyzeProposalStage(message, currentState, analysis) {
    const lowerMessage = message.toLowerCase().trim();

    analysis.conversationStage = this.STAGES.PROPOSAL_REVIEW;

    // Approval patterns
    if (this.isApproval(lowerMessage)) {
      analysis.intent = 'approve_plan';
      analysis.nextAction = 'proceed_to_booking';
      analysis.conversationStage = this.STAGES.BOOKING_ASSISTANCE;
      return analysis;
    }

    // Modification requests
    if (this.isModificationRequest(lowerMessage)) {
      analysis.intent = 'modify_plan';
      analysis.nextAction = 'handle_modifications';
      return analysis;
    }

    // Questions about the plan
    analysis.intent = 'plan_inquiry';
    analysis.nextAction = 'answer_plan_question';
    return analysis;
  }

  /**
   * Extract trip details from message
   */
  extractTripDetails(message, userContext = {}) {
    const details = {
      destination: null,
      duration: null,
      travelers: [],
      budget: null,
      interests: [],
      startDate: null,
      departureCity: null,
      budgetPreference: null
    };

    // Extract destination
    const destinationPatterns = [
      /(?:to|visit|in)\s+([A-Za-z\s,]{3,30})(?:\s+for|\s+with|\s*$)/i,
      /(?:trip|travel|vacation|holiday)\s+to\s+([A-Za-z\s,]{3,30})(?:\s+for|\s+with|\s*$)/i,
      /(?:plan|going)\s+(?:a\s+trip\s+)?to\s+([A-Za-z\s,]{3,30})(?:\s+for|\s+with|\s*$)/i
    ];

    for (const pattern of destinationPatterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        details.destination = match[1].trim().replace(/\s+/g, ' ');
        break;
      }
    }

    // Extract duration
    const durationMatch = message.match(/(\d+)\s*(?:day|days|week|weeks|night|nights)/i);
    if (durationMatch) {
      const num = parseInt(durationMatch[1]);
      const unit = durationMatch[0].toLowerCase();
      details.duration = unit.includes('week') ? `${num * 7} days` : `${num} days`;
    }

    // Extract travelers
    if (userContext.userId) {
      details.travelers.push(userContext.userId);
    }

    const soloIndicators = /\b(solo|alone|by myself|on my own)\b/i;
    const groupIndicators = /\b(with|friends|family|partner|spouse|girlfriend|boyfriend|husband|wife|group|together)\b/i;

    if (soloIndicators.test(message)) {
      // Solo travel - already have current user
    } else if (groupIndicators.test(message)) {
      // Look for specific names
      const namePattern = /(?:me and|with)\s+([A-Za-z\s,]+)/i;
      const match = message.match(namePattern);
      if (match) {
        const names = match[1].split(/[,\s]+/).filter(name =>
          name.length > 1 && !['and', 'with', 'my', 'friends', 'family'].includes(name.toLowerCase())
        );
        details.travelers.push(...names);
      }
    }

    // Extract budget hints
    const budgetPatterns = [
      /budget\s*(?:of|around|about)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*budget/i,
      /(cheap|budget|expensive|luxury|mid-range|affordable)/i
    ];

    for (const pattern of budgetPatterns) {
      const match = message.match(pattern);
      if (match) {
        details.budget = match[1] || match[0];
        break;
      }
    }

    // Extract departure city (from where they're flying)
    const departureCityPatterns = [
      /(?:from|flying from|leaving from|departing from)\s+([A-Za-z\s,]{3,30})/i,
      /(?:i'm in|i am in|based in|living in)\s+([A-Za-z\s,]{3,30})/i,
      /starting from\s+([A-Za-z\s,]{3,30})/i
    ];

    for (const pattern of departureCityPatterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        details.departureCity = match[1].trim().replace(/\s+/g, ' ');
        break;
      }
    }

    // Extract budget preference (Budget/Mid-range/Luxury)
    const budgetPreferencePatterns = [
      /\b(budget|cheap|affordable|economical)\s+(?:travel|trip|hotels?|accommodation)/i,
      /\b(mid-range|mid range|moderate|average)\s+(?:travel|trip|hotels?|accommodation)/i,
      /\b(luxury|luxurious|high-end|premium|upscale)\s+(?:travel|trip|hotels?|accommodation)/i,
      /(?:travel|trip|hotels?|accommodation)\s+(?:on a\s+)?(budget|cheap|mid-range|luxury)/i
    ];

    for (const pattern of budgetPreferencePatterns) {
      const match = message.match(pattern);
      if (match) {
        const preference = match[1].toLowerCase();
        if (preference === 'budget' || preference === 'cheap' || preference === 'affordable' || preference === 'economical') {
          details.budgetPreference = 'Budget';
        } else if (preference.includes('mid') || preference === 'moderate' || preference === 'average') {
          details.budgetPreference = 'Mid-range';
        } else if (preference === 'luxury' || preference === 'luxurious' || preference.includes('high-end') || preference === 'premium' || preference === 'upscale') {
          details.budgetPreference = 'Luxury';
        }
        break;
      }
    }

    return details;
  }

  /**
   * Helper methods for message classification
   */
  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'];
    return greetings.some(greeting => message.startsWith(greeting) && message.length < 50);
  }

  isSimpleDestinationResponse(message) {
    // Check if message is likely just a destination (e.g., "japan", "italy", "new york")
    const cleaned = message.trim().toLowerCase();
    return cleaned.length > 2 && cleaned.length < 50 &&
           /^[a-zA-Z\s,.-]+$/.test(cleaned) &&
           !cleaned.includes('day') && !cleaned.includes('week') &&
           !cleaned.includes('with') && !cleaned.includes('for');
  }

  isSimpleDurationResponse(message) {
    // Check if message is likely just a duration (e.g., "5", "5 days", "1 week")
    return /^\d+(\s*(?:day|days|week|weeks))?\s*$/.test(message.trim());
  }

  isApproval(message) {
    const approvalPhrases = ['yes', 'yeah', 'yep', 'sure', 'sounds good', 'looks great', 'perfect', 'let\'s do it', 'i love it', 'book it', 'go ahead'];
    return approvalPhrases.some(phrase => message.includes(phrase));
  }

  isModificationRequest(message) {
    const modificationPhrases = ['change', 'modify', 'different', 'instead', 'rather', 'but', 'however', 'adjust', 'update'];
    return modificationPhrases.some(phrase => message.includes(phrase));
  }

  /**
   * State management methods
   */
  setConversationState(userId, state) {
    this.conversationStates.set(userId, {
      ...state,
      lastUpdated: new Date(),
      sessionId: state.sessionId || this.generateSessionId()
    });

    // Auto-expire after 30 minutes
    setTimeout(() => {
      this.conversationStates.delete(userId);
    }, 30 * 60 * 1000);
  }

  getConversationState(userId) {
    return this.conversationStates.get(userId);
  }

  updateConversationState(userId, updates) {
    const currentState = this.getConversationState(userId);
    if (currentState) {
      this.setConversationState(userId, { ...currentState, ...updates });
    }
  }

  clearConversationState(userId) {
    this.conversationStates.delete(userId);
  }

  /**
   * Conversation history methods
   */
  addToHistory(userId, userMessage, aiResponse, metadata = {}) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }

    const history = this.conversationHistory.get(userId);
    history.push({
      timestamp: new Date(),
      userMessage,
      aiResponse,
      metadata
    });

    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  getConversationHistory(userId, limit = 10) {
    const history = this.conversationHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Generate natural follow-up questions
   */
  generateFollowUpQuestion(missingFields, extractedInfo, userProfile = {}) {
    const questions = {
      destination: [
        "Where are you dreaming of going?",
        "What destination is calling to you?",
        "Any particular place on your bucket list?",
        `I see you're interested in ${userProfile.interests?.[0] || 'adventure'} - any destinations in mind for that?`
      ],
      duration: [
        "How many days are you thinking?",
        "What's your ideal trip length?",
        "Are we talking weekend getaway or extended adventure?",
        "How much time can you spare for this amazing trip?"
      ],
      travelers: [
        "Who's joining you on this adventure?",
        "Solo journey or bringing company?",
        "Traveling with friends, family, or flying solo?",
        "Who else is coming along for the ride?"
      ],
      departureCity: [
        "Where will you be flying from?",
        "What city are you departing from?",
        "Which city will you start your journey from?",
        "Where's home base for this adventure?"
      ],
      budgetPreference: [
        "What's your accommodation style - budget-friendly, mid-range, or luxury?",
        "Are you looking for budget, mid-range, or luxury hotels?",
        "What's your preferred accommodation level for this trip?",
        "Would you prefer budget, mid-range, or luxury travel?"
      ]
    };

    // Pick appropriate question based on what we have
    const primaryMissing = missingFields[0];
    const questionOptions = questions[primaryMissing] || questions.destination;

    // Select question based on extracted info and user profile
    let selectedQuestion;
    if (userProfile.bucketList && userProfile.bucketList.length > 0 && primaryMissing === 'destination') {
      selectedQuestion = `Any of your bucket list destinations like ${userProfile.bucketList.slice(0, 2).join(' or ')} calling to you?`;
    } else {
      selectedQuestion = questionOptions[Math.floor(Math.random() * questionOptions.length)];
    }

    return selectedQuestion;
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}