
import React, { useEffect } from 'react';
import Messenger from '@/components/Chat/Messenger';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, MessageCircle, Users } from 'lucide-react';
import { type MessengerUser } from '@/lib/messengerService';
import { useNotificationService } from '@/hooks/useNotificationService';
import NotificationPermissionBanner from '@/components/Chat/NotificationPermissionBanner';

interface MessengerPageProps {
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
  isOffline?: boolean;
}

const MessengerPage: React.FC<MessengerPageProps> = ({ currentUser, onUserUpdate, isOffline = false }) => {
  const sessionToken = localStorage.getItem('messenger_session_token');

  // Initialize notification service for this page
  const {
    showPermissionBanner,
    requestNotificationPermission,
    dismissPermissionBanner
  } = useNotificationService({
    currentUser,
    sessionToken
  });

  if (!sessionToken) {
    return <div>Session not found</div>;
  }

  if (isOffline) {
    return (
      <div className="h-[calc(100vh-80px)] flex">
        {/* Offline Chat List */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <WifiOff className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                پیام‌رسان (آفلاین)
              </h2>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                برای دسترسی به پیام‌ها به اتصال اینترنت نیاز دارید
              </p>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Mock offline chat entries */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 opacity-50">
                <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                    گفتگو #{i}
                  </p>
                  <p className="text-xs text-slate-400">
                    در حالت آفلاین در دسترس نیست
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Offline Chat View */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <WifiOff className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                پیام‌رسان در حالت آفلاین
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                برای استفاده از پیام‌رسان به اتصال اینترنت نیاز دارید.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <MessageCircle className="w-4 h-4" />
                <span>منتظر اتصال مجدد...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)]">
      {/* Show notification banner if needed */}
      {showPermissionBanner && !isOffline && (
        <NotificationPermissionBanner
          onRequestPermission={requestNotificationPermission}
          onDismiss={dismissPermissionBanner}
        />
      )}
      
      <Messenger
        sessionToken={sessionToken}
        currentUser={currentUser}
        onUserUpdate={onUserUpdate}
      />
    </div>
  );
};

export default MessengerPage;
