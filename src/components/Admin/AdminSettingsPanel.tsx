import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Webhook, 
  Link, 
  Percent, 
  Upload,
  Settings as SettingsIcon 
} from 'lucide-react';
import { WebhookManagement } from './WebhookManagement';
import ShortLinksManager from '../admin/ShortLinksManager';
import DiscountManagement from './DiscountManagement';
import { DataImportSection } from '../admin/DataImportSection';

const AdminSettingsPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          تنظیمات سیستم
        </h1>
        <p className="text-muted-foreground mt-2">
          مدیریت تنظیمات پیشرفته و ابزارهای سیستم
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">وب‌هوک‌ها</span>
          </TabsTrigger>
          <TabsTrigger value="shortlinks" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">لینک‌های کوتاه</span>
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">کدهای تخفیف</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">وارد کردن داده</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                مدیریت وب‌هوک‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortlinks" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                مدیریت لینک‌های کوتاه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShortLinksManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                مدیریت کدهای تخفیف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DiscountManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                وارد کردن داده از فایل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataImportSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Information */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            اطلاعات سیستم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">تنظیمات پرداخت</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• درگاه: زرین‌پال</li>
                <li>• واحد پول: تومان</li>
                <li>• تایید خودکار: فعال</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">تنظیمات WooCommerce</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
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