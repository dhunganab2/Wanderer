import React, { useState, useEffect } from 'react';
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
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { cn } from '@/lib/utils';
import { sampleUsers } from '@/data/sampleUsers';

// Sample conversations data
const sampleConversations = [
  {
    id: '1',
    user: sampleUsers[0],
    lastMessage: {
      content: "Hey! I saw you're also going to Tokyo in March. Would love to explore some local food spots together! 🍜",
      timestamp: '2024-01-15T14:30:00Z',
      isFromMe: false
    },
    unreadCount: 2,
    isOnline: true
  },
  {
    id: '2',
    user: sampleUsers[1],
    lastMessage: {
      content: "That hiking trail looks amazing! Count me in 🏔️",
      timestamp: '2024-01-15T12:15:00Z',
      isFromMe: true
    },
    unreadCount: 0,
    isOnline: false
  },
  {
    id: '3',
    user: sampleUsers[2],
    lastMessage: {
      content: "Thanks for the Morocco travel tips! The photos you shared are incredible 📸",
      timestamp: '2024-01-14T18:45:00Z',
      isFromMe: false
    },
    unreadCount: 1,
    isOnline: true
  },
  {
    id: '4',
    user: sampleUsers[3],
    lastMessage: {
      content: "Perfect! I'll book the bungee jumping for both of us 🪂",
      timestamp: '2024-01-14T16:20:00Z',
      isFromMe: true
    },
    unreadCount: 0,
    isOnline: false
  },
  {
    id: '5',
    user: sampleUsers[4],
    lastMessage: {
      content: "The cooking class was so much fun! We should definitely do the street food tour next 🍲",
      timestamp: '2024-01-13T20:10:00Z',
      isFromMe: false
    },
    unreadCount: 3,
    isOnline: true
  }
];

const sampleMessages = [
  {
    id: '1',
    content: "Hey! I saw you're also going to Tokyo in March. Would love to explore some local food spots together! 🍜",
    timestamp: '2024-01-15T14:30:00Z',
    isFromMe: false
  },
  {
    id: '2',
    content: "That sounds amazing! I'm definitely interested. I've been researching some incredible ramen places in Shibuya.",
    timestamp: '2024-01-15T14:35:00Z',
    isFromMe: true
  },
  {
    id: '3',
    content: "Perfect! I have a local friend who can show us some hidden gems that tourists never find. Are you interested in trying some authentic kaiseki dining too?",
    timestamp: '2024-01-15T14:40:00Z',
    isFromMe: false
  },
  {
    id: '4',
    content: "Absolutely! I love authentic experiences. What dates work best for you?",
    timestamp: '2024-01-15T14:42:00Z',
    isFromMe: true
  },
  {
    id: '5',
    content: "I'll be there March 18-22. How about we plan a food tour for March 20th? 🗾",
    timestamp: '2024-01-15T14:45:00Z',
    isFromMe: false
  }
];

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations from database
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        // TODO: Implement conversation loading from Firebase
        // For now, set empty array to force database dependency
        setConversations([]);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      <div className="pt-20 pb-24 h-screen flex">
        {/* Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <h1 className="text-2xl font-bold text-foreground font-display mb-4">
              Messages
            </h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={cn(
                  "p-4 border-b border-border/30 cursor-pointer transition-colors hover:bg-muted/50",
                  selectedConversation.id === conversation.id && "bg-muted/70"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.user.avatar} />
                      <AvatarFallback>{conversation.user.name[0]}</AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {conversation.user.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {conversation.lastMessage.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {conversation.user.nextDestination}
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="text-xs px-2 py-1">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                      <AvatarImage src={selectedConversation.user.avatar} />
                      <AvatarFallback>{selectedConversation.user.name[0]}</AvatarFallback>
                    </Avatar>
                    {selectedConversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {selectedConversation.user.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {selectedConversation.user.nextDestination}
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      {selectedConversation.user.travelDates}
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
                {sampleMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isFromMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                        message.isFromMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        message.isFromMe 
                          ? "text-primary-foreground/70" 
                          : "text-muted-foreground"
                      )}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Image className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="pr-12"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground"
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
    </div>
  );
}
