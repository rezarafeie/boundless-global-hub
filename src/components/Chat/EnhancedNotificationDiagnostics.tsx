
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { enhancedPushNotificationService } from '@/lib/enhancedPushNotificationService';
import { enhancedOneSignalLoader } from '@/lib/enhancedOneSignalLoader';
import { serviceWorkerManager } from '@/lib/serviceWorkerManager';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Smartphone, Monitor, Bell, Download, Info, RefreshCw, Wifi, WifiOff, Zap } from 'lucide-react';
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
    oneSignalStatus: {
      sdkLoaded: false,
      isInitialized: false,
      isReady: false
    },
    serviceWorkerStatus: {
      supported: false,
      registered: false,
      registrationScope: null
    },
    networkStatus: {
      online: navigator.onLine,
      connectivity: 'checking'
    },
    permission: 'default',
    subscription: {
      isValid: false,
      subscriptionId: null
    },
    database: {
      tokenSaved: false,
      token: null
    },
    lastTestResult: null,
    initializationError: null,
    isForceReloading: false
  });

  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const runComprehensiveDiagnostics = async () => {
    setRefreshing(true);
    
    try {
      console.log('🔍 [Diagnostics] Starting comprehensive diagnostics...');
      
      // Get device info
      const deviceInfo = enhancedPushNotificationService.getDeviceInfo();
      
      // Check network connectivity
      const networkStatus = {
        online: navigator.onLine,
        connectivity: await checkConnectivity()
      };
      
      // Check service worker status
      const serviceWorkerStatus = await checkServiceWorkerStatus();
      
      // Check OneSignal SDK status
      const oneSignalStatus = await checkOneSignalStatus(deviceInfo);
      
      // Check permissions
      const permission = await checkPermissionStatus();
      
      // Check subscription status
      const subscription = await checkSubscriptionStatus();
      
      // Check database status
      const database = await checkDatabaseStatus();
      
      setDiagnostics({
        deviceInfo,
        oneSignalStatus,
        serviceWorkerStatus,
        networkStatus,
        permission,
        subscription,
        database,
        lastTestResult: diagnostics.lastTestResult,
        initializationError: oneSignalStatus.initializationError || null
      });
      
      console.log('✅ [Diagnostics] Comprehensive diagnostics completed');
      
    } catch (error) {
      console.error('❌ [Diagnostics] Comprehensive diagnostics failed:', error);
      setDiagnostics(prev => ({
        ...prev,
        initializationError: error.message
      }));
    } finally {
      setRefreshing(false);
    }
  };

  const checkConnectivity = async (): Promise<string> => {
    try {
      const response = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      return response.ok ? 'good' : 'limited';
    } catch {
      return 'poor';
    }
  };

  const checkServiceWorkerStatus = async () => {
    const supported = 'serviceWorker' in navigator;
    let registered = false;
    let registrationScope = null;
    let activeWorker = null;
    
    if (supported) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const unifiedRegistration = registrations.find(reg => 
          reg.scope.endsWith('/') && reg.active?.scriptURL.includes('unified-sw.js')
        );
        
        if (unifiedRegistration) {
          registered = true;
          registrationScope = unifiedRegistration.scope;
          activeWorker = unifiedRegistration.active?.scriptURL;
        }
      } catch (error) {
        console.error('Error checking service worker:', error);
      }
    }
    
    return { supported, registered, registrationScope, activeWorker };
  };

  const checkOneSignalStatus = async (deviceInfo: MobileDeviceInfo) => {
    const loaderStatus = enhancedOneSignalLoader.getLoadingStatus();
    const initStatus = enhancedPushNotificationService.getInitializationStatus();
    
    let initializationError = null;
    
    if (deviceInfo.supportsWebPush && !initStatus.isInitialized) {
      try {
        console.log('🔍 [Diagnostics] Attempting OneSignal initialization for diagnostics...');
        await enhancedPushNotificationService.initOneSignal();
      } catch (error) {
        initializationError = error.message;
        console.error('OneSignal diagnostic initialization failed:', error);
      }
    }
    
    return {
      sdkLoaded: loaderStatus.isLoaded,
      isInitialized: initStatus.isInitialized,
      isReady: initStatus.isInitialized && !!window.OneSignal,
      swRegistered: initStatus.swRegistered,
      deviceSupported: initStatus.deviceSupported,
      initializationError
    };
  };

  const checkPermissionStatus = async () => {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unavailable';
  };

  const checkSubscriptionStatus = async () => {
    try {
      const isValid = await enhancedPushNotificationService.isSubscriptionValid();
      const subscriptionId = await enhancedPushNotificationService.getSubscription();
      
      return {
        isValid,
        subscriptionId
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return {
        isValid: false,
        subscriptionId: null
      };
    }
  };

  const checkDatabaseStatus = async () => {
    if (!currentUser || !sessionToken) {
      return { tokenSaved: false, token: null };
    }
    
    try {
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      const { data, error } = await supabase
        .from('chat_users')
        .select('notification_token, notification_enabled')
        .eq('id', currentUser.id)
        .single();
        
      if (!error && data) {
        return {
          tokenSaved: !!data.notification_token,
          token: data.notification_token
        };
      }
    } catch (error) {
      console.error('Error checking database token:', error);
    }
    
    return { tokenSaved: false, token: null };
  };

  const sendTestNotification = async () => {
    setTesting(true);
    
    try {
      const subscriptionId = await enhancedPushNotificationService.getSubscription();
      
      if (!subscriptionId) {
        setDiagnostics(prev => ({
          ...prev,
          lastTestResult: { success: false, error: 'No valid subscription found', type: 'test_notification' }
        }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-onesignal-notification', {
        body: {
          recipientUserIds: [currentUser.id],
          message: {
            id: Date.now(),
            text: 'تست اعلان بهبود یافته - موفقیت‌آمیز! 🎉',
            senderName: 'سیستم تشخیص پیشرفته',
            senderId: 0,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        setDiagnostics(prev => ({
          ...prev,
          lastTestResult: { success: false, error: error.message, type: 'test_notification' }
        }));
      } else {
        setDiagnostics(prev => ({
          ...prev,
          lastTestResult: { success: true, data, type: 'test_notification' }
        }));
      }

    } catch (error) {
      console.error('Error sending test notification:', error);
      setDiagnostics(prev => ({
        ...prev,
        lastTestResult: { success: false, error: error.message, type: 'test_notification' }
      }));
    } finally {
      setTesting(false);
    }
  };

  const testPermissionRequest = async () => {
    setTesting(true);
    
    try {
      console.log('🔔 [Diagnostics] Testing permission request...');
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
        runComprehensiveDiagnostics();
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
    runComprehensiveDiagnostics();
    
    // Listen for network status changes
    const handleOnline = () => runComprehensiveDiagnostics();
    const handleOffline = () => runComprehensiveDiagnostics();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

  const NetworkIcon = ({ status }: { status: string }) => {
    if (status === 'good') {
      return <Wifi className="h-4 w-4 text-green-500" />;
    } else if (status === 'limited') {
      return <Wifi className="h-4 w-4 text-yellow-500" />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
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
          تشخیص جامع اعلان‌ها
          {deviceInfo && <DeviceIcon deviceInfo={deviceInfo} />}
          <NetworkIcon status={diagnostics.networkStatus.connectivity} />
        </CardTitle>
        {deviceInfo && (
          <div className="text-sm text-muted-foreground">
            {deviceInfo.browser} • {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Desktop'} 
            {deviceInfo.osVersion !== 'Unknown' && ` • ${deviceInfo.osVersion}`}
            {!diagnostics.networkStatus.online && ' • آفلاین'}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Critical Errors */}
        {diagnostics.initializationError && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-800">خطای بحرانی</span>
            </div>
            <p className="text-sm text-red-700">
              {diagnostics.initializationError}
            </p>
          </div>
        )}

        {/* Network Status */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <NetworkIcon status={diagnostics.networkStatus.connectivity} />
            وضعیت شبکه
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>اتصال:</span>
              <StatusIcon status={diagnostics.networkStatus.online} />
            </div>
            <div className="flex items-center justify-between">
              <span>کیفیت:</span>
              <Badge className={`${
                diagnostics.networkStatus.connectivity === 'good' ? 'bg-green-500' :
                diagnostics.networkStatus.connectivity === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
              } text-white`}>
                {diagnostics.networkStatus.connectivity === 'good' ? 'عالی' :
                 diagnostics.networkStatus.connectivity === 'limited' ? 'محدود' : 'ضعیف'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Service Worker Status */}
        <div>
          <h4 className="font-semibold mb-3">وضعیت Service Worker</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>پشتیبانی:</span>
              <StatusIcon status={diagnostics.serviceWorkerStatus.supported} />
            </div>
            <div className="flex items-center justify-between">
              <span>ثبت شده:</span>
              <StatusIcon status={diagnostics.serviceWorkerStatus.registered} />
            </div>
            {diagnostics.serviceWorkerStatus.registrationScope && (
              <div className="text-xs text-gray-600">
                <span>محدوده: {diagnostics.serviceWorkerStatus.registrationScope}</span>
              </div>
            )}
            {diagnostics.serviceWorkerStatus.activeWorker && (
              <div className="text-xs text-gray-600">
                <span>فایل فعال: {diagnostics.serviceWorkerStatus.activeWorker.split('/').pop()}</span>
              </div>
            )}
          </div>
        </div>

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
                <span>Notification API:</span>
                <StatusIcon status={'Notification' in window} />
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
                <StatusIcon status={diagnostics.oneSignalStatus.sdkLoaded} />
                <span>{diagnostics.oneSignalStatus.sdkLoaded ? 'بله' : 'خیر'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>راه‌اندازی شده:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.oneSignalStatus.isInitialized} />
                <span>{diagnostics.oneSignalStatus.isInitialized ? 'بله' : 'خیر'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>آماده به کار:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.oneSignalStatus.isReady} />
                <span>{diagnostics.oneSignalStatus.isReady ? 'آماده' : 'آماده نیست'}</span>
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
              <StatusIcon status={diagnostics.subscription.isValid} />
              <span>{diagnostics.subscription.isValid ? 'فعال' : 'غیر فعال'}</span>
            </div>
          </div>

          {diagnostics.subscription.subscriptionId && (
            <div className="text-xs text-gray-600">
              <span>Subscription ID: {diagnostics.subscription.subscriptionId.substring(0, 20)}...</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>ذخیره در دیتابیس:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={diagnostics.database.tokenSaved} />
              <span>{diagnostics.database.tokenSaved ? 'بله' : 'خیر'}</span>
            </div>
          </div>

          {diagnostics.database.token && (
            <div className="text-xs text-gray-600">
              <span>DB Token: {diagnostics.database.token.substring(0, 20)}...</span>
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
            onClick={runComprehensiveDiagnostics}
            disabled={refreshing}
            variant="outline"
            className="flex-1 min-w-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال بررسی...' : 'بررسی جامع'}
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
            disabled={testing || !diagnostics.database.tokenSaved || !deviceInfo?.supportsWebPush}
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
