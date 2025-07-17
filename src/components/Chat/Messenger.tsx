
import React, { useState, useEffect } from 'react';
import MessengerInbox from './MessengerInbox';
import MessengerChatView from './MessengerChatView';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';

interface MessengerProps {
  sessionToken: string;
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
}

const Messenger: React.FC<MessengerProps> = ({ sessionToken, currentUser, onUserUpdate }) => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedUser, setSelectedUser] = useState<MessengerUser | null>(null);

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
    <div className="flex h-full">
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
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
      
      <div className="flex-1 bg-slate-50 dark:bg-slate-900">
        <MessengerChatView
          selectedRoom={selectedRoom}
          selectedUser={selectedUser}
          currentUser={currentUser}
          sessionToken={sessionToken}
          onBack={selectedRoom || selectedUser ? handleBackToInbox : undefined}
          onBackToRooms={handleBackToInbox}
        />
      </div>
    </div>
  );
};

export default Messenger;
