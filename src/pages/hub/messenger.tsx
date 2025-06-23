
import React from 'react';
import Messenger from '@/components/Chat/Messenger';
import { type MessengerUser } from '@/lib/messengerService';

interface MessengerPageProps {
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
}

const MessengerPage: React.FC<MessengerPageProps> = ({ currentUser, onUserUpdate }) => {
  const sessionToken = localStorage.getItem('messenger_session_token');

  if (!sessionToken) {
    return <div>Session not found</div>;
  }

  return (
    <div className="h-[calc(100vh-80px)]">
      <Messenger
        sessionToken={sessionToken}
        currentUser={currentUser}
        onUserUpdate={onUserUpdate}
      />
    </div>
  );
};

export default MessengerPage;
