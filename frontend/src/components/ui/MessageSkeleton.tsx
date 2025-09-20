import React from 'react';

interface MessageSkeletonProps {
  isOwn?: boolean;
}

export function MessageSkeleton({ isOwn = false }: MessageSkeletonProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-gradient-sunrise rounded-br-md' 
            : 'bg-white/10 backdrop-blur-sm rounded-bl-md border border-white/20'
        }`}>
          {/* Message content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-white/20 rounded animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded animate-pulse w-3/4"></div>
          </div>
          
          {/* Timestamp skeleton */}
          <div className="flex items-center justify-between mt-2">
            <div className="h-3 bg-white/10 rounded animate-pulse w-16"></div>
            {isOwn && (
              <div className="h-3 bg-white/10 rounded animate-pulse w-4"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
      {/* Avatar skeleton */}
      <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse flex-shrink-0"></div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="h-4 bg-white/20 rounded animate-pulse w-24"></div>
          <div className="h-3 bg-white/10 rounded animate-pulse w-12"></div>
        </div>
        <div className="h-3 bg-white/10 rounded animate-pulse w-32"></div>
      </div>
      
      {/* Unread badge skeleton */}
      <div className="w-5 h-5 bg-white/20 rounded-full animate-pulse"></div>
    </div>
  );
}
