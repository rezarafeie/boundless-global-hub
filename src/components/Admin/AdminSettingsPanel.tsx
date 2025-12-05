import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WebhookManagement } from '@/components/Admin/WebhookManagement';
import ShortLinksManager from '@/components/admin/ShortLinksManager';
import DiscountManagement from '@/components/Admin/DiscountManagement';
import { DataImportSection } from '@/components/admin/DataImportSection';
import EmailSettings from '@/components/Admin/EmailSettings';
import BlackFridaySettings from '@/components/Admin/BlackFridaySettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminSettingsPanel: React.FC = () => {
  const { toast } = useToast();
  const [useFullLeadsSystem, setUseFullLeadsSystem] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('use_full_leads_system')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setUseFullLeadsSystem(data.use_full_leads_system || false);
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, []);

  const handleToggleLeadsSystem = async (checked: boolean) => {
    setUseFullLeadsSystem(checked);
    const { error } = await supabase
      .from('admin_settings')
      .update({ use_full_leads_system: checked, updated_at: new Date().toISOString() })
      .eq('id', 1);
    
    if (error) {
      toast({
        title: "خطا",
        description: "خطا در ذخیره تنظیمات",
        variant: "destructive"
      });
      setUseFullLeadsSystem(!checked);
    } else {
      toast({
        title: "ذخیره شد",
        description: checked ? "سیستم مدیریت لید کامل فعال شد" : "سیستم مدیریت لید ساده فعال شد"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">تنظیمات</h1>
        <p className="text-gray-600 mt-1">مدیریت تنظیمات سیستم و ابزارها</p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="system">سیستم</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="short-links">لینک‌های کوتاه</TabsTrigger>
          <TabsTrigger value="discounts">کدهای تخفیف</TabsTrigger>
          <TabsTrigger value="emails">ایمیل‌ها</TabsTrigger>
          <TabsTrigger value="blackfriday">بلک فرایدی</TabsTrigger>
          <TabsTrigger value="import">ورود داده</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>تنظیمات سیستم</CardTitle>
              <CardDescription>تنظیمات کلی سیستم مدیریت</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="leads-system" className="text-base font-medium">
                    سیستم مدیریت لید
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {useFullLeadsSystem 
                      ? "سیستم کامل (قدیمی) با تمام امکانات فعال است"
                      : "سیستم ساده (جدید) با رابط کاربری بهینه فعال است"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">ساده</span>
                  <Switch
                    id="leads-system"
                    checked={useFullLeadsSystem}
                    onCheckedChange={handleToggleLeadsSystem}
                    disabled={loadingSettings}
                  />
                  <span className="text-sm text-muted-foreground">کامل</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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