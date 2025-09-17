import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  className,
  delay = 0
}) => {
  return (
    <div 
      className={cn(
        "group relative p-8 rounded-2xl glass-card hover-lift",
        "animate-fade-up opacity-0",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Gradient Glow on Hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-sunrise opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
      
      {/* Icon */}
      <div className="mb-6 inline-flex p-4 rounded-2xl bg-gradient-sunrise/10 group-hover:bg-gradient-sunrise/20 transition-colors duration-300">
        <Icon className="w-8 h-8 text-primary group-hover:text-sunrise-coral transition-colors duration-300" />
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-semibold text-foreground mb-4 font-display">
        {title}
      </h3>
      
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
      
      {/* Hover Effect Arrow */}
      <div className="absolute bottom-6 right-6 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};