import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'lucide-react';
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
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-normal text-foreground mb-2">آکادمی رفیعی</h1>
          <p className="text-muted-foreground">ورود به حساب کاربری</p>
        </div>
        
        <UnifiedMessengerAuth onAuthenticated={handleAuthenticated} />
      </div>
    </div>
  );
};

export default Auth;