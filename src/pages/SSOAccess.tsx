import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { setCookie } from '@/lib/cookieUtils';
import { messengerService } from '@/lib/messengerService';
import MainLayout from '@/components/Layout/MainLayout';

const SSOAccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [message, setMessage] = useState('در حال تایید توکن و ایجاد جلسه...');
  const [courseSlug, setCourseSlug] = useState<string>('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('توکن ورود یافت نشد');
      return;
    }

    validateAndAuthenticate();
  }, [token]);

  const validateAndAuthenticate = async () => {
    try {
      console.log('Validating SSO token and creating session:', token);

      // Validate the token
      const { data: tokenData, error: tokenError } = await supabase
        .from('sso_tokens')
        .select('*')
        .eq('token', token)
        .eq('type', 'academy')
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        console.error('Token validation error:', tokenError);
        setStatus('error');
        setMessage('توکن نامعتبر یا منقضی شده است');
        return;
      }

      console.log('Token validated successfully:', tokenData);

      // Find user in messenger system by email
      const { data: chatUsers, error: userError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('email', tokenData.user_email)
        .limit(1);

      if (userError || !chatUsers || chatUsers.length === 0) {
        console.error('User lookup error:', userError);
        setStatus('error');
        setMessage('کاربر یافت نشد');
        return;
      }

      const chatUser = chatUsers[0];
      console.log('Found user:', chatUser.name);

      // Create a session for the user using messenger service
      const sessionToken = await messengerService.createSession(chatUser.id);
      console.log('Created session token:', sessionToken.substring(0, 10) + '...');

      // Create unified user object
      const unifiedUser = {
        id: chatUser.id.toString(),
        name: chatUser.name,
        firstName: chatUser.first_name || '',
        lastName: chatUser.last_name || '',
        email: chatUser.email || tokenData.user_email,
        phone: chatUser.phone,
        countryCode: chatUser.country_code || '+98',
        username: chatUser.username,
        isAcademyUser: true,
        isMessengerUser: true,
        messengerData: chatUser
      };

      // Set session in cookies and localStorage
      setCookie('session_token', sessionToken, 30);
      setCookie('current_user', encodeURIComponent(JSON.stringify(unifiedUser)), 30);
      localStorage.setItem('messenger_session_token', sessionToken);

      // Update auth context  
      login(messengerService.mapUserData(chatUser), sessionToken);

      // Mark token as used
      const { error: updateError } = await supabase
        .from('sso_tokens')
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', tokenData.id);

      if (updateError) {
        console.error('Error marking token as used:', updateError);
        // Continue anyway, don't block the user
      }

      setCourseSlug(tokenData.course_slug);
      setStatus('success');
      setMessage('ورود موفقیت‌آمیز! در حال انتقال به دوره...');

      // Redirect to course access page after a short delay
      setTimeout(() => {
        navigate(`/access?course=${tokenData.course_slug}`);
      }, 2000);

      toast({
        title: "ورود موفق",
        description: "به دوره دسترسی پیدا کردید",
      });

    } catch (error) {
      console.error('SSO validation error:', error);
      setStatus('error');
      setMessage('خطا در تایید ورود');
      toast({
        title: "خطا در ورود",
        description: "لطفا مجددا تلاش کنید",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    if (token) {
      setStatus('validating');
      setMessage('در حال تایید توکن و ایجاد جلسه...');
      validateAndAuthenticate();
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              {status === 'validating' && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <h2 className="text-xl font-semibold mb-2">در حال ورود خودکار</h2>
                  <p className="text-muted-foreground">{message}</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-green-700 dark:text-green-400">
                    ورود موفقیت‌آمیز!
                  </h2>
                  <p className="text-muted-foreground mb-4">{message}</p>
                  {courseSlug && (
                    <p className="text-sm text-muted-foreground">
                      در حال انتقال به دوره: <span className="font-medium">{courseSlug}</span>
                    </p>
                  )}
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">
                    خطا در ورود
                  </h2>
                  <p className="text-muted-foreground mb-6">{message}</p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleRetry}
                      className="w-full"
                      variant="default"
                    >
                      تلاش مجدد
                    </Button>
                    <Button 
                      onClick={handleGoHome}
                      className="w-full"
                      variant="outline"
                    >
                      بازگشت به صفحه اصلی
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SSOAccess;