import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';

const SSOLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [message, setMessage] = useState('در حال تایید توکن...');
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('توکن ورود یافت نشد');
      return;
    }

    validateAndRedirect();
  }, [token]);

  const validateAndRedirect = async () => {
    try {
      console.log('Validating WooCommerce SSO token:', token);

      // Validate the token
      const { data: tokenData, error: tokenError } = await supabase
        .from('sso_tokens')
        .select(`
          *,
          enrollments (
            courses (
              redirect_url,
              title
            )
          )
        `)
        .eq('token', token)
        .eq('type', 'woocommerce')
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        console.error('Token validation error:', tokenError);
        setStatus('error');
        setMessage('توکن نامعتبر یا منقضی شده است');
        return;
      }

      console.log('WooCommerce token validated successfully:', tokenData);

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

      // Get redirect URL from course
      const courseRedirectUrl = tokenData.enrollments?.courses?.redirect_url;
      
      if (courseRedirectUrl) {
        setRedirectUrl(courseRedirectUrl);
        setStatus('success');
        setMessage('ورود موفقیت‌آمیز! در حال انتقال به دوره...');

        // Redirect to course URL after a short delay
        setTimeout(() => {
          window.open(courseRedirectUrl, '_blank');
        }, 2000);

        toast({
          title: "ورود موفق",
          description: "به دوره دسترسی پیدا کردید",
        });
      } else {
        setStatus('error');
        setMessage('لینک دوره یافت نشد');
      }

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
      setMessage('در حال تایید توکن...');
      validateAndRedirect();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleAccessCourse = () => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
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
                  <h2 className="text-xl font-semibold mb-2">در حال تایید ورود</h2>
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
                  <p className="text-muted-foreground mb-6">{message}</p>
                  
                  {redirectUrl && (
                    <Button 
                      onClick={handleAccessCourse}
                      className="w-full mb-3"
                      variant="default"
                    >
                      ورود به دوره
                    </Button>
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

export default SSOLogin;