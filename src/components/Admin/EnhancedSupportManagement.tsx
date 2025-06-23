
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, MessageSquare } from 'lucide-react';
import SupportRoomManagement from './SupportRoomManagement';
import SupportManagementTab from './SupportManagementTab';

const EnhancedSupportManagement = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            مدیریت اتاق‌ها
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            گفتگوها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-6">
          <SupportRoomManagement />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <SupportManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSupportManagement;
