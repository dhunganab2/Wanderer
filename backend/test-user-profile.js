import './src/config/database.js';
import { userService } from './src/services/userService.js';

console.log('🔍 Testing user profile service...');

try {
  const user = await userService.getUserProfile('1');
  console.log('✅ User found:', user);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
