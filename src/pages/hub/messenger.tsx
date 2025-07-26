import React, { useEffect } from 'react';
import Messenger from '@/components/Chat/Messenger';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, MessageCircle, Users } from 'lucide-react';
import { type MessengerUser } from '@/lib/messengerService';
import { useEnhancedNotificationService } from '@/hooks/useEnhancedNotificationService';
import EnhancedNotificationPermissionBanner from '@/components/Chat/EnhancedNotificationPermissionBanner';
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

  // Initialize enhanced notification service for this page
  const {
    showPermissionBanner,
    requestNotificationPermission,
    dismissPermissionBanner
  } = useEnhancedNotificationService({
    currentUser,
    sessionToken
  });

  if (!sessionToken) {
    return <div>Session not found</div>;
  }

  return (
    <div className="h-full overflow-hidden">
      {/* Show enhanced notification banner if needed */}
      {showPermissionBanner && !isOffline && (
        <EnhancedNotificationPermissionBanner
          onRequestPermission={requestNotificationPermission}
          onDismiss={dismissPermissionBanner}
        />
      )}
      
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
