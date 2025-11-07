
import React, { useEffect } from 'react';
import Messenger from '@/components/Chat/Messenger';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, MessageCircle, Users } from 'lucide-react';
import { type MessengerUser } from '@/lib/messengerService';
import AddToHomeScreenBanner from '@/components/Chat/AddToHomeScreenBanner';

import { isMessengerSubdomain } from '@/utils/subdomainDetection';

interface MessengerPageProps {
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
  isOffline?: boolean;
  onLogout?: () => void;
}

const MessengerPage: React.FC<MessengerPageProps> = ({ currentUser, onUserUpdate, isOffline = false, onLogout }) => {
  const sessionToken = localStorage.getItem('messenger_session_token');

  if (!sessionToken) {
    return <div>Session not found</div>;
  }

  return (
    <div className="h-full overflow-hidden">
      {/* Show add to home screen banner on messenger subdomain */}
      {isMessengerSubdomain() && (
        <AddToHomeScreenBanner />
      )}
      
      
      <Messenger 
        sessionToken={sessionToken}
        currentUser={currentUser}
        onUserUpdate={onUserUpdate}
        isOffline={isOffline}
        onLogout={onLogout}
      />
    </div>
  );
};

export default MessengerPage;
