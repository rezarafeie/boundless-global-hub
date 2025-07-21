// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Headphones, Search, MessageCircle, RefreshCw, AlertCircle, CheckCircle, Archive, Clock, Tag, ArrowLeft, Plus, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { supportMessageService } from '@/lib/supportMessageService';
import SupportChatView from '@/components/Chat/SupportChatView';
import SupportStartChatModal from '@/components/Chat/SupportStartChatModal';
import ConversationTags from '@/components/Chat/ConversationTags';
import UserProfilePopup from '@/components/Chat/UserProfilePopup';

interface ConversationWithUser {
  id: number;
  status: string;
  priority: string;
  last_message_at: string;
  thread_type_id: number;
  tag_list: string[];
  unread_count: number;
  user_id: number;
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
  const [searchParams] = useSearchParams();
  const forceAccess = searchParams.get('force_access') === 'true';
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
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const checkSupportAccess = async () => {
    try {
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('لطفاً ابتدا وارد شوید');
      }

      console.log('Validating session with token:', sessionToken?.substring(0, 10) + '...');
      const result = await messengerService.validateSession(sessionToken);
      console.log('Validation result:', result);
      
      if (!result) {
        throw new Error('نتیجه احراز هویت خالی است');
      }
      
      console.log('User data:', result);
      console.log('is_support_agent:', result.is_support_agent);
      console.log('is_messenger_admin:', result.is_messenger_admin);

      // Check if user is support agent OR admin (or force access is enabled)
      if (!forceAccess && !result.is_support_agent && !result.is_messenger_admin) {
        throw new Error(`شما دسترسی به پنل پشتیبانی ندارید. is_support_agent: ${result.is_support_agent}, is_messenger_admin: ${result.is_messenger_admin}`);
      }

      setCurrentUser(result);
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
      
      const conversationsData = await supportMessageService.getAllConversations();
      
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
      console.log('Initializing support dashboard, force access:', forceAccess);
      const hasAccess = await checkSupportAccess();
      if (hasAccess || forceAccess) {
        console.log('Access granted, fetching conversations...');
        await fetchConversations();
      } else {
        console.log('Access denied and no force access');
      }
      setLoading(false);
    };

    initialize();
  }, [forceAccess]);

  const handleStartNewChat = async (user: MessengerUser) => {
    try {
      if (!currentUser) return;
      
      console.log('Creating new support conversation with user:', user.id);
      
      // Determine thread type based on user's boundless status
      const threadTypeId = user.bedoun_marz || user.bedoun_marz_approved ? 2 : 1;
      
      // Create conversation for the selected user
      const conversationId = await supportMessageService.getOrCreateUserConversation(
        user.id,
        threadTypeId
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
    console.log('Selecting conversation:', {
      conversationId: conversation.id,
      userId: conversation.user_id,
      userFromNestedObject: conversation.user?.id,
      userPhone: conversation.user?.phone,
      userName: conversation.user?.name
    });
    
    // Ensure we have the correct user_id
    if (!conversation.user_id && conversation.user?.id) {
      conversation.user_id = conversation.user.id;
    }
    
    setSelectedConversation(conversation);
    setShowConversationList(false);
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
  };

  const handleUserNameClick = (userId: number) => {
    setSelectedUserId(userId.toString());
    setShowUserProfile(true);
  };

  const handleCloseUserProfile = () => {
    setShowUserProfile(false);
    setSelectedUserId(null);
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

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
      <div className="flex h-screen bg-white dark:bg-slate-800 items-center justify-center">
        <div className="text-center">
          <Headphones className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پنل پشتیبانی...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || (!forceAccess && !currentUser.is_support_agent && !currentUser.is_messenger_admin)) {
    return (
      <div className="flex h-screen bg-white dark:bg-slate-800 items-center justify-center">
        <div className="text-center p-6">
          <Headphones className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            دسترسی غیرمجاز
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            شما دسترسی به پنل پشتیبانی ندارید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-800 overflow-hidden">
      {/* Left sidebar - hide on mobile when chat is selected */}
      <div className={`${!showConversationList ? 'hidden' : ''} md:flex w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-700 flex-col`}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Headphones className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                  پنل پشتیبانی
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {conversations.length} گفتگو
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowStartChatModal(true)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
              <Button 
                onClick={fetchConversations} 
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در گفتگوها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-sm"
              dir="rtl"
            />
          </div>

          {/* Simple filter tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="flex-1 h-8 text-xs"
            >
              همه
            </Button>
            <Button
              variant={statusFilter === 'open' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('open')}
              className="flex-1 h-8 text-xs"
            >
              باز
            </Button>
            <Button
              variant={statusFilter === 'assigned' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('assigned')}
              className="flex-1 h-8 text-xs"
            >
              در بررسی
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-500 mb-2">
                  {conversations.length === 0 ? 'هیچ گفتگوی پشتیبانی یافت نشد' : 'نتیجه‌ای یافت نشد'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2" dir="rtl">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`flex items-center gap-3 p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback 
                        className="text-white font-medium text-sm"
                        style={{ backgroundColor: getAvatarColor(conversation.user?.name || 'کاربر') }}
                      >
                        {(conversation.user?.name || 'ک').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.status === 'open' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate text-right">
                        {conversation.user?.name || 'کاربر نامشخص'}
                      </p>
                      <div className="flex items-center gap-2">
                        {conversation.unread_count > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                            {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                          </div>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(conversation.last_message_at).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-right flex-1 truncate">
                        {conversation.user?.phone}
                      </p>
                      <div className="flex gap-1">
                        {conversation.priority !== 'normal' && (
                          <Badge variant="outline" className="text-xs h-5 px-1">
                            {conversation.priority === 'high' ? 'بالا' : 
                             conversation.priority === 'urgent' ? 'فوری' : 
                             conversation.priority === 'low' ? 'کم' : conversation.priority}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs h-5 px-1">
                          {conversation.thread_type?.display_name || 'عادی'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right chat view - show on mobile when chat is selected */}
      <div className={`${showConversationList ? 'hidden' : ''} md:flex flex-1 bg-slate-50 dark:bg-slate-900 min-h-0`}>
        {selectedConversation ? (
          <div className="flex flex-col w-full h-full">
            {/* Chat Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBackToList} className="md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <Avatar className="w-10 h-10">
                  <AvatarFallback 
                    className="text-white font-medium"
                    style={{ backgroundColor: getAvatarColor(selectedConversation.user?.name || 'کاربر') }}
                  >
                    {(selectedConversation.user?.name || 'ک').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 
                    className="font-medium text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => selectedConversation.user?.id && handleUserNameClick(selectedConversation.user.id)}
                  >
                    {selectedConversation.user?.name || 'کاربر نامشخص'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedConversation.user?.phone}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedConversation.status)}
                  {selectedConversation.priority !== 'normal' && getPriorityBadge(selectedConversation.priority)}
                </div>
              </div>
              
              {/* Tags */}
              {selectedConversation.tag_list && selectedConversation.tag_list.length > 0 && (
                <div className="mt-3">
                  <ConversationTags 
                    tags={selectedConversation.tag_list}
                    onTagsChange={(newTags) => handleTagsChange(selectedConversation.id, newTags)}
                    editable={true}
                  />
                </div>
              )}
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
                recipientUserId={selectedConversation.user_id || selectedConversation.user?.id}
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

      {/* Start Chat Modal */}
      <SupportStartChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onUserSelect={handleStartNewChat}
        sessionToken={localStorage.getItem('messenger_session_token') || ''}
        currentUser={currentUser}
      />

      {/* User Profile Popup */}
      <UserProfilePopup
        isOpen={showUserProfile}
        onClose={handleCloseUserProfile}
        userId={selectedUserId}
      />
    </div>
  );
};

export default BorderlessHubSupportDashboard;
