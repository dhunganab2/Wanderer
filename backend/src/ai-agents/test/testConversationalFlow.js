#!/usr/bin/env node
/**
 * Test Script for the Improved AI Travel Agent System
 * Demonstrates the natural conversational flow described in the scenario
 */

import ImprovedAITravelService from '../ImprovedAITravelService.js';

// Mock socket service for testing
const mockSocketService = {
  sendStatusUpdate: (userId, update) => {
    console.log(`📡 [Socket Update for ${userId}]:`, update.stage, '-', update.message, `(${update.progress}%)`);
  }
};

// Mock user context
const mockUserContext = {
  userId: 'test-user-123',
  userProfile: {
    name: 'Jaljala',
    age: 21,
    location: 'Highland Heights',
    travelStyle: ['backpacker', 'nightlife', 'group', 'adventurer', 'wellness'],
    interests: ['Drawing', 'hiking'],
    bucketList: ['Japan', 'Iceland', 'New Zealand']
  }
};

async function testConversationalFlow() {
  console.log('🤖 ===== TESTING IMPROVED AI TRAVEL AGENT SYSTEM =====\n');

  try {
    // Initialize the improved AI service
    const aiService = new ImprovedAITravelService();
    await aiService.initialize(mockSocketService);

    console.log('✅ AI Service initialized successfully\n');

    // Test Scenario: "plan a trip to tokyo"
    console.log('🎬 ===== SCENARIO: "plan a trip to tokyo" =====\n');

    // Step 1: User makes initial vague request
    console.log('👤 User: "plan a trip to tokyo"\n');

    const response1 = await aiService.generateResponse(
      "plan a trip to tokyo",
      mockUserContext,
      mockSocketService
    );

    console.log('🤖 AI Response 1:');
    console.log('Type:', response1.type);
    console.log('Stage:', response1.metadata?.conversationStage);
    console.log('Message:', response1.message);
    console.log('\n' + '='.repeat(80) + '\n');

    // Step 2: User provides duration
    console.log('👤 User: "5 days"\n');

    const response2 = await aiService.generateResponse(
      "5 days",
      mockUserContext,
      mockSocketService
    );

    console.log('🤖 AI Response 2:');
    console.log('Type:', response2.type);
    console.log('Stage:', response2.metadata?.conversationStage);
    console.log('Message:', response2.message);
    console.log('\n' + '='.repeat(80) + '\n');

    // Step 3: User provides travel companions
    console.log('👤 User: "with my friend Casey"\n');

    const response3 = await aiService.generateResponse(
      "with my friend Casey",
      mockUserContext,
      mockSocketService
    );

    console.log('🤖 AI Response 3:');
    console.log('Type:', response3.type);
    console.log('Stage:', response3.metadata?.conversationStage);
    console.log('Message:', response3.message.substring(0, 500) + '...');

    if (response3.metadata?.agentCredits) {
      console.log('\n🎉 Agent Credits:');
      Object.entries(response3.metadata.agentCredits).forEach(([agent, credit]) => {
        console.log(`  ${agent}: ${credit}`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Test different greeting
    console.log('🎬 ===== SCENARIO: Greeting Test =====\n');
    console.log('👤 User: "hi"\n');

    const greetingResponse = await aiService.generateResponse(
      "hi",
      mockUserContext,
      mockSocketService
    );

    console.log('🤖 AI Greeting Response:');
    console.log('Type:', greetingResponse.type);
    console.log('Message:', greetingResponse.message);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test system health
    console.log('🏥 ===== SYSTEM HEALTH CHECK =====\n');

    const healthCheck = await aiService.healthCheck();
    console.log('Health Status:', JSON.stringify(healthCheck, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // Test system stats
    console.log('📊 ===== SYSTEM STATISTICS =====\n');

    const systemStats = aiService.getSystemStats();
    console.log('System Stats:', JSON.stringify(systemStats, null, 2));

    console.log('\n🎉 ===== ALL TESTS COMPLETED SUCCESSFULLY =====');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConversationalFlow();
}

export default testConversationalFlow;