
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: AuthError }>;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
  sendSMSVerification: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifySMSCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: any) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "خوش آمدید",
            description: "شما با موفقیت وارد شدید",
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "خروج موفق",
      description: "شما با موفقیت خارج شدید",
    });
  };

  const sendSMSVerification = async (phone: string) => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification code in database
      const { error: dbError } = await supabase
        .from('verification_codes')
        .insert({
          phone,
          code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });

      if (dbError) throw dbError;

      // Send SMS via edge function
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { phone, code }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      return { success: true };
    } catch (error) {
      console.error('SMS verification error:', error);
      return { success: false, error: 'خطا در ارسال کد تایید' };
    }
  };

  const verifySMSCode = async (phone: string, code: string) => {
    try {
      // Verify code from database
      const { data: verificationData, error } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !verificationData) {
        return { success: false, error: 'کد تایید نامعتبر یا منقضی شده' };
      }

      // Mark code as used
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', verificationData.id);

      // Check if user exists with this phone
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (profile) {
        // Existing user - sign them in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: phone // Using phone as password for SMS users
        });

        if (signInError) {
          return { success: false, error: 'خطا در ورود' };
        }
      } else {
        // New user - create account
        const tempEmail = `${phone}@temp.rafiei.co`;
        const { error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password: phone,
          options: {
            data: {
              phone,
              full_name: phone
            }
          }
        });

        if (signUpError) {
          return { success: false, error: 'خطا در ایجاد حساب' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('SMS verification error:', error);
      return { success: false, error: 'خطا در تایید کد' };
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) return { error: 'کاربر وارد نشده' };

    const { error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('user_id', user.id);

    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    sendSMSVerification,
    verifySMSCode,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
