import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        // Check user role from academy_users table
        const { data: userData, error } = await supabase
          .from('academy_users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          toast({
            title: "خطا",
            description: "خطا در دریافت نقش کاربر",
            variant: "destructive"
          });
          setRole(null);
        } else {
          setRole(userData?.role || 'student');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          checkUserRole();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

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