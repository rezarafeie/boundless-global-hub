
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Phone, Mail, Calendar, Shield, Settings, BookOpen, TrendingUp, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import UserRoleManagement from '@/components/Admin/UserProfile/UserRoleManagement';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import LearningProgress from '@/components/Admin/UserProfile/LearningProgress';
import UserCRM from '@/components/Admin/UserProfile/UserCRM';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    id: number;
    name: string;
    phone: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_approved: boolean;
    is_messenger_admin: boolean;
    is_support_agent: boolean;
    bedoun_marz: boolean;
    bedoun_marz_approved: boolean;
    bedoun_marz_request: boolean;
    role: string | null;
    created_at: string;
    updated_at: string;
    last_seen: string | null;
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    country_code: string | null;
    password_hash: string | null;
    signup_source: string | null;
    notification_enabled: boolean;
    notification_token: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', parseInt(id!))
          .single();

        if (error) throw error;
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: "خطا",
          description: "خطا در دریافت اطلاعات کاربر",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRoleUpdate = () => {
    // Refresh user data after role update
    if (id) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('chat_users')
            .select('*')
            .eq('id', parseInt(id))
            .single();

          if (error) throw error;
          setUser(data);
        } catch (error) {
          console.error('Error fetching user:', error);
          toast({
            title: "خطا",
            description: "خطا در دریافت اطلاعات کاربر",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent>
            <p>در حال بارگذاری اطلاعات کاربر...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent>
            <p>کاربر یافت نشد.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 ml-2" />
        بازگشت
      </Button>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            جزئیات کاربر
          </CardTitle>
          <div className="flex items-center gap-2">
            {user.is_approved ? (
              <Badge variant="outline">تایید شده</Badge>
            ) : (
              <Badge variant="destructive">تایید نشده</Badge>
            )}
            {user.is_messenger_admin && <Badge variant="secondary">مدیر پیام‌رسان</Badge>}
            {user.is_support_agent && <Badge variant="secondary">پشتیبان</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                اطلاعات کلی
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                فعالیت‌ها
              </TabsTrigger>
              <TabsTrigger value="enrollments" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                ثبت‌نام‌ها
              </TabsTrigger>
              <TabsTrigger value="licenses" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                لایسنس‌ها
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                پیشرفت یادگیری
              </TabsTrigger>
              <TabsTrigger value="crm" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                CRM
              </TabsTrigger>
              <TabsTrigger value="role" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                مدیریت نقش
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <UserOverview user={user} />
            </TabsContent>
            <TabsContent value="activity" className="space-y-4">
              <UserActivity userId={user.id} />
            </TabsContent>
            <TabsContent value="enrollments" className="space-y-4">
              <UserEnrollments userId={user.id} />
            </TabsContent>
            <TabsContent value="licenses" className="space-y-4">
              <UserLicenses userId={user.id} />
            </TabsContent>
            <TabsContent value="progress" className="space-y-4">
              <LearningProgress userId={user.id} />
            </TabsContent>
            <TabsContent value="crm" className="space-y-4">
              <UserCRM 
                userId={user.id}
                userName={user.full_name || user.name}
                userPhone={user.phone}
                userEmail={user.email || ''}
              />
            </TabsContent>
            <TabsContent value="role" className="space-y-4">
              <UserRoleManagement
                userId={user.id}
                userName={user.full_name || user.name}
                userPhone={user.phone}
                userEmail={user.email || ''}
                currentRole={user.role || 'user'}
                isMessengerAdmin={user.is_messenger_admin}
                isSupportAgent={user.is_support_agent}
                onRoleUpdate={handleRoleUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetail;
