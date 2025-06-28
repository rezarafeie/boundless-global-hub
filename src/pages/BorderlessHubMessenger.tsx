
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
        // Create messenger user from Rafiei user data with proper mapping
        const result = await messengerService.registerWithPassword({
          name: user!.full_name,
          phone: user!.phone,
          username: user!.user_id,
          password: 'migrated_rafiei_user',
          isBoundlessStudent: false
        });
        existingUser = result.user;
      } else {
        // Update existing user with Rafiei data if needed
        if (existingUser.name !== user!.full_name) {
          await messengerService.updateUser(existingUser.id, {
            name: user!.full_name,
            username: user!.user_id
          });
          existingUser.name = user!.full_name;
          existingUser.username = user!.user_id;
        }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <RafieiAuth
          onSuccess={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  if (messengerUser && !messengerUser.is_approved) {
    return <Navigate to="/hub/messenger/pending" replace />;
  }

  if (messengerUser) {
    return (
      <div className="h-screen bg-white dark:bg-slate-900">
        <Messenger
          sessionToken={token!}
          currentUser={messengerUser}
          onUserUpdate={setMessengerUser}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400">خطا در دسترسی به پیام‌رسان</p>
      </div>
    </div>
  );
};

export default BorderlessHubMessenger;
