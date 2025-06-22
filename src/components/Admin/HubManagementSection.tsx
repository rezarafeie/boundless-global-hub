
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, Radio, Megaphone, Video } from 'lucide-react';
import HubManagementPanel from '@/components/Admin/HubManagementPanel';
import SupportManagementPanel from '@/components/Admin/SupportManagementPanel';
import TopicRoomManagementPanel from '@/components/Admin/TopicRoomManagementPanel';

const HubManagementSection = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          مدیریت ماژول‌های Hub
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          کنترل کامل Rafiei Meet، پخش زنده، اعلانات و ترتیب نمایش
        </p>
      </div>

      <Tabs defaultValue="hub-settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger 
            value="hub-settings" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <Wifi className="w-4 h-4" />
            <span>تنظیمات Hub</span>
          </TabsTrigger>
          <TabsTrigger 
            value="live-broadcast" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <Radio className="w-4 h-4" />
            <span>پخش زنده</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rafiei-meet" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <Video className="w-4 h-4" />
            <span>Rafiei Meet</span>
          </TabsTrigger>
          <TabsTrigger 
            value="announcements" 
            className="flex flex-col items-center gap-2 py-3 text-xs sm:text-sm"
          >
            <Megaphone className="w-4 h-4" />
            <span>اعلانات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hub-settings" className="mt-6">
          <HubManagementPanel />
        </TabsContent>

        <TabsContent value="live-broadcast" className="mt-6">
          <SupportManagementPanel />
        </TabsContent>

        <TabsContent value="rafiei-meet" className="mt-6">
          <TopicRoomManagementPanel />
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <div className="text-center py-8">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">مدیریت اعلانات در حال توسعه است</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HubManagementSection;
