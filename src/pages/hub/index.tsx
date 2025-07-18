
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubLayout from '@/components/Layout/HubLayout';
import HubDashboard from '@/components/Hub/HubDashboard';
import MessengerPage from './messenger';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

const HubIndex = () => {
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceOffline, setForceOffline] = useState(false);
  const { isOnline, isChecking } = useOfflineDetection();

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

      // Set a timeout for connection check
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      );

      try {
        // Try to validate session with timeout
        const sessionData = await Promise.race([
          messengerService.validateSession(token),
          timeoutPromise
        ]) as { valid: boolean; user: MessengerUser } | null;

        if (!sessionData?.valid) {
          localStorage.removeItem('messenger_session_token');
          window.location.href = '/login';
          return;
        }

        setCurrentUser(sessionData.user);
        setForceOffline(false);
      } catch (connectionError) {
        console.log('Connection failed, switching to offline mode');
        // Create offline user
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
        setForceOffline(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('messenger_session_token');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (user: MessengerUser) => {
    setCurrentUser(user);
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

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isOfflineMode = forceOffline || !isOnline;

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
            />
          } 
        />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </HubLayout>
  );
};

export default HubIndex;
