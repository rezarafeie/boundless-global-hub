
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Headphones, Search, MessageSquare, Tag, User, Clock, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportService, type SupportConversation } from '@/lib/supportService';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import SupportChatView from '@/components/Support/SupportChatView';

const BorderlessHubSupportDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        navigate('/hub/messenger');
        return;
      }

      const result = await messengerService.validateSession(sessionToken);
      if (!result || !result.user.is_support_agent) {
        toast({
          title: 'دسترسی محدود',
          description: 'شما به این بخش دسترسی ندارید',
          variant: 'destructive',
        });
        navigate('/hub/messenger');
        return;
      }

      setCurrentUser(result.user);
      fetchConversations();
    } catch (error) {
      console.error('Access check failed:', error);
      navigate('/hub/messenger');
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const conversationsData = await supportService.getAllConversations();
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری گفتگوهای پشتیبانی',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMessenger = () => {
    navigate('/hub/messenger');
  };

  const handleConversationSelect = (conversation: SupportConversation) => {
    setSelectedConversation(conversation);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      (conv as any).user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv as any).user?.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: conversations.length,
    open: conversations.filter(c => c.status === 'open').length,
    assigned: conversations.filter(c => c.status === 'assigne' || c.agent_id).length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Headphones className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پشتیبانی...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToMessenger}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>برگشت به پیام‌رسان</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Headphones className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    داشبورد پشتیبانی
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    مدیریت گفتگوهای پشتیبانی
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {currentUser?.name} (پشتیبان)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Panel - Conversations List */}
            <div className="w-1/3 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold text-blue-600">{stats.open}</div>
                    <div className="text-xs text-slate-600">باز</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-lg font-bold text-green-600">{stats.resolved}</div>
                    <div className="text-xs text-slate-600">حل شده</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filter */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Input
                    placeholder="جستجو بر اساس نام یا شماره..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="فیلتر وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="open">باز</SelectItem>
                      <SelectItem value="assigned">اختصاص داده شده</SelectItem>
                      <SelectItem value="resolved">حل شده</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Conversations List */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    گفتگوهای پشتیبانی ({filteredConversations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-950' : ''
                        }`}
                        onClick={() => handleConversationSelect(conversation)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {(conversation as any).user?.name || 'کاربر ناشناس'}
                          </div>
                          <Badge 
                            variant={conversation.status === 'open' ? 'default' : 'secondary'}
                          >
                            {conversation.status === 'open' ? 'باز' : 
                             conversation.status === 'resolved' ? 'حل شده' : 'در حال بررسی'}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {(conversation as any).user?.phone}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {conversation.last_message_at ? 
                            new Date(conversation.last_message_at).toLocaleDateString('fa-IR') : 
                            'بدون پیام'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Chat View */}
            <div className="flex-1">
              {selectedConversation ? (
                <SupportChatView 
                  conversation={selectedConversation}
                  currentUser={currentUser!}
                  onConversationUpdate={fetchConversations}
                />
              ) : (
                <Card className="h-full">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">
                        یک گفتگو را انتخاب کنید
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubSupportDashboard;
