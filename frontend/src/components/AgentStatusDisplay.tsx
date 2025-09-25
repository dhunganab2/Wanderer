import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, CheckCircle, Clock, Sparkles, Zap, Search, Palette, Clipboard } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface AgentStatus {
  name: string;
  status: 'preparing' | 'working' | 'completed' | 'waiting';
  task: string;
}

interface AgentStatusDisplayProps {
  isVisible: boolean;
  stage: string;
  message: string;
  progress: number;
  agentsStatus?: AgentStatus[];
}

const AgentStatusDisplay: React.FC<AgentStatusDisplayProps> = ({
  isVisible,
  stage,
  message,
  progress,
  agentsStatus = []
}) => {
  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'ProfileAnalyst':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'DataScout':
        return <Search className="w-4 h-4 text-blue-500" />;
      case 'ItineraryArchitect':
        return <Palette className="w-4 h-4 text-pink-500" />;
      case 'ChiefTravelPlanner':
        return <Clipboard className="w-4 h-4 text-green-500" />;
      default:
        return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <Zap className="w-3 h-3 animate-pulse text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'preparing':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    // Dark theme variants
    switch (status) {
      case 'working':
        return 'border-emerald-400/40 bg-gradient-to-r from-emerald-500/10 to-emerald-400/5';
      case 'completed':
        return 'border-emerald-500/50 bg-gradient-to-r from-emerald-600/10 to-emerald-500/5';
      case 'preparing':
        return 'border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-amber-400/5';
      default:
        return 'border-border/40 bg-gradient-to-r from-gray-700/40 to-gray-800/40';
    }
  };

  // Show simple thinking indicator for initial stages
  const isInitialStage = stage === 'initializing' || (agentsStatus.length === 0 && progress < 30);

  if (isInitialStage) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center justify-center"
          >
            <div className="flex items-center space-x-3 bg-gradient-to-r from-sunrise-coral/10 to-sunrise-teal/10 px-6 py-3 rounded-full border border-sunrise-coral/20">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Card className="border border-border/50 bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-gray-800/80 shadow-soft">
            <CardContent className="p-6">
              {/* Main Status Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Bot className="w-6 h-6 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Zap className="w-2 h-2 text-white" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    🚀 AI Travel Specialists
                  </h3>
                  <p className="text-sm text-muted-foreground">{message}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm font-semibold text-muted-foreground mb-2">
                  <span>✨ Creating Your Perfect Trip</span>
                  <span className="text-blue-400">{progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full shadow-glow"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Agent Status List */}
              {agentsStatus.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Specialist Team
                  </h4>
                  {agentsStatus.map((agent, index) => (
                    <motion.div
                      key={agent.name}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: index * 0.15, duration: 0.5 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${getStatusColor(agent.status)} transition-all duration-300`}
                    >
                      <div className="flex items-center gap-3">
                        {getAgentIcon(agent.name)}
                        {getStatusIcon(agent.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-foreground text-base">
                            {agent.name}
                          </span>
                          {agent.status === 'working' && (
                            <motion.div
                              className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1 rounded-full font-bold"
                              animate={{ 
                                scale: [1, 1.05, 1],
                                boxShadow: ["0 0 0 0 rgba(16,185,129,0.35)", "0 0 0 8px rgba(16,185,129,0)", "0 0 0 0 rgba(16,185,129,0)"]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              ⚡ ACTIVE
                            </motion.div>
                          )}
                          {agent.status === 'completed' && (
                            <motion.div
                              className="text-xs bg-gradient-to-r from-emerald-600 to-green-500 text-white px-3 py-1 rounded-full font-bold"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                            >
                              ✅ DONE
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {agent.task}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Stage Indicator */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                  <motion.div
                    className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="capitalize">{stage}</span>
                  <motion.div
                    className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentStatusDisplay;