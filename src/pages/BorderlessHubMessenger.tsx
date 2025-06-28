
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import RafieiAuth from '@/components/Auth/RafieiAuth';
import Messenger from '@/components/Chat/Messenger';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { toast } from 'sonner';

const BorderlessHubMessenger: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const [messengerUser, setMessengerUser] = useState<MessengerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      // Create or get messenger user from the authenticated Rafiei user
      initializeMessengerUser();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, token]);

  const initializeMessengerUser = async () => {
    try {
      // Check if messenger user exists for this Rafiei user
      let existingUser = await messengerService.getUserByPhone(user!.phone);
      
      if (!existingUser) {
        // Create messenger user from Rafiei user data
        const result = await messengerService.registerWithPassword({
          name: user!.full_name,
          phone: user!.phone,
          username: user!.user_id, // Use the 11-digit ID as username
          password: 'migrated_user', // Placeholder password for migrated users
          isBoundlessStudent: false
        });
        existingUser = result.user;
      }

      setMessengerUser(existingUser);
    } catch (error) {
      console.error('Error initializing messenger user:', error);
      toast.error('خطا در دسترسی به پیام‌رسان');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show Rafiei Auth
  if (!isAuthenticated) {
    return (
      <RafieiAuth
        onSuccess={() => {
          // Reload to reinitialize
          window.location.reload();
        }}
      />
    );
  }

  // If user is not approved for messenger, show pending state
  if (messengerUser && !messengerUser.is_approved) {
    return <Navigate to="/hub/messenger/pending" replace />;
  }

  // Show messenger interface
  if (messengerUser) {
    return (
      <div className="h-screen bg-slate-100 dark:bg-slate-900">
        <Messenger
          sessionToken={token!}
          currentUser={messengerUser}
          onUserUpdate={setMessengerUser}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400">خطا در دسترسی به پیام‌رسان</p>
      </div>
    </div>
  );
};

export default BorderlessHubMessenger;
