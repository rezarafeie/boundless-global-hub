
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Search, Edit, Trash2, Pin, Tag, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerMessageWithUser, type ChatRoom } from '@/lib/messengerService';
import { chatTopicsService, type ChatTopic } from '@/lib/supabase';

const UnifiedChatManagement: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessengerMessageWithUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) return;

      const [roomsData, topicsData] = await Promise.all([
        messengerService.getRooms(sessionToken),
        chatTopicsService.getAll()
      ]);

      setRooms(roomsData);
      setTopics(topicsData);

      // Fetch messages for selected room or all rooms
      if (selectedRoom) {
        const messagesData = await messengerService.getMessages(selectedRoom, sessionToken);
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری داده‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRoom]);

  const handleDeleteMessage = async (messageId: number) => {
    if (window.confirm('آیا از حذف این پیام اطمینان دارید؟')) {
      try {
        const sessionToken = localStorage.getItem('messenger_session_token');
        if (!sessionToken) return;

        await messengerService.deleteMessage(messageId, sessionToken);
        setMessages(messages.filter(m => m.id !== messageId));
        
        toast({
          title: 'موفق',
          description: 'پیام حذف شد',
        });
      } catch (error) {
        toast({
          title: 'خطا',
          description: 'خطا در حذف پیام',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCreateTopic = async (topicData: { title: string; description: string }) => {
    try {
      await chatTopicsService.create({
        title: topicData.title,
        description: topicData.description,
        is_active: true
      });
      
      // Refresh topics
      const updatedTopics = await chatTopicsService.getAll();
      setTopics(updatedTopics);
      
      toast({
        title: 'موفق',
        description: 'تاپیک جدید ایجاد شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد تاپیک',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (window.confirm('آیا از حذف این تاپیک اطمینان دارید؟')) {
      try {
        await chatTopicsService.delete(topicId);
        setTopics(topics.filter(t => t.id !== topicId));
        
        toast({
          title: 'موفق',
          description: 'تاپیک حذف شد',
        });
      } catch (error) {
        toast({
          title: 'خطا',
          description: 'خطا در حذف تاپیک',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    // Add more filter logic here
    return matchesSearch;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center">در حال بارگذاری...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{rooms.length}</div>
            <div className="text-sm text-slate-600">اتاق‌های چت</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{messages.length}</div>
            <div className="text-sm text-slate-600">پیام‌ها</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{topics.length}</div>
            <div className="text-sm text-slate-600">تاپیک‌ها</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فیلتر و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="جستجو در پیام‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-64"
            />
            <Select value={selectedRoom?.toString() || 'all'} onValueChange={(value) => setSelectedRoom(value === 'all' ? null : parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="انتخاب اتاق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اتاق‌ها</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>مدیریت پیام‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>فرستنده</TableHead>
                <TableHead>پیام</TableHead>
                <TableHead>اتاق</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {message.sender_name || 'ناشناس'}
                      {message.sender?.is_support_agent && (
                        <Badge variant="outline" className="text-xs">پشتیبان</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {message.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.room_id ? `اتاق ${message.room_id}` : 'خصوصی'}
                  </TableCell>
                  <TableCell>
                    {message.created_at ? new Date(message.created_at).toLocaleDateString('fa-IR') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Topics Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              مدیریت تاپیک‌ها
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button>ایجاد تاپیک جدید</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ایجاد تاپیک جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="عنوان تاپیک" />
                  <Input placeholder="توضیحات" />
                  <Button onClick={() => handleCreateTopic({title: 'تست', description: 'تست'})}>
                    ایجاد
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان</TableHead>
                <TableHead>توضیحات</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">{topic.title}</TableCell>
                  <TableCell>{topic.description}</TableCell>
                  <TableCell>
                    <Badge variant={topic.is_active ? "default" : "secondary"}>
                      {topic.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTopic(topic.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedChatManagement;
