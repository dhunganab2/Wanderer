import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

/**
 * Socket.io authentication middleware
 * Simplified for development - allows connection with userId
 */
export const socketAuth = async (socket, next) => {
  try {
    const userId = socket.handshake.auth.userId;
    
    // For development, allow connection with any userId
    if (userId) {
      socket.userId = userId;
      console.log(`✅ Socket authenticated for user: ${userId}`);
      return next();
    }
    
    // Fallback: assign a temporary userId for testing
    socket.userId = 'anonymous_' + Date.now();
    console.log(`⚠️ Socket connected without userId, assigned: ${socket.userId}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    // Still allow connection for development
    socket.userId = 'error_' + Date.now();
    next();
  }
};

/**
 * Middleware to check if user is authorized to join a conversation room
 */
export const authorizeConversation = async (socket, conversationId, callback) => {
  try {
    if (!socket.userId) {
      return callback({ error: 'User not authenticated' });
    }

    // For development, we'll be more permissive
    // In production, you'd want to check conversation participants from Firestore
    console.log(`User ${socket.userId} joining conversation ${conversationId}`);
    callback({ success: true });
  } catch (error) {
    console.error('Error authorizing conversation:', error);
    callback({ error: 'Authorization failed' });
  }
};

/**
 * Rate limiting for message sending
 */
export class MessageRateLimit {
  constructor(maxMessages = 30, windowMs = 60000) { // 30 messages per minute
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
    this.userMessageCounts = new Map();
  }

  checkLimit(userId) {
    const now = Date.now();
    const userMessages = this.userMessageCounts.get(userId) || [];
    
    // Remove old messages outside the window
    const validMessages = userMessages.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validMessages.length >= this.maxMessages) {
      return false; // Rate limit exceeded
    }

    // Add current message timestamp
    validMessages.push(now);
    this.userMessageCounts.set(userId, validMessages);
    
    return true; // Within rate limit
  }

  cleanup() {
    // Clean up old entries periodically
    const now = Date.now();
    for (const [userId, messages] of this.userMessageCounts.entries()) {
      const validMessages = messages.filter(timestamp => now - timestamp < this.windowMs);
      if (validMessages.length === 0) {
        this.userMessageCounts.delete(userId);
      } else {
        this.userMessageCounts.set(userId, validMessages);
      }
    }
  }
}

// Global rate limiter instance
export const messageRateLimit = new MessageRateLimit();

// Clean up rate limiter every 5 minutes
setInterval(() => {
  messageRateLimit.cleanup();
}, 5 * 60 * 1000);
