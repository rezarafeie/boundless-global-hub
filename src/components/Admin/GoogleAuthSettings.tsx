import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Settings } from 'lucide-react';

interface GoogleAuthSettingsData {
  id: number;
  is_enabled: boolean;
  updated_at: string;
  updated_by: number | null;
}

const GoogleAuthSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GoogleAuthSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('google_auth_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching Google auth settings:', error);
        toast({
          title: 'خطا',
          description: 'خطا در دریافت تنظیمات Google Login',
          variant: 'destructive'
        });
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در دریافت تنظیمات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateGoogleAuthStatus = async (enabled: boolean) => {
    if (!settings) return;

    setUpdating(true);
    
    try {
      // Get current user session
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        toast({
          title: 'خطا',
          description: 'شما وارد نشده‌اید',
          variant: 'destructive'
        });
        return;
      }

      // Get current user ID
      const { data: userResult } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (!userResult) {
        toast({
          title: 'خطا',
          description: 'جلسه کاری نامعتبر است',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await supabase
        .from('google_auth_settings')
        .update({
          is_enabled: enabled,
          updated_by: userResult.user_id
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) {
        console.error('Error updating Google auth settings:', error);
        toast({
          title: 'خطا',
          description: 'خطا در به‌روزرسانی تنظیمات',
          variant: 'destructive'
        });
        return;
      }

      setSettings(data);
      
      toast({
        title: 'موفقیت آمیز',
        description: `Google Login ${enabled ? 'فعال' : 'غیرفعال'} شد`,
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="mr-2">در حال بارگذاری...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            خطا در دریافت تنظیمات Google Login
          </p>
          <Button 
            onClick={fetchSettings} 
            variant="outline" 
            className="mt-4 mx-auto block"
          >
            تلاش مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          تنظیمات Google Login
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-base font-medium">
              ورود با Google
            </div>
            <div className="text-sm text-muted-foreground">
              فعال یا غیرفعال کردن امکان ورود با حساب Google در سیستم
            </div>
          </div>
          <Switch
            checked={settings.is_enabled}
            onCheckedChange={updateGoogleAuthStatus}
            disabled={updating}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="text-sm font-medium">وضعیت فعلی:</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${settings.is_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {settings.is_enabled ? 'فعال' : 'غیرفعال'}
            </span>
          </div>
          {settings.updated_at && (
            <div className="text-xs text-muted-foreground">
              آخرین به‌روزرسانی: {new Date(settings.updated_at).toLocaleString('fa-IR')}
            </div>
          )}
        </div>

        {updating && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال به‌روزرسانی...
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
          <strong>نکته:</strong> در صورت غیرفعال کردن Google Login، کاربران نمی‌توانند با حساب Google خود وارد شوند یا حساب جدید ایجاد کنند.
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleAuthSettings;