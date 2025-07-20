
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { messengerService, MessengerUser } from '@/lib/messengerService';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: MessengerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: MessengerUser, token: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: MessengerUser) => void;
  checkEnrollment: (courseId: string) => Promise<boolean>;
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
  const [user, setUser] = useState<MessengerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('session_token');
        const storedUser = localStorage.getItem('current_user');
        
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Validate the session with the server
            const isValid = await messengerService.validateSession(storedToken);
            if (isValid) {
              setUser(parsedUser);
              setToken(storedToken);
            } else {
              // Clear invalid session
              localStorage.removeItem('session_token');
              localStorage.removeItem('current_user');
            }
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            localStorage.removeItem('session_token');
            localStorage.removeItem('current_user');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('session_token');
        localStorage.removeItem('current_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (user: MessengerUser, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('session_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
  };

  const logout = async () => {
    try {
      if (token) {
        await messengerService.deactivateSession(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('session_token');
      localStorage.removeItem('current_user');
    }
  };

  const updateUser = (updatedUser: MessengerUser) => {
    setUser(updatedUser);
    if (token) {
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }
  };

  const checkEnrollment = async (courseId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('payment_status', 'completed')
        .or(`chat_user_id.eq.${user.id},phone.eq.${user.phone},email.eq.${user.email || ''}`)
        .maybeSingle();
      
      return !error && !!data;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
    checkEnrollment
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
