import { useState, useCallback, useEffect } from 'react';
import type {
  AIChatMessage,
  AIChatState,
  AIUserContext
} from '../types/aiChat';
import aiTravelService from '../services/aiTravelService';
import { messagingService } from '../services/realtimeMessaging';

export const useAITravelBuddy = (userContext?: AIUserContext) => {
  const [state, setState] = useState<AIChatState>({
    isOpen: false,
    isMinimized: false,
    messages: [],
    isLoading: false,
    error: null,
    currentSessionId: '',
    hasWelcomed: false,
  });

  const generateMessageId = () =>
    `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  const generateSessionId = () =>
    `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  // Initialize session and load stored messages
  useEffect(() => {
    const sessionId = generateSessionId();
    const storedMessages = aiTravelService.getStoredMessages();

    setState(prev => ({
      ...prev,
      currentSessionId: sessionId,
      messages: storedMessages,
      hasWelcomed: storedMessages.length > 0
    }));
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (state.messages.length > 0) {
      aiTravelService.storeMessages(state.messages);
    }
  }, [state.messages]);

  const addMessage = useCallback((message: Omit<AIChatMessage, 'id'>) => {
    const newMessage: AIChatMessage = {
      ...message,
      id: generateMessageId(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    return newMessage.id;
  }, []);

  // WebSocket listener for AI status updates and final trip plans
  useEffect(() => {
    // Only set up listener if we have a valid user ID (not anonymous)
    if (!userContext?.userId || userContext.userId === 'anonymous_user') {
      console.log('⏳ Waiting for user authentication before setting up AI listener');
      return;
    }

    console.log('🔌 Setting up AI status update listener for user:', userContext.userId);

    const handleAIStatusUpdate = (data: any) => {
      console.log('📡 Received AI status update:', data);
      console.log('🔍 Frontend WebSocket Event Data:', JSON.stringify(data, null, 2));

      // Handle different types of updates
      if (data.stage === 'completed' && data.message) {
        console.log('🎉 Received final trip plan via WebSocket!');
        console.log('🔍 Raw data structure:', JSON.stringify(data, null, 2));
        console.log('🔍 Metadata structure:', JSON.stringify(data.metadata, null, 2));
        console.log('🔍 Raw data in metadata:', JSON.stringify(data.metadata?.rawData, null, 2));

        // Check if we already have a completed trip plan message to prevent duplicates
        setState(prev => {
          // Only check for duplicates if the message has the same content and timestamp
          const hasCompletedPlan = prev.messages.some(msg =>
            msg.type === 'trip_plan_with_feedback' &&
            msg.role === 'assistant' &&
            !msg.isTyping &&
            msg.content === data.message && // Check if content is identical
            Math.abs(new Date(msg.timestamp).getTime() - new Date(data.timestamp || Date.now()).getTime()) < 5000 // Within 5 seconds
          );

          if (hasCompletedPlan) {
            console.log('🚫 Duplicate trip plan detected (same content and timestamp), ignoring...');
            return {
              ...prev,
              messages: prev.messages.filter(msg => !msg.isTyping),
              isLoading: false
            };
          }

          // Remove typing indicators and status updates
          const cleanedMessages = prev.messages.filter(msg =>
            !msg.isTyping && msg.type !== 'status_update'
          );

          // Add the comprehensive trip plan as a message with proper metadata
          const tripPlanMessage: AIChatMessage = {
            id: generateMessageId(),
            content: data.message,
            role: 'assistant',
            timestamp: data.timestamp || new Date().toISOString(),
            type: 'trip_plan_with_feedback',
            metadata: {
              destination: data.metadata?.destination,
              duration: data.metadata?.duration,
              travelers: data.metadata?.travelers,
              trip_type: data.metadata?.trip_type,
              rawData: data.metadata?.rawData || data.rawData,
              allowsFeedback: data.metadata?.allowsFeedback !== false,
              userProfile: userContext?.userProfile || data.metadata?.userProfile
            }
          };

          console.log('✅ Adding trip plan with metadata:', JSON.stringify(tripPlanMessage.metadata, null, 2));
          console.log('✅ Trip plan message content length:', tripPlanMessage.content.length);
          console.log('✅ Total messages after adding trip plan:', cleanedMessages.length + 1);

          return {
            ...prev,
            messages: [...cleanedMessages, tripPlanMessage],
            isLoading: false
          };
        });
      } else if (data.stage === 'planning_in_progress' || data.stage === 'thinking') {
        // Show status updates as temporary messages or update loading state
        console.log('⚡ AI planning update:', data.progress + '%', data.message);

        // Update loading state with progress info
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null
        }));

        // Optionally show progress as a message (you can customize this)
        if (data.showToUser && data.message) {
          // Find and update existing status message or create new one
          setState(prev => {
            const existingStatusIndex = prev.messages.findIndex(msg =>
              msg.type === 'status_update' && msg.role === 'assistant'
            );

            if (existingStatusIndex >= 0) {
              // Update existing status message
              const updatedMessages = [...prev.messages];
              updatedMessages[existingStatusIndex] = {
                ...updatedMessages[existingStatusIndex],
                content: `${data.message} (${data.progress}%)`,
                timestamp: data.timestamp || new Date().toISOString(),
              };
              return { ...prev, messages: updatedMessages };
            } else {
              // Add new status message
              const statusMessage: AIChatMessage = {
                id: generateMessageId(),
                content: `${data.message} (${data.progress}%)`,
                role: 'assistant',
                timestamp: data.timestamp || new Date().toISOString(),
                type: 'status_update',
                isTyping: data.stage === 'thinking'
              };
              return {
                ...prev,
                messages: [...prev.messages.filter(msg => !msg.isTyping), statusMessage]
              };
            }
          });
        }
      }
    };

    // Subscribe to AI status updates
    messagingService.onAIStatusUpdate(handleAIStatusUpdate);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up AI status update listener');
      messagingService.offAIStatusUpdate();
    };
  }, [userContext?.userId, addMessage]);

  const updateMessage = useCallback((id: string, updates: Partial<AIChatMessage>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  }, []);

  const removeMessage = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== id),
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Add user message
    addMessage({
      content: content.trim(),
      role: 'user',
      timestamp: new Date().toISOString(),
    });

    // Add typing indicator
    const typingMessageId = addMessage({
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isTyping: true,
    });

    try {
      // Enhance user context with user ID for proper WebSocket communication
      const enhancedUserContext = {
        ...userContext,
        userId: userContext?.userId || 'anonymous_user',
        currentUser: userContext?.userId || 'anonymous_user'
      };
      
      console.log('🤖 Sending message with context:', enhancedUserContext);
      const response = await aiTravelService.sendMessage(content.trim(), enhancedUserContext);
      console.log('🤖 Received response:', response);

      // Remove typing indicator
      removeMessage(typingMessageId);

      if (response.success && response.data) {
        console.log('✅ Adding AI response to chat');
        // Add AI response
        addMessage({
          content: response.data.message,
          role: 'assistant',
          timestamp: response.data.timestamp,
          type: response.data.type || 'chat',
          metadata: response.data.metadata,
        });
      } else {
        console.error('❌ Response was not successful:', response);
        // Add error message
        addMessage({
          content: response.error || 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: new Date().toISOString(),
        });
        setState(prev => ({ ...prev, error: response.error || 'Unknown error' }));
      }
    } catch (error) {
      // Remove typing indicator
      removeMessage(typingMessageId);

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      addMessage({
        content: `Sorry, I couldn't process your message: ${errorMessage}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      });
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, userContext, addMessage, removeMessage]);

  const sendWelcomeMessage = useCallback(async () => {
    if (state.hasWelcomed || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await aiTravelService.getWelcomeMessage(userContext);

      if (response.success && response.data) {
        addMessage({
          content: response.data.message,
          role: 'assistant',
          timestamp: response.data.timestamp,
        });
        setState(prev => ({ ...prev, hasWelcomed: true }));
      }
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.hasWelcomed, state.isLoading, userContext, addMessage]);


  const toggleChat = useCallback(() => {
    setState(prev => {
      const willOpen = !prev.isOpen;

      // Send welcome message when opening chat for the first time
      if (willOpen && !prev.hasWelcomed) {
        setTimeout(() => sendWelcomeMessage(), 500);
      }

      return {
        ...prev,
        isOpen: willOpen,
        isMinimized: false,
      };
    });
  }, [sendWelcomeMessage]);

  const minimizeChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: true,
    }));
  }, []);

  const maximizeChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: false,
      isOpen: true,
    }));
  }, []);

  const clearConversation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await aiTravelService.clearConversation(userContext);
      aiTravelService.clearStoredMessages();

      setState(prev => ({
        ...prev,
        messages: [],
        hasWelcomed: false,
        error: null,
        isLoading: false,
        currentSessionId: generateSessionId(),
      }));
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to clear conversation',
        isLoading: false
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    sendMessage,
    sendWelcomeMessage,
    toggleChat,
    minimizeChat,
    maximizeChat,
    clearConversation,
    clearError,

    // Message management
    addMessage,
    updateMessage,
    removeMessage,
  };
};

export default useAITravelBuddy;