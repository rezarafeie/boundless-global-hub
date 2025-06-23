
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Megaphone, Video } from 'lucide-react';

interface HubManagementQuickActionsProps {
  onOpenModal: (modalType: string) => void;
}

const HubManagementQuickActions: React.FC<HubManagementQuickActionsProps> = ({ onOpenModal }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-red-200 hover:border-red-400">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-red-700">
            <Radio className="w-5 h-5" />
            پخش زنده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            کنترل پخش زنده آپارات و تنظیمات استریم
          </p>
          <Button 
            onClick={() => onOpenModal('live')}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Radio className="w-4 h-4 mr-2" />
            مدیریت پخش زنده
          </Button>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-green-200 hover:border-green-400">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-green-700">
            <Video className="w-5 h-5" />
            Rafiei Meet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            مدیریت جلسات تصویری و تنظیمات ویدیو کنفرانس
          </p>
          <Button 
            onClick={() => onOpenModal('meet')}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <Video className="w-4 h-4 mr-2" />
            تنظیمات جلسه
          </Button>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-purple-200 hover:border-purple-400">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
            <Megaphone className="w-5 h-5" />
            اعلانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            مدیریت اعلانات، اطلاعیه‌ها و پیام‌های عمومی
          </p>
          <Button 
            onClick={() => onOpenModal('announcements')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            مدیریت اعلانات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubManagementQuickActions;
