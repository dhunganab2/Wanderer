import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, MapPin, Calendar, Camera, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
  className?: string;
}

interface OnboardingData {
  name: string;
  age: string;
  photo?: string;
  travelStyle: string[];
  destinations: string[];
  bio: string;
}

const travelStyles = [
  { id: 'backpacker', label: 'Backpacker', icon: '🎒', description: 'Budget-friendly, authentic experiences' },
  { id: 'luxury', label: 'Luxury Seeker', icon: '✨', description: 'Premium comfort and experiences' },
  { id: 'foodie', label: 'Foodie', icon: '🍜', description: 'Culinary adventures and local cuisine' },
  { id: 'adventurer', label: 'Adventurer', icon: '🏔️', description: 'Extreme sports and outdoor activities' },
  { id: 'cultural', label: 'Culture Explorer', icon: '🏛️', description: 'Museums, history, and local traditions' },
  { id: 'photographer', label: 'Photographer', icon: '📸', description: 'Capturing beautiful moments and landscapes' },
  { id: 'solo', label: 'Solo Traveler', icon: '🚶', description: 'Independent exploration and self-discovery' },
  { id: 'group', label: 'Group Traveler', icon: '👥', description: 'Social experiences with fellow travelers' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, className }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: '',
    travelStyle: [],
    destinations: [],
    bio: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleTravelStyle = (styleId: string) => {
    updateData({
      travelStyle: data.travelStyle.includes(styleId)
        ? data.travelStyle.filter(s => s !== styleId)
        : [...data.travelStyle, styleId]
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name && data.age;
      case 2:
        return data.travelStyle.length > 0;
      case 3:
        return data.destinations.length > 0;
      case 4:
        return data.bio.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className={cn("max-w-2xl mx-auto p-6", className)}>
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of 4
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round((currentStep / 4) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-sunrise h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-96">
        {currentStep === 1 && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center">
              <User className="w-16 h-16 text-primary mx-auto mb-6 animate-scale-in" />
              <h2 className="text-3xl font-bold text-foreground mb-4 font-display">
                Welcome to Wander!
              </h2>
              <p className="text-lg text-muted-foreground">
                Let's get to know you better so we can find your perfect travel companions.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-base font-medium mb-2 block">
                  What's your name?
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your first name"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  className="text-lg h-12"
                />
              </div>

              <div>
                <Label htmlFor="age" className="text-base font-medium mb-2 block">
                  How old are you?
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Your age"
                  value={data.age}
                  onChange={(e) => updateData({ age: e.target.value })}
                  className="text-lg h-12"
                  min="18"
                  max="100"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">
                  Add a photo (optional)
                </Label>
                <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-6 animate-scale-in" />
              <h2 className="text-3xl font-bold text-foreground mb-4 font-display">
                What's your travel style?
              </h2>
              <p className="text-lg text-muted-foreground">
                Select all that describe how you like to travel. This helps us match you with like-minded adventurers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {travelStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => toggleTravelStyle(style.id)}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-medium hover-lift",
                    data.travelStyle.includes(style.id)
                      ? "border-primary bg-primary/10 shadow-medium"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{style.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {style.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {style.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-primary mx-auto mb-6 animate-scale-in" />
              <h2 className="text-3xl font-bold text-foreground mb-4 font-display">
                Where to next?
              </h2>
              <p className="text-lg text-muted-foreground">
                Tell us about your upcoming travel plans so we can connect you with travelers going to the same places.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="destination" className="text-base font-medium mb-2 block">
                  Your next destination
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g., Tokyo, Japan"
                  className="text-lg h-12"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value && !data.destinations.includes(value)) {
                        updateData({
                          destinations: [...data.destinations, value]
                        });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Press Enter to add destination
                </p>
              </div>

              {data.destinations.length > 0 && (
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Your destinations
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {data.destinations.map((dest, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20 flex items-center gap-2"
                      >
                        {dest}
                        <button
                          onClick={() => updateData({
                            destinations: data.destinations.filter((_, i) => i !== index)
                          })}
                          className="text-primary/70 hover:text-primary"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-xl p-6">
                <Calendar className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  Travel Dates (Coming Soon)
                </h3>
                <p className="text-muted-foreground">
                  Soon you'll be able to add specific travel dates to find companions with matching itineraries.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center">
              <User className="w-16 h-16 text-primary mx-auto mb-6 animate-scale-in" />
              <h2 className="text-3xl font-bold text-foreground mb-4 font-display">
                Tell us about yourself
              </h2>
              <p className="text-lg text-muted-foreground">
                Share a bit about yourself and what makes you excited about travel. This helps others connect with you!
              </p>
            </div>

            <div>
              <Label htmlFor="bio" className="text-base font-medium mb-2 block">
                Your travel story
              </Label>
              <textarea
                id="bio"
                placeholder="Share what excites you about travel, your favorite experiences, or what you're looking for in travel companions..."
                value={data.bio}
                onChange={(e) => updateData({ bio: e.target.value })}
                className="w-full h-32 p-4 border border-input rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent text-base"
                maxLength={300}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {data.bio.length}/300 characters
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-12">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          variant="hero"
          onClick={nextStep}
          disabled={!canProceed()}
          className="flex items-center gap-2 px-8"
        >
          {currentStep === 5 ? 'Complete Profile' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};