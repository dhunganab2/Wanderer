import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  RefreshCw,
  Sparkles,
  MapPin,
  Plane,
  Mountain,
  Camera,
  Shield,
  DollarSign,
  Bot,
  User,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';
import type { AIChatProps, AIChatMessage, AIQuickAction } from '../types/aiChat';
import useAITravelBuddy from '../hooks/useAITravelBuddy';
import { useChatLayout } from './ChatLayout';

const quickActionIcons: Record<string, React.ComponentType<any>> = {
  destination_ideas: MapPin,
  budget_tips: DollarSign,
  packing_advice: Plane,
  local_culture: Camera,
  safety_tips: Shield,
  hidden_gems: Mountain,
};

interface AITravelBuddySidebarProps extends Omit<AIChatProps, 'className' | 'initialPosition'> {
  onChatToggle?: (isOpen: boolean) => void;
}

const AITravelBuddySidebar: React.FC<AITravelBuddySidebarProps> = ({
  theme = 'auto',
  userContext,
  onMessageSent,
  onChatToggle,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { closeChat, isChatOpen } = useChatLayout();

  const {
    messages,
    isLoading,
    error,
    quickActions,
    sendMessage,
    sendQuickAction,
    clearConversation,
    clearError,
  } = useAITravelBuddy(userContext);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setShowQuickActions(false);
    onMessageSent?.(message);

    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = async (action: AIQuickAction) => {
    setShowQuickActions(false);
    onMessageSent?.(action.prompt);
    await sendQuickAction(action);
  };

  const handleNewChat = async () => {
    await clearConversation();
    setShowQuickActions(true);
    setInputValue('');
  };

  const formatMessage = (content: string) => {
    // Basic markdown-like formatting
    return content
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
                ? 'bg-gradient-to-br from-pink-500/90 to-rose-600/90 text-white border-pink-400/20 shadow-pink-500/20'
                : 'bg-gradient-to-br from-slate-700/90 to-slate-600/90 text-gray-100 border-slate-500/20 shadow-slate-500/20',
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

  const renderQuickActions = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-8 space-y-4"
    >
      <div className="text-center">
        <div className="text-sm text-gray-300 mb-2 font-semibold">
          ✨ Quick Start
        </div>
        <div className="text-xs text-gray-400">
          Choose a topic to get started
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {quickActions.map((action) => {
          const IconComponent = quickActionIcons[action.id] || Sparkles;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="h-auto p-4 flex flex-row items-center space-x-4 text-sm bg-gradient-to-r from-slate-700/60 to-slate-600/60 border-slate-500/30 text-gray-200 hover:from-indigo-600/40 hover:to-purple-600/40 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 backdrop-blur-sm rounded-xl group"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center border border-indigo-400/30 flex-shrink-0 group-hover:from-indigo-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                <IconComponent className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
              </div>
              <span className="text-left leading-tight text-sm font-medium group-hover:text-white transition-colors duration-300">
                {action.text}
              </span>
            </Button>
          );
        })}
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-l border-slate-700/50">
      {/* Header */}
      <div className="flex flex-row items-center justify-between p-6 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 text-white border-b border-white/10 backdrop-blur-sm shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              WanderBuddy
            </CardTitle>
            <p className="text-sm text-white/80 font-medium">Your AI Travel Companion</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-xl text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105"
              onClick={handleNewChat}
              title="New Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl text-white hover:bg-red-500/20 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105"
            onClick={closeChat}
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 custom-scrollbar bg-gradient-to-b from-slate-900/50 to-slate-800/30">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && showQuickActions && renderQuickActions()}

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
      <div className="border-t border-slate-600/30 bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-6 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about travel plans, destinations, tips..."
            disabled={isLoading}
            className="flex-1 bg-slate-700/60 border-slate-500/40 text-gray-100 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-400/50 backdrop-blur-sm rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:shadow-lg focus:shadow-indigo-500/20"
            maxLength={500}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shrink-0 shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Character count */}
        <div className="text-xs text-gray-400 mt-3 text-right">
          {inputValue.length}/500
        </div>
      </div>
    </div>
  );
};

export default AITravelBuddySidebar;
