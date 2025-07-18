import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import MessengerPage from './hub/messenger';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { ReplyProvider } from '@/contexts/ReplyContext';

const MessengerApp = () => {
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceOffline, setForceOffline] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { isOnline } = useOfflineDetection();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        setShowAuth(true);
        setLoading(false);
        return;
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      );

      try {
        const sessionData = await Promise.race([
          messengerService.validateSession(token),
          timeoutPromise
        ]) as { valid: boolean; user: MessengerUser } | null;

        if (!sessionData?.valid) {
          localStorage.removeItem('messenger_session_token');
          setShowAuth(true);
          setLoading(false);
          return;
        }

        setCurrentUser(sessionData.user);
        setSessionToken(token);
        setForceOffline(false);
      } catch (connectionError) {
        console.log('Connection failed, switching to offline mode');
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
          role: 'user',
          email: null,
          user_id: null,
          first_name: null,
          last_name: null,
          full_name: null,
          country_code: null,
          signup_source: null,
          bio: null,
          notification_enabled: true,
          notification_token: null,
          password_hash: null,
          avatar_url: null
        };
        setCurrentUser(mockUser);
        setSessionToken(token);
        setForceOffline(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('messenger_session_token');
      setShowAuth(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = (newSessionToken: string, userName: string, user: MessengerUser) => {
    localStorage.setItem('messenger_session_token', newSessionToken);
    setSessionToken(newSessionToken);
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleUserUpdate = (user: MessengerUser) => {
    setCurrentUser(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">در حال بارگذاری پیام‌رسان...</p>
        </div>
      </div>
    );
  }

  if (showAuth || !currentUser || !sessionToken) {
    return (
      <UnifiedMessengerAuth onAuthenticated={handleAuthenticated} />
    );
  }

  const isOfflineMode = forceOffline || !isOnline;

  return (
    <ReplyProvider>
      <div className="h-screen overflow-hidden">
        <MessengerPage 
          currentUser={currentUser} 
          onUserUpdate={handleUserUpdate}
          isOffline={isOfflineMode}
        />
      </div>
    </ReplyProvider>
  );
};

export default MessengerApp;