import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'sales_manager' | 'student' | null;

interface UserRoleInfo {
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isSalesManager: boolean;
  canManageLeads: boolean;
  canViewSales: boolean;
}

export const useUserRole = (): UserRoleInfo => {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRole = () => {
      console.log('🔍 useUserRole: Determining role...', { user, authLoading });
      
      if (authLoading) {
        console.log('🔍 useUserRole: Still loading auth...');
        setLoading(true);
        return;
      }

      if (!user) {
        console.log('🔍 useUserRole: No user found');
        setRole(null);
        setLoading(false);
        return;
      }

      console.log('🔍 useUserRole: User found:', {
        isAcademyUser: user.isAcademyUser,
        isMessengerUser: user.isMessengerUser,
        messengerData: user.messengerData
      });

      // Check if academy user first
      if (user.isAcademyUser && user.academyData) {
        console.log('🔍 useUserRole: Academy user detected');
        // Academy users might have roles in academy_users table
        // For now, default academy users to student unless they're admin
        setRole('student');
      } else if (user.isMessengerUser && user.messengerData) {
        // Messenger users - check their role and admin status
        const messengerData = user.messengerData;
        console.log('🔍 useUserRole: Messenger user detected:', {
          role: messengerData.role,
          is_messenger_admin: messengerData.is_messenger_admin
        });
        
        if (messengerData.is_messenger_admin || messengerData.role === 'admin') {
          console.log('🔍 useUserRole: Setting role to admin');
          setRole('admin');
        } else if (messengerData.role === 'sales_manager') {
          console.log('🔍 useUserRole: Setting role to sales_manager');
          setRole('sales_manager');
        } else {
          console.log('🔍 useUserRole: Setting role to student');
          setRole('student');
        }
      } else {
        console.log('🔍 useUserRole: Unknown user type, setting to student');
        setRole('student');
      }

      setLoading(false);
    };

    determineRole();
  }, [user, authLoading]);

  const isAdmin = role === 'admin';
  const isSalesManager = role === 'sales_manager';
  const canManageLeads = isAdmin || isSalesManager;
  const canViewSales = isAdmin || isSalesManager;

  return {
    role,
    loading,
    isAdmin,
    isSalesManager,
    canManageLeads,
    canViewSales,
  };
};