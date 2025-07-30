import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'sales_manager' | 'sales_agent' | 'student' | null;

interface UserRoleInfo {
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isSalesManager: boolean;
  isSalesAgent: boolean;
  canManageLeads: boolean;
  canViewSales: boolean;
  canDistributeLeads: boolean;
  canAccessSalesTab: boolean;
  canAccessCRM: boolean;
}

export const useUserRole = (): UserRoleInfo => {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRole = () => {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Check if academy user first
      if (user.isAcademyUser && user.academyData) {
        // Academy users might have roles in academy_users table
        // For now, default academy users to student unless they're admin
        setRole('student');
      } else if (user.isMessengerUser && user.messengerData) {
        // Messenger users - check their role and admin status
        const messengerData = user.messengerData;
        
        if (messengerData.is_messenger_admin || messengerData.role === 'admin') {
          setRole('admin');
        } else if (messengerData.role === 'sales_manager') {
          setRole('sales_manager');
        } else if (messengerData.role === 'sales_agent') {
          setRole('sales_agent');
        } else {
          setRole('student');
        }
      } else {
        setRole('student');
      }

      setLoading(false);
    };

    determineRole();
  }, [user, authLoading]);

  const isAdmin = role === 'admin';
  const isSalesManager = role === 'sales_manager';
  const isSalesAgent = role === 'sales_agent';
  const canManageLeads = isAdmin || isSalesManager || isSalesAgent;
  const canViewSales = isAdmin || isSalesManager;
  const canDistributeLeads = isAdmin || isSalesManager;
  const canAccessSalesTab = isAdmin || isSalesManager;
  const canAccessCRM = isAdmin || isSalesManager || isSalesAgent;

  return {
    role,
    loading,
    isAdmin,
    isSalesManager,
    isSalesAgent,
    canManageLeads,
    canViewSales,
    canDistributeLeads,
    canAccessSalesTab,
    canAccessCRM,
  };
};