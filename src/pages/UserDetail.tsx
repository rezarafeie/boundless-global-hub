
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Phone, Mail, Calendar, Shield, Settings, BookOpen, TrendingUp, MessageSquare, Edit, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserRoleManagement from '@/components/Admin/UserProfile/UserRoleManagement';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import LearningProgress from '@/components/Admin/UserProfile/LearningProgress';
import UserCRM from '@/components/Admin/UserProfile/UserCRM';
import UserFinancialHistory from '@/components/Admin/UserProfile/UserFinancialHistory';
import UserEditModal from '@/components/Admin/UserEditModal';

interface UserData {
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
  // New profile fields
  gender: 'male' | 'female' | null;
  age: number | null;
  education: string | null;
  job: string | null;
  specialized_program: 'drop_shipping' | 'drop_servicing' | 'digital_goods' | 'ai' | null;
  country: string | null;
  province: string | null;
}

const UserDetail: React.FC = () => {
  const { id, userId } = useParams<{ id?: string; userId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const userIdToFetch = id || userId;

  useEffect(() => {
    const fetchUser = async () => {
      if (!userIdToFetch) {
        toast({
          title: "خطا",
          description: "شناسه کاربر معتبر نیست",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', parseInt(userIdToFetch))
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
  }, [userIdToFetch, toast]);

  const handleRoleUpdate = () => {
    if (userIdToFetch) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('chat_users')
            .select('*')
            .eq('id', parseInt(userIdToFetch))
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
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mr-4">در حال بارگذاری اطلاعات کاربر...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center py-8">کاربر یافت نشد.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 ml-2" />
        بازگشت
      </Button>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            جزئیات کاربر
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              ویرایش پروفایل
            </Button>
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs md:text-sm">
                <User className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">اطلاعات کلی</span>
                <span className="sm:hidden">کلی</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1 text-xs md:text-sm">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">فعالیت‌ها</span>
                <span className="sm:hidden">فعالیت</span>
              </TabsTrigger>
              <TabsTrigger value="enrollments" className="flex items-center gap-1 text-xs md:text-sm">
                <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">ثبت‌نام‌ها</span>
                <span className="sm:hidden">ثبت‌نام</span>
              </TabsTrigger>
              <TabsTrigger value="licenses" className="flex items-center gap-1 text-xs md:text-sm">
                <Shield className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">لایسنس‌ها</span>
                <span className="sm:hidden">لایسنس</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-1 text-xs md:text-sm">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">پیشرفت یادگیری</span>
                <span className="sm:hidden">پیشرفت</span>
              </TabsTrigger>
              <TabsTrigger value="crm" className="flex items-center gap-1 text-xs md:text-sm">
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                CRM
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-1 text-xs md:text-sm">
                <Wallet className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">تاریخچه مالی</span>
                <span className="sm:hidden">مالی</span>
              </TabsTrigger>
              <TabsTrigger value="role" className="flex items-center gap-1 text-xs md:text-sm">
                <Settings className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">مدیریت نقش</span>
                <span className="sm:hidden">نقش</span>
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
              <UserLicenses userId={user.id} userPhone={user.phone} />
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

            <TabsContent value="financial" className="space-y-4">
              <UserFinancialHistory userId={user.id} />
            </TabsContent>
            
            <TabsContent value="role" className="space-y-4">
              <div dir="rtl" className="text-right">
                <UserRoleManagement
                  userId={user.id}
                  userName={user.full_name || user.name}
                  userPhone={user.phone}
                  userEmail={user.email || ''}
                  currentRole={user.role || 'user'}
                  isMessengerAdmin={user.is_messenger_admin}
                  isSupportAgent={user.is_support_agent}
                  isApproved={user.is_approved}
                  bedounMarz={user.bedoun_marz}
                  notificationEnabled={user.notification_enabled}
                  onRoleUpdate={handleRoleUpdate}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onUserUpdate={handleRoleUpdate}
      />
    </div>
  );
};

export default UserDetail;
