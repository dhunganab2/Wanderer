#!/usr/bin/env node
/**
 * Test Script for Quick Response System
 * Shows instant responses and background planning
 */

import QuickResponseAIService from '../QuickResponseAIService.js';

// Mock socket service to see status updates
const mockSocketService = {
  sendStatusUpdate: (userId, update) => {
    console.log(`📡 [Status Update]: ${update.progress}% - ${update.message}`);
  },
  sendMessage: (userId, message) => {
    console.log(`📨 [Final Result]: ${message.message.substring(0, 200)}...`);
  }
};

// Mock user context
const mockUser = {
  userId: 'quick-test-123',
  userProfile: {
    name: 'TestUser',
    interests: ['culture', 'food'],
    travelStyle: ['adventure', 'backpacker']
  }
};

async function testQuickResponses() {
  console.log('⚡ ===== TESTING QUICK RESPONSE SYSTEM =====\n');

  const startTime = Date.now();
  const service = new QuickResponseAIService();
  await service.initialize(mockSocketService);
  const initTime = Date.now() - startTime;

  console.log(`✅ Initialized in ${initTime}ms\n`);

  // Test 1: Instant greeting
  console.log('🧪 TEST 1: Instant Greeting Response');
  console.log('👤 User: "hi"');

  const greetingStart = Date.now();
  const greetingResponse = await service.generateResponse("hi", mockUser, mockSocketService);
  const greetingTime = Date.now() - greetingStart;

  console.log(`🤖 Response (${greetingTime}ms):`);
  console.log(`   ${greetingResponse.message}`);
  console.log(`   Quick: ${greetingResponse.metadata?.quickResponse || false}\n`);

  // Test 2: Trip planning start
  console.log('🧪 TEST 2: Trip Planning Start');
  console.log('👤 User: "plan a trip to Japan"');

  const planStart = Date.now();
  const planResponse = await service.generateResponse("plan a trip to Japan", mockUser, mockSocketService);
  const planTime = Date.now() - planStart;

  console.log(`🤖 Response (${planTime}ms):`);
  console.log(`   ${planResponse.message}`);
  console.log(`   Quick: ${planResponse.metadata?.quickResponse || false}\n`);

  // Test 3: Follow-up question
  console.log('🧪 TEST 3: Follow-up Response');
  console.log('👤 User: "5 days"');

  const followUpStart = Date.now();
  const followUpResponse = await service.generateResponse("5 days", mockUser, mockSocketService);
  const followUpTime = Date.now() - followUpStart;

  console.log(`🤖 Response (${followUpTime}ms):`);
  console.log(`   ${followUpResponse.message}`);
  console.log(`   Quick: ${followUpResponse.metadata?.quickResponse || false}\n`);

  // Test 4: Complete trip request (triggers background planning)
  console.log('🧪 TEST 4: Complete Trip Request (Background Planning)');
  console.log('👤 User: "solo trip"');

  const completeStart = Date.now();
  const completeResponse = await service.generateResponse("solo trip", mockUser, mockSocketService);
  const completeTime = Date.now() - completeStart;

  console.log(`🤖 Immediate Response (${completeTime}ms):`);
  console.log(`   ${completeResponse.message.substring(0, 200)}...`);
  console.log(`   Type: ${completeResponse.type}`);
  console.log(`\n⏳ Background planning started... Watch for status updates above!\n`);

  // Wait a bit to see background updates
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 5: Status check
  console.log('🧪 TEST 5: Planning Status Check');
  console.log('👤 User: "how is my trip planning going?"');

  const statusStart = Date.now();
  const statusResponse = await service.generateResponse("how is my trip planning going?", mockUser, mockSocketService);
  const statusTime = Date.now() - statusStart;

  console.log(`🤖 Response (${statusTime}ms):`);
  console.log(`   ${statusResponse.message}`);

  // Show system stats
  console.log('\n📊 ===== SYSTEM STATISTICS =====');
  const stats = service.getSystemStats();
  console.log(`Version: ${stats.version}`);
  console.log(`Architecture: ${stats.architecture}`);
  console.log(`Active Conversations: ${stats.activeConversations}`);
  console.log(`Active Planning: ${stats.activePlanningProcesses}`);
  console.log(`Features: ${stats.features.join(', ')}`);

  console.log('\n🎉 ===== QUICK RESPONSE TESTS COMPLETED =====');
  console.log(`✅ All responses were ${greetingTime + planTime + followUpTime + completeTime + statusTime < 1000 ? 'UNDER 1 SECOND!' : 'fast!'}`);
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testQuickResponses().catch(console.error);
}

export default testQuickResponses;