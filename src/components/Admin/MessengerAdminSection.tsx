
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Settings, Headphones } from 'lucide-react';
import ChatManagementTab from './ChatManagementTab';
import UserManagementTab from './UserManagementTab';
import TopicManagementTab from './TopicManagementTab';
import EnhancedSupportManagement from './EnhancedSupportManagement';

const MessengerAdminSection = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="chat-management" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger 
            value="chat-management" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            <span>مدیریت چت</span>
          </TabsTrigger>
          <TabsTrigger 
            value="user-management" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <Users className="w-5 h-5" />
            <span>مدیریت کاربران</span>
          </TabsTrigger>
          <TabsTrigger 
            value="topic-management" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <Settings className="w-5 h-5" />
            <span>مدیریت موضوعات</span>
          </TabsTrigger>
          <TabsTrigger 
            value="support-management" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <Headphones className="w-5 h-5" />
            <span>مدیریت پشتیبانی</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat-management" className="space-y-6">
          <ChatManagementTab />
        </TabsContent>

        <TabsContent value="user-management" className="space-y-6">
          <UserManagementTab />
        </TabsContent>

        <TabsContent value="topic-management" className="space-y-6">
          <TopicManagementTab />
        </TabsContent>

        <TabsContent value="support-management" className="space-y-6">
          <EnhancedSupportManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessengerAdminSection;
