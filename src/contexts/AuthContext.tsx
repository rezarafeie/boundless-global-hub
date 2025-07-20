
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { messengerService, MessengerUser } from '@/lib/messengerService';
import { unifiedAuthService, UnifiedUser } from '@/lib/unifiedAuthService';
import { supabase } from '@/integrations/supabase/client';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookieUtils';
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
  console.log('AuthProvider rendering...');
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

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('🔄 Found existing Supabase session');
          await handleSupabaseAuth(session, session.user);
          setIsLoading(false);
          return () => subscription.unsubscribe();
        }

        
        // Check all possible authentication sources
        const cookieToken = getCookie('session_token');
        const cookieUser = getCookie('current_user');
        const localStorageToken = localStorage.getItem('messenger_session_token');
        
        console.log('📁 Found auth data:', {
          cookieToken: cookieToken ? 'Yes' : 'No',
          cookieUser: cookieUser ? 'Yes' : 'No',
          localStorageToken: localStorageToken ? 'Yes' : 'No'
        });

        // Try to restore from cookies first (most reliable)
        if (cookieToken && cookieUser) {
          console.log('🍪 Attempting to restore from cookies...');
          try {
            const parsedUser = JSON.parse(decodeURIComponent(cookieUser));
            console.log('👤 Parsed user from cookie:', parsedUser.name);
            
            // Validate the session
            const validatedUser = await unifiedAuthService.validateSession(cookieToken);
            
            if (validatedUser) {
              console.log('✅ Cookie session validated successfully');
              setUser(validatedUser);
              setToken(cookieToken);
              
              // Ensure localStorage is also synced
              if (validatedUser.isMessengerUser) {
                localStorage.setItem('messenger_session_token', cookieToken);
              }
              return () => subscription.unsubscribe();
            } else {
              console.log('❌ Cookie session validation failed');
              // Clear invalid cookies
              deleteCookie('session_token');
              deleteCookie('current_user');
            }
          } catch (parseError) {
            console.error('❌ Error parsing stored user from cookies:', parseError);
            deleteCookie('session_token');
            deleteCookie('current_user');
          }
        }

        // If no valid cookie session, try localStorage token
        if (localStorageToken) {
          console.log('💾 Attempting to restore from localStorage...');
          try {
            const messengerUser = await messengerService.validateSession(localStorageToken);
            
            if (messengerUser) {
              console.log('✅ LocalStorage session validated successfully');
              const unifiedUser = convertToUnifiedUser(messengerUser);
              setUser(unifiedUser);
              setToken(localStorageToken);
              
              // Sync to cookies for cross-system compatibility
              setCookie('session_token', localStorageToken, 30);
              setCookie('current_user', encodeURIComponent(JSON.stringify(unifiedUser)), 30);
              return () => subscription.unsubscribe();
            } else {
              console.log('❌ LocalStorage session validation failed');
              localStorage.removeItem('messenger_session_token');
            }
          } catch (error) {
            console.log('❌ LocalStorage session validation error:', error);
            localStorage.removeItem('messenger_session_token');
          }
        }
        
        console.log('🚫 No valid session found anywhere');
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('💥 Critical error during auth initialization:', error);
        // Clean up everything on critical error
        deleteCookie('session_token');
        deleteCookie('current_user');
        localStorage.removeItem('messenger_session_token');
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
      
      // Store in both systems for compatibility
      setCookie('session_token', sessionToken, 30);
      setCookie('current_user', encodeURIComponent(JSON.stringify(unifiedUser)), 30);
      
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
    
    // Store in both systems for maximum compatibility
    console.log('💾 Storing session data...');
    setCookie('session_token', tokenData, 30);
    setCookie('current_user', encodeURIComponent(JSON.stringify(unifiedUser)), 30);
    
    // Always store in localStorage for messenger compatibility
    localStorage.setItem('messenger_session_token', tokenData);
    
    console.log('✅ Login successful for:', unifiedUser.name);
  };

  const logout = async () => {
    console.log('🚪 Logout initiated');
    try {
      if (token) {
        await unifiedAuthService.logout(token);
        console.log('📡 Server logout completed');
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Server logout error:', error);
    } finally {
      // Clear all auth data
      setUser(null);
      setToken(null);
      
      // Delete all cookies
      deleteCookie('session_token');
      deleteCookie('current_user');
      deleteCookie('rafiei-dismissed-floating');
      deleteCookie('rafiei-dismissed-popup');
      
      // Clear all localStorage items
      localStorage.removeItem('messenger_session_token');
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      console.log('🧹 All auth data, cookies, and sessions cleared');
    }
  };

  const updateUser = (updatedUser: UnifiedUser | MessengerUser) => {
    const unifiedUser = 'isMessengerUser' in updatedUser ? updatedUser : convertToUnifiedUser(updatedUser);
    setUser(unifiedUser);
    if (token) {
      setCookie('current_user', encodeURIComponent(JSON.stringify(unifiedUser)), 30);
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
