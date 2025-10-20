import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical,
  Phone,
  Video,
  Heart,
  MapPin,
  Calendar,
  Image,
  Smile,
  Paperclip,
  Clock,
  Check,
  CheckCheck,
  MoreHorizontal,
  Star,
  Flag
} from 'lucide-react';
import { MessageStatusIcon } from '@/components/ui/MessageStatusIcon';
import { MessageSkeleton, ConversationSkeleton } from '@/components/ui/MessageSkeleton';
import { formatMessageTime, getMessageStatus, formatUnreadCount } from '@/utils/messageUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { messagingService, typingIndicator } from '@/services/realtimeMessaging';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { User, Message, Conversation } from '@/types';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Link, useLocation } from 'react-router-dom';

function MessagesContent() {
  const { authUser } = useUserProfile();
  const location = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [selectedConversation]);

  // Helper function to get the other participant (not the current user)
  const getOtherParticipant = (conversation: Conversation): User | null => {
    if (!conversation.participants || !authUser?.uid) return null;
    
    return conversation.participants.find(participant => {
      const participantId = typeof participant === 'string' ? participant : participant.id;
      return participantId !== authUser.uid;
    }) as User || null;
  };

  // Subscribe to real conversations for the current user
  useEffect(() => {
    if (!authUser?.uid) return;

    console.log('🔄 Loading conversations from backend for user:', authUser.uid);
    setIsLoadingConversations(true);

    const unsubscribe = messagingService.subscribeToConversations(authUser.uid, (list) => {
      console.log('📋 Received conversations from backend:', list?.length || 0);
      setConversations(list || []);
      setIsLoadingConversations(false);
    });

    // Listen for real-time message updates to refresh conversations
    messagingService.onMessage((message) => {
      console.log('🔄 New message received, refreshing conversations');
      // Trigger a conversation refresh when a new message arrives
      setTimeout(() => {
        const refreshUnsubscribe = messagingService.subscribeToConversations(authUser.uid, (refreshedList) => {
          console.log('📋 Refreshed conversations after new message:', refreshedList?.length || 0);
          setConversations(refreshedList || []);
          if (typeof refreshUnsubscribe === 'function') refreshUnsubscribe();
        });
      }, 1000); // Small delay to ensure message is processed
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [authUser?.uid]);

  // Handle starting new conversation from location state
  useEffect(() => {
    const startConversationWith = (location.state as any)?.startConversationWith;
    if (startConversationWith && authUser?.uid) {
      console.log('🆕 Starting new conversation with user:', startConversationWith);

      // Create or get existing conversation
      const createConversation = async () => {
        try {
          const conversationId = await messagingService.createOrGetConversation(
            authUser.uid,
            startConversationWith.id
          );
          
          console.log('✅ Got conversation ID:', conversationId);
          
          // Create conversation object for UI
          const newConversation: Conversation = {
            id: conversationId,
            participants: [startConversationWith as User],
            unreadCount: 0,
            lastMessage: null,
            lastMessageAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          setSelectedConversation(newConversation);
          setMessages([]);
          
          toast.info(`Start chatting with ${startConversationWith.name}!`);
        } catch (error) {
          console.error('❌ Error creating conversation:', error);
          toast.error('Failed to start conversation');
        }
      };
      
      createConversation();

      // Clear the location state by replacing current history entry
      window.history.replaceState({}, '', '/messages');
    }
  }, [location.state, authUser?.uid]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      console.log('🔄 Loading messages for conversation:', selectedConversation.id);
      // Clear previous messages
      setMessages([]);
    }
  }, [selectedConversation]);

  // Set up real-time listeners
  useEffect(() => {
    if (selectedConversation && authUser?.uid) {
      // Mark messages as read when conversation is opened
      const conversationId = selectedConversation.id;
      console.log('📖 Marking messages as read for conversation:', conversationId);
      messagingService.markMessagesAsRead(conversationId, authUser.uid);
      
      // Join the conversation room for WebSocket events
      console.log('🔗 Joining conversation:', conversationId);
      messagingService.joinConversation(conversationId);
      
      // Listen to messages
      setIsLoadingMessages(true);
      const unsubscribeMessages = messagingService.subscribeToMessages(
        conversationId,
        (newMessages) => {
          console.log('📨 Received messages for conversation:', newMessages.length);
          setMessages(newMessages);
          setIsLoadingMessages(false);
        }
      );

      // Listen to real-time messages via WebSocket
      messagingService.onMessage((message) => {
        console.log('Received WebSocket message:', JSON.stringify(message, null, 2));
        console.log('Current conversation ID:', conversationId);
        console.log('Message conversationId:', message.conversationId);
        console.log('Message matchId:', message.matchId);
        
        if (message.conversationId === conversationId || 
            message.matchId === conversationId) {
          
          console.log('✅ Message matches current conversation, adding to UI');
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(m => m.id === message.id);
            if (!exists) {
              console.log('Adding new message to UI:', message);
              const newMessages = [...prev, message].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              
              // Messages are now persisted in Firebase by the backend
              
              return newMessages;
            } else {
              console.log('Message already exists, skipping');
            }
            return prev;
          });
        } else {
          console.log('❌ Message does not match current conversation, ignoring');
        }
      });

      // Listen to typing indicators
      messagingService.onTypingIndicator((data) => {
        if (data.matchId === conversationId) {
          if (data.isTyping) {
            setTypingUsers(prev => new Set([...prev, data.userId]));
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        }
      });

      return () => {
        // Leave the conversation room
        messagingService.leaveConversation(conversationId);
        unsubscribeMessages();
      };
    }
  }, [selectedConversation, authUser?.uid]);

  // Removed loadMessages function - now using subscribeToMessages for real-time updates

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !authUser?.uid) return;
    
    try {
      const messageData = {
        matchId: selectedConversation.id, // Use conversation ID
        senderId: authUser.uid,
        content: newMessage.trim(),
        type: 'text' as const
      };

      // Add message to UI immediately for better UX
      const tempMessage = {
        id: `temp_${Date.now()}`,
        ...messageData,
        timestamp: new Date().toISOString(),
        read: false,
        delivered: false
      };
      
      // Add tempMessage to UI for immediate feedback (optimistic UI)
      setMessages(prev => [...prev, tempMessage]);
      
      await messagingService.sendMessage(messageData);
      setNewMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        typingIndicator.stopTyping(selectedConversation.matchId || selectedConversation.id, authUser.uid);
        setIsTyping(false);
      }

      // After sending message, refresh conversations to show in sidebar
      console.log('🔄 Refreshing conversations after message send');
      setTimeout(() => {
        const refreshUnsubscribe = messagingService.subscribeToConversations(authUser?.uid || '', (refreshedList) => {
          console.log('📋 Conversations refreshed after message send:', refreshedList?.length || 0);
          setConversations(refreshedList || []);

          // If this was a temporary conversation, find and select the real one
          if (selectedConversation.id.startsWith('temp_')) {
            const realConversation = refreshedList.find(conv => conv.matchId === selectedConversation.matchId);
            if (realConversation) {
              console.log('✅ Found real conversation, updating selection:', realConversation.id);
              setSelectedConversation(realConversation);
            }
          }

          if (typeof refreshUnsubscribe === 'function') refreshUnsubscribe();
        });
      }, 1000); // Small delay to ensure message is processed and conversation is created
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Function to create a real conversation in the backend (database-first approach)
  const saveTemporaryConversation = async (tempConversation: Conversation, firstMessage: any) => {
    try {
      console.log('🔄 Creating conversation in backend:', {
        matchId: tempConversation.matchId,
        participants: tempConversation.participants,
        firstMessage: firstMessage
      });
      
      // Extract participant IDs - ensure both users are included
      const participantIds = [
        authUser.uid, // Current user
        ...tempConversation.participants.map(p => typeof p === 'string' ? p : p.id)
      ];

      console.log('📤 Sending conversation creation request:', {
        participants: participantIds,
        matchId: tempConversation.matchId,
        initialMessage: firstMessage
      });

      const conversationData = {
        participants: participantIds,
        matchId: tempConversation.matchId,
        initialMessage: {
          senderId: firstMessage.senderId,
          content: firstMessage.content,
          type: firstMessage.type
        }
      };

      // Create the conversation in the backend
      const response = await fetch('http://localhost:3001/api/messaging/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Conversation created on backend:', result);
        
        // Immediately refresh conversations to show the new one in the sidebar
        const refreshUnsubscribe = messagingService.subscribeToConversations(authUser?.uid || '', (refreshedList) => {
          console.log('📋 Conversations refreshed after creation:', refreshedList?.length || 0);
          setConversations(refreshedList || []);

          // Find and select the newly created conversation
          const newConversation = refreshedList.find(conv => conv.matchId === tempConversation.matchId);
          if (newConversation) {
            setSelectedConversation(newConversation);
            console.log('✅ Selected newly created conversation:', newConversation.id);
          }

          if (typeof refreshUnsubscribe === 'function') refreshUnsubscribe();
        });
      } else {
        console.error('❌ Failed to create conversation on backend');
        throw new Error('Backend conversation creation failed');
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!selectedConversation || !authUser?.uid) return;

    // Start typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      typingIndicator.startTyping(selectedConversation.matchId || selectedConversation.id, authUser.uid);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        typingIndicator.stopTyping(selectedConversation.matchId || selectedConversation.id, authUser.uid);
        setIsTyping(false);
      }
    }, 3000);
  };

  const handleImageUpload = () => {
    // In a real app, implement image upload
    toast.info('Image upload coming soon!');
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const filteredConversations = conversations.filter(conv => {
    try {
      const otherParticipant = getOtherParticipant(conv);
      const participantName = otherParticipant?.name?.toLowerCase() || '';
      const messageContent = conv.lastMessage?.content?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return participantName.includes(query) || messageContent.includes(query);
    } catch (error) {
      console.warn('Error filtering conversation:', error, conv);
      return false;
    }
  });

  // Debug: Log conversations state
  console.log('🔍 Current conversations state:', conversations);
  console.log('🔍 Filtered conversations:', filteredConversations);



  const emojis = ['😀', '😂', '😍', '🥰', '😘', '🤔', '😎', '🤗', '👍', '👎', '❤️', '🔥', '✨', '🎉', '👏', '🙌'];

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      <div className="pt-20 flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r flex flex-col bg-gradient-to-b from-background/80 to-muted/30" style={{borderColor: 'hsl(var(--border) / 0.3)'}}>
          {/* Header */}
          <div className="p-8 border-b sticky top-0 z-10 bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-xl" style={{borderColor: 'hsl(var(--border) / 0.3)'}}>
            <h1 className="text-3xl font-bold text-foreground font-display mb-6 animate-fade-up">
              <span className="text-gradient">Messages</span>
            </h1>

            {/* Search */}
            <div className="relative animate-slide-up" style={{animationDelay: '0.1s'}}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-2 border-border bg-muted/50 backdrop-blur-sm focus:border-sunrise-coral/50 transition-all duration-300 shadow-soft hover:shadow-medium"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-48 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-sunset rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-muted-foreground text-lg font-medium">No conversations yet</p>
                  <p className="text-muted-foreground text-sm mt-2">Start connecting with fellow travelers!</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Debug: Total conversations: {conversations.length}, Filtered: {filteredConversations.length}
                  </p>
                </div>
              </div>
            ) : isLoadingConversations ? (
              // Show skeleton loaders while conversations are loading
              Array.from({ length: 3 }).map((_, index) => (
                <ConversationSkeleton key={`skeleton-${index}`} />
              ))
            ) : (
              filteredConversations.map((conversation, index) => {
                const otherParticipant = getOtherParticipant(conversation);
                const participantId = otherParticipant?.id || conversation.participants?.[0]?.id || conversation.participants?.[0];

                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "p-5 border-b border-border/20 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-sunrise-coral/5 hover:to-transparent hover:shadow-soft message-card",
                      selectedConversation?.id === conversation.id && "bg-gradient-to-r from-sunrise-coral/10 to-warm-amber/5 border-l-4 border-l-sunrise-coral shadow-medium"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative group">
                        <Link
                          to={`/profile/${participantId}`}
                          className="block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar className="w-14 h-14 ring-2 ring-warm-gray-200 group-hover:ring-sunrise-coral/50 transition-all duration-300">
                            <AvatarImage src={otherParticipant?.avatar} className="group-hover:scale-110 transition-transform duration-300" />
                            <AvatarFallback className="bg-gradient-sunrise text-white font-semibold text-lg">
                              {otherParticipant?.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-forest-green border-3 border-background rounded-full shadow-medium animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={`/profile/${participantId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-foreground truncate hover:underline"
                          >
                            {otherParticipant?.name || 'Unknown User'}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessageAt && formatMessageTime(conversation.lastMessageAt)}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {conversation.lastMessage?.content || 'Start a conversation!'}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {otherParticipant?.nextDestination || 'Exploring'}
                          </div>

                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-gradient-sunrise text-white text-xs px-3 py-1 rounded-full shadow-medium animate-bounce-gentle">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col bg-gradient-to-b from-background/60 to-muted/20">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar} />
                      <AvatarFallback>{getOtherParticipant(selectedConversation)?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    {selectedConversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {getOtherParticipant(selectedConversation)?.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {getOtherParticipant(selectedConversation)?.nextDestination}
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      {getOtherParticipant(selectedConversation)?.travelDates}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : isLoadingMessages ? (
                  // Show skeleton loaders while messages are loading
                  Array.from({ length: 5 }).map((_, index) => (
                    <MessageSkeleton key={`message-skeleton-${index}`} isOwn={index % 3 === 0} />
                  ))
                ) : (
                  <>
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === authUser?.uid;
                      const otherParticipant = getOtherParticipant(selectedConversation);
                      const messageStatus = getMessageStatus(message, isOwnMessage);
                      
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex flex-col mb-4",
                            isOwnMessage ? "items-end" : "items-start"
                          )}
                        >
                          {/* Sender Name */}
                          {!isOwnMessage && (
                            <div className="text-xs text-muted-foreground mb-1 px-2">
                              {otherParticipant?.name || 'Unknown User'}
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div
                            className={cn(
                              "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm",
                              isOwnMessage
                                ? "bg-gradient-sunrise text-white rounded-br-md"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700"
                            )}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className={cn(
                                "text-xs",
                                isOwnMessage 
                                  ? "text-white/80" 
                                  : "text-gray-600 dark:text-gray-400"
                              )}>
                                {formatMessageTime(message.timestamp)}
                              </p>
                              {isOwnMessage && (
                                <MessageStatusIcon 
                                  status={messageStatus}
                                  className="ml-2 w-4 h-4"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Auto-scroll target */}
                    <div ref={messagesEndRef} />
                    
                    {/* Typing Indicator - Only show when OTHER users are typing */}
                    {(() => {
                      const otherUsersTyping = Array.from(typingUsers).filter(userId => userId !== authUser?.uid);
                      const otherParticipant = getOtherParticipant(selectedConversation);
                      
                      return otherUsersTyping.length > 0 && (
                        <div className="flex flex-col items-start mb-4">
                          <div className="text-xs text-muted-foreground mb-1 px-2">
                            {otherParticipant?.name || 'Someone'}
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">typing...</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground"
                    onClick={handleImageUpload}
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="pr-12"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="hero" 
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-20 right-4 bg-background border rounded-lg p-3 shadow-lg z-10">
                    <div className="grid grid-cols-8 gap-2">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiClick(emoji)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Select a conversation
                </h2>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
      
      {/* Debug info removed for production cleanliness */}
    </div>
  );
}

export default function Messages() {
  return (
    <ErrorBoundary>
      <MessagesContent />
    </ErrorBoundary>
  );
}
