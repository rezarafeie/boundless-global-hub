
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Search, Trash2, Edit, Pin, User, Calendar, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService } from '@/lib/messengerService';

interface MessageWithDetails {
  id: number;
  message: string;
  sender_name?: string;
  sender_id?: number;
  room_id?: number;
  created_at: string;
  message_type?: string;
  is_pinned?: boolean;
}

const ChatManagementPanel = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<MessageWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const allMessages = await messengerService.getAllMessages();
      setMessages(allMessages);
      setFilteredMessages(allMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
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

  useEffect(() => {
    if (searchTerm) {
      const filtered = messages.filter(message =>
        message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.id.toString().includes(searchTerm)
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [messages, searchTerm]);

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messengerService.deleteMessage(messageId);
      toast({
        title: 'موفق',
        description: 'پیام حذف شد',
      });
      fetchMessages();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف پیام',
        variant: 'destructive',
      });
    }
  };

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'file':
        return '📎';
      default:
        return '💬';
    }
  };

  const getStatsCards = () => {
    const stats = {
      total: messages.length,
      pinned: messages.filter(m => m.is_pinned).length,
      media: messages.filter(m => m.message_type && m.message_type !== 'text').length,
      recent: messages.filter(m => {
        const messageDate = new Date(m.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - messageDate.getTime();
        return timeDiff < (24 * 60 * 60 * 1000); // Last 24 hours
      }).length
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-slate-600">کل پیام‌ها</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Pin className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold">{stats.pinned}</p>
            <p className="text-sm text-slate-600">سنجاق شده</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl mb-2 block">🎥</span>
            <p className="text-2xl font-bold">{stats.media}</p>
            <p className="text-sm text-slate-600">رسانه</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.recent}</p>
            <p className="text-sm text-slate-600">امروز</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>در حال بارگذاری پیام‌ها...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {getStatsCards()}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="جستجو در پیام‌ها، فرستنده یا شناسه پیام..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            مدیریت پیام‌ها ({filteredMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>پیام</TableHead>
                  <TableHead>فرستنده</TableHead>
                  <TableHead>اتاق</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getMessageTypeIcon(message.message_type)}</span>
                        <div>
                          <p className="text-sm line-clamp-2">{message.message}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Hash className="w-3 h-3" />
                            {message.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">{message.sender_name || 'نامشخص'}</p>
                          <p className="text-xs text-slate-400">ID: {message.sender_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.room_id ? (
                        <Badge variant="outline">اتاق {message.room_id}</Badge>
                      ) : (
                        <Badge variant="secondary">خصوصی</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {message.message_type || 'text'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(message.created_at).toLocaleDateString('fa-IR')}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(message.created_at).toLocaleTimeString('fa-IR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.is_pinned && (
                        <Badge className="bg-amber-100 text-amber-800">
                          <Pin className="w-3 h-3 mr-1" />
                          سنجاق شده
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredMessages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchTerm ? 'هیچ پیامی یافت نشد' : 'هنوز پیامی ارسال نشده است'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatManagementPanel;
