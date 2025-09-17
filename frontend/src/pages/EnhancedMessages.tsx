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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { messagingService, typingIndicator } from '@/services/realtimeMessaging';
import { sampleConversations, sampleMessages } from '@/data/enhancedSampleData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DebugInfo } from '@/components/DebugInfo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { User, Message, Conversation } from '@/types';

function EnhancedMessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load sample conversations on mount
  useEffect(() => {
    const conversationsWithOnlineStatus = sampleConversations.map(conv => ({
      ...conv,
      isOnline: Math.random() > 0.5 // Random online status for demo
    }));
    setConversations(conversationsWithOnlineStatus);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.matchId);
    }
  }, [selectedConversation]);

  // Set up real-time listeners
  useEffect(() => {
    if (selectedConversation) {
      // Listen to messages
      const unsubscribeMessages = messagingService.subscribeToMessages(
        selectedConversation.matchId,
        (newMessages) => {
          setMessages(newMessages);
        }
      );

      // Listen to typing indicators
      messagingService.onTypingIndicator((data) => {
        if (data.matchId === selectedConversation.matchId) {
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
        unsubscribeMessages();
      };
    }
  }, [selectedConversation]);

  const loadMessages = async (matchId: string) => {
    try {
      setIsLoading(true);
      const loadedMessages = await messagingService.getMessages(matchId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const messageData = {
        matchId: selectedConversation.matchId,
        senderId: 'current-user-id', // In real app, get from auth
        content: newMessage.trim(),
        type: 'text' as const
      };

      await messagingService.sendMessage(messageData);
      setNewMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        typingIndicator.stopTyping(selectedConversation.matchId, 'current-user-id');
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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

    if (!selectedConversation) return;

    // Start typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      typingIndicator.startTyping(selectedConversation.matchId, 'current-user-id');
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        typingIndicator.stopTyping(selectedConversation.matchId, 'current-user-id');
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
      const participantName = conv.participants?.[0]?.name?.toLowerCase() || '';
      const messageContent = conv.lastMessage?.content?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return participantName.includes(query) || messageContent.includes(query);
    } catch (error) {
      console.warn('Error filtering conversation:', error, conv);
      return false;
    }
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.read) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    } else {
      return <Check className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const emojis = ['😀', '😂', '😍', '🥰', '😘', '🤔', '😎', '🤗', '👍', '👎', '❤️', '🔥', '✨', '🎉', '👏', '🙌'];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      <div className="pt-20 pb-24 h-screen flex">
        {/* Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r flex flex-col bg-gradient-to-b from-background to-muted/30" style={{borderColor: 'hsl(var(--border) / 0.3)'}}>
          {/* Header */}
          <div className="p-8 border-b bg-gradient-to-r from-background to-muted/20" style={{borderColor: 'hsl(var(--border) / 0.3)'}}>
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
                </div>
              </div>
            ) : (
              filteredConversations.map((conversation, index) => (
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
                    <Avatar className="w-14 h-14 ring-2 ring-warm-gray-200 group-hover:ring-sunrise-coral/50 transition-all duration-300">
                      <AvatarImage src={conversation.participants?.[0]?.avatar} className="group-hover:scale-110 transition-transform duration-300" />
                      <AvatarFallback className="bg-gradient-sunrise text-white font-semibold text-lg">
                        {conversation.participants?.[0]?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-forest-green border-3 border-background rounded-full shadow-medium animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {conversation.participants?.[0]?.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {conversation.lastMessage && formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {conversation.participants?.[0]?.nextDestination}
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
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConversation.participants?.[0]?.avatar} />
                      <AvatarFallback>{selectedConversation.participants?.[0]?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    {selectedConversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {selectedConversation.participants?.[0]?.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {selectedConversation.participants?.[0]?.nextDestination}
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      {selectedConversation.participants?.[0]?.travelDates}
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
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.senderId === 'current-user-id' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                            message.senderId === 'current-user-id'
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={cn(
                              "text-xs",
                              message.senderId === 'current-user-id' 
                                ? "text-primary-foreground/70" 
                                : "text-muted-foreground"
                            )}>
                              {formatTime(message.timestamp)}
                            </p>
                            {message.senderId === 'current-user-id' && (
                              <div className="ml-2">
                                {getMessageStatus(message)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-foreground rounded-2xl rounded-bl-md px-4 py-2">
                          <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-xs text-muted-foreground ml-2">
                              {Array.from(typingUsers).join(', ')} typing...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border/50">
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
      
      {/* Debug Info - Only in development */}
      <DebugInfo data={{ conversations: conversations.length, selectedConversation: !!selectedConversation }} label="Messages Debug" />
    </div>
  );
}

export default function EnhancedMessages() {
  return (
    <ErrorBoundary>
      <EnhancedMessagesContent />
    </ErrorBoundary>
  );
}
