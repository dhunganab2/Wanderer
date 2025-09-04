import React from 'react';
import { MapPin, Calendar, Users, Heart, X } from 'lucide-react';
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
}

export const TravelCard: React.FC<TravelCardProps> = ({ 
  user, 
  className, 
  onLike, 
  onPass, 
  onSuperLike,
  variant = 'stack',
  showActions = true
}) => {
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right' && onLike) {
      onLike(user.id);
    } else if (direction === 'left' && onPass) {
      onPass(user.id);
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-strong hover:shadow-glow transition-all duration-500 cursor-pointer group",
        variant === 'stack' ? "w-80 h-[500px]" : "w-full max-w-sm h-96",
        "glass-card backdrop-blur-xl border border-white/20",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative h-60 overflow-hidden">
        <img 
          src={user.coverImage || user.avatar} 
          alt={`${user.name}'s travel photo`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== user.avatar) {
              target.src = user.avatar;
            } else {
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=800x600`;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Mutual Connections Badge */}
        {user.mutualConnections && (
          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-white text-sm font-medium">
            <Users className="w-4 h-4 inline mr-1" />
            {user.mutualConnections} mutual
          </div>
        )}

        {/* Action Buttons - Stack Variant */}
        {variant === 'stack' && showActions && (onLike || onPass) && (
          <div className="absolute bottom-4 right-4 flex gap-3">
            {onPass && (
              <button
                onClick={() => handleSwipe('left')}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 button-bounce"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            {onLike && (
              <button
                onClick={() => handleSwipe('right')}
                className="w-14 h-14 rounded-full bg-gradient-sunrise border border-white/30 flex items-center justify-center text-white hover:shadow-glow transition-all duration-300 hover:scale-110 button-bounce"
              >
                <Heart className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Name and Age */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <img 
              src={user.avatar} 
              alt={`${user.name}'s profile`}
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=48`;
              }}
            />
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {user.name}, {user.age}
              </h3>
              {user.verified && (
                <div className="flex items-center text-primary text-xs font-medium">
                  <span className="w-2 h-2 bg-primary rounded-full mr-1"></span>
                  Verified
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {user.location}
          </div>
        </div>

        {/* Travel Info */}
        <div className="space-y-2">
          <div className="flex items-center text-primary text-sm font-medium">
            <Calendar className="w-4 h-4 mr-2" />
            Next: {user.nextDestination}
          </div>
          <div className="text-muted-foreground text-sm">
            {user.travelDates}
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-foreground leading-relaxed line-clamp-3">
          {user.bio}
        </p>

        {/* Travel Style Tags */}
        <div className="flex flex-wrap gap-2">
          {user.travelStyle.slice(0, 3).map((style, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20"
            >
              {style}
            </span>
          ))}
          {user.travelStyle.length > 3 && (
            <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
              +{user.travelStyle.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};