import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, BarChart3, Settings, Webhook, UserCheck, Mail } from 'lucide-react';
import CourseManagement from '@/components/Admin/CourseManagement';
import { WebhookManagement } from '@/components/Admin/WebhookManagement';
import UserManagement from '@/components/Admin/UserManagement';
import EmailSettings from '@/components/Admin/EmailSettings';

const EnrollmentAdmin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            پنل مدیریت آکادمی رفیعی
          </h1>
          <p className="text-muted-foreground">مدیریت دوره‌ها و ثبت‌نام‌ها</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="w-full flex flex-wrap justify-start bg-white/70 backdrop-blur-sm p-2 gap-2">
            <TabsTrigger value="courses" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">دوره‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">ثبت‌نام‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">کاربران</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Webhook className="h-4 w-4" />
              <span className="hidden sm:inline">وب‌هوک‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">آمار</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2 min-w-0 flex-shrink-0 bg-blue-50 text-blue-600 border border-blue-200">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">ایمیل</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">تنظیمات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <CourseManagement />
          </TabsContent>

          <TabsContent value="enrollments" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>گزارش ثبت‌نام‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    گزارش ثبت‌نام‌ها در بخش مدیریت دوره‌ها قابل مشاهده است
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <WebhookManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">تنظیمات ایمیل</h3>
              <p className="text-blue-700 mb-4">برای مدیریت کامل ایمیل‌ها و تنظیمات Gmail به صفحه اختصاصی مراجعه کنید.</p>
              <a 
                href="/enroll/admin/email" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>مدیریت ایمیل‌ها</span>
              </a>
            </div>
            <EmailSettings />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">کل فروش</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ۱۲۵,۰۰۰,۰۰۰ تومان
                  </div>
                  <p className="text-sm text-muted-foreground">در این ماه</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">تعداد ثبت‌نام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">۴۲</div>
                  <p className="text-sm text-muted-foreground">در این ماه</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">نرخ تبدیل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">۸۵٪</div>
                  <p className="text-sm text-muted-foreground">بازدید به خرید</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>آمار فروش هفتگی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    نمودار آمار در نسخه‌های بعدی اضافه خواهد شد
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>تنظیمات سیستم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">تنظیمات پرداخت</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• درگاه: زرین‌پال</li>
                      <li>• واحد پول: تومان</li>
                      <li>• تایید خودکار: فعال</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">تنظیمات WooCommerce</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• دامنه: auth.rafiei.co</li>
                      <li>• API: فعال</li>
                      <li>• سفارش خودکار: فعال</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">اطلاعات مهم</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• تمام پرداخت‌ها از طریق زرین‌پال امن هستند</li>
                    <li>• سفارشات به صورت خودکار در WooCommerce ثبت می‌شوند</li>
                    <li>• ایمیل‌های تایید به صورت خودکار ارسال می‌شوند</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnrollmentAdmin;