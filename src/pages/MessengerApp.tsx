import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import MessengerPage from './hub/messenger';
import MessengerAuth from '@/components/Chat/MessengerAuth';
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
  const location = useLocation();

  // Redirect to /hub/messenger if on messenger subdomain and not already there
  if (typeof window !== 'undefined' && window.location.hostname === 'messenger.rafiei.co' && location.pathname !== '/hub/messenger') {
    return <Navigate to="/hub/messenger" replace />;
  }

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

      // Extend timeout to 10 seconds to give more time for validation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      try {
        const user = await Promise.race([
          messengerService.validateSession(token),
          timeoutPromise
        ]) as MessengerUser | null;

        if (!user) {
          localStorage.removeItem('messenger_session_token');
          setShowAuth(true);
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        setSessionToken(token);
        setForceOffline(false);
      } catch (connectionError) {
        console.log('Connection failed, checking if we have a valid token for offline mode');
        
        // If we have a token but can't connect, try to use cached user data
        // This prevents logout during temporary network issues
        if (token) {
          console.log('Using offline mode with existing token');
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
        } else {
          // No token, show auth
          setShowAuth(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear session if there's no token or if it's clearly invalid
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        setShowAuth(true);
      } else {
        // Keep the session but force offline mode
        console.log('Keeping session in offline mode due to error');
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

  const handleLogout = () => {
    // Clear session data
    localStorage.removeItem('messenger_session_token');
    
    // Reset state
    setCurrentUser(null);
    setSessionToken(null);
    setShowAuth(true);
    setForceOffline(false);
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
      <MessengerAuth onAuthenticated={handleAuthenticated} />
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
          onLogout={handleLogout}
        />
      </div>
    </ReplyProvider>
  );
};

export default MessengerApp;