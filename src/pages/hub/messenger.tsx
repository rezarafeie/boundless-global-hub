
import React, { useEffect, useState } from 'react';
import Messenger from '@/components/Chat/Messenger';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, MessageCircle, Users } from 'lucide-react';
import { type MessengerUser } from '@/lib/messengerService';
import { useEnhancedNotificationService } from '@/hooks/useEnhancedNotificationService';
import EnhancedNotificationPermissionBanner from '@/components/Chat/EnhancedNotificationPermissionBanner';
import AddToHomeScreenBanner from '@/components/Chat/AddToHomeScreenBanner';
import EnhancedNotificationDiagnostics from '@/components/Chat/EnhancedNotificationDiagnostics';
import RealtimeDebugPanel from '@/components/Chat/RealtimeDebugPanel';
import { isMessengerSubdomain } from '@/utils/subdomainDetection';

interface MessengerPageProps {
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
  isOffline?: boolean;
  onLogout?: () => void;
}

const MessengerPage: React.FC<MessengerPageProps> = ({ currentUser, onUserUpdate, isOffline = false, onLogout }) => {
  const sessionToken = localStorage.getItem('messenger_session_token');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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

  // Show notification diagnostics in development mode or when debug=true
  const showDiagnostics = process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true');
  
  // Show realtime debug panel when debug=true
  const showRealtimeDebug = window.location.search.includes('debug=true');

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
      
      {/* Show enhanced notification diagnostics for debugging */}
      {showDiagnostics && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <EnhancedNotificationDiagnostics 
            currentUser={currentUser}
            sessionToken={sessionToken}
          />
        </div>
      )}
      
      {/* Show realtime debug panel when debug mode is enabled */}
      {showRealtimeDebug && (
        <RealtimeDebugPanel
          isVisible={showDebugPanel}
          onToggle={() => setShowDebugPanel(!showDebugPanel)}
        />
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
