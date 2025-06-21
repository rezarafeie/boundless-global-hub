
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <MainLayout>
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                پنل مدیریت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  به پنل مدیریت آکادمی رفیعی خوش آمدید
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">مدیریت کاربران</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      مشاهده و مدیریت کاربران سیستم
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">مدیریت محتوا</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      مدیریت دوره‌ها و محتویات آموزشی
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">گزارشات</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      مشاهده آمار و گزارشات سیستم
                    </p>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
