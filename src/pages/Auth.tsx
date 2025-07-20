
import React from 'react';
import { Navigate } from 'react-router-dom';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import { useAuth } from '@/contexts/AuthContext';

const Auth: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth();

  // If user is already authenticated, redirect to home
  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
  }

  const handleAuthenticated = (sessionToken: string, userName: string, userData: any) => {
    console.log('Auth page: User authenticated', { sessionToken, userName, userData });
    
    // Use the login function from AuthContext to sync the session
    login(userData, sessionToken);
    
    // Redirect will happen automatically due to the Navigate above
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
