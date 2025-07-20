
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { messengerService, MessengerUser } from '@/lib/messengerService';
import { supabase } from '@/integrations/supabase/client';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookieUtils';

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

// Helper function to normalize phone numbers for comparison
const normalizePhone = (phone: string): string[] => {
  if (!phone) return [];
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  const variations = [];
  
  // Add the original clean phone
  variations.push(cleanPhone);
  
  // If it starts with 98, also add without 98 and with 0
  if (cleanPhone.startsWith('98')) {
    const withoutCountryCode = cleanPhone.substring(2);
    variations.push(withoutCountryCode);
    if (!withoutCountryCode.startsWith('0')) {
      variations.push('0' + withoutCountryCode);
    }
  }
  
  // If it starts with 9, also add with 0 prefix and with +98
  if (cleanPhone.startsWith('9') && !cleanPhone.startsWith('98')) {
    variations.push('0' + cleanPhone);
    variations.push('98' + cleanPhone);
  }
  
  // If it starts with 09, also add without 0 and with +98
  if (cleanPhone.startsWith('09')) {
    const withoutZero = cleanPhone.substring(1);
    variations.push(withoutZero);
    variations.push('98' + withoutZero);
  }
  
  return [...new Set(variations)]; // Remove duplicates
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MessengerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const initializeAuth = async () => {
      try {
        const storedToken = getCookie('session_token');
        const storedUser = getCookie('current_user');
        
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(decodeURIComponent(storedUser));
            // Validate the session with the server
            const isValid = await messengerService.validateSession(storedToken);
            if (isValid) {
              setUser(parsedUser);
              setToken(storedToken);
            } else {
              // Clear invalid session
              deleteCookie('session_token');
              deleteCookie('current_user');
            }
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            deleteCookie('session_token');
            deleteCookie('current_user');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        deleteCookie('session_token');
        deleteCookie('current_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (user: MessengerUser, token: string) => {
    setUser(user);
    setToken(token);
    setCookie('session_token', token, 30); // Expires in 30 days
    setCookie('current_user', encodeURIComponent(JSON.stringify(user)), 30);
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
      deleteCookie('session_token');
      deleteCookie('current_user');
    }
  };

  const updateUser = (updatedUser: MessengerUser) => {
    setUser(updatedUser);
    if (token) {
      setCookie('current_user', encodeURIComponent(JSON.stringify(updatedUser)), 30);
    }
  };

  const checkEnrollment = async (courseId: string): Promise<boolean> => {
    if (!user) return false;
    
    console.log('Checking enrollment for user:', user.id, 'course:', courseId);
    
    try {
      // Get all phone number variations for comparison
      const phoneVariations = normalizePhone(user.phone);
      const emailVariations = user.email ? [user.email.toLowerCase()] : [];
      
      console.log('Phone variations to check:', phoneVariations);
      console.log('Email variations to check:', emailVariations);
      
      // Build query conditions
      let query = supabase
        .from('enrollments')
        .select('id, payment_status, chat_user_id, phone, email')
        .eq('course_id', courseId)
        .eq('payment_status', 'completed');
      
      // First, try to find by chat_user_id (most direct match)
      const { data: directMatch, error: directError } = await query
        .eq('chat_user_id', user.id);
      
      if (directError) {
        console.error('Error checking direct enrollment:', directError);
      }
      
      if (directMatch && directMatch.length > 0) {
        console.log('Found direct enrollment match:', directMatch);
        return true;
      }
      
      // If no direct match, check by phone and email
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
      
      // Check if any enrollment matches our phone/email variations
      const matchingEnrollment = allEnrollments?.find(enrollment => {
        // Check phone variations
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
        
        // Check email variations
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
        
        // Update the enrollment to link it with current user
        try {
          const { error: updateError } = await supabase
            .from('enrollments')
            .update({ chat_user_id: user.id })
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
