
import React from 'react';
import { Navigate } from 'react-router-dom';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import { useAuth } from '@/contexts/AuthContext';

const Auth: React.FC = () => {
  const { user } = useAuth();

  // If user is already authenticated, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleAuthenticated = (sessionToken: string, userName: string, user: any) => {
    // The AuthContext will handle the authentication state
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <UnifiedMessengerAuth onAuthenticated={handleAuthenticated} />
      </div>
    </div>
  );
};

export default Auth;
