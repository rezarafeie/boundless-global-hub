
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Megaphone, MessageSquare, Users, Headphones, Tag, Video, Wifi } from 'lucide-react';
import HubManagementPanel from '@/components/Admin/HubManagementPanel';
import UserManagementPanel from '@/components/Admin/UserManagementPanel';
import ChatManagementPanel from '@/components/Admin/ChatManagementPanel';
import SupportManagementPanel from '@/components/Admin/SupportManagementPanel';
import TopicRoomManagementPanel from '@/components/Admin/TopicRoomManagementPanel';

const BorderlessHubAdmin = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 pt-20">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  پنل مدیریت بدون مرز
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  مرکز کنترل کامل سیستم - مدیریت Hub، Messenger و پشتیبانی
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="hub-management" className="w-full">
            {/* Mobile-First Tab Navigation */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
              <TabsTrigger value="hub-management" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-3">
                <Wifi className="w-4 h-4" />
                <span className="hidden md:inline">مدیریت Hub</span>
                <span className="md:hidden">Hub</span>
              </TabsTrigger>
              <TabsTrigger value="user-management" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-3">
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">کاربران</span>
                <span className="md:hidden">کاربران</span>
              </TabsTrigger>
              <TabsTrigger value="chat-management" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-3">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">چت‌ها</span>
                <span className="md:hidden">چت‌ها</span>
              </TabsTrigger>
              <TabsTrigger value="support-management" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-3">
                <Headphones className="w-4 h-4" />
                <span className="hidden md:inline">پشتیبانی</span>
                <span className="md:hidden">پشتیبانی</span>
              </TabsTrigger>
              <TabsTrigger value="topic-room-management" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm py-3">
                <Tag className="w-4 h-4" />
                <span className="hidden md:inline">موضوعات</span>
                <span className="md:hidden">موضوعات</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="hub-management" className="space-y-6">
              <HubManagementPanel />
            </TabsContent>

            <TabsContent value="user-management" className="space-y-6">
              <UserManagementPanel />
            </TabsContent>

            <TabsContent value="chat-management" className="space-y-6">
              <ChatManagementPanel />
            </TabsContent>

            <TabsContent value="support-management" className="space-y-6">
              <SupportManagementPanel />
            </TabsContent>

            <TabsContent value="topic-room-management" className="space-y-6">
              <TopicRoomManagementPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubAdmin;
