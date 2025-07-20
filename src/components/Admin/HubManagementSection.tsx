
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Radio, Megaphone, Video, Settings } from 'lucide-react';
import HubManagementPanel from '@/components/Admin/HubManagementPanel';
import AnnouncementManagementModal from '@/components/Admin/AnnouncementManagementModal';
import LiveStreamManagementModal from '@/components/Admin/LiveStreamManagementModal';
import RafieiMeetManagementModal from '@/components/Admin/RafieiMeetManagementModal';
import GoogleAuthSettings from '@/components/Admin/GoogleAuthSettings';

const HubManagementSection = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

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

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-blue-500" />
              تنظیمات Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-3">
              مدیریت عمومی Hub و ترتیب نمایش
            </p>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              مدیریت
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radio className="w-4 h-4 text-red-500" />
              پخش زنده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-3">
              کنترل پخش زنده آپارات
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setActiveModal('live')}
            >
              <Radio className="w-4 h-4 mr-2" />
              مدیریت پخش
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Video className="w-4 h-4 text-green-500" />
              Rafiei Meet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-3">
              مدیریت جلسات تصویری
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setActiveModal('meet')}
            >
              <Video className="w-4 h-4 mr-2" />
              تنظیمات جلسه
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Megaphone className="w-4 h-4 text-purple-500" />
              اعلانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-3">
              مدیریت اعلانات و اطلاعیه‌ها
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setActiveModal('announcements')}
            >
              <Megaphone className="w-4 h-4 mr-2" />
              مدیریت اعلانات
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Google Auth Settings */}
      <GoogleAuthSettings />

      {/* Hub Management Panel */}
      <HubManagementPanel />

      {/* Modals */}
      <AnnouncementManagementModal 
        isOpen={activeModal === 'announcements'} 
        onClose={closeModal}
      />
      
      <LiveStreamManagementModal 
        isOpen={activeModal === 'live'} 
        onClose={closeModal}
      />
      
      <RafieiMeetManagementModal 
        isOpen={activeModal === 'meet'} 
        onClose={closeModal}
      />
    </div>
  );
};

export default HubManagementSection;
