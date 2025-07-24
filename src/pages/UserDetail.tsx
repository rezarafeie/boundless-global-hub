import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import { UserCRM } from '@/components/Admin/UserProfile/UserCRM';
import type { ChatUser } from '@/lib/supabase';

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);

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
          {/* Basic User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                اطلاعات کاربر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نام</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{user.name || 'نامشخص'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>شماره تلفن</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                </div>
                
                {user.email && (
                  <div className="space-y-2">
                    <Label>ایمیل</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>تاریخ عضویت</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              {user.username && (
                <div className="space-y-2 mt-4">
                  <Label>نام کاربری</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>@{user.username}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <Label>وضعیت تایید</Label>
                <div className="flex items-center gap-2">
                  {user.is_approved ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      تایید شده
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      <XCircle className="h-3 w-3 ml-1" />
                      تایید نشده
                    </Badge>
                  )}
                </div>
              </div>

              {/* Role Badges */}
              <div className="space-y-2 mt-4">
                <Label>نقش‌ها و دسترسی‌ها</Label>
                <div className="flex flex-wrap gap-2">
                  {user.is_messenger_admin && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      مدیر پیام‌رسان
                    </Badge>
                  )}
                  {user.bedoun_marz_approved && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      عضو بدون مرز
                    </Badge>
                  )}
                  {user.is_support_agent && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      نماینده پشتیبانی
                    </Badge>
                  )}
                  {!user.is_messenger_admin && !user.bedoun_marz_approved && !user.is_support_agent && (
                    <Badge variant="outline">کاربر عادی</Badge>
                  )}
                </div>
              </div>

              {user.last_seen && (
                <div className="space-y-2 mt-4">
                  <Label>آخرین بازدید</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(user.last_seen)}</span>
                  </div>
                </div>
              )}

              {user.user_id && (
                <div className="space-y-2 mt-4">
                  <Label>شناسه کاربری سیستم</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-xs font-mono">{user.user_id}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bio Section */}
          {user.bio && (
            <Card>
              <CardHeader>
                <CardTitle>بیوگرافی</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional User Information */}
          {(user.first_name || user.last_name || user.full_name) && (
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات تکمیلی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.first_name && (
                    <div className="space-y-2">
                      <Label>نام</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span>{user.first_name}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.last_name && (
                    <div className="space-y-2">
                      <Label>نام خانوادگی</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span>{user.last_name}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.full_name && (
                    <div className="space-y-2">
                      <Label>نام کامل</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span>{user.full_name}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.country_code && (
                    <div className="space-y-2">
                      <Label>کد کشور</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span>{user.country_code}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.signup_source && (
                    <div className="space-y-2">
                      <Label>منبع ثبت‌نام</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span>{user.signup_source}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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