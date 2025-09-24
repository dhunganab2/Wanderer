import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  RefreshCw,
  Sparkles,
  Bot,
  User,
  X,
  GripVertical
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';
import type { AIChatProps, AIChatMessage } from '../types/aiChat';
import useAITravelBuddy from '../hooks/useAITravelBuddy';
import AgentStatusDisplay from './AgentStatusDisplay';


interface ResizableAISidebarProps extends Omit<AIChatProps, 'className' | 'initialPosition'> {
  onChatToggle?: (isOpen: boolean) => void;
}

const ResizableAISidebar: React.FC<ResizableAISidebarProps> = ({
  theme = 'auto',
  userContext,
  onMessageSent,
  onChatToggle,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [agentStatus, setAgentStatus] = useState({
    isVisible: false,
    stage: '',
    message: '',
    progress: 0,
    agentsStatus: [] as Array<{name: string; status: 'preparing' | 'working' | 'completed' | 'waiting'; task: string}>
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const socketRef = useRef<Socket | null>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    clearError,
  } = useAITravelBuddy(userContext);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Setup WebSocket connection for agent status updates
  useEffect(() => {
    if (!userContext?.userId) return;

    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
      query: {
        userId: userContext.userId
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket for agent status updates');
    });

    socket.on('ai_status_update', (data) => {
      console.log('🤖 Agent status update received:', data);

      if (data.type === 'travel_planning_status') {
        setAgentStatus({
          isVisible: true,
          stage: data.stage || 'Processing',
          message: data.message || 'AI agents are working on your request...',
          progress: data.progress || 0,
          agentsStatus: data.agents || []
        });

        // Hide status after completion
        if (data.progress >= 100) {
          setTimeout(() => {
            setAgentStatus(prev => ({ ...prev, isVisible: false }));
          }, 3000);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
    });

    return () => {
      socket.disconnect();
    };
  }, [userContext?.userId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    onMessageSent?.(message);

    // Show agent status when sending message
    setAgentStatus({
      isVisible: true,
      stage: 'Initializing',
      message: 'Preparing AI travel agents...',
      progress: 5,
      agentsStatus: [
        { name: 'Travel Planner', status: 'preparing', task: 'Analyzing your request' },
        { name: 'Destination Expert', status: 'waiting', task: 'Waiting to research destinations' },
        { name: 'Budget Advisor', status: 'waiting', task: 'Waiting to calculate costs' }
      ]
    });

    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    await clearConversation();
    setInputValue('');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = startXRef.current - e.clientX; // Inverted because we're on the right side
    const newWidth = Math.max(300, Math.min(800, startWidthRef.current + deltaX));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const formatMessage = (content: any) => {
    // Ensure content is a string
    const stringContent = typeof content === 'string' ? content :
                         typeof content === 'object' ? JSON.stringify(content, null, 2) :
                         String(content);

    return stringContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(.*?)```/gs, '<code class="block bg-muted p-2 rounded my-2">$1</code>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>');
  };

  const renderMessage = (message: AIChatMessage) => {
    const isUser = message.role === 'user';
    const isTyping = message.isTyping;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'flex w-full mb-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div className={cn(
          'flex items-start space-x-3 max-w-[90%]',
          isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
        )}>
          {/* Avatar */}
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border',
            isUser 
              ? 'bg-gradient-to-br from-pink-500 to-rose-600 border-pink-400/30' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/30'
          )}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Message Bubble */}
          <div
            className={cn(
              'rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg border backdrop-blur-sm transition-all duration-200',
              isUser
                ? 'bg-gradient-sunrise text-white border-sunrise-coral/20 shadow-sunrise-coral/20'
                : 'bg-gradient-to-br from-muted/90 to-background/90 text-foreground border-border shadow-muted/20',
            )}
          >
            {isTyping ? (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100 opacity-80" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                </div>
                <span className="opacity-70">WanderBuddy is typing...</span>
              </div>
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: formatMessage(message.content)
                }}
              />
            )}

            {!isTyping && (
              <div
                className={cn(
                  'text-xs mt-2 opacity-60',
                  isUser ? 'text-white/80' : 'text-cloud-white/70'
                )}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };


  return (
    <div 
      className="h-full flex flex-col bg-gradient-to-br from-background/95 via-muted/95 to-background/95 backdrop-blur-xl border-l border-border transition-all duration-300"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="flex flex-row items-center justify-between p-4 bg-gradient-sunrise text-white border-b border-border backdrop-blur-sm shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-white">
              WanderBuddy
            </CardTitle>
            <p className="text-xs text-white/80 font-medium">AI Travel Companion</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105"
              onClick={handleNewChat}
              title="New Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-white hover:bg-red-500/20 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105"
            onClick={onChatToggle}
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agent Status Display */}
      <AgentStatusDisplay
        isVisible={agentStatus.isVisible}
        stage={agentStatus.stage}
        message={agentStatus.message}
        progress={agentStatus.progress}
        agentsStatus={agentStatus.agentsStatus}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar bg-gradient-to-b from-background/50 to-muted/30">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="text-xl font-semibold text-foreground mb-2">
                Hi! I'm WanderBuddy ✈️
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Your AI travel companion powered by multi-agent intelligence
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                I can help you plan complete trips, find destinations, give travel tips, and more!<br/>
                Just start typing your travel questions or say something like:<br/>
                <span className="text-blue-600 font-medium">"Plan a 7-day trip to Tokyo"</span>
              </div>
            </motion.div>
          )}

          {messages.map(renderMessage)}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/40 rounded-2xl p-4 text-sm text-red-200 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearError}
                  className="text-red-300 hover:bg-red-500/20 backdrop-blur-sm"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-gradient-to-r from-muted/80 to-background/80 p-4 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about travel plans, destinations, tips..."
            disabled={isLoading}
            className="flex-1 bg-muted/60 border-border text-foreground placeholder:text-muted-foreground focus:border-sunrise-coral focus:ring-sunrise-coral/50 backdrop-blur-sm rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:shadow-lg focus:shadow-sunrise-coral/20"
            maxLength={500}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="w-10 h-10 rounded-xl bg-gradient-sunrise hover:shadow-sunrise-coral/30 shrink-0 shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Character count */}
        <div className="text-xs text-muted-foreground mt-2 text-right">
          {inputValue.length}/500
        </div>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute left-0 top-0 w-1 h-full bg-border hover:bg-sunrise-coral/70 cursor-col-resize transition-colors duration-200 group"
        onMouseDown={handleMouseDown}
      >
        <div className="w-3 h-full -ml-1 flex items-center justify-center">
          <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-sunrise-coral opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    </div>
  );
};

export default ResizableAISidebar;
