import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Headphones, Search, MessageCircle, Send, User, Clock, AlertCircle, CheckCircle, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { supportService, type SupportConversation, type SupportMessage } from '@/lib/supportService';

interface ConversationWithUser extends SupportConversation {
  user?: {
    id: number;
    name: string;
    phone: string;
  };
  thread_type?: {
    id: number;
    display_name: string;
  };
  last_message?: string;
  unread_count?: number;
}

const BorderlessHubSupportDashboard: React.FC = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithUser | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const checkSupportAccess = async () => {
    try {
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('لطفاً ابتدا وارد شوید');
      }

      const result = await messengerService.validateSession(sessionToken);
      if (!result || !result.user.is_support_agent) {
        throw new Error('شما دسترسی به پنل پشتیبانی ندارید');
      }

      setCurrentUser(result.user);
      return true;
    } catch (error: any) {
      console.error('Support access error:', error);
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...');
      const conversationsData = await supportService.getAllConversations();
      console.log('Conversations loaded:', conversationsData.length);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری گفتگوها',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const messagesData = await supportService.getConversationMessages(conversationId);
      console.log('Messages loaded:', messagesData.length);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌ها',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const hasAccess = await checkSupportAccess();
      if (hasAccess) {
        await fetchConversations();
      }
      setLoading(false);
    };

    initialize();
  }, []);

  const handleConversationSelect = async (conversation: ConversationWithUser) => {
    console.log('Selecting conversation:', conversation.id);
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    setSending(true);
    try {
      console.log('Sending message...');
      const sentMessage = await supportService.sendSupportMessage(
        selectedConversation.id,
        newMessage,
        currentUser.id
      );
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      toast({
        title: 'موفق',
        description: 'پیام ارسال شد',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'assigned': return <User className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: 'باز', variant: 'destructive' as const },
      assigned: { label: 'اختصاص یافته', variant: 'default' as const },
      resolved: { label: 'حل شده', variant: 'secondary' as const },
      closed: { label: 'بسته', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user?.phone.includes(searchTerm) ||
      conv.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Headphones className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پنل پشتیبانی...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser || !currentUser.is_support_agent) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <Card className="w-full max-w-md p-6 text-center">
            <Headphones className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              دسترسی غیرمجاز
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              شما دسترسی به پنل پشتیبانی ندارید.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Headphones className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  پنل پشتیبانی
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  مدیریت درخواست‌های پشتیبانی و پاسخگویی به کاربران
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="جستجو در گفتگوها..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="فیلتر وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="open">باز</SelectItem>
                      <SelectItem value="assigned">اختصاص یافته</SelectItem>
                      <SelectItem value="resolved">حل شده</SelectItem>
                      <SelectItem value="closed">بسته</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-y-auto h-full">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">هیچ گفتگویی یافت نشد</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-4 border-b cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        selectedConversation?.id === conversation.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {conversation.user?.name || 'کاربر نامشخص'}
                          </h4>
                          <p className="text-sm text-slate-500">{conversation.user?.phone || 'شماره نامشخص'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(conversation.status || 'open')}
                          {getStatusBadge(conversation.status || 'open')}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{conversation.thread_type?.display_name || 'عمومی'}</span>
                        <span>
                          {conversation.last_message_at 
                            ? new Date(conversation.last_message_at).toLocaleDateString('fa-IR')
                            : ''
                          }
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {selectedConversation.user?.name || 'کاربر نامشخص'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {selectedConversation.thread_type?.display_name || 'عمومی'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={selectedConversation.status || 'open'}
                        onValueChange={(status) => {
                          setSelectedConversation({
                            ...selectedConversation,
                            status: status as any
                          });
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">باز</SelectItem>
                          <SelectItem value="assigned">اختصاص یافته</SelectItem>
                          <SelectItem value="resolved">حل شده</SelectItem>
                          <SelectItem value="closed">بسته</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                          هنوز پیامی در این گفتگو نیست
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.is_from_support ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.is_from_support
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at || '').toLocaleTimeString('fa-IR')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-1 min-h-[44px] max-h-32"
                        disabled={sending}
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || sending}
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      یک گفتگو را انتخاب کنید
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubSupportDashboard;
