
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pushNotificationService } from '@/lib/pushNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Smartphone, Bell, Database } from 'lucide-react';

interface NotificationDiagnosticsProps {
  currentUser: any;
  sessionToken: string;
}

const NotificationDiagnostics: React.FC<NotificationDiagnosticsProps> = ({ currentUser, sessionToken }) => {
  const [diagnostics, setDiagnostics] = useState<any>({
    browserSupport: false,
    oneSignalReady: false,
    permission: 'default',
    subscription: false,
    tokenSaved: false,
    lastTestResult: null,
    deviceInfo: {},
    databaseToken: null
  });

  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const runDiagnostics = async () => {
    setRefreshing(true);
    
    try {
      // Check browser support
      const browserSupport = pushNotificationService.isSupported();
      
      // Check OneSignal readiness
      const oneSignalReady = pushNotificationService.isInitialized && !!window.OneSignal;
      
      // Check permission
      const permission = 'Notification' in window ? Notification.permission : 'unavailable';
      
      // Check subscription
      const subscription = await pushNotificationService.isSubscriptionValid();
      
      // Check if token is saved in database
      let databaseToken = null;
      let tokenSaved = false;
      
      if (currentUser && sessionToken) {
        try {
          await supabase.rpc('set_session_context', { session_token: sessionToken });
          const { data, error } = await supabase
            .from('chat_users')
            .select('notification_token, notification_enabled')
            .eq('id', currentUser.id)
            .single();
            
          if (!error && data) {
            databaseToken = data.notification_token;
            tokenSaved = !!data.notification_token;
          }
        } catch (error) {
          console.error('Error checking database token:', error);
        }
      }
      
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: /Android/.test(navigator.userAgent),
        isSecureContext: window.isSecureContext,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasNotification: 'Notification' in window
      };
      
      setDiagnostics({
        browserSupport,
        oneSignalReady,
        permission,
        subscription,
        tokenSaved,
        databaseToken,
        deviceInfo,
        lastTestResult: diagnostics.lastTestResult
      });
      
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sendTestNotification = async () => {
    setTesting(true);
    
    try {
      // First check if we have a valid subscription
      const subscriptionId = await pushNotificationService.getSubscription();
      
      if (!subscriptionId) {
        setDiagnostics(prev => ({
          ...prev,
          lastTestResult: { success: false, error: 'No valid subscription found' }
        }));
        return;
      }

      // Send test notification via edge function
      const { data, error } = await supabase.functions.invoke('send-onesignal-notification', {
        body: {
          recipientUserIds: [currentUser.id],
          message: {
            id: Date.now(),
            text: 'این یک پیام آزمایشی است',
            senderName: 'سیستم اعلان‌ها',
            senderId: 0,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        setDiagnostics(prev => ({
          ...prev,
          lastTestResult: { success: false, error: error.message }
        }));
      } else {
        setDiagnostics(prev => ({
          ...prev,
          lastTestResult: { success: true, data }
        }));
      }

    } catch (error) {
      console.error('Error sending test notification:', error);
      setDiagnostics(prev => ({
        ...prev,
        lastTestResult: { success: false, error: error.message }
      }));
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [currentUser, sessionToken]);

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const PermissionBadge = ({ permission }: { permission: string }) => {
    const colors = {
      granted: 'bg-green-500',
      denied: 'bg-red-500',
      default: 'bg-yellow-500',
      unavailable: 'bg-gray-500'
    };
    
    return (
      <Badge className={`${colors[permission]} text-white`}>
        {permission}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          تشخیص وضعیت اعلان‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Info */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            اطلاعات دستگاه
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>نوع دستگاه: {diagnostics.deviceInfo.isMobile ? 'موبایل' : 'دسکتاپ'}</div>
            <div>سیستم عامل: {diagnostics.deviceInfo.isIOS ? 'iOS' : diagnostics.deviceInfo.isAndroid ? 'Android' : 'Other'}</div>
            <div>Context امن: {diagnostics.deviceInfo.isSecureContext ? 'بله' : 'خیر'}</div>
            <div>Service Worker: {diagnostics.deviceInfo.hasServiceWorker ? 'موجود' : 'غیر موجود'}</div>
          </div>
        </div>

        {/* Diagnostic Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>پشتیبانی مرورگر:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={diagnostics.browserSupport} />
              <span>{diagnostics.browserSupport ? 'پشتیبانی می‌شود' : 'پشتیبانی نمی‌شود'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>آماده‌سازی OneSignal:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={diagnostics.oneSignalReady} />
              <span>{diagnostics.oneSignalReady ? 'آماده' : 'آماده نیست'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>مجوز:</span>
            <PermissionBadge permission={diagnostics.permission} />
          </div>

          <div className="flex items-center justify-between">
            <span>اشتراک:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={diagnostics.subscription} />
              <span>{diagnostics.subscription ? 'فعال' : 'غیر فعال'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>ذخیره در دیتابیس:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={diagnostics.tokenSaved} />
              <span>{diagnostics.tokenSaved ? 'بله' : 'خیر'}</span>
            </div>
          </div>

          {diagnostics.databaseToken && (
            <div className="text-xs text-gray-600">
              <Database className="h-3 w-3 inline mr-1" />
              Token: {diagnostics.databaseToken.substring(0, 20)}...
            </div>
          )}
        </div>

        {/* Test Results */}
        {diagnostics.lastTestResult && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">نتیجه آخرین تست:</h4>
            <div className="flex items-center gap-2">
              {diagnostics.lastTestResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {diagnostics.lastTestResult.success ? 'موفق' : `خطا: ${diagnostics.lastTestResult.error}`}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics}
            disabled={refreshing}
            variant="outline"
            className="flex-1"
          >
            {refreshing ? 'در حال بررسی...' : 'بررسی مجدد'}
          </Button>
          
          <Button 
            onClick={sendTestNotification}
            disabled={testing || !diagnostics.tokenSaved}
            className="flex-1"
          >
            {testing ? 'در حال ارسال...' : 'ارسال تست'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDiagnostics;
