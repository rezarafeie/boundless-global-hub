
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubLayout from '@/components/Layout/HubLayout';
import HubDashboard from '@/components/Hub/HubDashboard';
import MessengerPage from './messenger';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, MessageCircle } from 'lucide-react';

const HubIndex = () => {
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useOfflineDetection();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // If offline, skip validation and create a mock user for offline mode
      if (!isOnline) {
        const mockUser: MessengerUser = {
          id: 0,
          name: 'کاربر آفلاین',
          phone: '',
          username: 'offline_user',
          is_approved: false,
          is_support_agent: false,
          is_messenger_admin: false,
          bedoun_marz: false,
          bedoun_marz_approved: false,
          bedoun_marz_request: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          role: 'user'
        };
        setCurrentUser(mockUser);
        setLoading(false);
        return;
      }

      const sessionData = await messengerService.validateSession(token);
      if (!sessionData || !sessionData.valid) {
        localStorage.removeItem('messenger_session_token');
        window.location.href = '/login';
        return;
      }

      setCurrentUser(sessionData.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      if (isOnline) {
        localStorage.removeItem('messenger_session_token');
        window.location.href = '/login';
      } else {
        // In offline mode, continue with mock user
        const mockUser: MessengerUser = {
          id: 0,
          name: 'کاربر آفلاین',
          phone: '',
          username: 'offline_user',
          is_approved: false,
          is_support_agent: false,
          is_messenger_admin: false,
          bedoun_marz: false,
          bedoun_marz_approved: false,
          bedoun_marz_request: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          role: 'user'
        };
        setCurrentUser(mockUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (user: MessengerUser) => {
    setCurrentUser(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <HubLayout currentUser={currentUser}>
      <Routes>
        <Route path="/" element={<HubDashboard currentUser={currentUser} />} />
        <Route 
          path="/messenger/*" 
          element={
            !isOnline ? (
              <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
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
            ) : (
              <MessengerPage 
                currentUser={currentUser} 
                onUserUpdate={handleUserUpdate}
              />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </HubLayout>
  );
};

export default HubIndex;
