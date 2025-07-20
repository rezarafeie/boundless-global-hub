
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { enhancedPushNotificationService } from '@/lib/enhancedPushNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Smartphone, Monitor, Bell, Download, Info, RefreshCw } from 'lucide-react';
import type { MobileDeviceInfo } from '@/lib/mobilePushDetection';

interface EnhancedNotificationDiagnosticsProps {
  currentUser: any;
  sessionToken: string;
}

const EnhancedNotificationDiagnostics: React.FC<EnhancedNotificationDiagnosticsProps> = ({ 
  currentUser, 
  sessionToken 
}) => {
  const [diagnostics, setDiagnostics] = useState<any>({
    deviceInfo: null,
    oneSignalReady: false,
    oneSignalLoaded: false,
    oneSignalInitialized: false,
    permission: 'default',
    subscription: false,
    subscriptionId: null,
    tokenSaved: false,
    lastTestResult: null,
    databaseToken: null,
    initializationError: null
  });

  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const runDiagnostics = async () => {
    setRefreshing(true);
    
    try {
      // Get enhanced device info
      const deviceInfo = enhancedPushNotificationService.getDeviceInfo();
      
      // Check OneSignal loading
      const oneSignalLoaded = typeof window.OneSignal !== 'undefined';
      
      // Check OneSignal initialization
      const oneSignalInitialized = enhancedPushNotificationService['isInitialized'];
      
      // Try to initialize OneSignal
      let initializationError = null;
      try {
        if (deviceInfo.supportsWebPush) {
          await enhancedPushNotificationService.initOneSignal();
        }
      } catch (error) {
        initializationError = error.message;
        console.error('OneSignal initialization failed:', error);
      }
      
      // Check OneSignal readiness
      const oneSignalReady = oneSignalInitialized && !!window.OneSignal;
      
      // Check permission
      const permission = 'Notification' in window ? Notification.permission : 'unavailable';
      
      // Check subscription
      let subscription = false;
      let subscriptionId = null;
      try {
        subscription = await enhancedPushNotificationService.isSubscriptionValid();
        subscriptionId = await enhancedPushNotificationService.getSubscription();
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
      
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
      
      setDiagnostics({
        deviceInfo,
        oneSignalLoaded,
        oneSignalInitialized,
        oneSignalReady,
        permission,
        subscription,
        subscriptionId,
        tokenSaved,
        databaseToken,
        initializationError,
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
      const subscriptionId = await enhancedPushNotificationService.getSubscription();
      
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
            text: 'تست اعلان بهبود یافته - موفقیت‌آمیز!',
            senderName: 'سیستم تشخیص پیشرفته',
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

  const testPermissionRequest = async () => {
    setTesting(true);
    
    try {
      console.log('🔔 Testing permission request...');
      const success = await enhancedPushNotificationService.requestPermissionWithUserGesture();
      
      setDiagnostics(prev => ({
        ...prev,
        lastTestResult: { 
          success, 
          error: success ? null : 'Permission request failed',
          type: 'permission_test'
        }
      }));
      
      // Refresh diagnostics after permission test
      setTimeout(() => {
        runDiagnostics();
      }, 2000);
      
    } catch (error) {
      console.error('Error testing permission request:', error);
      setDiagnostics(prev => ({
        ...prev,
        lastTestResult: { success: false, error: error.message, type: 'permission_test' }
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

  const DeviceIcon = ({ deviceInfo }: { deviceInfo: MobileDeviceInfo }) => {
    if (deviceInfo.isMobile) {
      return <Smartphone className="h-5 w-5 text-blue-500" />;
    }
    return <Monitor className="h-5 w-5 text-gray-500" />;
  };

  const PermissionBadge = ({ permission }: { permission: string }) => {
    const colors = {
      granted: 'bg-green-500',
      denied: 'bg-red-500',
      default: 'bg-yellow-500',
      unavailable: 'bg-gray-500'
    };
    
    const labels = {
      granted: 'مجاز',
      denied: 'رد شده',
      default: 'پیش‌فرض',
      unavailable: 'غیر موجود'
    };
    
    return (
      <Badge className={`${colors[permission]} text-white`}>
        {labels[permission] || permission}
      </Badge>
    );
  };

  const deviceInfo = diagnostics.deviceInfo;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          تشخیص پیشرفته اعلان‌ها
          {deviceInfo && <DeviceIcon deviceInfo={deviceInfo} />}
        </CardTitle>
        {deviceInfo && (
          <div className="text-sm text-muted-foreground">
            {deviceInfo.browser} • {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Desktop'} 
            {deviceInfo.osVersion !== 'Unknown' && ` • ${deviceInfo.osVersion}`}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Initialization Error */}
        {diagnostics.initializationError && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-800">خطای راه‌اندازی</span>
            </div>
            <p className="text-sm text-red-700">
              {diagnostics.initializationError}
            </p>
          </div>
        )}

        {/* Device Capabilities */}
        {deviceInfo && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              قابلیت‌های دستگاه
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>پشتیبانی وب پوش:</span>
                <StatusIcon status={deviceInfo.supportsWebPush} />
              </div>
              <div className="flex items-center justify-between">
                <span>حالت PWA:</span>
                <StatusIcon status={deviceInfo.isPWA} />
              </div>
              <div className="flex items-center justify-between">
                <span>Context امن:</span>
                <StatusIcon status={window.isSecureContext} />
              </div>
              <div className="flex items-center justify-between">
                <span>Service Worker:</span>
                <StatusIcon status={'serviceWorker' in navigator} />
              </div>
            </div>
          </div>
        )}

        {/* OneSignal Status */}
        <div>
          <h4 className="font-semibold mb-3">وضعیت OneSignal</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>SDK بارگذاری شده:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.oneSignalLoaded} />
                <span>{diagnostics.oneSignalLoaded ? 'بله' : 'خیر'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>راه‌اندازی شده:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.oneSignalInitialized} />
                <span>{diagnostics.oneSignalInitialized ? 'بله' : 'خیر'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>آماده به کار:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.oneSignalReady} />
                <span>{diagnostics.oneSignalReady ? 'آماده' : 'آماده نیست'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-4">
          <h4 className="font-semibold mb-3">وضعیت سیستم</h4>
          
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

          {diagnostics.subscriptionId && (
            <div className="text-xs text-gray-600">
              <span>Subscription ID: {diagnostics.subscriptionId.substring(0, 20)}...</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>ذخیره در دیتابیس:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={diagnostics.tokenSaved} />
              <span>{diagnostics.tokenSaved ? 'بله' : 'خیر'}</span>
            </div>
          </div>

          {diagnostics.databaseToken && (
            <div className="text-xs text-gray-600">
              <span>DB Token: {diagnostics.databaseToken.substring(0, 20)}...</span>
            </div>
          )}
        </div>

        {/* Limitations & Recommendations */}
        {deviceInfo && (deviceInfo.limitations.length > 0 || deviceInfo.recommendations.length > 0) && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              محدودیت‌ها و پیشنهادات
            </h4>
            
            {deviceInfo.limitations.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-yellow-700 mb-2">محدودیت‌ها:</p>
                <ul className="space-y-1">
                  {deviceInfo.limitations.map((limitation, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {deviceInfo.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">پیشنهادات:</p>
                <ul className="space-y-1">
                  {deviceInfo.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                      <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Mobile App Recommendation */}
        {deviceInfo && deviceInfo.isMobile && !deviceInfo.supportsWebPush && (
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-800">پیشنهاد اپلیکیشن موبایل</span>
            </div>
            <p className="text-sm text-blue-700">
              برای بهترین تجربه اعلان‌ها در {deviceInfo.isIOS ? 'iOS' : 'Android'}، 
              اپلیکیشن موبایل را نصب کنید که از اعلان‌های کامل پشتیبانی می‌کند.
            </p>
          </div>
        )}

        {/* Test Results */}
        {diagnostics.lastTestResult && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">
              نتیجه آخرین تست {diagnostics.lastTestResult.type === 'permission_test' ? '(درخواست مجوز)' : '(ارسال اعلان)'}:
            </h4>
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
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runDiagnostics}
            disabled={refreshing}
            variant="outline"
            className="flex-1 min-w-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال بررسی...' : 'بررسی مجدد'}
          </Button>
          
          {deviceInfo?.supportsWebPush && (
            <Button 
              onClick={testPermissionRequest}
              disabled={testing}
              variant="secondary"
              className="flex-1 min-w-0"
            >
              <Bell className="h-4 w-4 mr-2" />
              {testing ? 'تست مجوز...' : 'تست مجوز'}
            </Button>
          )}
          
          <Button 
            onClick={sendTestNotification}
            disabled={testing || !diagnostics.tokenSaved || !deviceInfo?.supportsWebPush}
            className="flex-1 min-w-0"
          >
            <Bell className="h-4 w-4 mr-2" />
            {testing ? 'در حال ارسال...' : 'ارسال تست'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedNotificationDiagnostics;
