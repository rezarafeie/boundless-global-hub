
import React, { useState, useEffect } from 'react';
import MessengerInbox from './MessengerInbox';
import MessengerChatView from './MessengerChatView';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessengerProps {
  sessionToken: string;
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
}

const Messenger: React.FC<MessengerProps> = ({ sessionToken, currentUser, onUserUpdate }) => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedUser, setSelectedUser] = useState<MessengerUser | null>(null);
  const isMobile = useIsMobile();

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    setSelectedUser(null);
  };

  const handleUserSelect = (user: MessengerUser) => {
    setSelectedUser(user);
    setSelectedRoom(null);
  };

  const handleBackToInbox = () => {
    setSelectedRoom(null);
    setSelectedUser(null);
  };

  return (
    <div className="flex h-screen">
      {/* Left sidebar - hide on mobile when chat is selected */}
      <div className={`${isMobile && (selectedRoom || selectedUser) ? 'hidden' : ''} w-full md:w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col`}>
        <MessengerInbox
          sessionToken={sessionToken}
          onRoomSelect={handleRoomSelect}
          onUserSelect={handleUserSelect}
          selectedRoom={selectedRoom}
          selectedUser={selectedUser}
          currentUser={currentUser}
          onUserUpdate={onUserUpdate}
        />
      </div>
      
      {/* Right chat view - show on mobile when chat is selected */}
      <div className={`${isMobile && !(selectedRoom || selectedUser) ? 'hidden' : ''} flex-1 bg-slate-50 dark:bg-slate-900 min-h-0`}>
        <MessengerChatView
          selectedRoom={selectedRoom}
          selectedUser={selectedUser}
          currentUser={currentUser}
          sessionToken={sessionToken}
          onBack={isMobile ? handleBackToInbox : undefined}
          onBackToRooms={handleBackToInbox}
        />
      </div>
    </div>
  );
};

export default Messenger;
