import { db, admin_mock } from '../config/database.js';

// Always use admin_mock for FieldValue operations (it handles both mock and real modes)
const adminInstance = admin_mock;

/**
 * Socket service class to handle all WebSocket events and operations
 */
export class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socket.id mapping
    this.userSockets = new Map(); // socket.id -> userId mapping
    this.typingUsers = new Map(); // conversationId -> Set of typing userIds
    this.conversationRooms = new Map(); // conversationId -> Set of socket.ids
  }

  /**
   * Initialize socket event handlers for a connected socket
   */
  initializeSocket(socket) {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${socket.id} for user: ${userId}`);

    // Store user mappings
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);

    // Join personal room for user-specific events
    socket.join(`user_${userId}`);

    // Notify other users that this user is online
    socket.broadcast.emit('user_online', { userId, online: true });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
      this.handleDisconnect(socket);
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        console.log(`User ${userId} joining conversation: ${conversationId}`);

        // Join the conversation room
        socket.join(`conversation_${conversationId}`);

        // Track this conversation room
        if (!this.conversationRooms.has(conversationId)) {
          this.conversationRooms.set(conversationId, new Set());
        }
        this.conversationRooms.get(conversationId).add(socket.id);

        if (callback) {
          callback({ success: true });
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
        if (callback) {
          callback({ error: error.message });
        }
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', ({ conversationId }, callback) => {
      console.log(`User ${userId} leaving conversation: ${conversationId}`);

      socket.leave(`conversation_${conversationId}`);

      if (this.conversationRooms.has(conversationId)) {
        this.conversationRooms.get(conversationId).delete(socket.id);
        if (this.conversationRooms.get(conversationId).size === 0) {
          this.conversationRooms.delete(conversationId);
        }
      }

      if (callback) {
        callback({ success: true });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, content, type = 'text' } = data;
        console.log(`User ${userId} sending message to conversation: ${conversationId}`);

        if (!conversationId || !content?.trim()) {
          if (callback) {
            callback({ error: 'Missing required fields: conversationId, content' });
          }
          return;
        }

        // Create message document
        const messageData = {
          conversationId,
          matchId: conversationId, // For backward compatibility
          senderId: userId,
          content: content.trim(),
          type,
          timestamp: adminInstance.firestore.FieldValue.serverTimestamp(),
          read: false,
          delivered: false
        };

        // Ensure conversation exists before saving message
        await this.ensureConversationExists(conversationId, userId);

        // Save message to Firestore
        const messageRef = await db.collection('messages').add(messageData);
        console.log(`📝 Mock: Added messages document with ID: ${messageRef.id}`);

        // Get the created message with timestamp
        const createdMessage = await messageRef.get();
        const messageWithId = {
          id: messageRef.id,
          ...createdMessage.data(),
          timestamp: createdMessage.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        };

        console.log(`✅ Message saved to Firestore: ${messageRef.id}`);

        // Update conversation with last message if it exists
        try {
          const conversationRef = db.collection('conversations').doc(conversationId);
          const conversationDoc = await conversationRef.get();

          if (conversationDoc.exists) {
            await conversationRef.update({
              lastMessage: {
                id: messageRef.id,
                senderId: userId,
                content: content.trim(),
                timestamp: adminInstance.firestore.FieldValue.serverTimestamp(),
                type
              },
              updatedAt: adminInstance.firestore.FieldValue.serverTimestamp()
            });
            console.log(`📝 Mock: Updated conversations document with ID: ${conversationId}`);
          }
        } catch (convError) {
          console.warn('Could not update conversation last message:', convError);
        }

        // Broadcast message to all users in the conversation room
        this.io.to(`conversation_${conversationId}`).emit('new_message', {
          ...messageWithId,
          conversationId,
          matchId: conversationId
        });
        console.log(`📡 Message broadcasted via WebSocket to room: ${conversationId}`);

        // Stop typing indicator for this user
        this.handleStopTyping(socket, conversationId);

        if (callback) {
          callback({
            success: true,
            message: messageWithId
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        if (callback) {
          callback({ error: error.message });
        }
      }
    });

    // Handle typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      this.handleStartTyping(socket, conversationId);
    });

    socket.on('typing_stop', ({ conversationId }) => {
      this.handleStopTyping(socket, conversationId);
    });
  }

  /**
   * Handle user starting to type
   */
  handleStartTyping(socket, conversationId) {
    const userId = socket.userId;
    console.log(`User ${userId} started typing in conversation: ${conversationId}`);

    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    this.typingUsers.get(conversationId).add(userId);

    // Broadcast typing indicator to other users in the conversation
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      conversationId,
      matchId: conversationId,
      userId,
      isTyping: true
    });
  }

  /**
   * Handle user stopping typing
   */
  handleStopTyping(socket, conversationId) {
    const userId = socket.userId;
    console.log(`User ${userId} stopped typing in conversation: ${conversationId}`);

    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId).delete(userId);
      if (this.typingUsers.get(conversationId).size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }

    // Broadcast stop typing indicator to other users in the conversation
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      conversationId,
      matchId: conversationId,
      userId,
      isTyping: false
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnect(socket) {
    const userId = this.userSockets.get(socket.id);

    if (userId) {
      // Remove user mappings
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      // Clean up conversation rooms
      for (const [conversationId, socketIds] of this.conversationRooms.entries()) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          this.conversationRooms.delete(conversationId);
        }
      }

      // Clean up typing indicators
      for (const [conversationId, typingUserIds] of this.typingUsers.entries()) {
        if (typingUserIds.has(userId)) {
          typingUserIds.delete(userId);
          // Notify others that this user stopped typing
          socket.to(`conversation_${conversationId}`).emit('user_typing', {
            conversationId,
            matchId: conversationId,
            userId,
            isTyping: false
          });
        }
        if (typingUserIds.size === 0) {
          this.typingUsers.delete(conversationId);
        }
      }

      // Notify other users that this user is offline
      socket.broadcast.emit('user_online', { userId, online: false });
    }
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Send message to all users in a conversation
   */
  sendToConversation(conversationId, event, data) {
    this.io.to(`conversation_${conversationId}`).emit(event, data);
  }

  /**
   * Ensure conversation exists for a matchId
   */
  async ensureConversationExists(conversationId, currentUserId) {
    try {
      // Check if conversation already exists
      const existingConversation = await db.collection('conversations').doc(conversationId).get();

      if (!existingConversation.exists()) {
        console.log(`🔄 Creating conversation: ${conversationId}`);

        // Extract participant IDs from the conversationId (assumes format: temp_match_user1_user2)
        const participants = this.extractParticipantsFromMatchId(conversationId, currentUserId);

        // Create new conversation
        const conversationData = {
          id: conversationId,
          matchId: conversationId,
          participants: participants,
          createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
          updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
          lastMessage: null
        };

        await db.collection('conversations').doc(conversationId).set(conversationData);
        console.log(`✅ Conversation created: ${conversationId}`);
      }
    } catch (error) {
      console.error(`❌ Error ensuring conversation exists:`, error);
    }
  }

  /**
   * Extract participant IDs from match ID
   */
  extractParticipantsFromMatchId(matchId, currentUserId) {
    // For temp_match_user1_user2 format
    if (matchId.startsWith('temp_match_')) {
      const parts = matchId.split('_');
      if (parts.length >= 4) {
        const user1 = parts[2];
        const user2 = parts[3];
        return [user1, user2];
      }
    }

    // For other formats, ensure current user is included
    return [currentUserId];
  }

  /**
   * Get debugging information
   */
  getDebugInfo() {
    return {
      connectedUsers: Array.from(this.connectedUsers.entries()),
      conversationRooms: Array.from(this.conversationRooms.entries()).map(([id, sockets]) => [id, Array.from(sockets)]),
      typingUsers: Array.from(this.typingUsers.entries()).map(([id, users]) => [id, Array.from(users)])
    };
  }
}