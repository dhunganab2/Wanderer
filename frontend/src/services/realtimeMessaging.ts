import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { io, Socket } from 'socket.io-client';
import { db, auth } from '@/lib/firebase';
import type { Message, Conversation, User } from '@/types';

// Enhanced real-time messaging service with Socket.io WebSocket connection
class RealtimeMessagingService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, (data: any) => void> = new Map();
  private isConnected = false;
  private currentUserId: string | null = null;
  private messageQueue: Array<{ event: string; data: any; callback?: (response: any) => void }> = [];
  private joinedConversations = new Set<string>();

  constructor() {
    // Initialize connection when auth state is ready
    this.initializeConnection();
  }

  private async initializeConnection() {
    // Wait for auth to be ready
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.connect();
      } else {
        this.currentUserId = null;
        this.disconnect();
      }
    });
  }

  private async connect() {
    try {
      if (this.socket?.connected) {
        console.log('Socket already connected');
        return;
      }

      if (!this.currentUserId) {
        console.log('No user authenticated, skipping socket connection');
        return;
      }

      // Get Firebase auth token for WebSocket authentication
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const serverUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      console.log('Connecting to WebSocket server:', serverUrl);
      
      this.socket = io(serverUrl, {
        auth: {
          token,
          userId: this.currentUserId
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupSocketEventHandlers();
      
    } catch (error) {
      console.error('Failed to connect to messaging service:', error);
      this.handleReconnect();
    }
  }

  private setupSocketEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to messaging server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Process queued messages
      this.processMessageQueue();
      
      // Re-join conversations
      this.rejoinConversations();
      
      this.notifyListeners('connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from messaging server:', reason);
      this.isConnected = false;
      this.notifyListeners('disconnected', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.notifyListeners('connection_error', { error: error.message });
    });

    // Message events
    this.socket.on('new_message', (message: Message) => {
      console.log('Received new message:', message);
      this.notifyListeners('message', message);
    });

    this.socket.on('messages_read', (data) => {
      console.log('Messages marked as read:', data);
      this.notifyListeners('messages_read', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      console.log('User typing status:', data);
      this.notifyListeners('typing', data);
    });

    // Conversation events
    this.socket.on('user_joined_conversation', (data) => {
      console.log('User joined conversation:', data);
      this.notifyListeners('user_joined', data);
    });

    this.socket.on('user_left_conversation', (data) => {
      console.log('User left conversation:', data);
      this.notifyListeners('user_left', data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private processMessageQueue() {
    if (!this.isConnected || !this.socket) return;

    console.log(`Processing ${this.messageQueue.length} queued messages`);
    
    while (this.messageQueue.length > 0) {
      const { event, data, callback } = this.messageQueue.shift()!;
      
      if (callback) {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
    }
  }

  private rejoinConversations() {
    if (!this.isConnected || !this.socket) return;

    console.log(`Re-joining ${this.joinedConversations.size} conversations`);
    
    for (const conversationId of this.joinedConversations) {
      this.socket.emit('join_conversation', { conversationId }, (response: any) => {
        if (response.error) {
          console.error(`Failed to re-join conversation ${conversationId}:`, response.error);
          this.joinedConversations.delete(conversationId);
        } else {
          console.log(`Re-joined conversation ${conversationId}`);
        }
      });
    }
  }

  // Removed old WebSocket sendMessage - using new simplified Firebase-only version

  // Fallback method to send message via Firebase only
  private async sendMessageViaFirebase(messageData: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<string> {
    try {
      console.log('💾 Saving message to Firebase:', messageData);
      
      const messageRef = await addDoc(collection(db, 'messages'), {
        ...messageData,
        conversationId: messageData.matchId || messageData.conversationId, // Support both formats
        timestamp: serverTimestamp(),
        read: false
      });

      console.log('✅ Message saved to Firebase with ID:', messageRef.id);

      // Update conversation last message and increment unread count
      const conversationId = messageData.matchId || messageData.conversationId;
      if (conversationId) {
        await this.updateConversationLastMessage(conversationId, messageData.content);
        
        // Increment unread count for the recipient (not the sender)
        await this.incrementUnreadCount(conversationId, messageData.senderId);
      }

      // Notify listeners
      this.notifyListeners('message_sent', { id: messageRef.id, ...messageData });

      return messageRef.id;
    } catch (error) {
      console.error('❌ Error sending message via Firebase:', error);
      throw error;
    }
  }

  // Removed old updateConversationLastMessage - using new implementation at the end

  // Join a conversation room
  joinConversation(conversationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        this.socket.emit('join_conversation', { conversationId }, (response: any) => {
          if (response.error) {
            console.error('Failed to join conversation:', response.error);
            resolve(false);
          } else {
            console.log('Joined conversation:', conversationId);
            this.joinedConversations.add(conversationId);
            resolve(true);
          }
        });
      } else {
        // Queue the join request
        this.messageQueue.push({
          event: 'join_conversation',
          data: { conversationId },
          callback: (response: any) => {
            if (!response.error) {
              this.joinedConversations.add(conversationId);
            }
            resolve(!response.error);
          }
        });
        resolve(false); // Return false for immediate call, but will retry when connected
      }
    });
  }

  // Leave a conversation room
  leaveConversation(conversationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.joinedConversations.delete(conversationId);
      
      if (this.socket && this.isConnected) {
        this.socket.emit('leave_conversation', { conversationId }, (response: any) => {
          if (response.error) {
            console.error('Failed to leave conversation:', response.error);
          } else {
            console.log('Left conversation:', conversationId);
          }
          resolve(!response.error);
        });
      } else {
        resolve(true); // Always succeed for leaving
      }
    });
  }

  // Mark message as read
  async markMessageAsRead(messageId: string) {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Mark all messages in conversation as read
  async markConversationAsRead(matchId: string, userId: string) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('matchId', '==', matchId),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  // Get messages for a conversation
  async getMessages(matchId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const response = await fetch(`http://localhost:3001/api/messaging/messages/${matchId}?limit=${limitCount}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || data; // Handle both response formats
        console.log('✅ Loaded messages from backend:', messages.length);
        return messages;
      } else {
        console.error('❌ Failed to load messages from backend');
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting messages:', error);
      return [];
    }
  }

  // Removed old subscribeToMessages - using new Firebase-based implementation

  // Removed old subscribeToConversations - using new Firebase-based implementation

  // Send typing indicator
  sendTypingIndicator(matchId: string, userId: string, isTyping: boolean) {
    if (this.socket && this.isConnected) {
      const event = isTyping ? 'typing_start' : 'typing_stop';
      this.socket.emit(event, { conversationId: matchId });
    }
    
    // Also notify local listeners for immediate UI feedback
    this.notifyListeners('typing', { matchId, userId, isTyping });
  }

  // Listen to typing indicators
  onTypingIndicator(callback: (data: { matchId: string; userId: string; isTyping: boolean }) => void) {
    this.listeners.set('typing', callback);
  }

  // Listen to message events
  onMessage(callback: (message: Message) => void) {
    this.listeners.set('message', callback);
  }

  // Notify listeners
  private notifyListeners(event: string, data: any) {
    const listener = this.listeners.get(event);
    if (listener) {
      listener(data);
    }
  }

  // AI Status Update functionality
  onAIStatusUpdate(callback: (data: any) => void) {
    this.listeners.set('ai_status_update', callback);
    
    if (this.socket) {
      this.socket.on('ai_status_update', callback);
    }
  }

  offAIStatusUpdate() {
    this.listeners.delete('ai_status_update');
    
    if (this.socket) {
      this.socket.off('ai_status_update');
    }
  }

  // Disconnect
  disconnect() {
    console.log('Disconnecting from messaging service');
    
    if (this.socket) {
      // Leave all joined conversations
      for (const conversationId of this.joinedConversations) {
        this.socket.emit('leave_conversation', { conversationId });
      }
      
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.joinedConversations.clear();
    this.messageQueue.length = 0;
    this.listeners.clear();
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      userId: this.currentUserId,
      joinedConversations: Array.from(this.joinedConversations),
      queuedMessages: this.messageQueue.length
    };
  }

  // Force reconnection
  async reconnect() {
    console.log('Force reconnecting to messaging service');
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.connect();
  }

  // Subscribe to conversations for a user
  subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    console.log('📋 Subscribing to conversations for user:', userId);
    
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
      // Note: orderBy removed temporarily until Firebase index is built
      // Will be re-added once index is ready
    );

    const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
      console.log('📋 Conversations snapshot received:', snapshot.docs.length, 'conversations');
      console.log('📋 Raw conversation data:', snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      })));
      
      const conversations: Conversation[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        // Handle Firestore timestamps properly
        const lastMessageAt = data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : 
                             data.lastMessageAt ? new Date(data.lastMessageAt) : new Date();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : 
                         data.createdAt ? new Date(data.createdAt) : new Date();
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                         data.updatedAt ? new Date(data.updatedAt) : new Date();

        const conversation: Conversation = {
          id: doc.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || null,
          lastMessageAt: lastMessageAt,
          unreadCount: data.unreadCount || 0,
          createdAt: createdAt,
          updatedAt: updatedAt
        };
        
        // Fetch participant details
        console.log('👥 Processing participants for conversation:', doc.id, data.participants);
        if (data.participants && Array.isArray(data.participants)) {
          const participantDetails = await Promise.all(
            data.participants.map(async (participantId: string) => {
              if (participantId === userId) {
                return null; // Skip current user
              }
              try {
                // Get user details from users collection by ID field
                const userQuery = query(
                  collection(db, 'users'),
                  where('id', '==', participantId),
                  limit(1)
                );
                const userDocSnap = await getDocs(userQuery);
                console.log(`👤 Fetching user ${participantId}:`, userDocSnap.docs.length, 'docs found');
                
                if (!userDocSnap.empty) {
                  const userData = userDocSnap.docs[0].data();
                  console.log(`✅ Found user data for ${participantId}:`, userData.name);
              return {
                id: participantId,
                name: userData.name || 'Unknown User',
                age: userData.age || 25,
                avatar: userData.avatar || userData.photos?.[0] || '/placeholder.svg',
                location: userData.location || 'Unknown',
                travelStyle: userData.travelStyle || [],
                nextDestination: userData.nextDestination || 'Unknown',
                travelDates: userData.travelDates || 'Flexible',
                bio: userData.bio || '',
                interests: userData.interests || [],
                verified: userData.verified || false,
                joinDate: userData.joinDate || new Date().toISOString(),
                lastActive: userData.lastActive || new Date().toISOString(),
                preferences: userData.preferences || {
                  ageRange: [18, 65],
                  maxDistance: 50,
                  travelStyles: [],
                  notifications: {
                    matches: true,
                    messages: true,
                    travelUpdates: true,
                    marketing: false
                  },
                  privacy: {
                    showLocation: true,
                    showAge: true,
                    showLastActive: true,
                    allowMessages: 'everyone'
                  }
                }
              } as User;
                }
              } catch (error) {
                console.warn('Error fetching participant details:', error);
              }
              return {
                id: participantId,
                name: 'Unknown User',
                age: 25,
                avatar: '/placeholder.svg',
                location: 'Unknown',
                travelStyle: [],
                nextDestination: 'Unknown',
                travelDates: 'Flexible',
                bio: '',
                interests: [],
                verified: false,
                joinDate: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                preferences: {
                  ageRange: [18, 65],
                  maxDistance: 50,
                  travelStyles: [],
                  notifications: {
                    matches: true,
                    messages: true,
                    travelUpdates: true,
                    marketing: false
                  },
                  privacy: {
                    showLocation: true,
                    showAge: true,
                    showLastActive: true,
                    allowMessages: 'everyone'
                  }
                }
              } as User;
            })
          );
          
          conversation.participants = participantDetails.filter(Boolean);
        }
        
        conversations.push(conversation);
      }
      
      // Sort conversations by lastMessageAt (client-side) since we can't use orderBy yet
      conversations.sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime; // Most recent first
      });

      console.log('📋 Processed conversations:', conversations.length);
      callback(conversations);
    }, (error) => {
      console.error('Error subscribing to conversations:', error);
      callback([]);
    });

    return unsubscribe;
  }

  // Create or get existing conversation between two users
  async createOrGetConversation(userId1: string, userId2: string): Promise<string> {
    console.log('💬 Creating or getting conversation between:', userId1, 'and', userId2);
    
    try {
      // Check if conversation already exists
      const existingQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId1)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      for (const doc of existingSnapshot.docs) {
        const data = doc.data();
        if (data.participants?.includes(userId2)) {
          console.log('✅ Found existing conversation:', doc.id);
          return doc.id;
        }
      }
      
      // Create new conversation
      const conversationData = {
        participants: [userId1, userId2],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: null,
        unreadCount: 0
      };
      
      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
      console.log('✅ Created new conversation:', conversationRef.id);
      
      return conversationRef.id;
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    console.log('📨 Subscribing to messages for conversation:', conversationId);
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      console.log('📨 Messages snapshot received:', snapshot.docs.length, 'messages');
      
      const messages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle Firestore timestamps properly
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : 
                         data.timestamp ? new Date(data.timestamp) : new Date();
        
        return {
          id: doc.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || 'text',
          timestamp: timestamp,
          read: data.read || false,
          matchId: data.matchId || conversationId // For backward compatibility
        };
      });
      
      callback(messages);
    }, (error) => {
      console.error('Error subscribing to messages:', error);
      callback([]);
    });

    return unsubscribe;
  }

  // Public method to send messages (called from UI)
  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<string> {
    console.log('📤 Sending message:', messageData);
    
    try {
      // Always use Firebase to ensure messages are saved
      const messageId = await this.sendMessageViaFirebase(messageData);
      console.log('✅ Message sent successfully with ID:', messageId);
      return messageId;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  // Mark messages as read for a conversation
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      console.log('📖 Marking messages as read for conversation:', conversationId, 'by user:', userId);
      
      // Get all unread messages in this conversation that weren't sent by the current user
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      console.log('📖 Found', messagesSnapshot.docs.length, 'unread messages to mark as read');

      if (messagesSnapshot.docs.length === 0) {
        console.log('📖 No unread messages to mark as read');
        return;
      }

      // Update all unread messages to read = true
      const updatePromises = messagesSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
      console.log('✅ Marked', messagesSnapshot.docs.length, 'messages as read');

      // Update conversation unread count to 0
      await updateDoc(doc(db, 'conversations', conversationId), {
        unreadCount: 0
      });
      console.log('✅ Updated conversation unread count to 0');

    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  // Increment unread count for conversation (excluding sender)
  private async incrementUnreadCount(conversationId: string, senderId: string) {
    try {
      console.log('📈 Incrementing unread count for conversation:', conversationId, '(excluding sender:', senderId, ')');
      
      // Use Firestore increment to atomically increase unread count
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        unreadCount: increment(1)
      });
      
      console.log('✅ Incremented unread count by 1');
    } catch (error) {
      console.error('❌ Error incrementing unread count:', error);
    }
  }

  // Update conversation last message
  private async updateConversationLastMessage(conversationId: string, lastMessage: string): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Updated conversation last message for:', conversationId);
    } catch (error) {
      console.warn('Could not update conversation last message:', error);
      // If conversation doesn't exist, we might need to create it
      // This will be handled by the conversation creation logic elsewhere
    }
  }
}

// Create singleton instance
export const messagingService = new RealtimeMessagingService();

// Export as default and as realtimeMessaging for backward compatibility
export const realtimeMessaging = messagingService;
export default messagingService;

// Typing indicator hook
export class TypingIndicator {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private isTyping = false;

  startTyping(matchId: string, userId: string) {
    if (!this.isTyping) {
      this.isTyping = true;
      messagingService.sendTypingIndicator(matchId, userId, true);
      
      // Stop typing after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        this.stopTyping(matchId, userId);
      }, 3000);
      
      this.timeouts.set(`${matchId}-${userId}`, timeout);
    }
  }

  stopTyping(matchId: string, userId: string) {
    if (this.isTyping) {
      this.isTyping = false;
      messagingService.sendTypingIndicator(matchId, userId, false);
      
      const timeout = this.timeouts.get(`${matchId}-${userId}`);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(`${matchId}-${userId}`);
      }
    }
  }

  reset() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.isTyping = false;
  }
}

export const typingIndicator = new TypingIndicator();
