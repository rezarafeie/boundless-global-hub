
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, Calendar, BookOpen, Bell, Settings, LogOut } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

const UserHub: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('با موفقیت خارج شدید');
    } catch (error) {
      toast.error('خطا در خروج');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-xl font-bold bg-blue-100 text-blue-600">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                خوش آمدید، {user.firstName}
              </h1>
              <p className="text-gray-600">شناسه کاربری: {user.id}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            خروج
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                اطلاعات کاربری
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">ایمیل</p>
                  <p className="text-sm text-gray-600">{user.email || 'تنظیم نشده'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">شماره موبایل</p>
                  <p className="text-sm text-gray-600" dir="ltr">{user.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">تاریخ عضویت</p>
                  <p className="text-sm text-gray-600">
                    {user.messengerData?.created_at ? new Date(user.messengerData.created_at).toLocaleDateString('fa-IR') : 
                     user.academyData?.created_at ? new Date(user.academyData.created_at).toLocaleDateString('fa-IR') : 'نامشخص'}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Badge variant={user.messengerData?.is_approved || user.isAcademyUser ? "default" : "secondary"}>
                  {user.messengerData?.is_approved || user.isAcademyUser ? 'تأیید شده' : 'در انتظار تأیید'}
                </Badge>
              </div>
              
              <Button variant="outline" className="w-full gap-2">
                <Settings className="w-4 h-4" />
                ویرایش اطلاعات
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Courses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                دوره‌های من
              </CardTitle>
              <CardDescription>
                دوره‌هایی که در آن‌ها ثبت‌نام کرده‌اید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید</p>
                <Button className="mt-4">مشاهده دوره‌ها</Button>
              </div>
            </CardContent>
          </Card>

          {/* Announcements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                اطلاعیه‌ها
              </CardTitle>
              <CardDescription>
                آخرین اطلاعیه‌های آکادمی رفیعی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>اطلاعیه‌ای برای نمایش وجود ندارد</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>دسترسی سریع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <BookOpen className="w-6 h-6" />
                  <span>مشاهده دوره‌ها</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <Bell className="w-6 h-6" />
                  <span>اطلاعیه‌ها</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserHub;
