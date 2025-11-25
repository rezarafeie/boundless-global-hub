import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WebhookManagement } from '@/components/Admin/WebhookManagement';
import ShortLinksManager from '@/components/admin/ShortLinksManager';
import DiscountManagement from '@/components/Admin/DiscountManagement';
import { DataImportSection } from '@/components/admin/DataImportSection';
import EmailSettings from '@/components/Admin/EmailSettings';
import BlackFridaySettings from '@/components/Admin/BlackFridaySettings';

const AdminSettingsPanel: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">تنظیمات</h1>
        <p className="text-gray-600 mt-1">مدیریت تنظیمات سیستم و ابزارها</p>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="short-links">لینک‌های کوتاه</TabsTrigger>
          <TabsTrigger value="discounts">کدهای تخفیف</TabsTrigger>
          <TabsTrigger value="emails">ایمیل‌ها</TabsTrigger>
          <TabsTrigger value="blackfriday">بلک فرایدی</TabsTrigger>
          <TabsTrigger value="import">ورود داده</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <WebhookManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="short-links">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <ShortLinksManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <DiscountManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="emails">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <EmailSettings />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="blackfriday">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <BlackFridaySettings />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <DataImportSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>اطلاعات سیستم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">تنظیمات پرداخت</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• درگاه: زرین‌پال</li>
                <li>• واحد پول: تومان</li>
                <li>• تایید خودکار: فعال</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">تنظیمات WooCommerce</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• دامنه: auth.rafiei.co</li>
                <li>• API: فعال</li>
                <li>• سفارش خودکار: فعال</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">اطلاعات مهم</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• تمام پرداخت‌ها از طریق زرین‌پال امن هستند</li>
              <li>• سفارشات به صورت خودکار در WooCommerce ثبت می‌شوند</li>
              <li>• ایمیل‌های تایید به صورت خودکار ارسال می‌شوند</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPanel;