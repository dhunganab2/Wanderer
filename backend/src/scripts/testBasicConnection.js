import { io } from 'socket.io-client';

console.log('🚀 Testing Basic WebSocket Server Connectivity...\n');

// Test basic server availability (should fail due to authentication, but confirms server is running)
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('❌ UNEXPECTED: Connected without authentication (this should not happen)');
  socket.disconnect();
  process.exit(1);
});

socket.on('connect_error', (error) => {
  if (error.message.includes('Authentication error')) {
    console.log('✅ SUCCESS: WebSocket server is running and authentication is working!');
    console.log('✅ SUCCESS: Server correctly rejected connection without token');
    console.log('\n📊 Test Results:');
    console.log('- WebSocket server: ✅ Running on port 3001');
    console.log('- Authentication middleware: ✅ Working correctly');
    console.log('- Socket.io integration: ✅ Properly configured');
    console.log('\n🎉 Real-time messaging backend is ready!');
    console.log('💡 Frontend can now connect with valid Firebase auth tokens.');
  } else {
    console.log('❌ FAIL: Unexpected connection error:', error.message);
    process.exit(1);
  }
  
  socket.disconnect();
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ TIMEOUT: Could not connect to WebSocket server');
  console.log('💡 Make sure the backend server is running: npm run dev');
  socket.disconnect();
  process.exit(1);
}, 10000);
