
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Headphones, Tag } from 'lucide-react';
import UserManagementTab from '@/components/Admin/UserManagementTab';
import ChatManagementTab from '@/components/Admin/ChatManagementTab';
import SupportManagementTab from '@/components/Admin/SupportManagementTab';
import TopicManagementTab from '@/components/Admin/TopicManagementTab';

const MessengerAdminSection = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          مدیریت سیستم پیام‌رسانی
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          کنترل کامل کاربران، چت‌ها، پشتیبانی و موضوعات
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger 
            value="users" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <Users className="w-4 h-4" />
            <span>کاربران</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chats" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>چت‌ها</span>
          </TabsTrigger>
          <TabsTrigger 
            value="support" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <Headphones className="w-4 h-4" />
            <span>پشتیبانی</span>
          </TabsTrigger>
          <TabsTrigger 
            value="topics" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <Tag className="w-4 h-4" />
            <span>موضوعات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagementTab />
        </TabsContent>

        <TabsContent value="chats" className="mt-6">
          <ChatManagementTab />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <SupportManagementTab />
        </TabsContent>

        <TabsContent value="topics" className="mt-6">
          <TopicManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessengerAdminSection;
