
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Wifi, Users, MessageSquare, Bell } from 'lucide-react';
import HubManagementSection from '@/components/Admin/HubManagementSection';
import MessengerAdminSection from '@/components/Admin/MessengerAdminSection';
import NotificationManagementSection from '@/components/Admin/NotificationManagementSection';

const BorderlessHubAdmin = () => {
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
              <div>
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
            <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
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
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubAdmin;
