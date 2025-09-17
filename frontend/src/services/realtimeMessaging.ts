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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message, Conversation, User } from '@/types';

// WebSocket connection for real-time messaging
class RealtimeMessagingService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, (data: any) => void> = new Map();
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Temporarily disabled to avoid permission errors
      // In production, use a real WebSocket server
      // For now, we'll simulate with Firebase real-time listeners
      this.isConnected = true;
      console.log('Real-time messaging service connected (simulated)');
    } catch (error) {
      console.error('Failed to connect to messaging service:', error);
      this.handleReconnect();
    }
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

  // Send a message
  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<string> {
    try {
      const messageRef = await addDoc(collection(db, 'messages'), {
        ...messageData,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update conversation last message
      await this.updateConversationLastMessage(messageData.matchId, messageData.content);

      // Notify listeners
      this.notifyListeners('message_sent', { id: messageRef.id, ...messageData });

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Update conversation last message
  private async updateConversationLastMessage(matchId: string, content: string) {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('matchId', '==', matchId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const conversationDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'conversations', conversationDoc.id), {
          lastMessage: {
            content,
            timestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
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
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('matchId', '==', matchId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Listen to messages in real-time
  subscribeToMessages(matchId: string, callback: (messages: Message[]) => void) {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('matchId', '==', matchId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message));
      
      callback(messages);
    });
  }

  // Listen to conversations in real-time
  subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Conversation));
      
      callback(conversations);
    });
  }

  // Send typing indicator
  sendTypingIndicator(matchId: string, userId: string, isTyping: boolean) {
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

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
    this.listeners.clear();
  }
}

// Create singleton instance
export const messagingService = new RealtimeMessagingService();

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
