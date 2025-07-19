
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { pushNotificationService } from '@/lib/pushNotificationService';
import { supabase } from '@/integrations/supabase/client';

interface NotificationTesterProps {
  currentUser: { id: number; name: string } | null;
}

const NotificationTester: React.FC<NotificationTesterProps> = ({ currentUser }) => {
  const [testResults, setTestResults] = useState<{
    browserSupport?: boolean;
    permission?: string;
    subscription?: boolean;
    tokenSaved?: boolean;
    testSent?: boolean;
    error?: string;
  }>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    if (!currentUser) return;
    
    setTesting(true);
    setTestResults({});
    
    try {
      console.log('🔧 Running notification diagnostics...');
      
      // Test 1: Browser support
      const browserSupport = pushNotificationService.isSupported();
      setTestResults(prev => ({ ...prev, browserSupport }));
      
      // Test 2: Permission status
      const permission = Notification.permission;
      setTestResults(prev => ({ ...prev, permission }));
      
      if (permission !== 'granted') {
        setTestResults(prev => ({ ...prev, error: 'Notification permission not granted' }));
        return;
      }
      
      // Test 3: Check subscription
      const status = await pushNotificationService.getSubscriptionStatus(currentUser.id);
      setTestResults(prev => ({ ...prev, subscription: !!status.subscription, tokenSaved: status.hasValidToken }));
      
      if (!status.hasValidToken) {
        console.log('🔧 No valid token, attempting to create subscription...');
        try {
          await pushNotificationService.subscribe(currentUser.id);
          setTestResults(prev => ({ ...prev, subscription: true, tokenSaved: true }));
        } catch (error) {
          setTestResults(prev => ({ ...prev, error: `Failed to create subscription: ${error}` }));
          return;
        }
      }
      
      // Test 4: Send test notification via edge function
      console.log('🔧 Sending test notification...');
      const { error: functionError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          recipientUserIds: [currentUser.id],
          message: {
            id: 9999,
            text: 'This is a test notification from the diagnostics tool',
            senderName: 'System Test',
            roomName: 'Test Room',
            senderId: 0,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      if (functionError) {
        setTestResults(prev => ({ ...prev, error: `Edge function error: ${functionError.message}` }));
      } else {
        setTestResults(prev => ({ ...prev, testSent: true }));
      }
      
    } catch (error) {
      console.error('🔧 Diagnostics error:', error);
      setTestResults(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setTesting(false);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setTestResults(prev => ({ ...prev, permission }));
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Notification Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Browser Support:</span>
            {testResults.browserSupport !== undefined && (
              <Badge variant={testResults.browserSupport ? "default" : "destructive"}>
                {testResults.browserSupport ? "Supported" : "Not Supported"}
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
        
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          <Bell className="h-4 w-4 mr-2" />
          {testing ? 'Testing...' : 'Run Diagnostics'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationTester;
