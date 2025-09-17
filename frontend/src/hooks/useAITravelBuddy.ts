import { useState, useCallback, useEffect } from 'react';
import type {
  AIChatMessage,
  AIChatState,
  AIQuickAction,
  AIUserContext
} from '../types/aiChat';
import aiTravelService from '../services/aiTravelService';

export const useAITravelBuddy = (userContext?: AIUserContext) => {
  const [state, setState] = useState<AIChatState>({
    isOpen: false,
    isMinimized: false,
    messages: [],
    isLoading: false,
    error: null,
    quickActions: [],
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

    // Load quick actions
    loadQuickActions();
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (state.messages.length > 0) {
      aiTravelService.storeMessages(state.messages);
    }
  }, [state.messages]);

  const loadQuickActions = useCallback(async () => {
    try {
      const response = await aiTravelService.getQuickActions();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          quickActions: response.data!
        }));
      }
    } catch (error) {
      console.error('Failed to load quick actions:', error);
    }
  }, []);

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
    const userMessageId = addMessage({
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
      const response = await aiTravelService.sendMessage(content.trim(), userContext);

      // Remove typing indicator
      removeMessage(typingMessageId);

      if (response.success && response.data) {
        // Add AI response
        addMessage({
          content: response.data.message,
          role: 'assistant',
          timestamp: response.data.timestamp,
        });
      } else {
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

  const sendQuickAction = useCallback(async (action: AIQuickAction) => {
    await sendMessage(action.prompt);
  }, [sendMessage]);

  const toggleChat = useCallback(() => {
    setState(prev => {
      const newIsOpen = !prev.isOpen;

      // Send welcome message when opening for the first time
      if (newIsOpen && !prev.hasWelcomed && prev.messages.length === 0) {
        // Use setTimeout to ensure state update completes first
        setTimeout(() => sendWelcomeMessage(), 100);
      }

      return {
        ...prev,
        isOpen: newIsOpen,
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

      await aiTravelService.clearConversation();
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
    sendQuickAction,
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