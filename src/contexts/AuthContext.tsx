
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { rafieiAuth, RafieiUser } from '@/lib/rafieiAuth';

interface AuthContextType {
  user: RafieiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: RafieiUser, token: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: RafieiUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<RafieiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const initializeAuth = async () => {
      try {
        const stored = rafieiAuth.getStoredSession();
        if (stored) {
          // Validate the session with the server
          const validation = await rafieiAuth.validateSession(stored.token);
          if (validation && validation.valid) {
            setUser(validation.user);
            setToken(stored.token);
          } else {
            // Clear invalid session
            rafieiAuth.clearSession();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        rafieiAuth.clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (user: RafieiUser, token: string) => {
    setUser(user);
    setToken(token);
    rafieiAuth.setSession(token, user);
  };

  const logout = async () => {
    try {
      await rafieiAuth.logout(token);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (updatedUser: RafieiUser) => {
    setUser(updatedUser);
    if (token) {
      rafieiAuth.setSession(token, updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
