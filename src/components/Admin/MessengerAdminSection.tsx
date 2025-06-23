
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagementTab from './UserManagementTab';
import TopicManagementTab from './TopicManagementTab';
import SupportManagementTab from './SupportManagementTab';
import AdminSettingsPanel from './AdminSettingsPanel';
import { Users, MessageSquare, Headphones, Settings } from 'lucide-react';

const MessengerAdminSection = () => {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">کاربران</span>
        </TabsTrigger>
        <TabsTrigger value="topics" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">موضوعات</span>
        </TabsTrigger>
        <TabsTrigger value="support" className="flex items-center gap-2">
          <Headphones className="w-4 h-4" />
          <span className="hidden sm:inline">پشتیبانی</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">تنظیمات</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-6">
        <UserManagementTab />
      </TabsContent>

      <TabsContent value="topics" className="mt-6">
        <TopicManagementTab />
      </TabsContent>

      <TabsContent value="support" className="mt-6">
        <SupportManagementTab />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <AdminSettingsPanel />
      </TabsContent>
    </Tabs>
  );
};

export default MessengerAdminSection;
