import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
}

const ProtectedRoute = ({ children, requireProfile = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuthContext();
  const { profileComplete, isNewUser, loading: profileLoading } = useUserProfile();
  const location = useLocation();

  // Debug logging
  React.useEffect(() => {
    if (!loading && !profileLoading) {
      console.log('🔒 ProtectedRoute Debug:', {
        user: !!user,
        userId: user?.uid,
        profileComplete,
        isNewUser,
        currentPath: location.pathname,
        requireProfile,
        sessionFlag: sessionStorage.getItem('profileJustCreated')
      });
    }
  }, [user, profileComplete, isNewUser, loading, profileLoading, location.pathname, requireProfile]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If we're on the profile setup route and don't require a complete profile, show the route
  if (!requireProfile) {
    return <>{children}</>;
  }

  // If user needs to complete profile setup
  if (isNewUser || !profileComplete) {
    // Don't redirect if we're already on the setup page
    if (location.pathname !== '/setup-profile') {
      // Add a small delay to allow profile state to update after creation
      // This prevents redirect loop when coming from profile setup
      const justCompletedSetup = sessionStorage.getItem('profileJustCreated');
      const profileCreatedAt = localStorage.getItem('profileCreatedAt');
      
      // If profile was created in the last 5 minutes, allow access
      if (justCompletedSetup) {
        console.log('🔓 Bypassing check - profile just created (session)');
        sessionStorage.removeItem('profileJustCreated');
        return <>{children}</>;
      }
      
      if (profileCreatedAt) {
        const timeSinceCreation = Date.now() - parseInt(profileCreatedAt);
        if (timeSinceCreation < 5 * 60 * 1000) { // 5 minutes
          console.log('🔓 Bypassing check - profile created recently');
          return <>{children}</>;
        }
      }
      
      console.log('🔒 Redirecting to profile setup - profile incomplete');
      return <Navigate to="/setup-profile" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
