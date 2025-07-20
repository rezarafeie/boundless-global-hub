
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { messengerService, MessengerUser } from '@/lib/messengerService';
import { unifiedAuthService, UnifiedUser } from '@/lib/unifiedAuthService';
import { supabase } from '@/integrations/supabase/client';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookieUtils';

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
  console.log('useAuth called, context:', context ? 'exists' : 'undefined');
  if (context === undefined) {
    console.error('useAuth hook called outside of AuthProvider!');
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
      try {
        console.log('Initializing auth...');
        
        // First check for unified auth session
        const storedToken = getCookie('session_token');
        const storedUser = getCookie('current_user');
        
        if (storedToken && storedUser) {
          console.log('Found unified auth session');
          try {
            const parsedUser = JSON.parse(decodeURIComponent(storedUser));
            const validatedUser = await unifiedAuthService.validateSession(storedToken);
            
            if (validatedUser) {
              setUser(validatedUser);
              setToken(storedToken);
              console.log('Unified auth session validated');
              return;
            } else {
              console.log('Unified auth session invalid, clearing');
              deleteCookie('session_token');
              deleteCookie('current_user');
            }
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            deleteCookie('session_token');
            deleteCookie('current_user');
          }
        }
        
        // Check for messenger session as fallback
        const messengerToken = localStorage.getItem('messenger_session_token');
        if (messengerToken) {
          console.log('Found messenger session, attempting to validate and sync');
          try {
            const messengerUser = await messengerService.validateSession(messengerToken);
            if (messengerUser) {
              console.log('Messenger session valid, converting to unified user');
              const unifiedUser = convertToUnifiedUser(messengerUser);
              setUser(unifiedUser);
              setToken(messengerToken);
              
              // Sync to cookies for cross-system compatibility
              setCookie('session_token', messengerToken, 30);
              setCookie('current_user', encodeURIComponent(JSON.stringify(unifiedUser)), 30);
              return;
            }
          } catch (error) {
            console.log('Messenger session validation failed:', error);
            localStorage.removeItem('messenger_session_token');
          }
        }
        
        console.log('No valid session found');
      } catch (error) {
        console.error('Error initializing auth:', error);
        deleteCookie('session_token');
        deleteCookie('current_user');
        localStorage.removeItem('messenger_session_token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

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
    console.log('Login called with:', { userData, tokenData });
    
    const unifiedUser = 'isMessengerUser' in userData ? userData : convertToUnifiedUser(userData);
    setUser(unifiedUser);
    setToken(tokenData);
    
    // Store in both systems for compatibility
    setCookie('session_token', tokenData, 30);
    setCookie('current_user', encodeURIComponent(JSON.stringify(unifiedUser)), 30);
    
    // If it's a messenger user, also store in localStorage
    if (unifiedUser.isMessengerUser) {
      localStorage.setItem('messenger_session_token', tokenData);
    }
  };

  const logout = async () => {
    try {
      console.log('Logout called');
      if (token) {
        await unifiedAuthService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      deleteCookie('session_token');
      deleteCookie('current_user');
      localStorage.removeItem('messenger_session_token');
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
