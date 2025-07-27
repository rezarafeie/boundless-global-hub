
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCog, Plus, Trash2, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  id: string;
  role_name: string;
  is_active: boolean;
  assigned_by: string;
  assigned_at: string;
  notes?: string;
}

interface UserRoleManagementProps {
  userId: number;
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'مدیر', description: 'دسترسی کامل به سیستم' },
  { value: 'moderator', label: 'مدیر محتوا', description: 'مدیریت محتوا و کاربران' },
  { value: 'support', label: 'پشتیبان', description: 'پاسخگویی به کاربران' },
  { value: 'sales_agent', label: 'نماینده فروش', description: 'مدیریت لیدها و CRM' },
  { value: 'user', label: 'کاربر عادی', description: 'دسترسی محدود' }
];

export function UserRoleManagement({ userId }: UserRoleManagementProps) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleNotes, setRoleNotes] = useState<string>('');
  const { toast } = useToast();

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
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
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
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_name: selectedRole,
          is_active: true,
          notes: roleNotes || null
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "نقش با موفقیت اضافه شد."
      });

      setSelectedRole('');
      setRoleNotes('');
      setIsAdding(false);
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

  const handleToggleRole = async (roleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: !currentStatus })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: `نقش ${!currentStatus ? 'فعال' : 'غیرفعال'} شد.`
      });

      fetchUserRoles();
    } catch (error) {
      console.error('Error toggling role:', error);
      toast({
        title: "خطا",
        description: "خطا در تغییر وضعیت نقش.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
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
    const role = AVAILABLE_ROLES.find(r => r.value === roleName);
    return role ? role.label : roleName;
  };

  const getRoleVariant = (roleName: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (roleName) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      case 'support':
        return 'secondary';
      case 'sales_agent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl" className="w-full max-w-full overflow-hidden">
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCog className="w-5 h-5" />
              مدیریت نقش‌ها
            </CardTitle>
            <Button 
              onClick={() => setIsAdding(true)}
              size="sm"
              className="flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              افزودن نقش
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6">
          {isAdding && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">نقش</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب نقش" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{role.label}</span>
                              <span className="text-sm text-muted-foreground">{role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">یادداشت (اختیاری)</Label>
                  <Textarea
                    id="notes"
                    placeholder="یادداشت در مورد اختصاص این نقش..."
                    value={roleNotes}
                    onChange={(e) => setRoleNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleAddRole}
                    disabled={!selectedRole}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن نقش
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAdding(false);
                      setSelectedRole('');
                      setRoleNotes('');
                    }}
                  >
                    لغو
                  </Button>
                </div>
              </div>
            </div>
          )}

          {userRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ نقش خاصی برای این کاربر تعریف نشده است.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نقش</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">تاریخ تخصیص</TableHead>
                    <TableHead className="text-right">یادداشت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Badge variant={getRoleVariant(role.role_name)}>
                          {getRoleLabel(role.role_name)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={role.is_active}
                            onCheckedChange={() => handleToggleRole(role.id, role.is_active)}
                          />
                          <span className="text-sm">
                            {role.is_active ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(role.assigned_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {role.notes ? (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{role.notes}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(role.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
