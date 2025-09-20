import { db, admin, admin_mock } from '../config/database.js';

// Always use admin_mock for FieldValue operations (it handles both mock and real modes)
const adminInstance = admin_mock;

export const messagingController = {
  // Get conversations for a user
  async getConversations(req, res) {
    try {
      const { userId } = req.params;
      console.log(`📋 Getting conversations for user: ${userId}`);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Query conversations where user is a participant
      const conversationsSnapshot = await db.collection('conversations')
        .where('participants', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const conversations = [];
      for (const doc of conversationsSnapshot.docs) {
        const data = doc.data();
        
        // Get participant details
        const participantDetails = [];
        for (const participantId of data.participants) {
          if (participantId !== userId) {
            try {
              const userDoc = await db.collection('users').doc(participantId).get();
              if (userDoc.exists()) {
                const userData = userDoc.data();
                participantDetails.push({
                  id: participantId,
                  name: userData.name || 'Unknown User',
                  avatar: userData.avatar || null,
                  nextDestination: userData.nextDestination || 'Unknown',
                  travelDates: userData.travelDates || 'Flexible'
                });
              } else {
                // If user not found in database, add placeholder
                participantDetails.push({
                  id: participantId,
                  name: participantId.includes('user_10') ? 'Alex Explorer' :
                        participantId.includes('I8FKq5vERTWsp5GTrNt4pVYGPZo2') ? 'Maya Wanderer' :
                        participantId.includes('PtiqNeg6GBSpPhVFRe0CooKbgEn1') ? 'Travel Buddy' : 'New User',
                  avatar: participantId.includes('user_10') ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' :
                          participantId.includes('I8FKq5vERTWsp5GTrNt4pVYGPZo2') ? 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' :
                          participantId.includes('PtiqNeg6GBSpPhVFRe0CooKbgEn1') ? 'https://images.unsplash.com/photo-1494790108755-2616b9a7c7a5?w=150&h=150&fit=crop&crop=face' : null,
                  nextDestination: 'Exploring',
                  travelDates: 'Soon'
                });
              }
            } catch (error) {
              console.warn(`Failed to fetch user ${participantId}:`, error);
              participantDetails.push({
                id: participantId,
                name: 'Unknown User',
                avatar: null,
                nextDestination: 'Unknown',
                travelDates: 'Flexible'
              });
            }
          }
        }

        conversations.push({
          id: doc.id,
          ...data,
          participants: participantDetails,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        });
      }

      console.log(`✅ Found ${conversations.length} conversations for user ${userId}`);
      res.status(200).json({ conversations });
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
    }
  },

  // Get messages for a conversation
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { limit = 50 } = req.query;
      console.log(`📨 Getting messages for conversation: ${conversationId}`);

      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }

      // Query messages for this conversation (support both conversationId and matchId for compatibility)
      let messagesSnapshot = await db.collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'asc')
        .limit(parseInt(limit))
        .get();

      // If no messages found with conversationId, try with matchId for backward compatibility
      if (messagesSnapshot.empty) {
        messagesSnapshot = await db.collection('messages')
          .where('matchId', '==', conversationId)
          .orderBy('timestamp', 'asc')
          .limit(parseInt(limit))
          .get();
      }

      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      }));

      console.log(`✅ Found ${messages.length} messages for conversation ${conversationId}`);
      res.status(200).json({ messages });
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
  },

  // Send a message
  async sendMessage(req, res) {
    try {
      const { conversationId, senderId, content, type = 'text' } = req.body;
      console.log(`📤 Sending message to conversation: ${conversationId}`);

      if (!conversationId || !senderId || !content?.trim()) {
        return res.status(400).json({ error: 'Missing required fields: conversationId, senderId, content' });
      }

      // Create message document
      const messageData = {
        conversationId,
        senderId,
        content: content.trim(),
        type,
        timestamp: adminInstance.firestore.FieldValue.serverTimestamp(),
        read: false,
        delivered: false
      };

      // Save message to Firestore
      const messageRef = await db.collection('messages').add(messageData);
      
      // Update conversation with last message
      await db.collection('conversations').doc(conversationId).update({
        lastMessage: {
          id: messageRef.id,
          senderId,
          content: content.trim(),
          timestamp: adminInstance.firestore.FieldValue.serverTimestamp(),
          type
        },
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp()
      });

      // Get the created message with timestamp
      const createdMessage = await messageRef.get();
      const messageWithId = {
        id: messageRef.id,
        ...createdMessage.data(),
        timestamp: createdMessage.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      console.log(`✅ Message saved to Firestore: ${messageRef.id}`);
      
      // Broadcast via WebSocket if available
      const socketService = req.app.locals.socketService;
      if (socketService) {
        socketService.io.to(conversationId).emit('new_message', messageWithId);
        console.log(`📡 Message broadcasted via WebSocket to room: ${conversationId}`);
      }

      res.status(200).json({ 
        success: true, 
        messageId: messageRef.id,
        message: messageWithId
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
  },

  // Create a new conversation
  async createConversation(req, res) {
    try {
      const { participants, matchId, initialMessage } = req.body;
      console.log(`💬 Creating conversation for match: ${matchId}`);
      console.log(`📝 Request body:`, JSON.stringify(req.body, null, 2));

      if (!participants || !Array.isArray(participants) || participants.length < 2) {
        console.log(`❌ Invalid participants:`, participants);
        return res.status(400).json({
          error: 'At least 2 participants are required',
          received: participants,
          participantCount: participants?.length || 0
        });
      }

      if (!matchId) {
        console.log(`❌ Missing matchId`);
        return res.status(400).json({ error: 'matchId is required' });
      }

      // Check if conversation already exists for this match
      const existingConversation = await db.collection('conversations')
        .where('matchId', '==', matchId)
        .limit(1)
        .get();

      if (!existingConversation.empty) {
        const existing = existingConversation.docs[0];
        console.log(`ℹ️ Conversation already exists: ${existing.id}`);
        return res.status(200).json({ 
          success: true, 
          conversationId: existing.id,
          conversation: { id: existing.id, ...existing.data() }
        });
      }

      // Create new conversation
      const conversationData = {
        participants,
        matchId,
        createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        lastMessage: null
      };

      const conversationRef = await db.collection('conversations').add(conversationData);
      
      // If there's an initial message, send it
      if (initialMessage) {
        const messageData = {
          conversationId: conversationRef.id,
          senderId: initialMessage.senderId,
          content: initialMessage.content,
          type: initialMessage.type || 'text',
          timestamp: adminInstance.firestore.FieldValue.serverTimestamp(),
          read: false,
          delivered: false
        };

        const messageRef = await db.collection('messages').add(messageData);
        
        // Update conversation with the initial message
        await conversationRef.update({
          lastMessage: {
            id: messageRef.id,
            senderId: initialMessage.senderId,
            content: initialMessage.content,
            timestamp: adminInstance.firestore.FieldValue.serverTimestamp(),
            type: initialMessage.type || 'text'
          },
          updatedAt: adminInstance.firestore.FieldValue.serverTimestamp()
        });
      }

      const createdConversation = await conversationRef.get();
      const conversationWithId = {
        id: conversationRef.id,
        ...createdConversation.data()
      };

      console.log(`✅ Conversation created: ${conversationRef.id}`);
      res.status(200).json({ 
        success: true, 
        conversationId: conversationRef.id,
        conversation: conversationWithId
      });
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation', details: error.message });
    }
  },

  // Mark messages as read
  async markMessagesAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const { userId, messageIds } = req.body;
      console.log(`👁️ Marking messages as read in conversation: ${conversationId}`);

      if (!conversationId || !userId) {
        return res.status(400).json({ error: 'Conversation ID and User ID are required' });
      }

      const batch = db.batch();
      
      if (messageIds && Array.isArray(messageIds)) {
        // Mark specific messages as read
        for (const messageId of messageIds) {
          const messageRef = db.collection('messages').doc(messageId);
          batch.update(messageRef, { 
            read: true,
            readAt: adminInstance.firestore.FieldValue.serverTimestamp(),
            readBy: userId
          });
        }
      } else {
        // Mark all unread messages in conversation as read
        const unreadMessages = await db.collection('messages')
          .where('conversationId', '==', conversationId)
          .where('senderId', '!=', userId)
          .where('read', '==', false)
          .get();

        unreadMessages.docs.forEach(doc => {
          batch.update(doc.ref, { 
            read: true,
            readAt: adminInstance.firestore.FieldValue.serverTimestamp(),
            readBy: userId
          });
        });
      }

      await batch.commit();
      
      // Broadcast read receipt via WebSocket
      const socketService = req.app.locals.socketService;
      if (socketService) {
        socketService.io.to(conversationId).emit('messages_read', { 
          conversationId, 
          readBy: userId, 
          messageIds: messageIds || 'all_unread' 
        });
      }

      console.log(`✅ Messages marked as read in conversation: ${conversationId}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read', details: error.message });
    }
  },

  // Get online users count
  async getOnlineUsers(req, res) {
    try {
      const socketService = req.app.locals.socketService;
      const count = socketService ? socketService.getConnectedUsersCount() : 0;
      
      console.log(`👥 Online users count: ${count}`);
      res.status(200).json({ onlineUsers: count });
    } catch (error) {
      console.error('❌ Error getting online users:', error);
      res.status(500).json({ error: 'Failed to get online users count', details: error.message });
    }
  }
};