import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OnboardingFlow } from './OnboardingFlow';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import type { TravelStyle } from '@/types';

interface OnboardingData {
  name: string;
  age: string;
  photo?: string;
  travelStyle: string[];
  destinations: string[];
  bio: string;
}

export const ProfileSetupFlow: React.FC = () => {
  const navigate = useNavigate();
  const { createUserProfile, loading, error } = useUserProfile();
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      setSetupLoading(true);

      // Convert onboarding data to User profile format
      const userProfileData = {
        name: data.name,
        age: parseInt(data.age),
        bio: data.bio,
        avatar: data.photo || '',
        travelStyle: data.travelStyle as TravelStyle[],
        nextDestination: data.destinations[0] || 'Not specified',
        travelDates: 'TBD', // This will be updated when user adds specific dates
        location: 'Location not set',
        interests: data.travelStyle, // Using travel styles as initial interests
        photos: data.photo ? [data.photo] : [],
      };

      console.log('Creating user profile with data:', userProfileData);
      await createUserProfile(userProfileData);
      
      console.log('Profile created successfully!');
      setSetupComplete(true);
      toast.success('Profile created successfully! Welcome to Wander!');
      
      // Navigate to main app immediately - the ProtectedRoute will handle the rest
      navigate('/discover');
      
    } catch (err) {
      console.error('Error setting up profile:', err);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sunrise-start to-sunrise-end flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Welcome to Wander!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your profile has been created successfully. You'll be redirected to start discovering travel companions.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Redirecting...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunrise-start to-sunrise-end">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <UserPlus className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4 font-display">
            Create Your Travel Profile
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Let's set up your profile so you can start connecting with fellow travelers and discover amazing companions for your next adventure.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-0">
            {error && (
              <div className="p-6 bg-destructive/10 border-b border-destructive/20">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
            
            <OnboardingFlow
              onComplete={handleOnboardingComplete}
              className="p-6"
            />
            
            {(loading || setupLoading) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-muted-foreground">
                    {setupLoading ? 'Creating your profile...' : 'Loading...'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-white/75 text-sm">
            Already have an account? Your data will be safely migrated to your new profile.
          </p>
        </div>
      </div>
    </div>
  );
};