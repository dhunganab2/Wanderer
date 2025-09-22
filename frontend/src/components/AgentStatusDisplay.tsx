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
    switch (status) {
      case 'working':
        return 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg';
      case 'completed':
        return 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50';
      case 'preparing':
        return 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50';
      default:
        return 'border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50';
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
          <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-xl">
            <CardContent className="p-6">
              {/* Main Status Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Bot className="w-6 h-6 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Zap className="w-2 h-2 text-white" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🚀 AI Travel Specialists
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">{message}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                  <span>✨ Creating Your Perfect Trip</span>
                  <span className="text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Agent Status List */}
              {agentsStatus.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Specialist Team
                  </h4>
                  {agentsStatus.map((agent, index) => (
                    <motion.div
                      key={agent.name}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: index * 0.15, duration: 0.5 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 ${getStatusColor(agent.status)} transition-all duration-300 hover:shadow-md`}
                    >
                      <div className="flex items-center gap-3">
                        {getAgentIcon(agent.name)}
                        {getStatusIcon(agent.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-gray-800 text-base">
                            {agent.name}
                          </span>
                          {agent.status === 'working' && (
                            <motion.div
                              className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full font-bold shadow-lg"
                              animate={{ 
                                scale: [1, 1.05, 1],
                                boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0.4)", "0 0 0 8px rgba(34, 197, 94, 0)", "0 0 0 0 rgba(34, 197, 94, 0)"]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              ⚡ ACTIVE
                            </motion.div>
                          )}
                          {agent.status === 'completed' && (
                            <motion.div
                              className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full font-bold"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                            >
                              ✅ DONE
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">
                          {agent.task}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Stage Indicator */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-600">
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