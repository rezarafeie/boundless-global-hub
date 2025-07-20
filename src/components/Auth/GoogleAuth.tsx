import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';

interface GoogleAuthProps {
  onAuthenticated?: (sessionToken: string, userName: string, userData: any) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMessengerAuth, setShowMessengerAuth] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('🔐 Starting Google authentication...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        toast({
          title: "خطا در ورود",
          description: "خطا در ورود با Google. لطفا دوباره تلاش کنید.",
          variant: "destructive"
        });
      } else {
        console.log('✅ Google auth initiated successfully');
        // The redirect will handle the rest
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        title: "خطا در ورود",
        description: "خطا در ورود با Google. لطفا دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessengerAuth = (sessionToken: string, userName: string, userData: any) => {
    console.log('📱 Messenger auth completed');
    if (onAuthenticated) {
      onAuthenticated(sessionToken, userName, userData);
    }
  };

  if (showMessengerAuth) {
    return (
      <Card className="w-full max-w-md border-0 shadow-none bg-background">
        <CardHeader className="pb-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowMessengerAuth(false)}
            className="self-start p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            ← بازگشت به صفحه ورود
          </Button>
        </CardHeader>
        <CardContent>
          <UnifiedMessengerAuth onAuthenticated={handleMessengerAuth} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none bg-background">
      <CardHeader className="text-center pb-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        <CardTitle className="text-2xl font-normal text-foreground">ورود به آکادمی رفیعی</CardTitle>
        <CardDescription className="text-muted-foreground mt-2">
          برای دسترسی به دوره‌ها و خدمات، وارد شوید
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Google Sign In Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-full shadow-sm transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              در حال ورود...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              ورود با Google
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">یا</span>
          </div>
        </div>

        {/* Messenger Auth Button */}
        <Button
          onClick={() => setShowMessengerAuth(true)}
          variant="outline"
          className="w-full h-12 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
        >
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          ورود با شماره تلفن
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          با ورود به سایت، شما با{' '}
          <a href="/terms" className="underline">شرایط استفاده</a>{' '}
          و{' '}
          <a href="/privacy" className="underline">حریم خصوصی</a>{' '}
          موافقت می‌کنید.
        </p>
      </CardContent>
    </Card>
  );
};

export default GoogleAuth;