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

    // API Key rotation system
    this.apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_BACKUP,
      process.env.GEMINI_API_KEY_BACKUP_2
    ].filter(key => key);

    this.currentKeyIndex = 0;
    this.keyUsageCount = new Map();
    this.maxUsagePerKey = 50;
    this.exhaustedKeys = new Set();
    this.keyExhaustionTime = new Map();
    this.callCounter = 0;

    this.initializeGemini();
  }

  initializeGemini() {
    if (this.apiKeys.length === 0) {
      console.warn(`⚠️ No API keys available for ${this.name}`);
      return false;
    }


    const currentKey = this.apiKeys[this.currentKeyIndex];
    this.genAI = new GoogleGenerativeAI(currentKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    if (!this.keyUsageCount.has(currentKey)) {
      this.keyUsageCount.set(currentKey, 0);
    }

    return true;
  }

  getBestAvailableKeyIndex() {
    const availableKeys = [];
    for (let i = 0; i < this.apiKeys.length; i++) {
      if (!this.isKeyExhausted(i)) {
        availableKeys.push(i);
      }
    }

    if (availableKeys.length === 0) {
      return -1;
    }

    const rotationIndex = this.callCounter % availableKeys.length;
    return availableKeys[rotationIndex];
  }

  isKeyExhausted(keyIndex) {
    const key = this.apiKeys[keyIndex];
    if (!this.exhaustedKeys.has(key)) return false;

    const exhaustionTime = this.keyExhaustionTime.get(key);
    if (!exhaustionTime) return false;

    const now = new Date();
    const hoursElapsed = (now - exhaustionTime) / (1000 * 60 * 60);

    if (hoursElapsed >= 24) {
      this.exhaustedKeys.delete(key);
      this.keyExhaustionTime.delete(key);
      this.keyUsageCount.set(key, 0);
      return false;
    }

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
    if (!this.model) {
      throw new Error(`Gemini not initialized for ${this.name}`);
    }

    this.callCounter++;

    const bestKeyIndex = this.getBestAvailableKeyIndex();
    if (bestKeyIndex === -1) {
      throw new Error('All API keys are exhausted');
    }

    if (bestKeyIndex !== this.currentKeyIndex) {
      this.currentKeyIndex = bestKeyIndex;
      this.initializeGemini();
    }

    try {
      const response = await this.model.generateContent(prompt);
      const currentKey = this.apiKeys[this.currentKeyIndex];
      this.keyUsageCount.set(currentKey, (this.keyUsageCount.get(currentKey) || 0) + 1);
      return response.response.text();
    } catch (error) {
      // Handle 503 Service Unavailable (overloaded) errors
      if (error.status === 503 || error.message?.includes('overloaded') || error.message?.includes('Service Unavailable')) {
        console.log(`🔄 API key ${this.currentKeyIndex + 1} is overloaded (503), adding delay and trying next key...`);
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try next available key
        const nextIndex = this.getBestAvailableKeyIndex();
        if (nextIndex !== -1 && nextIndex !== this.currentKeyIndex) {
          this.currentKeyIndex = nextIndex;
          this.initializeGemini();
          
          // Retry with next key
          try {
            const retryResponse = await this.model.generateContent(prompt);
            const currentKey = this.apiKeys[this.currentKeyIndex];
            this.keyUsageCount.set(currentKey, (this.keyUsageCount.get(currentKey) || 0) + 1);
            return retryResponse.response.text();
          } catch (retryError) {
            console.error('Retry with next key also failed:', retryError);
            throw retryError;
          }
        } else {
          console.log('No other API keys available, throwing 503 error');
          throw error;
        }
      }
      
      if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('limit')) {
        const failedKey = this.apiKeys[this.currentKeyIndex];
        this.exhaustedKeys.add(failedKey);
        this.keyExhaustionTime.set(failedKey, new Date());

        const nextIndex = this.getBestAvailableKeyIndex();
        if (nextIndex !== -1) {
          this.currentKeyIndex = nextIndex;
          this.initializeGemini();
          return await this.callGemini(prompt);
        }
      }
      throw error;
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