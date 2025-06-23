
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Radio, Megaphone, Video, Settings } from 'lucide-react';

interface HubManagementQuickActionsProps {
  onOpenModal: (modalType: string) => void;
}

const HubManagementQuickActions: React.FC<HubManagementQuickActionsProps> = ({ onOpenModal }) => {
  return (
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
            onClick={() => onOpenModal('live')}
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
            onClick={() => onOpenModal('meet')}
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
            onClick={() => onOpenModal('announcements')}
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
