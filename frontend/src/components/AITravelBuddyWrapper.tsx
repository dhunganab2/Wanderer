import React, { useMemo } from 'react';
import AITravelBuddy from './AITravelBuddy';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAppStore } from '../store/useAppStore';
import type { AIUserContext } from '../types/aiChat';

interface AITravelBuddyWrapperProps {
  className?: string;
  initialPosition?: 'right' | 'left';
  theme?: 'light' | 'dark' | 'auto';
  onMessageSent?: (message: string) => void;
  onChatToggle?: (isOpen: boolean) => void;
}

const AITravelBuddyWrapper: React.FC<AITravelBuddyWrapperProps> = (props) => {
  const { user } = useUserProfile();
  const { bucketList } = useAppStore();

  // Transform user profile data to AI context format
  const userContext = useMemo((): AIUserContext => {
    if (!user) {
      return {};
    }

    // Map travel styles to strings
    const travelStyleStrings = user.travelStyle?.map(style => {
      if (typeof style === 'string') return style;
      return style; // In case it's already a string
    }) || [];

    return {
      userProfile: {
        name: user.name,
        age: user.age,
        location: user.location,
        travelStyle: travelStyleStrings,
        interests: user.interests || [],
        bucketList: bucketList.map(item =>
          typeof item === 'string' ? item : item.destination || item.name || ''
        ).filter(Boolean),
        travelExperience: (() => {
          // Infer travel experience from profile data
          const hasMultipleStyles = user.travelStyle && user.travelStyle.length > 1;
          const hasExtensiveInterests = user.interests && user.interests.length > 5;
          const hasBucketList = bucketList.length > 0;

          if (hasMultipleStyles && hasExtensiveInterests && hasBucketList) {
            return 'experienced';
          } else if (hasMultipleStyles || hasExtensiveInterests) {
            return 'intermediate';
          } else {
            return 'beginner';
          }
        })(),
        preferredBudget: (() => {
          // Infer budget from travel styles
          if (user.travelStyle?.includes('luxury' as any)) {
            return 'luxury';
          } else if (user.travelStyle?.includes('backpacker' as any)) {
            return 'budget';
          } else {
            return 'mid-range';
          }
        })(),
      },
      currentLocation: user.location,
      upcomingTrips: user.nextDestination ? [user.nextDestination] : [],
    };
  }, [user, bucketList]);

  // Don't render AI buddy if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <AITravelBuddy
      {...props}
      userContext={userContext}
    />
  );
};

export default AITravelBuddyWrapper;