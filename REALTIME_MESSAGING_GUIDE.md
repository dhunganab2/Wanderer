# Real-time Messaging System Documentation

## Overview

This document describes the complete real-time messaging system implemented for the Wanderer travel matching app using Socket.io WebSocket server with Firebase Firestore integration.

## Architecture

```
Frontend (React + TypeScript)
    ↓ Socket.io Client + Firebase Auth
WebSocket Server (Socket.io + Express.js)
    ↓ Firebase Admin SDK
Firebase Firestore Database
```

## Key Features

✅ **Real-time messaging** with WebSocket connections  
✅ **Authentication** via Firebase JWT tokens  
✅ **Room-based messaging** (users join conversation rooms)  
✅ **Typing indicators** with real-time broadcasting  
✅ **Message delivery confirmations**  
✅ **Read receipts** for messages  
✅ **Automatic reconnection** with message queuing  
✅ **Firebase fallback** for offline scenarios  
✅ **Rate limiting** to prevent message spam  
✅ **Security validation** (users can only message their matches)

## Backend Implementation

### 1. Server Setup (`backend/src/index.js`)

```javascript
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketService } from './services/socketService.js';
import { socketAuth } from './middleware/socketAuth.js';

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8081",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const socketService = new SocketService(io);
io.use(socketAuth);
io.on('connection', (socket) => {
  socketService.initializeSocket(socket);
});
```

### 2. Authentication Middleware (`backend/src/middleware/socketAuth.js`)

- Verifies Firebase JWT tokens on WebSocket connection
- Attaches user ID to socket for authorization
- Implements rate limiting for message sending
- Provides conversation authorization checks

### 3. Socket Service (`backend/src/services/socketService.js`)

Handles all WebSocket events:
- `send_message` - Send and broadcast messages
- `join_conversation` - Join conversation rooms
- `leave_conversation` - Leave conversation rooms
- `typing_start/stop` - Typing indicators
- `mark_messages_read` - Read receipts

### 4. Messaging Controller (`backend/src/controllers/messagingController.js`)

REST API endpoints:
- `GET /api/messaging/conversations/:userId` - Get user conversations
- `GET /api/messaging/messages/:conversationId` - Get conversation messages
- `POST /api/messaging/messages` - Send message (fallback)
- `POST /api/messaging/conversations` - Create conversation
- `PUT /api/messaging/conversations/:conversationId/read` - Mark as read
- `GET /api/messaging/online-users` - Get online user count

## Frontend Integration

### 1. Enhanced Messaging Service (`frontend/src/services/realtimeMessaging.ts`)

```typescript
import { io, Socket } from 'socket.io-client';
import { auth } from '@/lib/firebase';

class RealtimeMessagingService {
  private socket: Socket | null = null;
  private messageQueue: Array<QueuedMessage> = [];
  
  async connect() {
    const token = await auth.currentUser?.getIdToken();
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
  }
}
```

### 2. Key Methods

- `sendMessage()` - Send via WebSocket with Firebase fallback
- `joinConversation()` - Join conversation room
- `leaveConversation()` - Leave conversation room
- `sendTypingIndicator()` - Send typing status
- `getConnectionStatus()` - Check connection health

## WebSocket Events

### Client → Server

| Event | Data | Response | Description |
|-------|------|----------|-------------|
| `send_message` | `{conversationId, content, type}` | `{success, message}` | Send a message |
| `join_conversation` | `{conversationId}` | `{success}` | Join conversation room |
| `leave_conversation` | `{conversationId}` | `{success}` | Leave conversation room |
| `typing_start` | `{conversationId}` | - | Start typing indicator |
| `typing_stop` | `{conversationId}` | - | Stop typing indicator |
| `mark_messages_read` | `{conversationId, messageIds}` | `{success}` | Mark messages as read |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `new_message` | `Message` | New message received |
| `user_typing` | `{userId, conversationId, isTyping}` | Typing indicator update |
| `messages_read` | `{conversationId, readBy, messageIds}` | Messages marked as read |
| `user_joined_conversation` | `{userId, conversationId}` | User joined room |
| `user_left_conversation` | `{userId, conversationId}` | User left room |
| `connected` | `{userId}` | Connection established |

## Database Schema

### Conversations Collection

```javascript
{
  id: "conv_123",
  participants: [
    { id: "user1", name: "Alice", avatar: "..." },
    { id: "user2", name: "Bob", avatar: "..." }
  ],
  matchId: "match_456", // Optional: link to match
  lastMessage: {
    id: "msg_789",
    content: "Hello!",
    senderId: "user1",
    timestamp: "2024-01-15T10:30:00Z"
  },
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Messages Collection

```javascript
{
  id: "msg_123",
  conversationId: "conv_456",
  senderId: "user1",
  content: "Hello, how are you?",
  type: "text", // "text", "image", "location"
  timestamp: "2024-01-15T10:30:00Z",
  read: false,
  delivered: true
}
```

## Security Features

### 1. Authentication
- All WebSocket connections require valid Firebase JWT tokens
- Tokens are verified using Firebase Admin SDK
- Invalid tokens are immediately rejected

### 2. Authorization
- Users can only join conversations they're participants in
- Message sending is restricted to conversation participants
- Match validation ensures users can only message their matches

### 3. Rate Limiting
- 30 messages per minute per user
- Automatic cleanup of rate limit data
- Configurable limits per environment

## Error Handling

### Connection Errors
- Automatic reconnection with exponential backoff
- Message queuing during disconnections
- Graceful degradation to Firebase-only mode

### Message Failures
- Automatic fallback to Firebase REST API
- Delivery confirmations and retries
- User feedback for failed operations

## Development Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install socket.io

# Frontend  
cd frontend
npm install socket.io-client
```

### 2. Environment Variables

```bash
# Backend .env
FRONTEND_URL=http://localhost:8081
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Frontend .env
VITE_BACKEND_URL=http://localhost:3001
```

### 3. Start Services

```bash
# Backend
npm run dev

# Frontend
npm run dev
```

### 4. Test Connection

```bash
# Test WebSocket server
node backend/src/scripts/testBasicConnection.js
```

## Production Deployment

### 1. Environment Setup
- Set up Firebase Admin SDK with service account
- Configure CORS for production domains
- Set up SSL/TLS for WebSocket connections

### 2. Scaling Considerations
- Use Redis adapter for multi-server Socket.io scaling
- Implement horizontal scaling with load balancers
- Monitor WebSocket connection limits

### 3. Monitoring
- Track connection counts and message throughput
- Monitor error rates and reconnection patterns
- Set up alerts for service degradation

## Usage Examples

### Frontend: Sending Messages

```typescript
// Join conversation
await messagingService.joinConversation('conv_123');

// Send message
const messageId = await messagingService.sendMessage({
  matchId: 'conv_123',
  senderId: 'user1',
  content: 'Hello!',
  type: 'text'
});

// Listen for new messages
messagingService.onMessage((message) => {
  console.log('New message:', message);
});

// Send typing indicator
messagingService.sendTypingIndicator('conv_123', 'user1', true);
```

### Frontend: Starting New Conversation

```typescript
// From profile page
navigate('/messages', { 
  state: { 
    startConversationWith: {
      id: 'user2',
      name: 'Alice',
      avatar: 'avatar_url'
    }
  }
});
```

### Backend: Creating Conversation

```javascript
// POST /api/messaging/conversations
{
  "participants": ["user1", "user2"],
  "matchId": "match_123",
  "initialMessage": {
    "senderId": "user1",
    "content": "Hi! I saw we matched!",
    "type": "text"
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if backend server is running
   - Verify CORS configuration
   - Ensure Firebase Auth is working

2. **Authentication Errors**
   - Verify Firebase JWT token validity
   - Check Firebase Admin SDK configuration
   - Ensure user is properly authenticated

3. **Messages Not Delivered**
   - Check conversation authorization
   - Verify user is participant in conversation
   - Check rate limiting status

### Debug Tools

```javascript
// Check connection status
const status = messagingService.getConnectionStatus();
console.log('Connection:', status);

// Monitor WebSocket events
messagingService.socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

## API Reference

### REST Endpoints

All endpoints require authentication via Firebase JWT token in Authorization header.

#### Get Conversations
```
GET /api/messaging/conversations/:userId
Response: Array<Conversation>
```

#### Get Messages  
```
GET /api/messaging/messages/:conversationId?limit=50&before=timestamp
Response: Array<Message>
```

#### Send Message
```
POST /api/messaging/messages
Body: { conversationId, senderId, content, type }
Response: { success: boolean, message: Message }
```

#### Create Conversation
```
POST /api/messaging/conversations  
Body: { participants, matchId?, initialMessage? }
Response: { success: boolean, conversation: Conversation }
```

#### Mark as Read
```
PUT /api/messaging/conversations/:conversationId/read
Body: { userId, messageIds? }
Response: { success: boolean }
```

## Performance Optimization

### Frontend
- Implement message pagination
- Use virtual scrolling for long conversations
- Cache conversation data locally
- Debounce typing indicators

### Backend
- Use database connection pooling
- Implement message caching with Redis
- Optimize Firebase queries with indexes
- Use compression for WebSocket messages

## Security Best Practices

1. **Always validate user permissions** before allowing actions
2. **Sanitize message content** to prevent XSS attacks  
3. **Implement proper rate limiting** to prevent abuse
4. **Use HTTPS/WSS** in production environments
5. **Monitor for suspicious activity** and implement banning
6. **Keep dependencies updated** for security patches

---

🎉 **The real-time messaging system is now fully implemented and ready for use!**

For additional support or questions, refer to the Socket.io and Firebase documentation.
