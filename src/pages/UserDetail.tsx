import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, CheckCircle, XCircle, FileText, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import { UserCRM } from '@/components/Admin/UserProfile/UserCRM';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
import { messengerService } from '@/lib/messengerService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ChatUser } from '@/lib/supabase';

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        toast({
          title: 'خطا',
          description: 'شناسه کاربر معتبر نیست',
          variant: 'destructive',
        });
        navigate('/enroll/admin?tab=users');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', parseInt(userId))
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          toast({
            title: 'خطا',
            description: 'کاربر یافت نشد',
            variant: 'destructive',
          });
          navigate('/enroll/admin?tab=users');
          return;
        }

        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'خطا',
          description: 'خطا در بارگذاری اطلاعات کاربر',
          variant: 'destructive',
        });
        navigate('/enroll/admin?tab=users');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate, toast]);

  const handleRoleUpdate = async (field: string, value: any) => {
    if (!user) return;

    setUpdatingRole(true);
    try {
      const updateData = { [field]: value };
      await messengerService.updateUser(user.id, updateData);
      
      setUser({ ...user, [field]: value });
      toast({
        title: 'موفق',
        description: 'نقش کاربر با موفقیت به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی نقش کاربر',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدیر';
      case 'enrollments_manager':
        return 'مدیر ثبت‌نام‌ها';
      case 'support':
        return 'پشتیبانی';
      default:
        return 'کاربر عادی';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگذاری اطلاعات کاربر...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">کاربر یافت نشد</p>
            <Button onClick={() => navigate('/enroll/admin?tab=users')} className="mt-4">
              بازگشت به لیست کاربران
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b mb-6">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/enroll/admin?tab=users')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                بازگشت
              </Button>
              <div>
                <h1 className="text-2xl font-bold">جزئیات کاربر</h1>
                <p className="text-muted-foreground">اطلاعات کامل کاربر</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* User Overview */}
          <UserOverview user={user} />

          {/* Role Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                مدیریت نقش‌ها و دسترسی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Role */}
              <div className="space-y-2">
                <Label>نقش اصلی</Label>
                <Select 
                  value={user.role || 'user'} 
                  onValueChange={(value) => handleRoleUpdate('role', value)}
                  disabled={updatingRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نقش را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">کاربر عادی</SelectItem>
                    <SelectItem value="support">پشتیبانی</SelectItem>
                    <SelectItem value="enrollments_manager">مدیر ثبت‌نام‌ها</SelectItem>
                    <SelectItem value="admin">مدیر</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  نقش فعلی: <Badge variant="outline">{getRoleLabel(user.role || 'user')}</Badge>
                </p>
              </div>

              {/* Additional Permissions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>تایید شده</Label>
                    <p className="text-sm text-muted-foreground">کاربر تایید شده است</p>
                  </div>
                  <Switch
                    checked={user.is_approved}
                    onCheckedChange={(checked) => handleRoleUpdate('is_approved', checked)}
                    disabled={updatingRole}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>مدیر پیام‌رسان</Label>
                    <p className="text-sm text-muted-foreground">دسترسی مدیریت پیام‌رسان</p>
                  </div>
                  <Switch
                    checked={user.is_messenger_admin}
                    onCheckedChange={(checked) => handleRoleUpdate('is_messenger_admin', checked)}
                    disabled={updatingRole}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>نماینده پشتیبانی</Label>
                    <p className="text-sm text-muted-foreground">دسترسی پشتیبانی کاربران</p>
                  </div>
                  <Switch
                    checked={user.is_support_agent}
                    onCheckedChange={(checked) => handleRoleUpdate('is_support_agent', checked)}
                    disabled={updatingRole}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>تایید بدون مرز</Label>
                    <p className="text-sm text-muted-foreground">دسترسی به محتوای بدون مرز</p>
                  </div>
                  <Switch
                    checked={user.bedoun_marz_approved}
                    onCheckedChange={(checked) => handleRoleUpdate('bedoun_marz_approved', checked)}
                    disabled={updatingRole}
                  />
                </div>
              </div>

              {/* Role Permissions Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">دسترسی‌های نقش فعلی</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {user.role === 'admin' && (
                    <>
                      <p>• دسترسی کامل به همه بخش‌ها</p>
                      <p>• مدیریت کاربران و ثبت‌نام‌ها</p>
                      <p>• مدیریت دوره‌ها و محتوا</p>
                    </>
                  )}
                  {user.role === 'enrollments_manager' && (
                    <>
                      <p>• مدیریت کاربران</p>
                      <p>• مدیریت ثبت‌نام‌ها</p>
                      <p>• مشاهده گزارشات</p>
                    </>
                  )}
                  {user.role === 'support' && (
                    <>
                      <p>• پشتیبانی از کاربران</p>
                      <p>• مشاهده تیکت‌ها</p>
                    </>
                  )}
                  {(!user.role || user.role === 'user') && (
                    <p>• دسترسی‌های پایه کاربری</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Enrollments */}
          <UserEnrollments userId={user.id} />

          {/* User Licenses */}
          <UserLicenses userId={user.id} userPhone={user.phone} />

          {/* User Activity */}
          <UserActivity userId={user.id} />

          {/* CRM Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                مدیریت CRM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserCRM userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserDetail;