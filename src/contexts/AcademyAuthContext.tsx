
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { academyAuth, AcademyUser } from '@/lib/academyAuth';
import { supabase } from '@/integrations/supabase/client';

interface AcademyAuthContextType {
  user: AcademyUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AcademyAuthContext = createContext<AcademyAuthContextType | undefined>(undefined);

export const useAcademyAuth = () => {
  const context = useContext(AcademyAuthContext);
  if (context === undefined) {
    throw new Error('useAcademyAuth must be used within an AcademyAuthProvider');
  }
  return context;
};

interface AcademyAuthProviderProps {
  children: ReactNode;
}

export const AcademyAuthProvider: React.FC<AcademyAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AcademyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const academyUser = await academyAuth.getCurrentUser();
          setUser(academyUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const academyUser = await academyAuth.getCurrentUser();
        setUser(academyUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (identifier: string, password: string) => {
    const result = await academyAuth.login(identifier, password);
    if (result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const signup = async (userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const result = await academyAuth.signup(userData);
    if (result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await academyAuth.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAdmin
  };

  return (
    <AcademyAuthContext.Provider value={value}>
      {children}
    </AcademyAuthContext.Provider>
  );
};
