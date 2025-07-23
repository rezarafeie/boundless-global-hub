
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, Wifi, Users, MessageSquare, Bell, Shield, Link } from 'lucide-react';
import { messengerService } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import HubManagementSection from '@/components/Admin/HubManagementSection';
import MessengerAdminSection from '@/components/Admin/MessengerAdminSection';
import NotificationManagementSection from '@/components/Admin/NotificationManagementSection';
import ShortLinksManager from '@/components/admin/ShortLinksManager';

const BorderlessHubAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSupportLogin = async () => {
    try {
      // Get current session token
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        toast({
          variant: "destructive",
          title: "خطا",
          description: "لطفاً ابتدا وارد شوید"
        });
        return;
      }

      // Validate session and get user data
      const result = await messengerService.validateSession(sessionToken);
      if (!result) {
        toast({
          variant: "destructive", 
          title: "خطا",
          description: "جلسه کاری نامعتبر است"
        });
        return;
      }

      // Force enable support access for admin users
      if (result.is_messenger_admin) {
        // Navigate to support panel with forced access
        navigate('/hub/support?force_access=true');
        toast({
          title: "موفق",
          description: "در حال انتقال به پنل پشتیبانی..."
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطا", 
          description: "شما دسترسی مدیریت ندارید"
        });
      }
    } catch (error) {
      console.error('Support login error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در ورود به پنل پشتیبانی"
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 pt-20">
        {/* Clean Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  مرکز کنترل بدون مرز
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  پنل مدیریت کامل سیستم Hub و Messenger
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="hub-management" className="w-full">
            {/* Mobile-First Tab Navigation */}
            <TabsList className="grid w-full grid-cols-4 mb-6 h-auto">
              <TabsTrigger 
                value="hub-management" 
                className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
              >
                <Wifi className="w-5 h-5" />
                <span>مدیریت Hub</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messenger-admin" 
                className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
              >
                <MessageSquare className="w-5 h-5" />
                <span>مدیریت Messenger</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notification-management" 
                className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
              >
                <Bell className="w-5 h-5" />
                <span>مدیریت اعلان‌ها</span>
              </TabsTrigger>
              <TabsTrigger 
                value="short-links" 
                className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
              >
                <Link className="w-5 h-5" />
                <span>لینک‌های کوتاه</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="hub-management" className="space-y-6">
              <HubManagementSection />
            </TabsContent>

            <TabsContent value="messenger-admin" className="space-y-6">
              <MessengerAdminSection />
            </TabsContent>

            <TabsContent value="notification-management" className="space-y-6">
              <NotificationManagementSection />
            </TabsContent>

            <TabsContent value="short-links" className="space-y-6">
              <ShortLinksManager />
            </TabsContent>
          </Tabs>
          
          {/* SSO Support Panel Login Button - Bottom */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSupportLogin}
              variant="outline"
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 border-green-200 dark:border-green-800"
            >
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">ورود به پنل پشتیبانی</span>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubAdmin;
