
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { SalesAgentCourseManagement } from '../SalesAgentCourseManagement';

interface UserRole {
  id: number;
  role_name: string;
  is_active: boolean;
  granted_at: string;
}

interface UserRoleManagementProps {
  userId: number;
}

const UserRoleManagement: React.FC<UserRoleManagementProps> = ({ userId }) => {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [isSalesAgent, setIsSalesAgent] = useState(false);

  const availableRoles = [
    { value: 'admin', label: 'مدیر' },
    { value: 'moderator', label: 'مدیر گروه' },
    { value: 'user', label: 'کاربر عادی' },
    { value: 'support', label: 'پشتیبانی' },
    { value: 'enrollments_manager', label: 'مدیر ثبت‌نام‌ها' },
    { value: 'sales_agent', label: 'نماینده فروش' }
  ];

  useEffect(() => {
    fetchUserRoles();
  }, [userId]);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role_name, is_active, granted_at')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      setUserRoles(data || []);
      
      // Check if user is a sales agent
      const hasSalesAgentRole = data?.some(role => role.role_name === 'sales_agent');
      setIsSalesAgent(hasSalesAgentRole || false);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری نقش‌های کاربر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRole = async () => {
    if (!selectedRole) return;

    try {
      setAdding(true);
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_name: selectedRole,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'نقش با موفقیت اضافه شد',
      });

      setSelectedRole('');
      fetchUserRoles();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: 'خطا',
        description: error.message.includes('duplicate') 
          ? 'این نقش قبلاً به کاربر اختصاص داده شده است'
          : 'خطا در اضافه کردن نقش',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const removeRole = async (roleId: number) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'نقش با موفقیت حذف شد',
      });

      fetchUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف نقش',
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: string) => {
    return availableRoles.find(r => r.value === role)?.label || role;
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'default';
      case 'support': return 'secondary';
      case 'enrollments_manager': return 'outline';
      case 'sales_agent': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6" dir="rtl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Shield className="h-5 w-5" />
            مدیریت نقش‌های کاربر
          </CardTitle>
        </CardHeader>
        <CardContent className="text-right">
          <div className="space-y-6">
            {/* Current Roles */}
            <div>
              <h3 className="text-lg font-semibold mb-3">نقش‌های فعلی</h3>
              {userRoles.length === 0 ? (
                <p className="text-muted-foreground">هیچ نقش خاصی تعریف نشده است</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((userRole) => (
                    <div key={userRole.id} className="flex items-center gap-2">
                      <Badge 
                        variant={getRoleVariant(userRole.role_name)}
                        className="text-xs"
                      >
                        {getRoleLabel(userRole.role_name)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(userRole.id)}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Role */}
            <div>
              <h3 className="text-lg font-semibold mb-3">اضافه کردن نقش جدید</h3>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-48 min-w-0">
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles
                      .filter(role => !userRoles.some(ur => ur.role_name === role.value))
                      .map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={addRole}
                  disabled={!selectedRole || adding}
                  className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">
                    {adding ? 'در حال افزودن...' : 'افزودن نقش'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Agent Course Management */}
      {isSalesAgent && (
        <SalesAgentCourseManagement userId={userId} />
      )}
    </div>
  );
};

export { UserRoleManagement };
