import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Send,
  Sparkles,
  Plane,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Search,
  Palette,
  Clipboard,
  Zap,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Bot,
  Cloud,
  Camera,
  Utensils,
  Heart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Compass,
  Globe,
  Shield,
  Star,
  Menu,
  X,
  Plus,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import useAITravelBuddy from '../hooks/useAITravelBuddy';
import AgentStatusDisplay from '../components/AgentStatusDisplay';
import TripPlanDisplay from '../components/TripPlanDisplay';
import { DesktopNavigation, Navigation } from '../components/Navigation';
import type { AIChatMessage, AIUserContext } from '../types/aiChat';

const AITravelPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [chatHistory] = useState([
    { id: '1', title: 'Tokyo 7-day Trip', timestamp: 'Yesterday', preview: 'Plan a complete 7-day itinerary for Tokyo...' },
    { id: '2', title: 'Budget Europe Travel', timestamp: '2 days ago', preview: 'Find budget-friendly destinations in Europe...' },
    { id: '3', title: 'Packing for Japan', timestamp: '1 week ago', preview: 'What should I pack for Tokyo in spring?' },
    { id: '4', title: 'Cultural Tips Italy', timestamp: '2 weeks ago', preview: 'Tell me about local customs in Italy...' },
  ]);
  const [agentStatus, setAgentStatus] = useState({
    isVisible: false,
    stage: '',
    message: '',
    progress: 0,
    agentsStatus: [] as Array<{name: string; status: 'preparing' | 'working' | 'completed' | 'waiting'; task: string}>
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<any>(null);
  const { user } = useAuth();

  // Real user context from Firestore
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userContext, setUserContext] = useState<AIUserContext>({
    userProfile: {
      name: 'Traveler',
      interests: ['culture', 'food', 'adventure'],
      bucketList: ['Japan', 'Italy', 'Thailand']
    }
  });

  // Enhance user context with user ID
  const enhancedUserContext = {
    ...userContext,
    userId: user?.uid || 'anonymous_user',
    currentUser: user?.uid || 'anonymous_user'
  };

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    clearError,
  } = useAITravelBuddy(enhancedUserContext);

  // Auto-scroll to bottom when new messages arrive - with delay to prevent jumping
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
    };
    
    // Use requestAnimationFrame to ensure DOM has updated before scrolling
    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 50);
    });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Fetch user profile from Firestore when user is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) {
        // Clear profile when no user is logged in
        console.log('🧹 Clearing user profile - no user logged in');
        setUserProfile(null);
        setUserContext({
          userProfile: {
            name: 'Traveler',
            age: undefined,
            location: undefined,
            travelStyle: [],
            interests: [],
            bucketList: [],
            travelExperience: undefined,
            preferredBudget: undefined
          }
        });
        return;
      }

      try {
        console.log('🔍 Fetching user profile for AI Travel Planner:', user.uid);
        const response = await fetch(`http://localhost:3001/api/users/profile/${user.uid}`);
        
        if (response.ok) {
          const profileData = await response.json();
          console.log('✅ User profile fetched:', profileData);
          
          if (profileData.success && profileData.data) {
            const profile = profileData.data;
            setUserProfile(profile);
            
            // Update user context with real profile data
            setUserContext({
              userProfile: {
                name: profile.name || 'Traveler',
                age: profile.age,
                location: profile.location,
                travelStyle: profile.travelStyle || [],
                interests: profile.interests || [],
                bucketList: profile.bucketList || [],
                travelExperience: profile.travelExperience,
                preferredBudget: profile.preferredBudget
              }
            });
          } else {
            // No profile found for this user
            console.log('📝 No profile found for user, using default context');
            setUserProfile(null);
            setUserContext({
              userProfile: {
                name: 'Traveler',
                age: undefined,
                location: undefined,
                travelStyle: [],
                interests: [],
                bucketList: [],
                travelExperience: undefined,
                preferredBudget: undefined
              }
            });
          }
        } else {
          console.log('📝 No profile found, using default context');
          setUserProfile(null);
          setUserContext({
            userProfile: {
              name: 'Traveler',
              age: undefined,
              location: undefined,
              travelStyle: [],
              interests: [],
              bucketList: [],
              travelExperience: undefined,
              preferredBudget: undefined
            }
          });
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        // Clear profile on error
        setUserProfile(null);
        setUserContext({
          userProfile: {
            name: 'Traveler',
            age: undefined,
            location: undefined,
            travelStyle: [],
            interests: [],
            bucketList: [],
            travelExperience: undefined,
            preferredBudget: undefined
          }
        });
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  // Clear conversation when user changes to prevent showing old messages with previous user's name
  useEffect(() => {
    if (user?.uid) {
      console.log('🔄 User changed to:', user.uid, 'clearing conversation history');
      clearConversation();
    } else {
      console.log('🔄 User logged out, clearing conversation history');
      clearConversation();
    }
  }, [user?.uid, clearConversation]);

  // Setup WebSocket connection for agent status updates
  useEffect(() => {
    if (!enhancedUserContext?.userId) return;

    // Import and setup real-time messaging service
    import('@/services/realtimeMessaging').then(({ realtimeMessaging }) => {
      if (!realtimeMessaging) {
        console.warn('⚠️ Real-time messaging service not available');
        return;
      }
      
      // Set up AI status update listener
      realtimeMessaging.onAIStatusUpdate((data: any) => {
        console.log('🤖 Received AI status update:', data);
        
        if (data.type === 'travel_planning_status') {
          setAgentStatus({
            isVisible: true,
            stage: data.stage,
            message: data.message,
            progress: data.progress || 0,
            agentsStatus: data.agents || []
          });

          // Hide status after completion
          if (data.stage === 'completed') {
            setTimeout(() => {
              setAgentStatus(prev => ({ ...prev, isVisible: false }));
            }, 3000);
          }
        }
      });

      // Store reference for cleanup
      socketRef.current = realtimeMessaging as any;
    }).catch((error) => {
      console.warn('⚠️ Failed to load real-time messaging service:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.offAIStatusUpdate();
      }
    };
  }, [enhancedUserContext?.userId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    
    // Set AI thinking state
    setIsAIThinking(true);

    // Show agent status for trip planning requests
    if (message.toLowerCase().includes('plan') || message.toLowerCase().includes('trip')) {
      setAgentStatus({
        isVisible: true,
        stage: 'initializing',
        message: '🌟 Amazing choice! Let me rally my specialist team to craft your perfect adventure.',
        progress: 10,
        agentsStatus: [
          { name: 'ProfileAnalyst', status: 'preparing', task: '🧠 Analyzing your travel personality and preferences...' },
          { name: 'DataScout', status: 'preparing', task: '🔍 Preparing to search live travel data...' },
          { name: 'ItineraryArchitect', status: 'preparing', task: '🎨 Getting ready to design your dream itinerary...' },
          { name: 'ChiefTravelPlanner', status: 'preparing', task: '📋 Coordinating your complete travel experience...' }
        ]
      });

      // Hide status after completion
      setTimeout(() => {
        setAgentStatus(prev => ({ ...prev, isVisible: false }));
      }, 15000);
    }

    try {
      await sendMessage(message);
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-foreground/90">$1</em>')
      .replace(/```(.*?)```/gs, '<code class="block bg-muted p-3 rounded-lg my-3 text-sm font-mono text-foreground border border-border/50">$1</code>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">$1</code>');
  };

  const renderMessage = (message: AIChatMessage) => {
    const isUser = message.role === 'user';
    const isTyping = message.isTyping;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'flex w-full mb-6',
          message.type === 'trip_plan' || message.type === 'interactive_trip_plan' ? 'justify-center' : (isUser ? 'justify-end' : 'justify-start')
        )}
      >
        <div
          className={cn(
            message.type === 'trip_plan' || message.type === 'interactive_trip_plan' ? 'w-full max-w-6xl' : 'max-w-2xl',
            'rounded-2xl px-6 py-4 text-sm leading-relaxed',
            'shadow-soft',
            isUser
              ? 'bg-gradient-sunrise text-white ml-4'
              : message.type === 'trip_plan' || message.type === 'interactive_trip_plan'
                ? 'bg-transparent border-none mr-0 px-0 py-0'
                : 'bg-card text-foreground border border-border/50 mr-4',
            'transition-all duration-200'
          )}
        >
          {isTyping ? (
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-sunrise-coral rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-sunrise-coral rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-sunrise-coral rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-muted-foreground ml-2">WanderBuddy is crafting your perfect trip...</span>
            </div>
          ) : message.type === 'trip_plan' || message.type === 'interactive_trip_plan' ? (
            <TripPlanDisplay
              content={message.content}
              metadata={{
                ...message.metadata,
                rawData: message.metadata?.rawData,
                userProfile: userProfile // Pass the user profile data
              }}
              className="w-full"
              onSelectionComplete={(selections) => {
                console.log('User selections:', selections);
                // Handle the selection completion - could trigger next phase of planning
                if (selections.selectedFlight !== undefined || selections.selectedHotel !== undefined) {
                  // Show a success message or trigger next steps
                  const selectionMessage = `Great choices! ${
                    selections.selectedFlight !== undefined ? `Flight option ${selections.selectedFlight + 1}` : ''
                  }${
                    selections.selectedFlight !== undefined && selections.selectedHotel !== undefined ? ' and ' : ''
                  }${
                    selections.selectedHotel !== undefined ? `Hotel option ${selections.selectedHotel + 1}` : ''
                  } selected. Let me finalize your complete itinerary!`;
                  
                  // Could send this back to the AI for final processing
                  console.log('Selection confirmation:', selectionMessage);
                }
              }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: formatMessage(message.content)
              }}
            />
          )}

          {!isTyping && (
            <div
              className={cn(
                'text-xs mt-3 opacity-70',
                isUser ? 'text-white/80' : 'text-gray-500'
              )}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-background overflow-hidden grid" style={{ 
      gridTemplateColumns: sidebarExpanded ? '320px 1fr' : '64px 1fr',
      position: 'fixed',
      width: '100vw',
      height: '100vh',
      top: 0,
      left: 0,
      zIndex: 1
    }}>
      {/* Desktop Navigation - Hidden when sidebar is present */}
      <DesktopNavigation className="hidden" />
      
      {/* Left Sidebar - Chat History */}
      <div className="bg-background border-r border-border/50 flex flex-col h-screen">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            {sidebarExpanded && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-sunrise flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-foreground">WanderBuddy</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={clearConversation}
            className={cn(
              "bg-gradient-sunrise hover:shadow-glow text-white transition-all duration-300",
              sidebarExpanded ? "w-full justify-start" : "w-10 h-10 p-0"
            )}
          >
            <Plus className="w-4 h-4" />
            {sidebarExpanded && <span className="ml-2">New Chat</span>}
          </Button>
        </div>

        {/* Chat History */}
        {sidebarExpanded && (
          <div className="flex-1 overflow-y-auto px-4 min-h-0">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Recent Chats
            </div>
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors duration-200 group"
                >
                  <div className="text-sm font-medium text-foreground group-hover:text-sunrise-coral transition-colors">
                    {chat.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {chat.preview}
                  </div>
                  <div className="text-xs text-muted-foreground/60 mt-1">
                    {chat.timestamp}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-border/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-ocean flex items-center justify-center">
              <span className="text-sm font-bold text-white">J</span>
            </div>
            {sidebarExpanded && (
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Jaljala</div>
                <div className="text-xs text-muted-foreground">Travel Enthusiast</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Grok Style */}
      <div className="flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/50 p-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-sunrise flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground font-display">WanderBuddy</h1>
                <p className="text-sm text-muted-foreground">Powered by multi-agent intelligence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollBehavior: 'auto', contain: 'layout' }}>
            <div className="max-w-4xl mx-auto px-6 py-8" style={{ minHeight: 'calc(100vh - 200px)', contain: 'layout' }}>
              <AnimatePresence mode="sync">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-sunrise flex items-center justify-center shadow-elevation">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-foreground mb-4 font-display">
                      What do you want to explore?
                    </div>
                    <div className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                      I'm your AI travel companion. I can help you plan trips, find destinations, and create detailed itineraries with real-time data.
                    </div>
                    
                    {/* Quick Start Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                      <button 
                        className="p-4 bg-card hover:bg-muted/50 border border-border/50 hover:border-sunrise-coral/30 rounded-2xl transition-all duration-200 text-left group"
                        onClick={() => setInputValue('Plan a 7-day trip to Japan')}
                      >
                        <MapPin className="w-5 h-5 text-sunrise-coral mb-2" />
                        <div className="text-sm font-medium text-foreground group-hover:text-sunrise-coral transition-colors">Plan a Trip</div>
                        <div className="text-xs text-muted-foreground">Complete itineraries</div>
                      </button>
                      
                      <button 
                        className="p-4 bg-card hover:bg-muted/50 border border-border/50 hover:border-forest-green/30 rounded-2xl transition-all duration-200 text-left group"
                        onClick={() => setInputValue('Find budget-friendly destinations')}
                      >
                        <DollarSign className="w-5 h-5 text-forest-green mb-2" />
                        <div className="text-sm font-medium text-foreground group-hover:text-forest-green transition-colors">Budget Travel</div>
                        <div className="text-xs text-muted-foreground">Save money</div>
                      </button>
                      
                      <button 
                        className="p-4 bg-card hover:bg-muted/50 border border-border/50 hover:border-sky-blue/30 rounded-2xl transition-all duration-200 text-left group"
                        onClick={() => setInputValue('What should I pack for Tokyo?')}
                      >
                        <Camera className="w-5 h-5 text-sky-blue mb-2" />
                        <div className="text-sm font-medium text-foreground group-hover:text-sky-blue transition-colors">Packing Tips</div>
                        <div className="text-xs text-muted-foreground">Essential items</div>
                      </button>
                      
                      <button 
                        className="p-4 bg-card hover:bg-muted/50 border border-border/50 hover:border-sunset-pink/30 rounded-2xl transition-all duration-200 text-left group"
                        onClick={() => setInputValue('Tell me about local culture in Japan')}
                      >
                        <Heart className="w-5 h-5 text-sunset-pink mb-2" />
                        <div className="text-sm font-medium text-foreground group-hover:text-sunset-pink transition-colors">Cultural Insights</div>
                        <div className="text-xs text-muted-foreground">Local customs</div>
                      </button>
                    </div>
                  </motion.div>
                )}

                <div style={{ minHeight: '100px' }}>
                  {messages.map((message, index) => (
                    <div key={`message-${message.id || 'temp'}-${index}-${message.timestamp}`}>
                      {renderMessage(message)}
                    </div>
                  ))}
                </div>

                {/* Agent Status Display - Inside chat flow */}
                <AgentStatusDisplay
                  isVisible={agentStatus.isVisible}
                  stage={agentStatus.stage}
                  message={agentStatus.message}
                  progress={agentStatus.progress}
                  agentsStatus={agentStatus.agentsStatus}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive"
                  >
                    <div className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area + Suggestions */}
          <div className="border-t border-border/50 shrink-0 bg-background" style={{ minHeight: '160px' }}>
            <div className="max-w-4xl mx-auto p-6">

              {/* AI Thinking Indicator - Fixed Height */}
              <div className="mb-4 flex items-center justify-center" style={{ minHeight: '40px' }}>
                <AnimatePresence>
                  {isAIThinking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-3 bg-gradient-to-r from-sunrise-coral/10 to-sunrise-teal/10 px-6 py-3 rounded-full border border-sunrise-coral/20"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-sunrise-coral border-t-transparent rounded-full"
                      />
                      <span className="text-sm font-medium text-sunrise-coral">
                        WanderBuddy is thinking...
                      </span>
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-1 h-1 bg-sunrise-coral rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-1 h-1 bg-sunrise-coral rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-1 h-1 bg-sunrise-coral rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What do you want to know?"
                    disabled={isLoading || isAIThinking}
                    className={cn(
                      "h-14 text-base bg-background border-2 rounded-2xl px-6 pr-16 transition-all duration-300",
                      isAIThinking 
                        ? "border-sunrise-coral/30 bg-sunrise-coral/5" 
                        : "border-border/50 focus:border-sunrise-coral focus:ring-1 focus:ring-sunrise-coral"
                    )}
                    maxLength={500}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    {inputValue.length}/500
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || isAIThinking}
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                    isAIThinking
                      ? "bg-gradient-to-r from-sunrise-coral/50 to-sunrise-teal/50 cursor-not-allowed"
                      : "bg-gradient-sunrise hover:shadow-glow text-white"
                  )}
                >
                  {isLoading || isAIThinking ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
    </div>
  );
};

export default AITravelPlanner;
