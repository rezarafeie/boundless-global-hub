
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubLayout from '@/components/Layout/HubLayout';
import HubDashboard from '@/components/Hub/HubDashboard';
import MessengerPage from './messenger';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

const HubIndex = () => {
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [loading, setLoading] = useState(true);

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

      const sessionData = await messengerService.validateSession(token);
      if (!sessionData || !sessionData.valid) {
        localStorage.removeItem('messenger_session_token');
        window.location.href = '/login';
        return;
      }

      setCurrentUser(sessionData.user);
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
            <MessengerPage 
              currentUser={currentUser} 
              onUserUpdate={handleUserUpdate}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </HubLayout>
  );
};

export default HubIndex;
