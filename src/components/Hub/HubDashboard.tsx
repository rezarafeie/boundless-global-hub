
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User } from 'lucide-react';

interface HubDashboardProps {
  currentUser: any;
}

const HubDashboard: React.FC<HubDashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          خوش آمدید، {currentUser.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          به هاب بدون مرز خوش آمدید
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              پیام‌رسان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              با دیگران در ارتباط باشید
            </p>
            <Button onClick={() => navigate('/hub/messenger')} className="w-full">
              ورود به پیام‌رسان
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              پروفایل کاربری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              مدیریت اطلاعات شخصی
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>نام:</strong> {currentUser.name}</p>
              <p><strong>تلفن:</strong> {currentUser.phone}</p>
              {currentUser.username && (
                <p><strong>نام کاربری:</strong> @{currentUser.username}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HubDashboard;
