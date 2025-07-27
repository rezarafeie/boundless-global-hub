
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Phone, Mail, Calendar, Shield, Crown, AlertCircle, MessageSquare, Activity, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import UserCRM from '@/components/Admin/UserProfile/UserCRM';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  last_seen: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  bedoun_marz_approved: boolean;
  signup_source: string;
  user_id: string;
  first_name: string;
  last_name: string;
  country_code: string;
  username: string;
  bio: string;
  is_support_agent: boolean;
  avatar_url: string;
}

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);

  const fetchUser = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">در حال بارگذاری اطلاعات کاربر...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">کاربر یافت نشد</h2>
              <p className="text-muted-foreground mb-4">
                کاربری با شناسه {userId} یافت نشد.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              پروفایل کاربر
            </CardTitle>
            <div className="flex gap-2">
              {user.is_approved && (
                <Badge variant="default">تایید شده</Badge>
              )}
              {user.is_messenger_admin && (
                <Badge variant="destructive">ادمین</Badge>
              )}
              {user.bedoun_marz_approved && (
                <Badge variant="secondary">بدون مرز</Badge>
              )}
              {user.is_support_agent && (
                <Badge variant="outline">پشتیبان</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">نام و نام خانوادگی</div>
                  <div className="font-bold">{user.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">نام کاربری</div>
                  <div className="font-bold">
                    {user.username ? `@${user.username}` : 'ندارد'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">ایمیل</div>
                  <div className="font-bold">{user.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">شماره تلفن</div>
                  <div className="font-bold">{user.phone}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">تاریخ عضویت</div>
                  <div className="font-bold">{formatDate(user.created_at)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">آخرین بازدید</div>
                  <div className="font-bold">{formatDate(user.last_seen)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">منبع ثبت‌نام</div>
                  <div className="font-bold">{user.signup_source}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">بیوگرافی</div>
                  <div className="font-bold">{user.bio || 'ندارد'}</div>
                </div>
              </div>

              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="licenses" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Licenses
                  </TabsTrigger>
                  <TabsTrigger value="crm" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    CRM
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  <UserOverview user={user} />
                </TabsContent>
                <TabsContent value="licenses" className="mt-6">
                  <UserLicenses userId={user.id} userPhone={user.phone} />
                </TabsContent>
                <TabsContent value="crm" className="mt-6">
                  <UserCRM 
                    userId={user.id}
                    userName={user.name}
                    userPhone={user.phone}
                    userEmail={user.email}
                  />
                </TabsContent>
                <TabsContent value="activity" className="mt-6">
                  <UserActivity userId={user.id} />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;
