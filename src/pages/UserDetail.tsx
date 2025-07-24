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
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
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
          {/* User Overview */}
          <UserOverview user={user} />

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