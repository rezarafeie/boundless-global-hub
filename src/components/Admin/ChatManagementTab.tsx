
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerMessage } from '@/lib/messengerService';

const ChatManagementTab = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching all messages...');
      
      const allMessages = await messengerService.getAllMessages();
      console.log('Fetched messages:', allMessages.length);
      
      setMessages(allMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setError(error.message || 'خطا در بارگذاری پیام‌ها');
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDeleteMessage = async (messageId: number) => {
    try {
      setDeleting(messageId);
      await messengerService.deleteMessage(messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: 'موفق',
        description: 'پیام حذف شد',
      });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف پیام',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>مدیریت پیام‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span>در حال بارگذاری پیام‌ها...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>مدیریت پیام‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">خطا در بارگذاری پیام‌ها</p>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <Button onClick={fetchMessages} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>مدیریت پیام‌ها ({messages.length})</span>
          <Button onClick={fetchMessages} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            به‌روزرسانی
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">هیچ پیامی یافت نشد</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>فرستنده</TableHead>
                <TableHead>پیام</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{message.sender?.name || 'نامشخص'}</p>
                      <p className="text-xs text-slate-500">{message.sender?.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="truncate" title={message.message}>
                        {message.message}
                      </p>
                      {message.room_id && (
                        <Badge variant="outline" className="text-xs mt-1">
                          اتاق: {message.room_id}
                        </Badge>
                      )}
                      {message.conversation_id && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          گفتگو: {message.conversation_id}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={message.message_type === 'text' ? 'default' : 'secondary'}>
                      {message.message_type || 'text'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {formatDate(message.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteMessage(message.id)}
                      disabled={deleting === message.id}
                    >
                      {deleting === message.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatManagementTab;
