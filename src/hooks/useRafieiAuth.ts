
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RafieiUser } from '@/lib/rafieiAuth';

interface UseRafieiAuthOptions {
  onSuccess?: (user: RafieiUser, token: string) => void;
  enrollmentMode?: boolean;
  redirectAfterAuth?: string;
}

export const useRafieiAuth = (options: UseRafieiAuthOptions = {}) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isAuthenticated, user, login } = useAuth();

  const openAuth = useCallback(() => {
    if (isAuthenticated) {
      options.onSuccess?.(user!, '');
      return;
    }
    setIsAuthOpen(true);
  }, [isAuthenticated, user, options]);

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
  }, []);

  const handleAuthSuccess = useCallback((user: RafieiUser, token: string) => {
    login(user, token);
    setIsAuthOpen(false);
    options.onSuccess?.(user, token);
  }, [login, options]);

  return {
    isAuthOpen,
    openAuth,
    closeAuth,
    handleAuthSuccess,
    isAuthenticated,
    user,
    ...options
  };
};
