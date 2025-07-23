import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowRight, 
  User, 
  CreditCard, 
  Key, 
  MessageSquare, 
  Activity,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar
} from 'lucide-react';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import { UserCRM } from '@/components/Admin/UserProfile/UserCRM';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
import { supabase } from '@/integrations/supabase/client';

interface User {
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
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    overview: true,
    enrollments: false,
    licenses: false,
    crm: false,
    activity: true
  });

  useEffect(() => {
    if (userId) {
      fetchUser(parseInt(userId));
    }
  }, [userId]);

  const fetchUser = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusBadges = (user: User) => {
    const badges = [];
    if (user.is_approved) badges.push(<Badge key="approved" variant="default">تایید شده</Badge>);
    if (user.is_messenger_admin) badges.push(<Badge key="admin" variant="destructive">مدیر</Badge>);
    if (user.bedoun_marz_approved) badges.push(<Badge key="boundless" variant="secondary">بدون مرز</Badge>);
    return badges;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'نامشخص';
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
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری پروفایل کاربر...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">کاربر یافت نشد</h1>
            <p className="text-muted-foreground mb-4">کاربر درخواست شده پیدا نشد.</p>
            <Button onClick={() => navigate('/enroll/admin/users')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              بازگشت به لیست کاربران
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 'overview',
      title: 'اطلاعات کلی',
      icon: User,
      component: <UserOverview user={user} />
    },
    {
      id: 'enrollments',
      title: 'ثبت‌نام‌ها در دوره‌ها',
      icon: CreditCard,
      component: <UserEnrollments userId={user.id} />
    },
    {
      id: 'licenses',
      title: 'لایسنس‌ها',
      icon: Key,
      component: <UserLicenses userId={user.id} userPhone={user.phone} />
    },
    {
      id: 'crm',
      title: 'مدیریت ارتباط با مشتری',
      icon: MessageSquare,
      component: <UserCRM userId={user.id} />
    },
    {
      id: 'activity',
      title: 'پیشرفت تحصیلی و فعالیت‌ها',
      icon: Activity,
      component: <UserActivity userId={user.id} />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/enroll/admin/users')}
                className="self-start flex items-center gap-2"
                size="sm"
              >
                <ArrowRight className="w-4 h-4" />
                بازگشت به لیست کاربران
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground text-sm">شناسه کاربر: #{user.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {getStatusBadges(user)}
            </div>
          </div>
        </div>

        {/* Quick Info Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <User className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <p className="font-medium text-sm sm:text-base">{user.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{user.phone}</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-primary">{formatDate(user.created_at).split(' ')[0]}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">تاریخ ثبت‌نام</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-accent">{formatDate(user.last_seen).split(' ')[0]}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">آخرین بازدید</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-secondary">{user.signup_source || 'وب‌سایت'}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">منبع ثبت‌نام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const isOpen = openSections[section.id as keyof typeof openSections];
            
            return (
              <Collapsible
                key={section.id}
                open={isOpen}
                onOpenChange={() => toggleSection(section.id as keyof typeof openSections)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4 sm:p-6">
                      <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                          {section.title}
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {section.component}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}