
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
  const [initialLoad, setInitialLoad] = useState(true);
  const { isOnline, isChecking } = useOfflineDetection();

  useEffect(() => {
    // Quick initial check
    const quickCheck = async () => {
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // If we can't connect quickly, assume offline
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 2000)
      );

      try {
        await Promise.race([
          messengerService.validateSession(token),
          timeoutPromise
        ]);
        // If successful, continue with normal auth check
        setInitialLoad(false);
        checkAuth();
      } catch (error) {
        console.log('Quick check failed, assuming offline mode');
        // Create offline user immediately
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
        setInitialLoad(false);
      }
    };

    quickCheck();
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      checkAuth();
    }
  }, [isOnline, initialLoad]); // Re-check auth when online status changes

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Wait for offline detection to complete initial check
      if (isChecking) {
        return;
      }

      // If offline, create a mock user for offline mode
      if (!isOnline) {
        console.log('Creating offline user for offline mode');
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
        console.log('Auth failed, using offline mode');
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

  // Show loading while checking connection or auth
  if (loading || (isChecking && initialLoad)) {
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
            <MessengerPage 
              currentUser={currentUser} 
              onUserUpdate={handleUserUpdate}
              isOffline={!isOnline}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </HubLayout>
  );
};

export default HubIndex;
