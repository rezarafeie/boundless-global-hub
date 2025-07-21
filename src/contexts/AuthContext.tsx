
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { messengerService, MessengerUser } from '@/lib/messengerService';
import { unifiedAuthService, UnifiedUser } from '@/lib/unifiedAuthService';
import { supabase } from '@/integrations/supabase/client';
import { SessionStorage } from '@/lib/sessionStorage';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UnifiedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UnifiedUser | MessengerUser, token: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: UnifiedUser | MessengerUser) => void;
  checkEnrollment: (courseId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth hook called outside of AuthProvider! Current context:', context);
    console.error('Make sure the component is wrapped in AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to normalize phone numbers for comparison
const normalizePhone = (phone: string): string[] => {
  if (!phone) return [];
  
  const cleanPhone = phone.replace(/\D/g, '');
  const variations = [];
  
  variations.push(cleanPhone);
  
  if (cleanPhone.startsWith('98')) {
    const withoutCountryCode = cleanPhone.substring(2);
    variations.push(withoutCountryCode);
    if (!withoutCountryCode.startsWith('0')) {
      variations.push('0' + withoutCountryCode);
    }
  }
  
  if (cleanPhone.startsWith('9') && !cleanPhone.startsWith('98')) {
    variations.push('0' + cleanPhone);
    variations.push('98' + cleanPhone);
  }
  
  if (cleanPhone.startsWith('09')) {
    const withoutZero = cleanPhone.substring(1);
    variations.push(withoutZero);
    variations.push('98' + withoutZero);
  }
  
  return [...new Set(variations)];
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔄 AuthProvider rendering...');
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing auth...');
      setIsLoading(true);
      
      try {
        // Set up Supabase auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔐 Supabase auth state changed:', event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ Google/Supabase auth success');
              await handleSupabaseAuth(session, session.user);
            } else if (event === 'SIGNED_OUT') {
              console.log('🚪 Supabase auth signed out');
              // Don't clear everything here as it might be a messenger logout
            }
          }
        );

        // Check for existing Supabase session first
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('🔄 Found existing Supabase session');
          await handleSupabaseAuth(session, session.user);
          setIsLoading(false);
          return () => subscription.unsubscribe();
        }

        // Check for messenger session using SessionStorage utility
        const messengerSession = SessionStorage.getSession();
        if (messengerSession) {
          console.log('🔄 Found existing messenger session');
          
          try {
            // Validate the session with the server
            const validatedUser = await messengerService.validateSession(messengerSession.sessionToken);
            
            if (validatedUser) {
              console.log('✅ Messenger session validated successfully');
              const unifiedUser = convertToUnifiedUser(validatedUser);
              setUser(unifiedUser);
              setToken(messengerSession.sessionToken);
              
              // Refresh session expiration
              SessionStorage.refreshSession();
              return () => subscription.unsubscribe();
            } else {
              console.log('❌ Messenger session validation failed');
              SessionStorage.clearSession();
            }
          } catch (error) {
            console.log('❌ Messenger session validation error:', error);
            SessionStorage.clearSession();
          }
        }
        
        console.log('🚫 No valid session found');
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('💥 Critical error during auth initialization:', error);
        // Clean up everything on critical error
        SessionStorage.clearSession();
      } finally {
        setIsLoading(false);
        console.log('🏁 Auth initialization complete');
      }
    };

    const cleanup = initializeAuth();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, []);

  // Handle Supabase (Google) authentication
  const handleSupabaseAuth = async (session: Session, user: User) => {
    try {
      console.log('🔄 Processing Supabase auth for:', user.email);
      
      // Create unified user from Supabase user
      const unifiedUser: UnifiedUser = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'کاربر',
        firstName: user.user_metadata?.given_name || '',
        lastName: user.user_metadata?.family_name || '',
        email: user.email || '',
        phone: user.phone || '',
        countryCode: '+98',
        username: user.email?.split('@')[0],
        isAcademyUser: true,
        isMessengerUser: false,
        academyData: {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.given_name || '',
          last_name: user.user_metadata?.family_name || ''
        }
      };

      // Store session
      const sessionToken = session.access_token;
      setUser(unifiedUser);
      setToken(sessionToken);
      
      console.log('✅ Supabase auth processed successfully');
    } catch (error) {
      console.error('❌ Error processing Supabase auth:', error);
    }
  };

  const convertToUnifiedUser = (messengerUser: MessengerUser): UnifiedUser => {
    return {
      id: messengerUser.id.toString(),
      name: messengerUser.name || `${messengerUser.first_name || ''} ${messengerUser.last_name || ''}`.trim(),
      firstName: messengerUser.first_name || '',
      lastName: messengerUser.last_name || '',
      email: messengerUser.email || '',
      phone: messengerUser.phone || '',
      countryCode: messengerUser.country_code || '+98',
      username: messengerUser.username,
      isAcademyUser: false,
      isMessengerUser: true,
      messengerData: messengerUser,
      academyData: undefined
    };
  };

  const login = (userData: UnifiedUser | MessengerUser, tokenData: string) => {
    console.log('🔐 Login called with user:', userData.name || 'Unknown');
    
    const unifiedUser = 'isMessengerUser' in userData ? userData : convertToUnifiedUser(userData);
    
    // Update state
    setUser(unifiedUser);
    setToken(tokenData);
    
    // For messenger users, save to SessionStorage
    if (unifiedUser.isMessengerUser && unifiedUser.messengerData) {
      SessionStorage.saveSession(tokenData, unifiedUser.messengerData);
    }
    
    console.log('✅ Login successful for:', unifiedUser.name);
  };

  const logout = async () => {
    console.log('🚪 Logout initiated');
    try {
      if (token) {
        // Try to logout from server
        try {
          await messengerService.logout(token);
          console.log('📡 Server logout completed');
        } catch (error) {
          console.error('❌ Server logout error:', error);
        }
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear all auth data
      setUser(null);
      setToken(null);
      
      // Clear session storage
      SessionStorage.clearSession();
      
      // Clear all localStorage items
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      console.log('🧹 All auth data and sessions cleared');
    }
  };

  const updateUser = (updatedUser: UnifiedUser | MessengerUser) => {
    const unifiedUser = 'isMessengerUser' in updatedUser ? updatedUser : convertToUnifiedUser(updatedUser);
    setUser(unifiedUser);
    
    // Update session storage if it's a messenger user
    if (token && unifiedUser.isMessengerUser && unifiedUser.messengerData) {
      SessionStorage.saveSession(token, unifiedUser.messengerData);
    }
  };

  const checkEnrollment = async (courseId: string): Promise<boolean> => {
    if (!user) return false;
    
    console.log('Checking enrollment for user:', user.id, 'course:', courseId);
    
    try {
      const phoneVariations = normalizePhone(user.phone);
      const emailVariations = user.email ? [user.email.toLowerCase()] : [];
      
      console.log('Phone variations to check:', phoneVariations);
      console.log('Email variations to check:', emailVariations);
      
      let query = supabase
        .from('enrollments')
        .select('id, payment_status, chat_user_id, phone, email')
        .eq('course_id', courseId)
        .eq('payment_status', 'completed');
      
      const { data: directMatch, error: directError } = await query
        .eq('chat_user_id', parseInt(user.id));
      
      if (directError) {
        console.error('Error checking direct enrollment:', directError);
      }
      
      if (directMatch && directMatch.length > 0) {
        console.log('Found direct enrollment match:', directMatch);
        return true;
      }
      
      const { data: allEnrollments, error: allError } = await supabase
        .from('enrollments')
        .select('id, payment_status, chat_user_id, phone, email')
        .eq('course_id', courseId)
        .eq('payment_status', 'completed');
      
      if (allError) {
        console.error('Error fetching all enrollments:', allError);
        return false;
      }
      
      console.log('All completed enrollments for course:', allEnrollments);
      
      const matchingEnrollment = allEnrollments?.find(enrollment => {
        if (enrollment.phone) {
          const enrollmentPhoneVariations = normalizePhone(enrollment.phone);
          const phoneMatch = phoneVariations.some(userPhone => 
            enrollmentPhoneVariations.some(enrollmentPhone => 
              userPhone === enrollmentPhone
            )
          );
          if (phoneMatch) {
            console.log('Found phone match:', enrollment.phone, 'matches user phone:', user.phone);
            return true;
          }
        }
        
        if (enrollment.email && emailVariations.length > 0) {
          const emailMatch = emailVariations.includes(enrollment.email.toLowerCase());
          if (emailMatch) {
            console.log('Found email match:', enrollment.email, 'matches user email:', user.email);
            return true;
          }
        }
        
        return false;
      });
      
      if (matchingEnrollment) {
        console.log('Found matching enrollment, updating chat_user_id:', matchingEnrollment);
        
        try {
          const { error: updateError } = await supabase
            .from('enrollments')
            .update({ chat_user_id: parseInt(user.id) })
            .eq('id', matchingEnrollment.id);
          
          if (updateError) {
            console.error('Error updating enrollment chat_user_id:', updateError);
          } else {
            console.log('Successfully linked enrollment to current user');
          }
        } catch (updateError) {
          console.error('Exception updating enrollment:', updateError);
        }
        
        return true;
      }
      
      console.log('No matching enrollment found for user');
      return false;
      
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
