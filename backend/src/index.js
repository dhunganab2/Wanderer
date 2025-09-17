import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './routes/users.js';
import matchingRoutes from './routes/matching.js';
import bucketListRoutes from './routes/bucketlist.js';
import messagingRoutes from './routes/messaging.js';
import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Wanderer Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to Wanderer API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      matching: '/api/matching',
      bucketlist: '/api/bucketlist',
      messaging: '/api/messaging',
      ai: '/api/ai'
    }
  });
});

// Mount route handlers
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/bucketlist', bucketListRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
