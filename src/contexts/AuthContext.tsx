import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Cookies from 'js-cookie';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, phone: string) => Promise<void>;
  signUp: (email: string, phone: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string | null, phone: string | null, token: string) => Promise<boolean>;
  activateCourse: (courseId: string, courseTitle: string, isPaid: boolean) => Promise<void>;
  activateTest: (testId: string, testTitle: string) => Promise<void>;
  activateAssistant: () => Promise<void>;
  getUserProfile: () => Promise<any>;
  updateUserProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { translations, language } = useLanguage();

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session) {
        // Set cookie for persistent auth
        Cookies.set('supabase-auth', 'authenticated', { expires: 7, secure: true });
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        Cookies.set('supabase-auth', 'authenticated', { expires: 7, secure: true });
      } else {
        Cookies.remove('supabase-auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send OTP for authentication
  const signIn = async (email: string, phone: string) => {
    setLoading(true);
    try {
      const contact = email || phone;
      const { error } = await supabase.auth.signInWithOtp({
        email: email || undefined,
        phone: phone || undefined,
      });

      if (error) throw error;

      toast({
        title: translations.verificationCodeSent || 'Verification code sent',
        description: email 
          ? `${translations.codeEmailSent || 'Code sent to'} ${email}` 
          : `${translations.codePhoneSent || 'Code sent to'} ${phone}`,
      });
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP token
  const verifyOTP = async (email: string | null, phone: string | null, token: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email || undefined,
        phone: phone || undefined,
        token,
        type: 'sms',
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
      
      toast({
        title: translations.success || 'Success',
        description: translations.loginSuccess || 'Login successful',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign up new user
  const signUp = async (email: string, phone: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      // First register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email || undefined,
        phone: phone || undefined,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      // Create user profile in profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              first_name: firstName, 
              last_name: lastName, 
              email, 
              phone 
            }
          ]);

        if (profileError) throw profileError;
      }

      toast({
        title: translations.success || 'Success',
        description: translations.accountCreated || 'Account created successfully',
      });
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign out user
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear auth cookie
      Cookies.remove('supabase-auth');
      
      // Redirect to home page
      navigate(language === 'en' ? '/en' : '/');
      
      toast({
        title: translations.success || 'Success',
        description: translations.logoutSuccess || 'Logged out successfully',
      });
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Activate course for user
  const activateCourse = async (courseId: string, courseTitle: string, isPaid: boolean) => {
    if (!user) {
      toast({
        title: translations.error || 'Error',
        description: translations.loginRequired || 'Login required',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if user already has access to this course
      const { data: existingAccess, error: checkError } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAccess) {
        // User already has access, just redirect
        navigate(`/start/${isPaid ? 'paid' : 'free'}-course?title=${encodeURIComponent(courseTitle)}`);
        return;
      }

      // Insert new access record
      const { error } = await supabase
        .from('user_courses')
        .insert([
          { 
            user_id: user.id, 
            course_id: courseId, 
            course_title: courseTitle,
            is_paid: isPaid,
            status: 'ongoing',
            progress: 0
          }
        ]);

      if (error) throw error;

      toast({
        title: translations.success || 'Success',
        description: translations.courseAccessGranted || 'Course access granted',
      });

      // Redirect to course start page
      navigate(`/start/${isPaid ? 'paid' : 'free'}-course?title=${encodeURIComponent(courseTitle)}`);
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Activate test for user
  const activateTest = async (testId: string, testTitle: string) => {
    if (!user) {
      toast({
        title: translations.error || 'Error',
        description: translations.loginRequired || 'Login required',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if user already has access to this test
      const { data: existingAccess, error: checkError } = await supabase
        .from('user_tests')
        .select('*')
        .eq('user_id', user.id)
        .eq('test_id', testId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAccess) {
        // User already has access, just redirect
        navigate(`/assessment/${testId}`);
        return;
      }

      // Insert new access record
      const { error } = await supabase
        .from('user_tests')
        .insert([
          { 
            user_id: user.id, 
            test_id: testId, 
            test_title: testTitle,
            status: 'ongoing'
          }
        ]);

      if (error) throw error;

      toast({
        title: translations.success || 'Success',
        description: translations.testAccessGranted || 'Test access granted',
      });

      // Redirect to test page
      navigate(`/assessment/${testId}`);
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Activate AI assistant for user
  const activateAssistant = async () => {
    if (!user) {
      toast({
        title: translations.error || 'Error',
        description: translations.loginRequired || 'Login required',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update user profile to activate assistant
      const { error } = await supabase
        .from('profiles')
        .update({ assistant_access: true })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: translations.success || 'Success',
        description: translations.assistantActivated || 'Smart assistant activated',
      });

      // Open AI assistant in new tab
      window.open('https://ai.rafiei.co/', '_blank');
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Get user profile data
  const getUserProfile = async () => {
    if (!user) return null;

    try {
      // Get profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update user profile data
  const updateUserProfile = async (profileData: any) => {
    if (!user) {
      toast({
        title: translations.error || 'Error',
        description: translations.loginRequired || 'Login required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: translations.success || 'Success',
        description: translations.profileUpdated || 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: translations.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      verifyOTP,
      activateCourse,
      activateTest,
      activateAssistant,
      getUserProfile,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
