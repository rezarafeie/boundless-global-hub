
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RafieiAuth from '@/components/Auth/RafieiAuth';

const Auth: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // If user is already authenticated, redirect to user hub
  if (isAuthenticated) {
    return <Navigate to="/me" replace />;
  }

  return (
    <RafieiAuth
      onSuccess={() => {
        // Navigation will be handled by the auth context
        window.location.href = '/me';
      }}
    />
  );
};

export default Auth;
