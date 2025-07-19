import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, RefreshCw, Clock, User, MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationLog {
  id: string;
  timestamp: string;
  event_type: string;
  user_id: number | null;
  user_name: string | null;
  message: string;
  status: 'success' | 'error' | 'pending';
  details: any;
}

const NotificationLogs: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch from push notification logs (if available)
      const pushLogs = await fetchPushNotificationLogs();
      const messageLogs = await fetchMessageLogs();
      const tokenLogs = await fetchTokenLogs();
      
      const combinedLogs = [...pushLogs, ...messageLogs, ...tokenLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100); // Last 100 logs
      
      setLogs(combinedLogs);
    } catch (error) {
      console.error('Error fetching notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPushNotificationLogs = async (): Promise<NotificationLog[]> => {
    // For now, return mock data since edge_logs table doesn't exist
    return [
      {
        id: `push_${Date.now()}`,
        timestamp: new Date().toISOString(),
        event_type: 'push_notification',
        user_id: null,
        user_name: null,
        message: 'Push notification system ready',
        status: 'success',
        details: { source: 'system' }
      }
    ];
  };

  const fetchMessageLogs = async (): Promise<NotificationLog[]> => {
    // Fetch recent messenger messages that should trigger notifications
    const { data: messages } = await supabase
      .from('messenger_messages')
      .select(`
        id,
        message,
        created_at,
        sender_id,
        recipient_id,
        conversation_id
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get sender names separately
    const senderIds = [...new Set(messages?.map(m => m.sender_id).filter(Boolean))];
    const { data: users } = await supabase
      .from('chat_users')
      .select('id, name')
      .in('id', senderIds);

    const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

    return (messages || []).map(msg => ({
      id: `msg_${msg.id}`,
      timestamp: msg.created_at || new Date().toISOString(),
      event_type: 'message_sent',
      user_id: msg.sender_id,
      user_name: userMap.get(msg.sender_id!) || 'Unknown',
      message: `Message sent: "${msg.message.substring(0, 50)}..."`,
      status: 'success' as const,
      details: { messageId: msg.id, recipientId: msg.recipient_id }
    }));
  };

  const fetchTokenLogs = async (): Promise<NotificationLog[]> => {
    // Check users with notification tokens
    const { data: users } = await supabase
      .from('chat_users')
      .select('id, name, notification_token, notification_enabled, updated_at')
      .not('notification_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(20);

    return (users || []).map(user => ({
      id: `token_${user.id}`,
      timestamp: user.updated_at || new Date().toISOString(),
      event_type: 'token_update',
      user_id: user.id,
      user_name: user.name,
      message: `Token ${user.notification_enabled ? 'enabled' : 'disabled'} for user`,
      status: user.notification_token ? 'success' : 'error',
      details: { hasToken: !!user.notification_token, enabled: user.notification_enabled }
    }));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'push_notification':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'token_update':
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    const labels = {
      push_notification: 'Push Notification',
      message_sent: 'Message Sent',
      token_update: 'Token Update',
    };
    return labels[eventType as keyof typeof labels] || eventType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            گزارش‌های اعلان ({logs.length})
          </div>
          <Button 
            onClick={fetchLogs} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>زمان</TableHead>
                <TableHead>نوع رویداد</TableHead>
                <TableHead>کاربر</TableHead>
                <TableHead>پیام</TableHead>
                <TableHead>وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString('fa-IR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEventIcon(log.event_type)}
                      <Badge variant="outline">
                        {getEventLabel(log.event_type)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.user_name ? (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user_name}
                      </div>
                    ) : (
                      <span className="text-slate-400">سیستم</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{log.message}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <Badge 
                        variant={log.status === 'success' ? 'default' : 
                               log.status === 'error' ? 'destructive' : 'secondary'}
                      >
                        {log.status === 'success' ? 'موفق' : 
                         log.status === 'error' ? 'خطا' : 'در انتظار'}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    هیچ گزارشی یافت نشد
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationLogs;