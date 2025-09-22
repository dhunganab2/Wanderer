import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Testing environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY first 20 chars:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 20) + '...' : 'undefined');
console.log('Working directory:', process.cwd());
console.log('All GEMINI env vars:', Object.keys(process.env).filter(key => key.includes('GEMINI')));