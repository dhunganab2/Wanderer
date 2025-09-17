import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TravelCardSkeletonProps {
  variant?: 'stack' | 'grid' | 'list';
  className?: string;
}

export const TravelCardSkeleton: React.FC<TravelCardSkeletonProps> = ({ 
  variant = 'stack',
  className 
}) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50",
        variant === 'stack' ? "w-80 h-[500px]" : "w-full max-w-sm h-96",
        className
      )}
    >
      {/* Cover Image Skeleton */}
      <Skeleton className="h-60 w-full rounded-t-2xl" />
      
      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Name and Age */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Travel Info */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>

        {/* Travel Style Tags */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const TravelCardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <TravelCardSkeleton key={index} variant="grid" />
      ))}
    </div>
  );
};

export const TravelCardStackSkeleton: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-96">
      <div className="relative">
        <TravelCardSkeleton variant="stack" className="relative z-10" />
        {/* Next card preview */}
        <div className="absolute top-2 left-2 right-2 z-0 opacity-30 scale-95">
          <TravelCardSkeleton variant="stack" />
        </div>
      </div>
    </div>
  );
};
