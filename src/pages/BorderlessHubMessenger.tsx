
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import MessengerInbox from '@/components/Chat/MessengerInbox';
import MessengerChatView from '@/components/Chat/MessengerChatView';
import PrivateChatView from '@/components/Chat/PrivateChatView';
import MobileMessengerHeader from '@/components/Chat/MobileMessengerHeader';
import ExactSearchModal from '@/components/Chat/ExactSearchModal';
import UsernameSetupModal from '@/components/Chat/UsernameSetupModal';
import SupportChatView from '@/components/Chat/SupportChatView';
import UserSettingsModal from '@/components/Chat/UserSettingsModal';
import { ProfileSettingsModal } from '@/components/Chat/ProfileSettingsModal';
import NotificationPermissionBanner from '@/components/Chat/NotificationPermissionBanner';
import { messengerService, type MessengerUser, type ChatRoom } from '@/lib/messengerService';
import { privateMessageService, type PrivateConversation } from '@/lib/privateMessageService';
import { useNotificationService } from '@/hooks/useNotificationService';
import { useUserPresence } from '@/hooks/useUserPresence';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, ArrowRight, Headphones, Plus, Users, User, MessageSquare } from 'lucide-react';

interface SupportRoom {
  id: string;
  name: string;
  description: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  isPermanent: true;
}

interface MessengerSupportRoom {
  id: string;
  name: string;
  description: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  isPermanent: true;
}

interface UnifiedChatItem {
  id: string;
  type: 'private' | 'room' | 'support';
  name: string;
  description?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isPermanent?: boolean;
  data: PrivateConversation | ChatRoom | MessengerSupportRoom;
}

type ViewType = 'inbox' | 'room-chat' | 'private-chat' | 'support-chat';

const BorderlessHubMessenger: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<PrivateConversation | null>(null);
  const [selectedSupportRoom, setSelectedSupportRoom] = useState<MessengerSupportRoom | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('inbox');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showExactSearchModal, setShowExactSearchModal] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [privateConversations, setPrivateConversations] = useState<PrivateConversation[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [unifiedChats, setUnifiedChats] = useState<UnifiedChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize notification service for desktop (only when user is available)
  const notificationService = useNotificationService({
    currentUser,
    sessionToken
  });

  // Track user presence when logged in
  useUserPresence({
    userId: currentUser?.id || null,
    enabled: !!currentUser && !!sessionToken
  });

  const showPermissionBanner = currentUser ? notificationService.showPermissionBanner : false;
  const requestNotificationPermission = currentUser ? notificationService.requestNotificationPermission : () => Promise.resolve(false);
  const dismissPermissionBanner = currentUser ? notificationService.dismissPermissionBanner : () => {};

  // Support rooms based on user access - always show these
  const getSupportRooms = (): MessengerSupportRoom[] => {
    if (!currentUser) return [];
    
    const supportRooms: MessengerSupportRoom[] = [
      {
        id: 'academy_support',
        name: '🎓 پشتیبانی آکادمی رفیعی',
        description: 'پشتیبانی عمومی برای همه کاربران',
        type: 'academy_support',
        icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
        isPermanent: true
      }
    ];

    // Add boundless support only for boundless users
    if (currentUser?.bedoun_marz || currentUser?.bedoun_marz_approved) {
      supportRooms.push({
        id: 'boundless_support',
        name: '🌐 پشتیبانی بدون مرز',
        description: 'پشتیبانی ویژه اعضای بدون مرز',
        type: 'boundless_support',
        icon: <Headphones className="w-4 h-4 text-purple-500" />,
        isPermanent: true
      });
    }

    return supportRooms;
  };

  useEffect(() => {
    checkExistingSession();
  }, []);

  useEffect(() => {
    if (currentUser && sessionToken) {
      loadAllChats();
      
      if (!currentUser.username) {
        setShowUsernameSetup(true);
      }
    }
  }, [currentUser, sessionToken]);

  useEffect(() => {
    if (!currentUser) return;

    // Get support rooms - always show these at the top
    const supportRooms = getSupportRooms();
    
    // Combine and sort all chats with support rooms always at top
    const combined: UnifiedChatItem[] = [
      // Support rooms first (permanent and always at top)
      ...supportRooms.map(room => ({
        id: `support-${room.id}`,
        type: 'support' as const,
        name: room.name,
        description: room.description,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isPermanent: true,
        data: room
      })),
      // Private conversations
      ...privateConversations.map(conv => ({
        id: `private-${conv.id}`,
        type: 'private' as const,
        name: conv.other_user?.name || 'کاربر',
        lastMessage: conv.last_message,
        lastMessageTime: conv.last_message_at,
        unreadCount: conv.unread_count,
        data: conv
      })),
      // Regular rooms
      ...rooms.map(room => ({
        id: `room-${room.id}`,
        type: 'room' as const,
        name: room.name,
        description: room.description,
        lastMessage: room.last_message,
        lastMessageTime: room.last_message_time,
        unreadCount: room.unread_count,
        data: room
      }))
    ];

    // Sort: support rooms first (permanent), then by unread, then by last message time
    combined.sort((a, b) => {
      // Support rooms always first
      if (a.isPermanent && !b.isPermanent) return -1;
      if (!a.isPermanent && b.isPermanent) return 1;
      
      // If both are permanent (support rooms), maintain original order
      if (a.isPermanent && b.isPermanent) return 0;
      
      // For non-permanent items, sort by unread first
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      
      // Then by last message time
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      
      return timeB - timeA;
    });

    setUnifiedChats(combined);
  }, [privateConversations, rooms, currentUser]);

  const checkExistingSession = async () => {
    const token = localStorage.getItem('messenger_session_token');
    if (token) {
      try {
        const result = await messengerService.validateSession(token);
        if (result) {
          setCurrentUser(result.user);
          setSessionToken(token);
          
          if (!result.user.is_approved) {
            navigate('/hub/messenger/pending', { replace: true });
            return;
          }
        } else {
          localStorage.removeItem('messenger_session_token');
        }
      } catch (error) {
        localStorage.removeItem('messenger_session_token');
        console.error('Session validation error:', error);
      }
    }
    setLoading(false);
  };

  const loadAllChats = async () => {
    if (!currentUser || !sessionToken) return;
    
    try {
      const [conversations, chatRooms] = await Promise.all([
        privateMessageService.getUserConversations(currentUser.id, sessionToken),
        messengerService.getRooms(sessionToken)
      ]);
      
      // Show all active rooms - no filtering
      const activeRooms = chatRooms.filter(room => room.is_active);
      
      setPrivateConversations(conversations);
      setRooms(activeRooms);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const handleAuthenticated = (token: string, userName: string, user: MessengerUser) => {
    setSessionToken(token);
    setCurrentUser(user);
    localStorage.setItem('messenger_session_token', token);
    
    if (!user.is_approved) {
      navigate('/hub/messenger/pending', { replace: true });
      return;
    }
    
    toast({
      title: 'خوش آمدید!',
      description: `${userName} عزیز، به پیام‌رسان بدون مرز خوش آمدید.`,
    });
  };

  const handleChatSelect = (chat: UnifiedChatItem) => {
    if (chat.type === 'private') {
      setSelectedConversation(chat.data as PrivateConversation);
      setSelectedRoom(null);
      setSelectedSupportRoom(null);
      setCurrentView('private-chat');
    } else if (chat.type === 'support') {
      setSelectedSupportRoom(chat.data as MessengerSupportRoom);
      setSelectedRoom(null);
      setSelectedConversation(null);
      setCurrentView('support-chat');
    } else {
      setSelectedRoom(chat.data as ChatRoom);
      setSelectedConversation(null);
      setSelectedSupportRoom(null);
      setCurrentView('room-chat');
    }
    setShowMobileChat(true);
  };

  const handleStartChatWithUser = async (user: MessengerUser) => {
    if (!currentUser || !sessionToken) return;
    
    try {
      const conversationId = await privateMessageService.getOrCreateConversation(
        currentUser.id,
        user.id,
        sessionToken
      );
      
      const conversation: PrivateConversation = {
        id: conversationId,
        user1_id: Math.min(currentUser.id, user.id),
        user2_id: Math.max(currentUser.id, user.id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        other_user: user
      };
      
      setSelectedConversation(conversation);
      setSelectedRoom(null);
      setSelectedSupportRoom(null);
      setCurrentView('private-chat');
      setShowMobileChat(true);
      await loadAllChats();
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'خطا',
        description: 'امکان شروع گفتگو وجود ندارد',
        variant: 'destructive'
      });
    }
  };

  const handleBackToInbox = () => {
    setShowMobileChat(false);
    setSelectedRoom(null);
    setSelectedConversation(null);
    setSelectedSupportRoom(null);
    setCurrentView('inbox');
  };

  const handleBackToHub = () => {
    navigate('/hub');
  };

  const handleLogout = () => {
    if (sessionToken) {
      messengerService.deactivateSession(sessionToken);
    }
    localStorage.removeItem('messenger_session_token');
    setCurrentUser(null);
    setSessionToken(null);
    setSelectedRoom(null);
    setSelectedConversation(null);
    setSelectedSupportRoom(null);
    setShowMobileChat(false);
    toast({
      title: 'خروج موفق',
      description: 'از پیام‌رسان خارج شدید.',
    });
  };

  const handleUsernameSet = async (username: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, username });
      toast({
        title: 'موفق',
        description: 'نام کاربری شما تنظیم شد',
      });
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getChatIcon = (chat: UnifiedChatItem) => {
    if (chat.type === 'private') {
      return <User className="w-4 h-4 text-blue-500" />;
    } else if (chat.type === 'support') {
      const supportRoom = chat.data as MessengerSupportRoom;
      return supportRoom.icon;
    } else {
      const room = chat.data as ChatRoom;
      if (room.type === 'academy_support') {
        return <span className="text-lg">🎓</span>;
      } else if (room.type === 'boundless_support') {
        return <Headphones className="w-4 h-4 text-blue-500" />;
      } else {
        return <Users className="w-4 h-4 text-green-500" />;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <UnifiedMessengerAuth onAuthenticated={handleAuthenticated} />;
  }

  if (!currentUser.is_approved) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <MessageCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            در انتظار تایید
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            حساب شما هنوز توسط مدیریت تایید نشده است. لطفاً منتظر باشید.
          </p>
          <button
            onClick={handleLogout}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            خروج از حساب
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Notification Permission Banner - Desktop */}
      {showPermissionBanner && (
        <NotificationPermissionBanner
          onRequestPermission={requestNotificationPermission}
          onDismiss={dismissPermissionBanner}
          pushSupported={notificationService.permissionState.pushSupported}
        />
      )}
      {/* Mobile Header */}
      {showMobileChat ? (
        <div className="md:hidden">
          {currentUser && (
            <MobileMessengerHeader
              onBack={handleBackToInbox}
              onLogout={handleLogout}
              currentUser={currentUser}
              onProfileClick={() => setShowUserSettings(true)}
            />
          )}
        </div>
      ) : (
        <div className="md:hidden">
          {currentUser && (
            <MobileMessengerHeader
              onBack={handleBackToHub}
              onLogout={handleLogout}
              currentUser={currentUser}
              onProfileClick={() => setShowUserSettings(true)}
            />
          )}
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden md:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToHub}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowRight className="w-5 h-5" />
              <span>برگشت به هاب</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              پیام‌رسان بدون مرز
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.is_support_agent && (
              <button
                onClick={() => navigate('/hub/support')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Headphones className="w-4 h-4" />
                🎧 پنل پشتیبانی
              </button>
            )}
            <button
              onClick={() => setShowProfileSettings(true)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={currentUser.avatar_url} alt={currentUser.name} />
                <AvatarFallback 
                  style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                  className="text-white font-medium text-xs"
                >
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {currentUser.name}
                {currentUser.username && (
                  <span className="text-xs text-blue-600 block">@{currentUser.username}</span>
                )}
              </span>
              <User className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-600"
            >
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex">
        {/* Desktop Layout */}
        <div className="hidden md:flex w-full">
          {/* Left Panel - Unified Chat List */}
          <div className="w-1/3 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <h2 className="font-semibold">همه گفتگوها</h2>
            </div>

            {/* Unified Chat List */}
            <div className="flex-1 overflow-hidden">
              {unifiedChats.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">هنوز گفتگویی ندارید</p>
                    <p className="text-xs text-slate-400 mt-1">از دکمه + برای شروع گفتگو استفاده کنید</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {unifiedChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        (selectedConversation && chat.id === `private-${selectedConversation.id}`) ||
                        (selectedRoom && chat.id === `room-${selectedRoom.id}`) ||
                        (selectedSupportRoom && chat.id === `support-${selectedSupportRoom.id}`)
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback 
                            style={{ backgroundColor: getAvatarColor(chat.name) }}
                            className="text-white font-medium"
                          >
                            {chat.type === 'support' ? (
                              (chat.data as MessengerSupportRoom).type === 'academy_support' ? '🎓' : '🌐'
                            ) : (
                              chat.name.charAt(0)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1">
                          {getChatIcon(chat)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm truncate">
                            {chat.name}
                          </div>
                          {chat.unreadCount! > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {chat.description && (
                          <div className="text-xs text-slate-500 truncate">
                            {chat.description}
                          </div>
                        )}
                        {chat.lastMessage && (
                          <div className="text-xs text-slate-500 truncate">
                            {chat.lastMessage}
                          </div>
                        )}
                        {chat.lastMessageTime && !chat.isPermanent && (
                          <div className="text-xs text-slate-400">
                            {new Date(chat.lastMessageTime).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Chat View */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900">
            {currentView === 'room-chat' && selectedRoom ? (
              <MessengerChatView
                selectedRoom={selectedRoom}
                selectedUser={null}
                currentUser={currentUser}
                sessionToken={sessionToken!}
              />
            ) : currentView === 'private-chat' && selectedConversation ? (
              <PrivateChatView
                conversation={selectedConversation}
                currentUser={currentUser}
                sessionToken={sessionToken!}
                onBack={handleBackToInbox}
              />
            ) : currentView === 'support-chat' && selectedSupportRoom ? (
              <SupportChatView
                supportRoom={selectedSupportRoom}
                currentUser={currentUser}
                sessionToken={sessionToken!}
                onBack={handleBackToInbox}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    یک گفتگو را انتخاب کنید
                  </p>
                  {currentUser?.is_support_agent && (
                    <button
                      onClick={() => navigate('/hub/support')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto mt-4"
                    >
                      <Headphones className="w-4 h-4" />
                      🎧 ورود به پنل پشتیبانی
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full">
          {!showMobileChat ? (
            <div className="bg-white dark:bg-slate-800 h-full flex flex-col">
              {/* Mobile Header */}
              <div className="p-4 border-b">
                <h2 className="font-semibold">همه گفتگوها</h2>
              </div>

              {/* Mobile Unified Chat List */}
              <div className="flex-1 overflow-hidden">
                {unifiedChats.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">هنوز گفتگویی ندارید</p>
                      <p className="text-xs text-slate-400 mt-1">از دکمه + برای شروع گفتگو استفاده کنید</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {unifiedChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleChatSelect(chat)}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback 
                              style={{ backgroundColor: getAvatarColor(chat.name) }}
                              className="text-white font-medium"
                            >
                              {chat.type === 'support' ? (
                                (chat.data as MessengerSupportRoom).type === 'academy_support' ? '🎓' : '🌐'
                              ) : (
                                chat.name.charAt(0)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1">
                            {getChatIcon(chat)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm truncate">
                              {chat.name}
                            </div>
                            {chat.unreadCount! > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {chat.description && (
                            <div className="text-xs text-slate-500 truncate">
                              {chat.description}
                            </div>
                          )}
                          {chat.lastMessage && !chat.isPermanent && (
                            <div className="text-xs text-slate-500 truncate">
                              {chat.lastMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Support Panel Button for mobile */}
              {currentUser?.is_support_agent && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => navigate('/hub/support')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <Headphones className="w-4 h-4" />
                    🎧 ورود به پنل پشتیبانی
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {currentView === 'room-chat' && selectedRoom && (
                <MessengerChatView
                  selectedRoom={selectedRoom}
                  selectedUser={null}
                  currentUser={currentUser}
                  sessionToken={sessionToken!}
                />
              )}
              {currentView === 'private-chat' && selectedConversation && (
                <PrivateChatView
                  conversation={selectedConversation}
                  currentUser={currentUser}
                  sessionToken={sessionToken!}
                  onBack={handleBackToInbox}
                />
              )}
              {currentView === 'support-chat' && selectedSupportRoom && (
                <SupportChatView
                  supportRoom={selectedSupportRoom}
                  currentUser={currentUser}
                  sessionToken={sessionToken!}
                  onBack={handleBackToInbox}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed Floating Action Button - Only show on main chat list */}
      {!showMobileChat && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowExactSearchModal(true)}
            size="lg"
            className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-0"
            title="شروع گفتگوی جدید"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Modals */}
      <ExactSearchModal
        isOpen={showExactSearchModal}
        onClose={() => setShowExactSearchModal(false)}
        onUserSelect={handleStartChatWithUser}
        sessionToken={sessionToken!}
        currentUser={currentUser}
      />

      <UsernameSetupModal
        isOpen={showUsernameSetup}
        onClose={() => setShowUsernameSetup(false)}
        onUsernameSet={handleUsernameSet}
        sessionToken={sessionToken!}
        userId={currentUser.id}
        currentUsername={currentUser.username}
      />

      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
        currentUser={currentUser}
        sessionToken={sessionToken!}
        onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
      />

      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        currentUser={currentUser}
        onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
      />
    </div>
  );
};

export default BorderlessHubMessenger;
