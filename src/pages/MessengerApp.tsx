
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import MessengerPage from './hub/messenger';
import MessengerAuth from '@/components/Chat/MessengerAuth';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { ReplyProvider } from '@/contexts/ReplyContext';
import { useAuth } from '@/contexts/AuthContext';

const MessengerApp = () => {
  const [loading, setLoading] = useState(true);
  const [forceOffline, setForceOffline] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { isOnline } = useOfflineDetection();
  const location = useLocation();
  const { user: unifiedUser, token: unifiedToken, login, logout, isAuthenticated } = useAuth();

  // Redirect to /hub/messenger if on messenger subdomain and not already there
  if (typeof window !== 'undefined' && window.location.hostname === 'messenger.rafiei.co' && location.pathname !== '/hub/messenger') {
    return <Navigate to="/hub/messenger" replace />;
  }

  useEffect(() => {
    checkAuth();
  }, [unifiedUser, unifiedToken]);

  const checkAuth = async () => {
    try {
      console.log('📱 MessengerApp: Checking authentication...');
      
      // First check if we have a unified auth session
      if (isAuthenticated && unifiedUser && unifiedToken) {
        console.log('✅ Found unified auth session for:', unifiedUser.name);
        
        // If unified user is a messenger user, we're good to go
        if (unifiedUser.isMessengerUser && unifiedUser.messengerData) {
          console.log('✅ Unified user is messenger user, using that session');
          setForceOffline(false);
          setLoading(false);
          return;
        }
        
        // If not a messenger user, still allow access but might need to sync
        console.log('⚠️ Unified user exists but not messenger user, allowing access');
        setForceOffline(false);
        setLoading(false);
        return;
      }

      // Check for local messenger session as fallback
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

        // Convert messenger user to unified user and sync with AuthContext
        console.log('Found valid messenger session, syncing with unified auth');
        login(user, token);
        setForceOffline(false);
      } catch (connectionError) {
        console.log('Connection failed, checking if we have a valid token for offline mode');
        
        // If we have a token but can't connect, try to use cached user data
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
          login(mockUser, token);
          setForceOffline(true);
        } else {
          // No token, show auth
          setShowAuth(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        setShowAuth(true);
      } else {
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
        login(mockUser, token);
        setForceOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = (newSessionToken: string, userName: string, user: MessengerUser) => {
    console.log('📱 MessengerApp: User authenticated:', userName);
    
    // Store in localStorage for messenger compatibility
    localStorage.setItem('messenger_session_token', newSessionToken);
    
    // Sync with unified auth system
    login(user, newSessionToken);
    setShowAuth(false);
    
    console.log('✅ MessengerApp: Authentication complete and synced');
  };

  const handleUserUpdate = (updatedUser: MessengerUser) => {
    console.log('📱 MessengerApp: Updating user data');
    // Update both local state and unified auth
    const token = unifiedToken || localStorage.getItem('messenger_session_token') || '';
    login(updatedUser, token);
  };

  const handleLogout = async () => {
    console.log('📱 MessengerApp: Logging out...');
    // Clear both local session and unified session
    localStorage.removeItem('messenger_session_token');
    await logout();
    setShowAuth(true);
    setForceOffline(false);
    console.log('✅ MessengerApp: Logout complete');
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

  if (showAuth || (!isAuthenticated && !unifiedUser)) {
    return (
      <MessengerAuth onAuthenticated={handleAuthenticated} />
    );
  }

  const isOfflineMode = forceOffline || !isOnline;
  
  // Get current user data (prefer messenger data if available)
  const currentUser = unifiedUser?.messengerData || (unifiedUser?.isMessengerUser ? {
    id: parseInt(unifiedUser.id),
    name: unifiedUser.name,
    phone: unifiedUser.phone,
    username: unifiedUser.username || '',
    is_approved: true,
    is_support_agent: false,
    is_messenger_admin: false,
    bedoun_marz: false,
    bedoun_marz_approved: false,
    bedoun_marz_request: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    role: 'user' as const,
    email: unifiedUser.email,
    user_id: null,
    first_name: unifiedUser.firstName,
    last_name: unifiedUser.lastName,
    full_name: unifiedUser.name,
    country_code: unifiedUser.countryCode,
    signup_source: null,
    bio: null,
    notification_enabled: true,
    notification_token: null,
    password_hash: null,
    avatar_url: null
  } : null) as MessengerUser | null;

  if (!currentUser) {
    return (
      <MessengerAuth onAuthenticated={handleAuthenticated} />
    );
  }

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
