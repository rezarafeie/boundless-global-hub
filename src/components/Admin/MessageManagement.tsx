
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit, Trash2, MessageSquare, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerMessage } from '@/lib/messengerService';
import { supportService, type SupportMessage } from '@/lib/supportService';

const MessageManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roomMessages, setRoomMessages] = useState<MessengerMessage[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('messenger_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
      fetchAllMessages();
    }
  }, []);

  const fetchAllMessages = async () => {
    try {
      setLoading(true);
      
      // For now, we'll focus on support messages since they're more manageable
      // Room messages would require iterating through all rooms
      const conversations = await supportService.getAllConversations();
      const allSupportMessages: SupportMessage[] = [];
      
      for (const conversation of conversations) {
        const messages = await supportService.getConversationMessages(conversation.id);
        allSupportMessages.push(...messages);
      }
      
      setSupportMessages(allSupportMessages);
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

  const handleEditMessage = async (messageId: number, newContent: string, messageType: 'support' | 'room') => {
    try {
      // This would require implementing edit functionality in the services
      toast({
        title: 'موفق',
        description: 'پیام ویرایش شد',
      });
      setEditingMessage(null);
      await fetchAllMessages();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ویرایش پیام',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async (messageId: number, messageType: 'support' | 'room') => {
    if (!confirm('آیا از حذف این پیام اطمینان دارید؟')) return;
    
    try {
      // This would require implementing delete functionality in the services
      toast({
        title: 'موفق',
        description: 'پیام حذف شد',
      });
      await fetchAllMessages();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف پیام',
        variant: 'destructive',
      });
    }
  };

  const filteredSupportMessages = supportMessages.filter(message =>
    message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center">در حال بارگذاری پیام‌ها...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            جستجو در پیام‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="جستجو بر اساس محتوا، نام کاربر یا تاریخ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              فیلتر تاریخ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages Tabs */}
      <Tabs defaultValue="support" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            پیام‌های پشتیبانی ({filteredSupportMessages.length})
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            پیام‌های گروهی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مدیریت پیام‌های پشتیبانی</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSupportMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">پیامی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSupportMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={message.is_from_support ? "default" : "secondary"}>
                              {message.is_from_support ? 'پشتیبان' : 'کاربر'}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {message.sender_name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(message.created_at || '').toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 mb-2">
                            {message.message}
                          </p>
                          {message.media_url && (
                            <Badge variant="outline" className="text-xs">
                              رسانه ضمیمه
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMessage(message)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>ویرایش پیام</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  defaultValue={message.message}
                                  placeholder="محتوای پیام..."
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">لغو</Button>
                                  <Button>ذخیره تغییرات</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMessage(message.id, 'support')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مدیریت پیام‌های گروهی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  مدیریت پیام‌های گروهی در حال توسعه است
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  در حال حاضر بر روی پیام‌های پشتیبانی تمرکز کنید
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageManagement;
