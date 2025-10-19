/**
 * Base Agent Class
 * Provides common functionality for all AI agents
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

export default class BaseAgent {
  constructor(name, role, systemPrompt) {
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.status = 'idle'; // idle, working, completed, error
    this.currentTask = null;
    this.results = null;
    this.startTime = null;
    this.endTime = null;

    // Single API Key system
    this.apiKey = process.env.GEMINI_API_KEY;
    this.callCounter = 0;

    // Debug: Log API key status
    if (this.apiKey) {
      const maskedKey = this.apiKey.length > 8 ? this.apiKey.substring(0, 4) + "..." + this.apiKey.substring(this.apiKey.length - 4) : "***";
      console.log(`🔑 ${this.name}: Using single API key: ${maskedKey}`);
    } else {
      console.warn(`⚠️ ${this.name}: No API key configured!`);
    }

    this.initializeGemini();
  }

  initializeGemini() {
    if (!this.apiKey) {
      console.warn(`⚠️ No API key available for ${this.name}`);
      return false;
    }

    // Initialize the Gemini client with API key
    this.client = new GoogleGenerativeAI(this.apiKey);
    this.modelName = "gemini-2.0-flash-exp";

    return true;
  }


  /**
   * Parse AI response and extract JSON from markdown code blocks
   */
  parseAIResponse(response) {
    if (!response) return null;
    
    let cleanResponse = response.trim();
    
    // Remove markdown code blocks
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Raw response:', response);
      console.error('Cleaned response:', cleanResponse);
      return null;
    }
  }

  async callGemini(prompt) {
    if (!this.client) {
      console.log(`⚠️ ${this.name}: No Gemini client initialized - using fallback response.`);
      throw new Error('No Gemini client initialized - using fallback');
    }

    this.callCounter++;
    const callId = this.callCounter;

    try {
      console.log(`🚀 ${this.name}: Making API call #${callId} with ${this.modelName}...`);

      // Format the prompt correctly for the API
      const formattedPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
      
      // Get the model and generate content using correct @google/generative-ai API
      const model = this.client.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(formattedPrompt);
      const response = await result.response;
      const responseText = response.text();
      
      console.log(`✅ ${this.name}: API call #${callId} successful (${responseText.length} chars)`);
      return responseText;
    } catch (error) {
      console.error(`❌ ${this.name}: API call #${callId} failed:`, error.message);

      // Check for specific error types
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('403')) {
        throw new Error('Invalid API key - check your Gemini API key configuration');
      } else if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded - please try again later');
      } else if (error.message.includes('quota')) {
        throw new Error('API quota exceeded - check your billing settings');
      }

      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  updateStatus(status, task = null) {
    this.status = status;
    this.currentTask = task;

    if (status === 'working' && !this.startTime) {
      this.startTime = new Date();
    } else if (status === 'completed' || status === 'error') {
      this.endTime = new Date();
    }

    this.logStatus();
  }

  logStatus() {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = this.getStatusEmoji();
    console.log(`${emoji} [${timestamp}] ${this.name} (${this.role}): ${this.status.toUpperCase()}`);

    if (this.currentTask) {
      console.log(`   🎯 Task: ${this.currentTask}`);
    }
  }

  getStatusEmoji() {
    switch (this.status) {
      case 'idle': return '⏳';
      case 'working': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '🤖';
    }
  }

  getDuration() {
    if (!this.startTime) return null;
    const endTime = this.endTime || new Date();
    return Math.round((endTime - this.startTime) / 1000);
  }

  getStatusUpdate() {
    return {
      name: this.name,
      role: this.role,
      status: this.status,
      currentTask: this.currentTask,
      duration: this.getDuration(),
      results: this.results
    };
  }

  async execute(input, context = {}) {
    throw new Error(`Execute method must be implemented by ${this.name}`);
  }
}