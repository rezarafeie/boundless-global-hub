import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import MessengerAuth from '@/components/Chat/MessengerAuth';
import MessengerInbox from '@/components/Chat/MessengerInbox';
import MessengerChatView from '@/components/Chat/MessengerChatView';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, ArrowRight } from 'lucide-react';

interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description: string;
  is_boundless_only: boolean;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

const BorderlessHubMessenger: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const token = localStorage.getItem('messenger_session_token');
    if (token) {
      try {
        const result = await messengerService.validateSession(token);
        if (result) {
          setCurrentUser(result.user);
          setSessionToken(token);
          
          // Check if user is approved, if not redirect to pending page
          if (!result.user.is_approved) {
            navigate('/hub/messenger/pending', { replace: true });
            return;
          }
        } else {
          localStorage.removeItem('messenger_session_token');
        }
      } catch (error) {
        localStorage.removeItem('messenger_session_token');
      }
    }
    setLoading(false);
  };

  const handleAuthenticated = (token: string, userName: string, user: MessengerUser) => {
    setSessionToken(token);
    setCurrentUser(user);
    localStorage.setItem('messenger_session_token', token);
    
    // Check if user needs approval
    if (!user.is_approved) {
      navigate('/hub/messenger/pending', { replace: true });
      return;
    }
    
    toast({
      title: 'خوش آمدید!',
      description: `${userName} عزیز، به پیام‌رسان بدون مرز خوش آمدید.`,
    });
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    setShowMobileChat(true);
  };

  const handleBackToInbox = () => {
    setShowMobileChat(false);
    setSelectedRoom(null);
  };

  const handleLogout = () => {
    if (sessionToken) {
      messengerService.deactivateSession(sessionToken);
    }
    localStorage.removeItem('messenger_session_token');
    setCurrentUser(null);
    setSessionToken(null);
    setSelectedRoom(null);
    setShowMobileChat(false);
    toast({
      title: 'خروج موفق',
      description: 'از پیام‌رسان خارج شدید.',
    });
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
    return <MessengerAuth onAuthenticated={handleAuthenticated} />;
  }

  // This check is now redundant since we redirect to pending, but keep as fallback
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
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/hub')}
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
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {currentUser.name}
            </span>
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
          {/* Left Panel - Inbox */}
          <div className="w-1/3 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <MessengerInbox
              currentUser={currentUser}
              onRoomSelect={handleRoomSelect}
              selectedRoom={selectedRoom}
            />
          </div>
          
          {/* Right Panel - Chat View */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900">
            {selectedRoom ? (
              <MessengerChatView
                room={selectedRoom}
                currentUser={currentUser}
                onBack={handleBackToInbox}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
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

        {/* Mobile Layout */}
        <div className="md:hidden w-full">
          {!showMobileChat ? (
            <div className="bg-white dark:bg-slate-800 h-full">
              <MessengerInbox
                currentUser={currentUser}
                onRoomSelect={handleRoomSelect}
                selectedRoom={selectedRoom}
              />
            </div>
          ) : (
            selectedRoom && (
              <MessengerChatView
                room={selectedRoom}
                currentUser={currentUser}
                onBack={handleBackToInbox}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BorderlessHubMessenger;
