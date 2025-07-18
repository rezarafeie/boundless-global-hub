// @ts-nocheck
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Headphones, Search, MessageCircle, RefreshCw, AlertCircle, CheckCircle, Archive, Clock, Tag, ArrowLeft, Plus, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import SupportChatView from '@/components/Chat/SupportChatView';
import SupportStartChatModal from '@/components/Chat/SupportStartChatModal';
import ConversationTags from '@/components/Chat/ConversationTags';

interface ConversationWithUser {
  id: number;
  status: string;
  priority: string;
  last_message_at: string;
  thread_type_id: number;
  tag_list: string[];
  unread_count: number;
  user?: {
    id: number;
    name: string;
    phone: string;
  };
  thread_type?: {
    id: number;
    display_name: string;
  };
}

const BorderlessHubSupportDashboard: React.FC = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showStartChatModal, setShowStartChatModal] = useState(false);

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
      setRefreshing(true);
      console.log('Fetching support conversations...');
      
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('Session token not found');
      }

      const conversationsData = await privateMessageService.getSupportConversations(sessionToken);
      
      console.log('Support conversations loaded:', conversationsData.length);
      setConversations(conversationsData);
      
      if (conversationsData.length > 0) {
        toast({
          title: 'موفق',
          description: `${conversationsData.length} گفتگوی پشتیبانی یافت شد`,
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری گفتگوها',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
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

  const handleStartNewChat = async (user: MessengerUser) => {
    try {
      if (!currentUser) return;
      
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) return;

      console.log('Creating new support conversation with user:', user.id);
      
      // Determine support user ID based on user's boundless status
      const supportUserId = user.bedoun_marz || user.bedoun_marz_approved ? 999998 : 999997;
      
      // Create conversation between the selected user and appropriate support
      const conversationId = await privateMessageService.getOrCreateConversation(
        user.id,
        supportUserId,
        sessionToken
      );

      console.log('New conversation created:', conversationId);
      
      // Refresh conversations to show the new one
      await fetchConversations();
      
      // Find and select the new conversation
      setTimeout(() => {
        const newConversation = conversations.find(conv => 
          conv.user?.id === user.id
        );
        if (newConversation) {
          handleConversationSelect(newConversation);
        }
      }, 1000);
      
      toast({
        title: 'موفق',
        description: `گفتگوی جدید با ${user.name} شروع شد`,
      });
      
    } catch (error) {
      console.error('Error starting new chat:', error);
      toast({
        title: 'خطا',
        description: 'خطا در شروع گفتگوی جدید',
        variant: 'destructive',
      });
    }
  };

  const handleConversationSelect = (conversation: ConversationWithUser) => {
    console.log('Selecting conversation:', conversation.id);
    setSelectedConversation(conversation);
    setShowConversationList(false);
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
  };

  const handleTagsChange = async (conversationId: number, newTags: string[]) => {
    try {
      // Update local state immediately
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, tag_list: newTags }
            : conv
        )
      );
      
      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation(prev => 
          prev ? { ...prev, tag_list: newTags } : null
        );
      }

      // TODO: Here you would typically call an API to update tags in the database
      // For now, we'll just update the local state
      console.log('Tags updated for conversation', conversationId, ':', newTags);
      
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بروزرسانی تگ‌ها',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'assigned': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: 'باز', variant: 'destructive' as const },
      assigned: { label: 'در حال بررسی', variant: 'default' as const },
      resolved: { label: 'حل شده', variant: 'secondary' as const },
      closed: { label: 'بسته', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: 'کم', color: 'bg-gray-100 text-gray-800' },
      normal: { label: 'عادی', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'بالا', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'فوری', color: 'bg-red-100 text-red-800' }
    };
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || priorityMap.normal;
    return (
      <Badge variant="outline" className={`text-xs ${priorityInfo.color}`}>
        {priorityInfo.label}
      </Badge>
    );
  };

  // Get unique tags from all conversations
  const allTags = Array.from(
    new Set(conversations.flatMap(conv => conv.tag_list || []))
  );

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user?.phone.includes(searchTerm) ||
      conv.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;
    const matchesTag = tagFilter === 'all' || (conv.tag_list && conv.tag_list.includes(tagFilter));
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTag;
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
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            {!showConversationList && selectedConversation ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleBackToList}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 text-center">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {selectedConversation.user?.name || 'کاربر نامشخص'}
                  </h3>
                </div>
                <div></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Headphones className="w-6 h-6 text-blue-600" />
                  <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                    پنل پشتیبانی
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowStartChatModal(true)}
                    size="sm"
                    variant="default"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={fetchConversations} 
                    disabled={refreshing}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
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
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowStartChatModal(true)}
                  variant="default"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 ml-1" />
                  شروع گفتگوی جدید
                </Button>
                <Button 
                  onClick={fetchConversations} 
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی'}
                </Button>
              </div>
            </div>
            
            {/* Stats */}
            {conversations.length > 0 && (
              <div className="mt-4 flex gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  کل گفتگوها: {conversations.length}
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                  باز: {conversations.filter(c => c.status === 'open').length}
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                  خوانده نشده: {conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className={`
            ${showConversationList ? 'flex' : 'hidden'} 
            md:flex flex-col w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          `}>
            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
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
                
                <div className="grid grid-cols-1 gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                      <SelectItem value="open">باز</SelectItem>
                      <SelectItem value="assigned">در حال بررسی</SelectItem>
                      <SelectItem value="resolved">حل شده</SelectItem>
                      <SelectItem value="closed">بسته</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="اولویت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه اولویت‌ها</SelectItem>
                      <SelectItem value="low">کم</SelectItem>
                      <SelectItem value="normal">عادی</SelectItem>
                      <SelectItem value="high">بالا</SelectItem>
                      <SelectItem value="urgent">فوری</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="تگ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه تگ‌ها</SelectItem>
                      {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Conversations with Fixed Height and Scrolling */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">
                      {conversations.length === 0 ? 'هیچ گفتگوی پشتیبانی یافت نشد' : 'نتیجه‌ای یافت نشد'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {conversations.length === 0 ? 'هنوز هیچ درخواست پشتیبانی ارسال نشده است' : 'فیلتر جستجو را تغییر دهید'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`p-4 mb-2 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(conversation.status)}
                            <span className="font-medium text-sm">
                              {conversation.user?.name || 'کاربر نامشخص'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(conversation.status)}
                          {getPriorityBadge(conversation.priority)}
                          <Badge variant="outline" className="text-xs">
                            {conversation.thread_type?.display_name}
                          </Badge>
                        </div>
                        
                        {/* Display Tags */}
                        {conversation.tag_list && conversation.tag_list.length > 0 && (
                          <div className="mb-2">
                            <ConversationTags 
                              tags={conversation.tag_list}
                              onTagsChange={(newTags) => handleTagsChange(conversation.id, newTags)}
                              editable={false}
                            />
                          </div>
                        )}
                        
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {conversation.user?.phone}
                        </div>
                        
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(conversation.last_message_at).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className={`
            ${!showConversationList ? 'flex' : 'hidden'} 
            md:flex flex-col flex-1 bg-white dark:bg-slate-800
          `}>
            {selectedConversation ? (
              <div className="flex flex-col h-full">
                {/* Chat Header with Tags */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="md:hidden">
                        <Button variant="ghost" size="sm" onClick={handleBackToList}>
                          <ArrowLeft className="w-5 h-5" />
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {selectedConversation.user?.name || 'کاربر نامشخص'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {selectedConversation.user?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedConversation.status)}
                      {getPriorityBadge(selectedConversation.priority)}
                    </div>
                  </div>
                  
                  {/* Editable Tags */}
                  <div className="mt-3">
                    <ConversationTags 
                      tags={selectedConversation.tag_list || []}
                      onTagsChange={(newTags) => handleTagsChange(selectedConversation.id, newTags)}
                      editable={true}
                    />
                  </div>
                </div>
                
                {/* Chat Content */}
                <div className="flex-1 overflow-hidden">
                  <SupportChatView
                    supportRoom={{
                      id: selectedConversation.thread_type_id?.toString() || '1',
                      name: selectedConversation.thread_type?.display_name || 'پشتیبانی',
                      description: 'گفتگوی پشتیبانی',
                      type: selectedConversation.thread_type_id === 2 ? 'boundless_support' : 'academy_support',
                      icon: <MessageCircle className="w-4 h-4" />,
                      isPermanent: true
                    }}
                    currentUser={currentUser}
                    sessionToken={localStorage.getItem('messenger_session_token') || ''}
                    onBack={handleBackToList}
                    conversationId={selectedConversation.id}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    یک گفتگو را انتخاب کنید
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    برای مشاهده پیام‌ها، یک گفتگو انتخاب کنید
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Chat Modal */}
      <SupportStartChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onUserSelect={handleStartNewChat}
        sessionToken={localStorage.getItem('messenger_session_token') || ''}
        currentUser={currentUser}
      />
    </MainLayout>
  );
};

export default BorderlessHubSupportDashboard;
