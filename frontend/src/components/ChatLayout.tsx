import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import ResizableAISidebar from './ResizableAISidebar';

interface ChatLayoutContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
}

const ChatLayoutContext = createContext<ChatLayoutContextType | undefined>(undefined);

export const useChatLayout = () => {
  const context = useContext(ChatLayoutContext);
  if (!context) {
    throw new Error('useChatLayout must be used within a ChatLayoutProvider');
  }
  return context;
};

interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  const contextValue: ChatLayoutContextType = {
    isChatOpen,
    toggleChat,
    openChat,
    closeChat,
  };

  return (
    <ChatLayoutContext.Provider value={contextValue}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {children}
          
          {/* Chat Toggle Button - Fixed to bottom right */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={toggleChat}
              size="icon"
              className="w-12 h-12 rounded-xl shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border border-white/20 backdrop-blur-sm hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Chat Sidebar - Slides in from right */}
        <AnimatePresence>
          {isChatOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={closeChat}
              />
              
              {/* Sidebar */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
                className="fixed right-0 top-0 h-full w-96 shadow-2xl z-50"
              >
                <ResizableAISidebar
                  onChatToggle={closeChat}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ChatLayoutContext.Provider>
  );
};

export default ChatLayout;
