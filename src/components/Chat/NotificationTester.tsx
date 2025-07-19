
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, TestTube, AlertCircle, CheckCircle, Smartphone, Monitor } from 'lucide-react';
import { pushNotificationService } from '@/lib/pushNotificationService';
import { supabase } from '@/integrations/supabase/client';

interface NotificationTesterProps {
  currentUser: { id: number; name: string } | null;
}

// Mobile detection utility
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isIOSSafari = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

const NotificationTester: React.FC<NotificationTesterProps> = ({ currentUser }) => {
  const [testResults, setTestResults] = useState<{
    browserSupport?: boolean;
    permission?: string;
    subscription?: boolean;
    tokenSaved?: boolean;
    testSent?: boolean;
    oneSignalReady?: boolean;
    mobileDetected?: boolean;
    deviceType?: string;
    error?: string;
  }>({});
  const [testing, setTesting] = useState(false);

  const detectDevice = () => {
    if (isIOSSafari()) return 'iOS Safari';
    if (isAndroid()) return 'Android';
    if (isMobile()) return 'Mobile (Other)';
    return 'Desktop';
  };

  const runDiagnostics = async () => {
    if (!currentUser) return;
    
    setTesting(true);
    setTestResults({});
    
    try {
      console.log('🔧 Running OneSignal notification diagnostics...');
      
      // Test 1: Device detection
      const deviceType = detectDevice();
      const mobileDetected = isMobile();
      setTestResults(prev => ({ ...prev, deviceType, mobileDetected }));
      
      // Test 2: Browser support
      const browserSupport = pushNotificationService.isSupported();
      setTestResults(prev => ({ ...prev, browserSupport }));
      
      if (!browserSupport) {
        setTestResults(prev => ({ ...prev, error: `Push notifications not supported on ${deviceType}` }));
        return;
      }
      
      // Test 3: OneSignal initialization
      let oneSignalReady = false;
      try {
        await pushNotificationService.initOneSignal();
        oneSignalReady = !!window.OneSignal;
        console.log('🔧 OneSignal initialized:', oneSignalReady);
      } catch (osError) {
        console.error('🔧 OneSignal initialization error:', osError);
      }
      setTestResults(prev => ({ ...prev, oneSignalReady }));
      
      if (!oneSignalReady) {
        setTestResults(prev => ({ ...prev, error: 'OneSignal failed to initialize' }));
        return;
      }
      
      // Test 4: Permission status
      const permission = Notification.permission;
      setTestResults(prev => ({ ...prev, permission }));
      
      if (permission !== 'granted') {
        let errorMsg = 'Notification permission not granted';
        if (isIOSSafari()) {
          errorMsg += ' (iOS Safari requires user interaction)';
        } else if (isAndroid()) {
          errorMsg += ' (Android may require site engagement)';
        }
        setTestResults(prev => ({ ...prev, error: errorMsg }));
        return;
      }
      
      // Test 5: Check OneSignal subscription
      const status = await pushNotificationService.getSubscriptionStatus(currentUser.id);
      const subscriptionId = await pushNotificationService.getSubscription();
      setTestResults(prev => ({ 
        ...prev, 
        subscription: !!subscriptionId, 
        tokenSaved: status.hasValidToken 
      }));
      
      if (!status.hasValidToken) {
        console.log('🔧 No valid token, attempting to create subscription...');
        try {
          // Add delay for mobile browsers
          if (mobileDetected) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          await pushNotificationService.subscribe(currentUser.id);
          setTestResults(prev => ({ ...prev, subscription: true, tokenSaved: true }));
        } catch (error) {
          let errorMsg = `Failed to create subscription: ${error}`;
          if (isIOSSafari()) {
            errorMsg += ' (iOS Safari has limited push support)';
          }
          setTestResults(prev => ({ ...prev, error: errorMsg }));
          return;
        }
      }
      
      // Test 6: Send test notification via OneSignal edge function
      console.log('🔧 Sending test OneSignal notification...');
      const { error: functionError } = await supabase.functions.invoke('send-onesignal-notification', {
        body: {
          recipientUserIds: [currentUser.id],
          message: {
            id: 9999,
            text: `OneSignal test notification from ${deviceType}`,
            senderName: 'System Test',
            roomName: 'Test Room',
            senderId: 0,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      if (functionError) {
        setTestResults(prev => ({ ...prev, error: `OneSignal function error: ${functionError.message}` }));
      } else {
        setTestResults(prev => ({ ...prev, testSent: true }));
        
        // Show additional mobile guidance
        if (mobileDetected && !isIOSSafari()) {
          setTimeout(() => {
            console.log('🔧 OneSignal notification should appear shortly...');
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error('🔧 Diagnostics error:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (mobileDetected) {
        errorMsg += ` (Mobile: ${deviceType})`;
      }
      setTestResults(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setTesting(false);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setTestResults(prev => ({ ...prev, permission }));
      
      if (permission === 'granted' && isMobile()) {
        setTimeout(() => {
          console.log('🔧 Permission granted on mobile, ready for OneSignal subscription');
        }, 500);
      }
    } catch (error) {
      console.error('Error requesting permission on mobile:', error);
      setTestResults(prev => ({ 
        ...prev, 
        error: `Permission request failed on ${detectDevice()}: ${error}` 
      }));
    }
  };

  if (!currentUser) {
    return null;
  }

  const deviceType = testResults.deviceType || detectDevice();
  const mobileDetected = testResults.mobileDetected ?? isMobile();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          OneSignal Diagnostics
          {mobileDetected ? <Smartphone className="h-4 w-4 text-blue-500" /> : <Monitor className="h-4 w-4" />}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Device: {deviceType} {mobileDetected && '(Mobile)'}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Device Type:</span>
            <Badge variant="outline">
              {deviceType}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Browser Support:</span>
            {testResults.browserSupport !== undefined && (
              <Badge variant={testResults.browserSupport ? "default" : "destructive"}>
                {testResults.browserSupport ? "Supported" : "Not Supported"}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>OneSignal Ready:</span>
            {testResults.oneSignalReady !== undefined && (
              <Badge variant={testResults.oneSignalReady ? "default" : "destructive"}>
                {testResults.oneSignalReady ? "Ready" : "Not Ready"}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Permission:</span>
            {testResults.permission && (
              <div className="flex items-center gap-2">
                <Badge variant={testResults.permission === 'granted' ? "default" : "secondary"}>
                  {testResults.permission}
                </Badge>
                {testResults.permission !== 'granted' && (
                  <Button size="sm" variant="outline" onClick={requestPermission}>
                    Request
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Subscription:</span>
            {testResults.subscription !== undefined && (
              <Badge variant={testResults.subscription ? "default" : "destructive"}>
                {testResults.subscription ? "Active" : "Missing"}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Token Saved:</span>
            {testResults.tokenSaved !== undefined && (
              <Badge variant={testResults.tokenSaved ? "default" : "destructive"}>
                {testResults.tokenSaved ? "Yes" : "No"}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Test Sent:</span>
            {testResults.testSent !== undefined && (
              <Badge variant={testResults.testSent ? "default" : "destructive"}>
                {testResults.testSent ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              </Badge>
            )}
          </div>
        </div>
        
        {testResults.error && (
          <div className="p-2 bg-destructive/10 text-destructive text-sm rounded border">
            {testResults.error}
          </div>
        )}
        
        {mobileDetected && isIOSSafari() && (
          <div className="p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
            📱 iOS Note: Push notifications have limited support on iOS Safari. For best results, add this site to your home screen.
          </div>
        )}
        
        {mobileDetected && isAndroid() && (
          <div className="p-2 bg-green-50 text-green-700 text-xs rounded border border-green-200">
            📱 Android: Make sure to interact with the site before testing notifications.
          </div>
        )}
        
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          <Bell className="h-4 w-4 mr-2" />
          {testing ? 'Testing...' : 'Run OneSignal Diagnostics'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationTester;
