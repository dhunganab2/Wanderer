import React from 'react';
import { MapPin, Calendar, Users, Heart, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface TravelCardProps {
  user: User;
  className?: string;
  onLike?: (userId: string) => void;
  onPass?: (userId: string) => void;
  onSuperLike?: (userId: string) => void;
  variant?: 'stack' | 'grid';
  showActions?: boolean;
  compatibilityScore?: number;
  compatibilityReasons?: string[];
}

export const TravelCard: React.FC<TravelCardProps> = ({ 
  user, 
  className, 
  onLike, 
  onPass, 
  onSuperLike,
  variant = 'stack',
  showActions = true,
  compatibilityScore,
  compatibilityReasons
}) => {
  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (direction === 'right' && onLike) {
      onLike(user.id);
    } else if (direction === 'left' && onPass) {
      onPass(user.id);
    } else if (direction === 'up' && onSuperLike) {
      onSuperLike(user.id);
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-3xl shadow-elevation hover:shadow-glow transition-all duration-700 cursor-pointer group",
        variant === 'stack' ? "w-[300px] sm:w-[320px] md:w-[340px] h-[480px] sm:h-[500px] md:h-[520px]" : "w-full max-w-sm h-[400px] sm:h-[420px] md:h-[440px]",
        "glass-card-elevated backdrop-blur-2xl border border-white/20 hover:border-sunrise-coral/30",
        "hover:scale-[1.02] hover:-translate-y-2",
        className
      )}
    >
      {/* Enhanced Cover Image */}
      <div className="relative h-52 sm:h-56 md:h-60 overflow-hidden">
        <img 
          src={user.coverImage || user.avatar || '/placeholder.svg'} 
          alt={`${user.name}'s travel photo`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          onError={(e) => {
            // If both coverImage and avatar fail, use a placeholder
            const target = e.target as HTMLImageElement;
            if (target.src !== '/placeholder.svg') {
              target.src = '/placeholder.svg';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-sunrise-coral/10 via-transparent to-sky-blue/10" />
        
        {/* Enhanced Mutual Connections Badge */}
        {user.mutualConnections && (
          <div className="absolute top-4 left-4 glass-card-elevated backdrop-blur-xl rounded-full px-4 py-2 text-white text-sm font-semibold border border-white/20">
            <Users className="w-4 h-4 inline mr-2" />
            {user.mutualConnections} mutual
          </div>
        )}

        {/* Enhanced Action Buttons - Stack Variant */}
        {variant === 'stack' && showActions && (onLike || onPass) && (
          <div className="absolute bottom-6 right-6 flex gap-4">
            {onPass && (
              <button
                onClick={() => handleSwipe('left')}
                className="w-16 h-16 rounded-full glass-card-elevated backdrop-blur-xl border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-110 button-bounce group/btn"
              >
                <X className="w-7 h-7 group-hover/btn:rotate-90 transition-transform duration-300" />
              </button>
            )}
            {onLike && (
              <button
                onClick={() => handleSwipe('right')}
                className="w-16 h-16 rounded-full bg-gradient-sunrise border border-white/30 flex items-center justify-center text-white hover:shadow-glow transition-all duration-300 hover:scale-110 button-bounce group/btn"
              >
                <Heart className="w-7 h-7 group-hover/btn:scale-110 transition-transform duration-300" />
              </button>
            )}
          </div>
        )}

        {/* Enhanced Action Buttons - Grid Variant */}
        {variant === 'grid' && showActions && (onLike || onPass) && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 opacity-80 group-hover:opacity-100 transition-all duration-300 z-10">
            {onPass && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipe('left');
                }}
                className="w-12 h-12 rounded-full glass-card-elevated backdrop-blur-xl border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-110 shadow-lg group/btn"
                title="Pass"
              >
                <X className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" />
              </button>
            )}
            {onLike && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipe('right');
                }}
                className="w-12 h-12 rounded-full bg-gradient-sunrise border border-white/30 flex items-center justify-center text-white hover:shadow-glow transition-all duration-300 hover:scale-110 shadow-lg group/btn"
                title="Like"
              >
                <Heart className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" fill="currentColor" />
              </button>
            )}
          </div>
        )}
        
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Enhanced Content */}
      <div className="p-4 sm:p-5 space-y-3 flex flex-col h-full">
        {/* Name and Age */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight group-hover:text-gradient-primary transition-all duration-300">
              {user.name}
            </h3>
            <span className="text-xl sm:text-2xl text-muted-foreground font-bold">
              {user.age}
            </span>
          </div>
          <div className="flex items-center text-muted-foreground text-sm font-medium">
            <MapPin className="w-4 h-4 mr-2 text-sunrise-coral" />
            {user.location}
          </div>
        </div>

        {/* Travel Info */}
        <div className="space-y-3">
          <div className="flex items-center text-sunrise-coral text-sm font-semibold bg-sunrise-coral/10 px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4 mr-2" />
            Next: {user.nextDestination}
          </div>
          <div className="text-muted-foreground text-sm font-medium">
            {user.travelDates}
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs sm:text-sm text-foreground leading-relaxed line-clamp-2 group-hover:text-foreground/90 transition-colors duration-300">
          {user.bio}
        </p>

        {/* Enhanced Travel Style Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {user.travelStyle.slice(0, 3).map((style, index) => (
            <span
              key={index}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-sunrise/10 text-sunrise-coral text-xs font-semibold rounded-full border border-sunrise-coral/20 hover:bg-gradient-sunrise/20 hover:border-sunrise-coral/40 transition-all duration-300 cursor-default"
            >
              {style}
            </span>
          ))}
          {user.travelStyle.length > 3 && (
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 text-muted-foreground text-xs font-semibold rounded-full border border-muted-foreground/20">
              +{user.travelStyle.length - 3} more
            </span>
          )}
        </div>
        
        {/* Action Buttons - Inside Content Area */}
        {variant === 'stack' && showActions && (onLike || onPass || onSuperLike) && (
          <div className="flex justify-center gap-3 pt-2 mt-auto">
            {onPass && (
              <button
                onClick={() => handleSwipe('left')}
                className="w-14 h-14 rounded-full glass-card-elevated backdrop-blur-xl border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-110 button-bounce group/btn"
              >
                <X className="w-6 h-6 group-hover/btn:rotate-90 transition-transform duration-300" />
              </button>
            )}
            {onSuperLike && (
              <button
                onClick={() => handleSwipe('up')}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-midnight-blue border border-sky-blue/40 flex items-center justify-center text-white hover:shadow-glow transition-all duration-300 hover:scale-110 button-bounce group/btn"
              >
                <Star className="w-5 h-5 group-hover/btn:animate-pulse-soft transition-all duration-300" fill="currentColor" />
              </button>
            )}
            {onLike && (
              <button
                onClick={() => handleSwipe('right')}
                className="w-14 h-14 rounded-full bg-gradient-sunrise border border-white/30 flex items-center justify-center text-white hover:shadow-glow transition-all duration-300 hover:scale-110 button-bounce group/btn"
              >
                <Heart className="w-6 h-6 group-hover/btn:scale-110 transition-transform duration-300" />
              </button>
            )}
          </div>
        )}
        
        {/* Enhanced Hover Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-sunrise/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </div>
  );
};