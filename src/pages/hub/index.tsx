
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubLayout from '@/components/Layout/HubLayout';
import HubDashboard from '@/components/Hub/HubDashboard';
import MessengerPage from './messenger';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useAuth } from '@/contexts/AuthContext';

const HubIndex = () => {
  const [loading, setLoading] = useState(true);
  const [forceOffline, setForceOffline] = useState(false);
  const { user: unifiedUser, token: unifiedToken, login, logout, isAuthenticated } = useAuth();
  const { isOnline } = useOfflineDetection();

  useEffect(() => {
    const initializeHub = async () => {
      console.log('🏠 Hub: Initializing...');
      setLoading(true);

      try {
        // Check if user is already authenticated via AuthContext
        if (isAuthenticated && unifiedUser && unifiedToken) {
          console.log('✅ Hub: User already authenticated via AuthContext:', unifiedUser.name);
          setForceOffline(false);
          setLoading(false);
          return;
        }

        console.log('❌ Hub: No authenticated user found, redirecting to login');
        window.location.href = '/login';
      } catch (error) {
        console.error('💥 Hub: Initialization error:', error);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    initializeHub();
  }, [isAuthenticated, unifiedUser, unifiedToken]);

  const handleUserUpdate = (user: MessengerUser) => {
    console.log('🏠 Hub: Updating user data');
    if (unifiedToken) {
      login(user, unifiedToken);
    }
  };

  const handleLogout = async () => {
    console.log('🏠 Hub: Logging out...');
    await logout();
    window.location.href = '/login';
  };

  // Show loading while checking auth
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

  if (!isAuthenticated || !unifiedUser) {
    return <Navigate to="/login" replace />;
  }

  const isOfflineMode = forceOffline || !isOnline;

  // Get current user data (prefer messenger data if available)
  const currentUser = unifiedUser.messengerData || (unifiedUser.isMessengerUser ? {
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
  } : {
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
  }) as MessengerUser;

  return (
    <HubLayout currentUser={currentUser}>
      <Routes>
        <Route path="/" element={<HubDashboard currentUser={currentUser} />} />
        <Route 
          path="/messenger/*" 
          element={
            <MessengerPage 
              currentUser={currentUser} 
              onUserUpdate={handleUserUpdate}
              isOffline={isOfflineMode}
              onLogout={handleLogout}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </HubLayout>
  );
};

export default HubIndex;
