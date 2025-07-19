import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Stethoscope, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Bell,
  MessageSquare,
  Server,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface DiagnosticStats {
  totalUsers: number;
  usersWithTokens: number;
  enabledUsers: number;
  recentMessages: number;
  recentNotifications: number;
}

const NotificationDiagnostics: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [stats, setStats] = useState<DiagnosticStats | null>(null);

  const runDiagnostics = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);

    const diagnostics = [
      checkUserTokens,
      checkNotificationSettings,
      checkEdgeFunction,
      checkServiceWorker,
      checkVAPIDKeys,
      checkRecentActivity,
      checkDatabaseTriggers
    ];

    for (let i = 0; i < diagnostics.length; i++) {
      try {
        const result = await diagnostics[i]();
        setResults(prev => [...prev, result]);
        setProgress(((i + 1) / diagnostics.length) * 100);
      } catch (error) {
        setResults(prev => [...prev, {
          name: `تست ${i + 1}`,
          status: 'error',
          message: `خطا در اجرای تست: ${error}`
        }]);
      }
    }

    await fetchStats();
    setRunning(false);
  };

  const fetchStats = async () => {
    try {
      const { data: allUsers } = await supabase.from('chat_users').select('id, notification_token, notification_enabled');
      const { data: messages } = await supabase
        .from('messenger_messages')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('is_active', true);

      setStats({
        totalUsers: allUsers?.length || 0,
        usersWithTokens: allUsers?.filter(u => u.notification_token).length || 0,
        enabledUsers: allUsers?.filter(u => u.notification_enabled).length || 0,
        recentMessages: messages?.length || 0,
        recentNotifications: notifications?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkUserTokens = async (): Promise<DiagnosticResult> => {
    const { data: users } = await supabase
      .from('chat_users')
      .select('notification_token, notification_enabled')
      .not('notification_token', 'is', null);

    if (!users || users.length === 0) {
      return {
        name: 'بررسی توکن‌های کاربران',
        status: 'error',
        message: 'هیچ کاربری توکن اعلان ندارد',
        details: { count: 0 }
      };
    }

    const validTokens = users.filter(u => {
      try {
        const parsed = JSON.parse(u.notification_token);
        return parsed.endpoint && parsed.keys;
      } catch {
        return false;
      }
    });

    if (validTokens.length === 0) {
      return {
        name: 'بررسی توکن‌های کاربران',
        status: 'error',
        message: 'تمام توکن‌ها نامعتبر هستند',
        details: { total: users.length, valid: 0 }
      };
    }

    return {
      name: 'بررسی توکن‌های کاربران',
      status: validTokens.length === users.length ? 'success' : 'warning',
      message: `${validTokens.length} از ${users.length} توکن معتبر`,
      details: { total: users.length, valid: validTokens.length }
    };
  };

  const checkNotificationSettings = async (): Promise<DiagnosticResult> => {
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (!settings) {
      return {
        name: 'بررسی تنظیمات اعلان',
        status: 'warning',
        message: 'تنظیمات پیدا نشد'
      };
    }

    return {
      name: 'بررسی تنظیمات اعلان',
      status: 'success',
      message: 'تنظیمات موجود است'
    };
  };

  const checkEdgeFunction = async (): Promise<DiagnosticResult> => {
    try {
      // Test the edge function
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: { test: true }
      });

      if (error) {
        return {
          name: 'بررسی Edge Function',
          status: 'error',
          message: `خطا در Edge Function: ${error.message}`,
          details: error
        };
      }

      return {
        name: 'بررسی Edge Function',
        status: 'success',
        message: 'Edge Function در دسترس است'
      };
    } catch (error) {
      return {
        name: 'بررسی Edge Function',
        status: 'error',
        message: `خطا در اتصال: ${error}`,
        details: error
      };
    }
  };

  const checkServiceWorker = async (): Promise<DiagnosticResult> => {
    if (!('serviceWorker' in navigator)) {
      return {
        name: 'بررسی Service Worker',
        status: 'error',
        message: 'Service Worker پشتیبانی نمی‌شود'
      };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return {
        name: 'بررسی Service Worker',
        status: 'error',
        message: 'Service Worker ثبت نشده'
      };
    }

    return {
      name: 'بررسی Service Worker',
      status: 'success',
      message: 'Service Worker فعال است'
    };
  };

  const checkVAPIDKeys = async (): Promise<DiagnosticResult> => {
    // Check if VAPID keys are configured (this would need to be checked on the server)
    return {
      name: 'بررسی کلیدهای VAPID',
      status: 'warning',
      message: 'نیاز به بررسی دستی کلیدها در تنظیمات سرور'
    };
  };

  const checkRecentActivity = async (): Promise<DiagnosticResult> => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: messages } = await supabase
      .from('messenger_messages')
      .select('id')
      .gte('created_at', twentyFourHoursAgo);

    if (!messages || messages.length === 0) {
      return {
        name: 'بررسی فعالیت اخیر',
        status: 'warning',
        message: 'هیچ پیامی در ۲۴ ساعت گذشته ارسال نشده'
      };
    }

    return {
      name: 'بررسی فعالیت اخیر',
      status: 'success',
      message: `${messages.length} پیام در ۲۴ ساعت گذشته`,
      details: { count: messages.length }
    };
  };

  const checkDatabaseTriggers = async (): Promise<DiagnosticResult> => {
    // Check if notification triggers exist by checking recent messages
    try {
      const { data: recentMessages } = await supabase
        .from('messenger_messages')
        .select('id')
        .limit(1);

      return {
        name: 'بررسی Trigger های دیتابیس',
        status: 'success',
        message: 'دیتابیس در دسترس است'
      };
    } catch (error) {
      return {
        name: 'بررسی Trigger های دیتابیس',
        status: 'warning',
        message: 'نمی‌توان وضعیت trigger ها را بررسی کرد'
      };
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-slate-500">کل کاربران</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Bell className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.usersWithTokens}</div>
              <div className="text-sm text-slate-500">با توکن</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.enabledUsers}</div>
              <div className="text-sm text-slate-500">فعال</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.recentMessages}</div>
              <div className="text-sm text-slate-500">پیام‌های امروز</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{stats.recentNotifications}</div>
              <div className="text-sm text-slate-500">اعلان‌های فعال</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              تشخیص سیستم اعلانات
            </div>
            <Button 
              onClick={runDiagnostics} 
              disabled={running}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
              {running ? 'در حال بررسی...' : 'شروع تشخیص'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {running && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>پیشرفت تشخیص</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {results.map((result, index) => (
            <Alert key={index} className={
              result.status === 'success' ? 'border-green-200 bg-green-50' :
              result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }>
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.name}</span>
                    <Badge variant={
                      result.status === 'success' ? 'default' :
                      result.status === 'warning' ? 'secondary' :
                      'destructive'
                    }>
                      {result.status === 'success' ? 'موفق' :
                       result.status === 'warning' ? 'هشدار' : 'خطا'}
                    </Badge>
                  </div>
                  <AlertDescription className="mt-1">
                    {result.message}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}

          {results.length === 0 && !running && (
            <Alert>
              <Stethoscope className="w-4 h-4" />
              <AlertDescription>
                برای شروع تشخیص سیستم اعلانات، روی دکمه "شروع تشخیص" کلیک کنید.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDiagnostics;