import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Minimize2,
  Maximize2,
  X,
  RefreshCw,
  Sparkles,
  Plane
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';
import type { AIChatProps, AIChatMessage } from '../types/aiChat';
import useAITravelBuddy from '../hooks/useAITravelBuddy';
import TripPlanDisplay from './TripPlanDisplay';


const AITravelBuddy: React.FC<AIChatProps> = ({
  className,
  initialPosition = 'right',
  theme = 'auto',
  userContext,
  onMessageSent,
  onChatToggle,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    isMinimized,
    messages,
    isLoading,
    error,
    sendMessage,
    toggleChat,
    minimizeChat,
    maximizeChat,
    clearConversation,
    clearError,
  } = useAITravelBuddy(userContext);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Notify parent component when chat toggles
  useEffect(() => {
    onChatToggle?.(isOpen);
  }, [isOpen, onChatToggle]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    onMessageSent?.(message);

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
          message.type === 'trip_plan' || message.type === 'trip_plan_with_feedback' ? 'justify-center' : (isUser ? 'justify-end' : 'justify-start')
        )}
      >
        <div
          className={cn(
            message.type === 'trip_plan' || message.type === 'trip_plan_with_feedback' ? 'w-full' : 'max-w-[85%]',
            'rounded-2xl px-3 py-2 text-sm leading-relaxed',
            'shadow-sm',
            isUser
              ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white ml-4 shadow-lg'
              : message.type === 'trip_plan' || message.type === 'trip_plan_with_feedback'
                ? 'bg-transparent border-none mr-0 px-0 py-0'
                : 'bg-gradient-to-br from-gray-50 to-white text-gray-800 border border-gray-200 mr-4 shadow-md hover:shadow-lg',
            'transition-all duration-200'
          )}
        >
          {isTyping ? (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-gray-500 ml-2">WanderBuddy is typing...</span>
            </div>
          ) : (message.type === 'trip_plan' || message.type === 'interactive_trip_plan' || message.type === 'trip_plan_with_feedback') ? (
            <TripPlanDisplay
              content={message.content}
              metadata={{
                ...message.metadata,
                rawData: message.metadata?.rawData
              }}
              className="w-full"
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
                'text-xs mt-2 opacity-70',
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


  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'fixed z-50 cursor-pointer',
          initialPosition === 'right' ? 'right-6' : 'left-6',
          'bottom-6'
        )}
        onClick={toggleChat}
      >
        <div className="relative">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 border-2 border-white/30 transition-all duration-300"
          >
            <div className="flex flex-col items-center">
              <Sparkles className="w-4 h-4 text-white mb-0.5" />
              <span className="text-[10px] text-white font-medium">AI</span>
            </div>
          </Button>

          {/* Enhanced pulse animation */}
          <div className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 animate-ping opacity-30" />

          {/* Travel-themed floating icons */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <Plane className="w-3 h-3 text-white" />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'fixed z-50',
        initialPosition === 'right' ? 'right-4' : 'left-4',
        'bottom-4',
        isMinimized ? 'w-64 h-12' : 'w-72 h-[26rem]',
        'transition-all duration-300',
        className
      )}
    >
      <Card className="h-full shadow-lg border border-gray-200 bg-white rounded-xl overflow-hidden">
        {/* Enhanced Header */}
        <CardHeader className="flex flex-row items-center justify-between p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1 left-2 w-4 h-4 border border-white/30 rounded-full" />
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/20 rounded-full" />
            <div className="absolute bottom-2 left-6 w-3 h-3 border border-white/25 rounded-full" />
            <Plane className="absolute bottom-1 right-2 w-4 h-4 text-white/20" />
          </div>

          <div className="flex items-center space-x-2 relative z-10">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">WanderBuddy</CardTitle>
              <div className="text-xs text-white/80 font-normal">AI Travel Companion</div>
            </div>
            {isLoading && <RefreshCw className="w-3 h-3 ml-2 animate-spin text-white/80" />}
          </div>

          <div className="flex items-center space-x-1">
            {!isMinimized && messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-white hover:bg-white/20"
                onClick={handleNewChat}
                title="New Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/20"
              onClick={isMinimized ? maximizeChat : minimizeChat}
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/20"
              onClick={toggleChat}
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-full p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-lg font-semibold text-gray-800 mb-2">
                      Hi! I'm WanderBuddy ✈️
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      Your AI travel companion powered by multi-agent intelligence
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">
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
                    className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
                  >
                    <div className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={clearError}
                        className="text-red-500 hover:bg-red-100"
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
            <div className="border-t bg-gray-50 p-4">
              <div className="flex items-center space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about travel plans, destinations, tips..."
                  disabled={isLoading}
                  className="flex-1 border-warm-gray-300 focus:border-sunrise-coral focus:ring-sunrise-coral"
                  maxLength={500}
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-r from-sunrise-coral to-sunrise-coral-dark hover:from-sunrise-coral-dark hover:to-sunrise-coral shrink-0"
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
              <div className="text-xs text-gray-500 mt-1 text-right">
                {inputValue.length}/500
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
};

export default AITravelBuddy;