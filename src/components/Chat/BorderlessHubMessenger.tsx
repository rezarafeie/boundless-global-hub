
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Users, Settings, Shield } from 'lucide-react';
import UnifiedMessengerAuth from './UnifiedMessengerAuth';
import GroupChatView from './GroupChatView';
import PrivateMessengerView from './PrivateMessengerView';
import SupportRoomsSelector from './SupportRoomsSelector';
import SupportChatView from './SupportChatView';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { supportRoomService, type SupportRoom } from '@/lib/supportRoomService';
import { useToast } from '@/hooks/use-toast';

interface BorderlessHubMessengerProps {
  onBack?: () => void;
}

type ViewType = 'main' | 'group-chat' | 'private-messages' | 'support-rooms' | 'support-chat';

const BorderlessHubMessenger: React.FC<BorderlessHubMessengerProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [selectedSupportRoom, setSelectedSupportRoom] = useState<SupportRoom | null>(null);
  const [supportRooms, setSupportRooms] = useState<SupportRoom[]>([]);
  const [loadingSupportRooms, setLoadingSupportRooms] = useState(false);

  useEffect(() => {
    if (currentUser && sessionToken) {
      fetchSupportRooms();
    }
  }, [currentUser, sessionToken]);

  const fetchSupportRooms = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingSupportRooms(true);
      const rooms = await supportRoomService.getUserSupportRooms(currentUser.id);
      setSupportRooms(rooms);
    } catch (error) {
      console.error('Error fetching support rooms:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اتاق‌های پشتیبانی',
        variant: 'destructive',
      });
    } finally {
      setLoadingSupportRooms(false);
    }
  };

  const handleAuthenticated = (token: string, userName: string, user: MessengerUser) => {
    setSessionToken(token);
    setCurrentUser(user);
    toast({
      title: 'خوش آمدید!',
      description: `${userName} عزیز، به پیام‌رسان آکادمی رفیعی خوش آمدید`,
    });
  };

  const handleSupportRoomSelect = (room: SupportRoom) => {
    setSelectedSupportRoom(room);
    setCurrentView('support-chat');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedSupportRoom(null);
  };

  if (!currentUser || !sessionToken) {
    return <UnifiedMessengerAuth onAuthenticated={handleAuthenticated} />;
  }

  if (currentView === 'group-chat') {
    return (
      <GroupChatView
        currentUser={currentUser}
        sessionToken={sessionToken}
        onBack={handleBackToMain}
      />
    );
  }

  if (currentView === 'private-messages') {
    return (
      <PrivateMessengerView
        currentUser={currentUser}
        sessionToken={sessionToken}
        onBack={handleBackToMain}
      />
    );
  }

  if (currentView === 'support-chat' && selectedSupportRoom) {
    return (
      <SupportChatView
        supportRoom={selectedSupportRoom}
        currentUser={currentUser}
        sessionToken={sessionToken}
        onBack={handleBackToMain}
      />
    );
  }

  if (currentView === 'support-rooms') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackToMain}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              برگشت
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              اتاق‌های پشتیبانی
            </h1>
          </div>
          
          <SupportRoomsSelector
            currentUser={currentUser}
            onRoomSelect={handleSupportRoomSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                برگشت
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                پیام‌رسان آکادمی رفیعی
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                سلام {currentUser.name}، به پیام‌رسان خوش آمدید
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Group Chat Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('group-chat')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-500" />
                چت گروهی
              </CardTitle>
              <CardDescription>
                به گفتگوی عمومی اعضای آکادمی بپیوندید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ورود به چت گروهی
              </Button>
            </CardContent>
          </Card>

          {/* Private Messages Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('private-messages')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-green-500" />
                پیام‌های خصوصی
              </CardTitle>
              <CardDescription>
                پیام خصوصی با سایر اعضا رد و بدل کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                مشاهده پیام‌ها
              </Button>
            </CardContent>
          </Card>

          {/* Support Rooms Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('support-rooms')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-500" />
                پشتیبانی
              </CardTitle>
              <CardDescription>
                دسترسی به اتاق‌های پشتیبانی و راهنمایی
                {supportRooms.length > 0 && (
                  <span className="block text-sm text-blue-600 mt-1">
                    {supportRooms.length} اتاق در دسترس
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                disabled={loadingSupportRooms}
              >
                {loadingSupportRooms ? 'در حال بارگذاری...' : 'ورود به پشتیبانی'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Info */}
        <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">اطلاعات کاربری</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                نام: {currentUser.name} | 
                تلفن: {currentUser.phone} |
                {currentUser.username && ` نام کاربری: ${currentUser.username} |`}
                وضعیت: {currentUser.is_approved ? 'تایید شده' : 'در انتظار تایید'}
              </p>
            </div>
            <div className="flex gap-2">
              {currentUser.bedoun_marz && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  بدون مرز
                </span>
              )}
              {currentUser.is_messenger_admin && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  مدیر
                </span>
              )}
              {currentUser.is_support_agent && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  پشتیبان
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorderlessHubMessenger;
