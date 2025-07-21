
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Activity, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeDebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const RealtimeDebugPanel: React.FC<RealtimeDebugPanelProps> = ({ isVisible, onToggle }) => {
  const [connectionStatus, setConnectionStatus] = useState<'SUBSCRIBED' | 'CLOSED' | 'CONNECTING'>('CONNECTING');
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Monitor Supabase realtime connection
    const monitorConnection = () => {
      try {
        const activeChannels = supabase.getChannels();
        setChannels(activeChannels.map(ch => ch.topic));
        
        // Check if we have any active subscriptions
        if (activeChannels.length > 0) {
          setConnectionStatus('SUBSCRIBED');
        } else {
          setConnectionStatus('CLOSED');
        }
      } catch (error) {
        console.error('Error monitoring connection:', error);
        setErrors(prev => [...prev.slice(-4), `Connection error: ${error}`]);
        setConnectionStatus('CLOSED');
      }
    };

    const interval = setInterval(monitorConnection, 2000);
    monitorConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const handleRefreshConnection = () => {
    console.log('🔄 Manual connection refresh requested');
    window.location.reload(); // Simple but effective for debugging
  };

  const clearLogs = () => {
    setErrors([]);
    setMessageCount(0);
    setLastMessageTime(null);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto z-50 bg-white dark:bg-slate-800 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Real-time Debug
          </span>
          <Button onClick={onToggle} variant="ghost" size="sm">
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span>اتصال:</span>
          <Badge variant={connectionStatus === 'SUBSCRIBED' ? 'default' : 'destructive'}>
            {connectionStatus === 'SUBSCRIBED' ? (
              <><Wifi className="w-3 h-3 mr-1" /> متصل</>
            ) : (
              <><WifiOff className="w-3 h-3 mr-1" /> قطع</>
            )}
          </Badge>
        </div>

        {/* Active Channels */}
        <div>
          <span className="font-medium">کانال‌های فعال ({channels.length}):</span>
          <div className="mt-1 space-y-1">
            {channels.length > 0 ? (
              channels.map((channel, index) => (
                <div key={index} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                  {channel}
                </div>
              ))
            ) : (
              <div className="text-slate-500">هیچ کانال فعالی وجود ندارد</div>
            )}
          </div>
        </div>

        {/* Message Statistics */}
        <div className="flex items-center justify-between">
          <span>پیام‌های دریافتی:</span>
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {messageCount}
          </Badge>
        </div>

        {lastMessageTime && (
          <div className="flex items-center justify-between">
            <span>آخرین پیام:</span>
            <span className="text-slate-600 dark:text-slate-400">
              {lastMessageTime.toLocaleTimeString('fa-IR')}
            </span>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div>
            <span className="font-medium text-red-600">خطاها:</span>
            <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 dark:bg-red-950 rounded px-2 py-1">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button onClick={handleRefreshConnection} size="sm" variant="outline" className="flex-1">
            <RefreshCw className="w-3 h-3 mr-1" />
            بازنشانی
          </Button>
          <Button onClick={clearLogs} size="sm" variant="outline" className="flex-1">
            پاک کردن
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeDebugPanel;
