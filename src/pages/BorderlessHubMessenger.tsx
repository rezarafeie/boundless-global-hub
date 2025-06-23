
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/Layout/MainLayout';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import MessengerChatView from '@/components/Chat/MessengerChatView';
import SupportChatView from '@/components/Chat/SupportChatView';
import PrivateChatView from '@/components/Chat/PrivateChatView';
import StartChatModal from '@/components/Chat/StartChatModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Users, 
  Search, 
  Settings, 
  Plus,
  Headphones,
  User,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService, type PrivateConversation } from '@/lib/privateMessageService';
import { supportService } from '@/lib/supportService';

interface ChatRoom {
  id: number;
  name: string;
  description: string;
  type: 'general' | 'boundless_only' | 'topic';
  is_active: boolean;
  is_boundless_only: boolean;
  member_count?: number;
  last_message?: {
    text: string;
    time: string;
    sender: string;
  };
}

interface SupportRoom {
  id: string;
  name: string;
  description: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  isPermanent: true;
}

const BorderlessHubMessenger: React.FC = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [selectedSupportRoom, setSelectedSupportRoom] = useState<SupportRoom | null>(null);
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateConversation | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [privateConversations, setPrivateConversations] = useState<PrivateConversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(true);
  const [showStartChatModal, setShowStartChatModal] = useState(false);

  // Always available support rooms
  const supportRooms: SupportRoom[] = [
    {
      id: 'academy_support',
      name: 'پشتیبانی آکادمی',
      description: 'پشتیبانی عمومی آکادمی',
      type: 'academy_support',
      icon: <Headphones className="w-5 h-5" />,
      isPermanent: true
    },
    ...(currentUser?.bedoun_marz ? [{
      id: 'boundless_support',
      name: 'پشتیبانی بدون مرز',
      description: 'پشتیبانی ویژه اعضای بدون مرز',
      type: 'boundless_support' as const,
      icon: <Headphones className="w-5 h-5" />,
      isPermanent: true as const
    }] : [])
  ];

  const handleAuthenticated = (token: string, userName: string, user: MessengerUser) => {
    console.log('User authenticated:', { token: token.substring(0, 10) + '...', userName, userId: user.id });
    setSessionToken(token);
    setCurrentUser(user);
    localStorage.setItem('messenger_session_token', token);
    localStorage.setItem('messenger_user_name', userName);
    fetchUserData(user, token);
  };

  const fetchUserData = async (user: MessengerUser, token: string) => {
    try {
      setLoading(true);
      console.log('Fetching user data for:', user.id);

      // Set session context for Supabase RLS
      await supabase.rpc('set_session_context', { session_token: token });

      // Fetch chat rooms
      const rooms = await messengerService.getChatRooms(user);
      console.log('Fetched chat rooms:', rooms);
      setChatRooms(rooms);

      // Fetch private conversations
      const conversations = await privateMessageService.getUserConversations(user.id, token);
      console.log('Fetched private conversations:', conversations);
      setPrivateConversations(conversations);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSession = async () => {
    const storedToken = localStorage.getItem('messenger_session_token');
    const storedUserName = localStorage.getItem('messenger_user_name');
    
    if (storedToken && storedUserName) {
      try {
        const result = await messengerService.validateSession(storedToken);
        if (result) {
          handleAuthenticated(storedToken, storedUserName, result.user);
          return;
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkExistingSession();
  }, []);

  const handleChatRoomSelect = (room: ChatRoom) => {
    console.log('Selecting chat room:', room.name);
    setSelectedChatRoom(room);
    setSelectedSupportRoom(null);
    setSelectedPrivateChat(null);
    setShowChatList(false);
  };

  const handleSupportRoomSelect = (room: SupportRoom) => {
    console.log('Selecting support room:', room.name);
    setSelectedSupportRoom(room);
    setSelectedChatRoom(null);
    setSelectedPrivateChat(null);
    setShowChatList(false);
  };

  const handlePrivateChatSelect = (conversation: PrivateConversation) => {
    console.log('Selecting private chat:', conversation.id);
    setSelectedPrivateChat(conversation);
    setSelectedChatRoom(null);
    setSelectedSupportRoom(null);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    setShowChatList(true);
    setSelectedChatRoom(null);
    setSelectedSupportRoom(null);
    setSelectedPrivateChat(null);
  };

  const handleNewPrivateConversation = (conversation: PrivateConversation) => {
    setPrivateConversations(prev => [conversation, ...prev]);
    handlePrivateChatSelect(conversation);
    setShowStartChatModal(false);
  };

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = privateConversations.filter(conv =>
    conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSupportRooms = supportRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پیام‌رسان...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <UnifiedMessengerAuth onAuthenticated={handleAuthenticated} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            {!showChatList ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleBackToList}>
                  <MessageCircle className="w-5 h-5" />
                </Button>
                <div className="flex-1 text-center">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {selectedChatRoom?.name || selectedSupportRoom?.name || selectedPrivateChat?.other_user_name || 'گفتگو'}
                  </h3>
                </div>
                <div></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                    پیام‌رسان
                  </h1>
                </div>
                <Button 
                  onClick={() => setShowStartChatModal(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    پیام‌رسان بدون مرز
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    خوش آمدید، {currentUser.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setShowStartChatModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  گفتگوی جدید
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                اتاق‌ها: {filteredRooms.length}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                گفتگوهای خصوصی: {filteredConversations.length}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                پشتیبانی: {filteredSupportRooms.length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat List */}
          <div className={`
            ${showChatList ? 'flex' : 'hidden'} 
            md:flex flex-col w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          `}>
            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="جستجو در گفتگوها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Chat Items */}
            <div className="flex-1 overflow-y-auto">
              {/* Support Rooms - Always at top */}
              {filteredSupportRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleSupportRoomSelect(room)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    selectedSupportRoom?.id === room.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      {room.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                          {room.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          پشتیبانی
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                        {room.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Private Conversations */}
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handlePrivateChatSelect(conversation)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    selectedPrivateChat?.id === conversation.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                          {conversation.other_user_name}
                        </h3>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          @{conversation.other_user_username}
                        </p>
                        {conversation.last_message_at && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(conversation.last_message_at).toLocaleDateString('fa-IR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Chat Rooms */}
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleChatRoomSelect(room)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    selectedChatRoom?.id === room.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {room.is_boundless_only && (
                            <Badge variant="outline" className="text-xs">
                              بدون مرز
                            </Badge>
                          )}
                          {room.member_count && (
                            <span className="text-xs text-slate-500">{room.member_count}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                        {room.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* No Results */}
              {searchTerm && filteredRooms.length === 0 && filteredConversations.length === 0 && filteredSupportRooms.length === 0 && (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">نتیجه‌ای یافت نشد</p>
                  <p className="text-sm text-slate-400">
                    برای "{searchTerm}" چیزی پیدا نکردیم
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!searchTerm && chatRooms.length === 0 && privateConversations.length === 0 && (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">هنوز گفتگویی ندارید</p>
                  <p className="text-sm text-slate-400">
                    با دکمه "گفتگوی جدید" شروع کنید
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`
            ${!showChatList ? 'flex' : 'hidden'} 
            md:flex flex-col flex-1 bg-white dark:bg-slate-800
          `}>
            {selectedChatRoom ? (
              <MessengerChatView
                room={selectedChatRoom}
                currentUser={currentUser}
                sessionToken={sessionToken}
                onBack={handleBackToList}
              />
            ) : selectedSupportRoom ? (
              <SupportChatView
                supportRoom={selectedSupportRoom}
                currentUser={currentUser}
                sessionToken={sessionToken}
                onBack={handleBackToList}
              />
            ) : selectedPrivateChat ? (
              <PrivateChatView
                conversation={selectedPrivateChat}
                currentUser={currentUser}
                sessionToken={sessionToken}
                onBack={handleBackToList}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    یک گفتگو را انتخاب کنید
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    یا گفتگوی جدیدی شروع کنید
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Start Chat Modal */}
        {showStartChatModal && (
          <StartChatModal
            currentUser={currentUser}
            sessionToken={sessionToken}
            onClose={() => setShowStartChatModal(false)}
            onConversationCreated={handleNewPrivateConversation}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default BorderlessHubMessenger;
