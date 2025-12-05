import React, { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Webhook, 
  Link, 
  Percent, 
  Mail, 
  Tag, 
  Upload,
  Info,
  CreditCard,
  ShoppingCart
} from 'lucide-react';

type SettingsTab = 'system' | 'webhooks' | 'short-links' | 'discounts' | 'emails' | 'blackfriday' | 'import' | 'info';

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'system', label: 'سیستم', icon: Settings },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'short-links', label: 'لینک‌های کوتاه', icon: Link },
  { id: 'discounts', label: 'کدهای تخفیف', icon: Percent },
  { id: 'emails', label: 'ایمیل‌ها', icon: Mail },
  { id: 'blackfriday', label: 'بلک فرایدی', icon: Tag },
  { id: 'import', label: 'ورود داده', icon: Upload },
  { id: 'info', label: 'اطلاعات سیستم', icon: Info },
];

const AdminSettingsPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('system');
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

  const renderContent = () => {
    switch (activeTab) {
      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">تنظیمات سیستم</h2>
              <p className="text-muted-foreground mt-1">تنظیمات کلی سیستم مدیریت</p>
            </div>
            <Card>
              <CardContent className="p-6">
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
          </div>
        );
      case 'webhooks':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Webhooks</h2>
              <p className="text-muted-foreground mt-1">مدیریت وب‌هوک‌های سیستم</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <WebhookManagement />
              </CardContent>
            </Card>
          </div>
        );
      case 'short-links':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">لینک‌های کوتاه</h2>
              <p className="text-muted-foreground mt-1">مدیریت لینک‌های کوتاه</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <ShortLinksManager />
              </CardContent>
            </Card>
          </div>
        );
      case 'discounts':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">کدهای تخفیف</h2>
              <p className="text-muted-foreground mt-1">مدیریت کدهای تخفیف</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <DiscountManagement />
              </CardContent>
            </Card>
          </div>
        );
      case 'emails':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">تنظیمات ایمیل</h2>
              <p className="text-muted-foreground mt-1">مدیریت قالب‌های ایمیل</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <EmailSettings />
              </CardContent>
            </Card>
          </div>
        );
      case 'blackfriday':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">بلک فرایدی</h2>
              <p className="text-muted-foreground mt-1">تنظیمات کمپین بلک فرایدی</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <BlackFridaySettings />
              </CardContent>
            </Card>
          </div>
        );
      case 'import':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">ورود داده</h2>
              <p className="text-muted-foreground mt-1">وارد کردن داده‌ها از فایل</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <DataImportSection />
              </CardContent>
            </Card>
          </div>
        );
      case 'info':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">اطلاعات سیستم</h2>
              <p className="text-muted-foreground mt-1">اطلاعات فنی و پیکربندی</p>
            </div>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">تنظیمات پرداخت</h3>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 mr-7">
                      <li>• درگاه: زرین‌پال</li>
                      <li>• واحد پول: تومان</li>
                      <li>• تایید خودکار: فعال</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">تنظیمات WooCommerce</h3>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 mr-7">
                      <li>• دامنه: auth.rafiei.co</li>
                      <li>• API: فعال</li>
                      <li>• سفارش خودکار: فعال</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <h4 className="font-semibold text-primary mb-2">اطلاعات مهم</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• تمام پرداخت‌ها از طریق زرین‌پال امن هستند</li>
                    <li>• سفارشات به صورت خودکار در WooCommerce ثبت می‌شوند</li>
                    <li>• ایمیل‌های تایید به صورت خودکار ارسال می‌شوند</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[600px]">
      {/* Mobile Horizontal Tabs */}
      <div className="md:hidden">
        <div className="mb-3">
          <h1 className="text-lg font-bold">تنظیمات</h1>
        </div>
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <nav className="flex gap-2 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:block w-56 flex-shrink-0">
        <div className="sticky top-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold">تنظیمات</h1>
            <p className="text-sm text-muted-foreground">مدیریت سیستم</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminSettingsPanel;
