
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, MessageCircle, Edit, Trash2, Plus, Users, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerMessageWithUser } from '@/lib/messengerService';

// Define ChatTopic type locally since it's not exported
type ChatTopic = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const UnifiedChatManagement = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessengerMessageWithUser[]>([]);
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic | null>(null);
  const [topicForm, setTopicForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch messages and topics - using placeholder data for now
      setMessages([]);
      setTopics([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      // Implement message deletion
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
  };

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      // Implement message editing
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, message: newContent } : m
      ));
      toast({
        title: 'موفق',
        description: 'پیام ویرایش شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ویرایش پیام',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTopic = async () => {
    try {
      // Implement topic creation
      const newTopic: ChatTopic = {
        id: Date.now(),
        name: topicForm.name,
        description: topicForm.description,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setTopics([...topics, newTopic]);
      setShowTopicDialog(false);
      setTopicForm({ name: '', description: '' });
      
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
    try {
      // Implement topic deletion
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
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    // Add more filtering logic based on message type
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            پیام‌ها
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            تاپیک‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مدیریت پیام‌ها</CardTitle>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="جستجو در پیام‌ها..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="نوع چت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه پیام‌ها</SelectItem>
                    <SelectItem value="support">پشتیبانی</SelectItem>
                    <SelectItem value="public">عمومی</SelectItem>
                    <SelectItem value="boundless">بدون مرز</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  هیچ پیامی یافت نشد
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {message.user?.name || 'کاربر ناشناس'}
                            </span>
                            <Badge variant="outline">
                              {message.room_id ? `اتاق ${message.room_id}` : 'عمومی'}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {message.created_at ? 
                                new Date(message.created_at).toLocaleDateString('fa-IR') : 
                                ''
                              }
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">
                            {message.message}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newContent = prompt('محتوای جدید:', message.message);
                              if (newContent) handleEditMessage(message.id, newContent);
                            }}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>مدیریت تاپیک‌ها</CardTitle>
                <Button onClick={() => setShowTopicDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  تاپیک جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : topics.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  هیچ تاپیکی وجود ندارد
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topics.map((topic) => (
                    <Card key={topic.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{topic.name}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant={topic.is_active ? 'default' : 'secondary'}>
                              {topic.is_active ? 'فعال' : 'غیرفعال'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTopic(topic.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-400">
                          {topic.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Topic Dialog */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد تاپیک جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">نام تاپیک</label>
              <Input
                value={topicForm.name}
                onChange={(e) => setTopicForm({...topicForm, name: e.target.value})}
                placeholder="نام تاپیک را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">توضیحات</label>
              <Textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                placeholder="توضیحات تاپیک را وارد کنید"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowTopicDialog(false)}>
                انصراف
              </Button>
              <Button onClick={handleCreateTopic} disabled={!topicForm.name}>
                ایجاد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedChatManagement;
