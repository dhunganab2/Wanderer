import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Heart, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface SwipeableCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  className?: string;
  children: React.ReactNode;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  user,
  onSwipe,
  className,
  children
}) => {
  const [{ x, y, rotate, scale, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    config: { tension: 300, friction: 30 }
  }));

  const bind = useDrag(
    ({
      movement: [mx, my],
      direction: [dx, dy],
      velocity: [vx, vy],
      active,
      cancel
    }) => {
      // Determine swipe direction and threshold
      const trigger = Math.abs(mx) > 100 || Math.abs(my) > 100;
      const isHorizontal = Math.abs(mx) > Math.abs(my);
      const isVertical = Math.abs(my) > Math.abs(mx);
      
      if (active) {
        // While dragging
        api.start({
          x: mx,
          y: my,
          rotate: mx / 10,
          scale: 1.05,
          opacity: 1 - Math.abs(mx) / 300,
          immediate: true
        });
      } else {
        // When released
        if (trigger) {
          let swipeDirection: 'left' | 'right' | 'up';
          let exitX = 0;
          let exitY = 0;
          
          if (isVertical && my < -100) {
            // Super like (swipe up)
            swipeDirection = 'up';
            exitY = -window.innerHeight;
          } else if (isHorizontal && mx > 100) {
            // Like (swipe right)
            swipeDirection = 'right';
            exitX = window.innerWidth;
          } else {
            // Pass (swipe left)
            swipeDirection = 'left';
            exitX = -window.innerWidth;
          }
          
          // Animate exit
          api.start({
            x: exitX,
            y: exitY,
            rotate: exitX / 5,
            scale: 0.8,
            opacity: 0,
            config: { tension: 200, friction: 20 },
            onRest: () => onSwipe(swipeDirection)
          });
        } else {
          // Spring back to center
          api.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1
          });
        }
      }
    },
    {
      axis: undefined, // Allow both x and y movement
      bounds: { left: -300, right: 300, top: -200, bottom: 200 },
      rubberband: true
    }
  );

  // Show swipe indicators based on drag position
  const showLikeIndicator = x.to(x => x > 50);
  const showPassIndicator = x.to(x => x < -50);
  const showSuperLikeIndicator = y.to(y => y < -50);

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        rotate: rotate.to(r => `${r}deg`),
        scale,
        opacity,
        touchAction: 'none'
      }}
      className={cn(
        "relative cursor-grab active:cursor-grabbing touch-none select-none",
        className
      )}
    >
      {children}
      
      {/* Swipe Indicators */}
      <animated.div
        style={{
          opacity: showLikeIndicator.to(show => show ? 1 : 0),
          scale: showLikeIndicator.to(show => show ? 1 : 0.8)
        }}
        className="absolute top-8 right-8 bg-green-500/90 text-white p-4 rounded-2xl backdrop-blur-sm border-4 border-white/50 rotate-12 pointer-events-none"
      >
        <Heart className="w-8 h-8" fill="currentColor" />
      </animated.div>

      <animated.div
        style={{
          opacity: showPassIndicator.to(show => show ? 1 : 0),
          scale: showPassIndicator.to(show => show ? 1 : 0.8)
        }}
        className="absolute top-8 left-8 bg-red-500/90 text-white p-4 rounded-2xl backdrop-blur-sm border-4 border-white/50 -rotate-12 pointer-events-none"
      >
        <X className="w-8 h-8" />
      </animated.div>

      <animated.div
        style={{
          opacity: showSuperLikeIndicator.to(show => show ? 1 : 0),
          scale: showSuperLikeIndicator.to(show => show ? 1 : 0.8)
        }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white p-4 rounded-2xl backdrop-blur-sm border-4 border-white/50 pointer-events-none"
      >
        <Star className="w-8 h-8" fill="currentColor" />
      </animated.div>
    </animated.div>
  );
};
