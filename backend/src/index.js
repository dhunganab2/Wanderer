// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

// Import routes
import userRoutes from './routes/users.js';
import matchingRoutes from './routes/matching.js';
import bucketListRoutes from './routes/bucketlist.js';
import messagingRoutes from './routes/messaging.js';
import aiRoutes from './routes/aiV3.js';

// Import socket services
import { socketAuth } from './middleware/socketAuth.js';
import { SocketService } from './services/socketService.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:8080",
      "http://localhost:8080",
      "http://localhost:8081"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Socket.io authentication middleware
io.use(socketAuth);

// Socket.io connection handler
io.on('connection', (socket) => {
  socketService.initializeSocket(socket);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:8080",
    "http://localhost:8080",
    "http://localhost:8081"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-conversation-id', 'x-user-id'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Wanderer Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      users: '/api/users',
      matching: '/api/matching',
      bucketlist: '/api/bucketlist',
      messaging: '/api/messaging',
      ai: '/api/ai'
    },
    timestamp: new Date().toISOString()
  });
});

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

// Make socket service available to routes
app.locals.socketService = socketService;

// Mount route handlers
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/bucketlist', bucketListRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/ai/v3', aiRoutes); // Mount at v3 for frontend compatibility
app.use('/api/ai', aiRoutes);    // Also mount at root for flexibility

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

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 WebSocket server ready for real-time messaging`);
  console.log(`🔌 Socket.io endpoint: http://localhost:${PORT}`);
});
