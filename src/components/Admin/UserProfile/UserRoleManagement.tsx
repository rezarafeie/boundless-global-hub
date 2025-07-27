
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  id: number;
  role_name: string;
  is_active: boolean;
  assigned_by: number;
  assigned_at: string;
}

interface UserRoleManagementProps {
  userId: number;
}

export function UserRoleManagement({ userId }: UserRoleManagementProps) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const { toast } = useToast();

  const availableRoles = [
    { value: 'admin', label: 'مدیر' },
    { value: 'sales_agent', label: 'نماینده فروش' },
    { value: 'moderator', label: 'مدیر بخش' },
    { value: 'user', label: 'کاربر عادی' }
  ];

  useEffect(() => {
    fetchUserRoles();
  }, [userId]);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our interface
      const mappedRoles = data?.map(role => ({
        id: role.id,
        role_name: role.role_name,
        is_active: role.is_active,
        assigned_by: role.granted_by,
        assigned_at: role.granted_at
      })) || [];
      
      setUserRoles(mappedRoles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری نقش‌های کاربر.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole) return;

    try {
      // Check if role already exists
      const existingRole = userRoles.find(role => role.role_name === selectedRole && role.is_active);
      if (existingRole) {
        toast({
          title: "خطا",
          description: "این نقش قبلاً برای کاربر تعریف شده است.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_name: selectedRole,
          is_active: true,
          granted_by: 1, // Should be current admin user ID
          granted_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "نقش با موفقیت اضافه شد."
      });

      setSelectedRole('');
      setIsAddingRole(false);
      fetchUserRoles();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن نقش.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "نقش با موفقیت حذف شد."
      });

      fetchUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف نقش.",
        variant: "destructive"
      });
    }
  };

  const getRoleLabel = (roleName: string) => {
    const role = availableRoles.find(r => r.value === roleName);
    return role ? role.label : roleName;
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'sales_agent': 'bg-green-100 text-green-800',
      'moderator': 'bg-blue-100 text-blue-800',
      'user': 'bg-gray-100 text-gray-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            مدیریت نقش‌ها
          </CardTitle>
          <Button
            onClick={() => setIsAddingRole(true)}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            افزودن نقش
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Role Form */}
        {isAddingRole && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="space-y-4">
              <div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddRole} disabled={!selectedRole}>
                  افزودن
                </Button>
                <Button variant="outline" onClick={() => setIsAddingRole(false)}>
                  لغو
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Roles List */}
        {userRoles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هیچ نقشی برای این کاربر تعریف نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {userRoles
              .filter(role => role.is_active)
              .map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleColor(role.role_name)}>
                      {getRoleLabel(role.role_name)}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      تاریخ تعیین: {new Date(role.assigned_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRole(role.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
