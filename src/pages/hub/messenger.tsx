
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MessengerChatView from '@/components/Chat/MessengerChatView';
import PrivateChatView from '@/components/Chat/PrivateChatView';
import SupportChatView from '@/components/Chat/SupportChatView';
import MessengerInbox from '@/components/Chat/MessengerInbox';
import { messengerService, type MessengerUser, type ChatRoom, type MessengerMessage } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { supportMessageService } from '@/lib/supportMessageService';
import { ReplyProvider } from '@/contexts/ReplyContext';
import { supabase } from '@/integrations/supabase/client';
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator';
import OfflineDetector from '@/components/OfflineDetector';
import { toast } from 'sonner';
// Temporarily disabled notification components
// import { useNotificationService } from '@/hooks/useNotificationService';
// import NotificationPermissionBanner from '@/components/Chat/NotificationPermissionBanner';

interface MessengerPageProps {
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
  isOffline?: boolean;
  onLogout: () => void;
  disableNotificationBanner?: boolean;
}

const MessengerPage: React.FC<MessengerPageProps> = ({ 
  currentUser, 
  onUserUpdate, 
  isOffline = false,
  onLogout,
  disableNotificationBanner = false
}) => {
  console.log('🎯 MessengerPage: Component mounted/updated', { 
    userId: currentUser.id, 
    isOffline,
    disableNotificationBanner 
  });

  const [searchParams] = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedUser, setSelectedUser] = useState<MessengerUser | null>(null);
  const [selectedSupportRoom, setSelectedSupportRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [view, setView] = useState<'rooms' | 'private' | 'support'>('rooms');

  // Temporarily disable notification service
  // const notificationService = useNotificationService({
  //   currentUser,
  //   sessionToken
  // });

  useEffect(() => {
    const token = localStorage.getItem('messenger_session_token') || '';
    setSessionToken(token);
    loadInitialData();
  }, [currentUser.id]);

  useEffect(() => {
    const roomParam = searchParams.get('room');
    const userParam = searchParams.get('user');
    const supportParam = searchParams.get('support');

    if (roomParam) {
      const roomId = parseInt(roomParam);
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setSelectedRoom(room);
        setView('rooms');
      }
    } else if (userParam) {
      const userId = parseInt(userParam);
      messengerService.getUserById(userId).then(user => {
        if (user) {
          setSelectedUser(user);
          setView('private');
        }
      });
    } else if (supportParam === 'true') {
      setView('support');
    }
  }, [searchParams, rooms]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('📱 Loading initial messenger data...');
      
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        console.error('No session token found');
        return;
      }

      await supabase.rpc('set_session_context', { session_token: token });
      
      const roomsData = await messengerService.getRooms();
      console.log('📱 Loaded rooms:', roomsData.length);
      setRooms(roomsData);

      if (roomsData.length > 0 && !selectedRoom) {
        const defaultRoom = roomsData.find(room => room.name.includes('عمومی')) || roomsData[0];
        setSelectedRoom(defaultRoom);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      if (!isOffline) {
        toast.error('خطا در بارگذاری داده‌ها');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = useCallback((room: ChatRoom) => {
    console.log('📱 Room selected:', room.name);
    setSelectedRoom(room);
    setSelectedUser(null);
    setSelectedSupportRoom(null);
    setView('rooms');
  }, []);

  const handlePrivateChat = useCallback((user: MessengerUser) => {
    console.log('📱 Private chat with:', user.name);
    setSelectedUser(user);
    setSelectedRoom(null);
    setSelectedSupportRoom(null);
    setView('private');
  }, []);

  const handleSupportChat = useCallback((room: ChatRoom) => {
    console.log('📱 Support chat in:', room.name);
    setSelectedSupportRoom(room);
    setSelectedRoom(null);
    setSelectedUser(null);
    setView('support');
  }, []);

  const handleBackToInbox = useCallback(() => {
    setSelectedRoom(null);
    setSelectedUser(null);
    setSelectedSupportRoom(null);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">در حال بارگذاری پیام‌رسان...</p>
        </div>
      </div>
    );
  }

  const showChatView = selectedRoom || selectedUser || selectedSupportRoom;
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <OnlineStatusIndicator />
      <OfflineDetector>
        <div />
      </OfflineDetector>
      
      {/* Temporarily disable notification banner */}
      {/* {!disableNotificationBanner && notificationService.showPermissionBanner && (
        <NotificationPermissionBanner
          onRequestPermission={notificationService.requestNotificationPermission}
          onDismiss={notificationService.dismissPermissionBanner}
          pushSupported={notificationService.permissionState.supported}
        />
      )} */}

      <div className="flex-1 flex overflow-hidden">
        {(!isMobile || !showChatView) && (
          <div className={`${isMobile ? 'w-full' : 'w-80'} border-r border-border bg-card`}>
            <MessengerInbox
              currentUser={currentUser}
              selectedRoom={selectedRoom}
              selectedUser={selectedUser}
              selectedSupportRoom={selectedSupportRoom}
              onRoomSelect={handleRoomSelect}
              onPrivateChat={handlePrivateChat}
              onSupportChat={handleSupportChat}
              onUserUpdate={onUserUpdate}
              onLogout={onLogout}
              view={view}
              setView={setView}
              isOffline={isOffline}
            />
          </div>
        )}

        {showChatView && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col`}>
            {view === 'rooms' && selectedRoom && (
              <MessengerChatView
                roomId={selectedRoom.id}
                currentUser={currentUser}
                onBack={isMobile ? handleBackToInbox : undefined}
                isOffline={isOffline}
              />
            )}
            
            {view === 'private' && selectedUser && (
              <PrivateChatView
                recipientUser={selectedUser}
                currentUser={currentUser}
                onBack={isMobile ? handleBackToInbox : undefined}
                isOffline={isOffline}
              />
            )}

            {view === 'support' && selectedSupportRoom && (
              <SupportChatView
                supportRoom={{
                  id: selectedSupportRoom.id.toString(),
                  name: selectedSupportRoom.name,
                  description: selectedSupportRoom.description || '',
                  type: selectedSupportRoom.type,
                  icon: <div>📞</div>,
                  isPermanent: true
                }}
                currentUser={currentUser}
                sessionToken={sessionToken}
                onBack={isMobile ? handleBackToInbox : undefined}
                conversationId={1}
                recipientUserId={1}
              />
            )}
          </div>
        )}

        {!showChatView && !isMobile && (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center text-muted-foreground">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">گفتگو را انتخاب کنید</p>
              <p className="text-sm mt-2">از فهرست سمت چپ یک گفتگو انتخاب کنید</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerPage;
