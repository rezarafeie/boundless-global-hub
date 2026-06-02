import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WebhookManagement } from '@/components/Admin/WebhookManagement';
import ShortLinksManager from '@/components/admin/ShortLinksManager';
import DiscountManagement from '@/components/Admin/DiscountManagement';
import { DataImportSection } from '@/components/admin/DataImportSection';
import EmailSettings from '@/components/Admin/EmailSettings';
import BlackFridaySettings from '@/components/Admin/BlackFridaySettings';
import { TelegramBotManagement } from '@/components/Admin/TelegramBotManagement';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  ShoppingCart,
  MessageCircle
} from 'lucide-react';

type SettingsTab = 'system' | 'webhooks' | 'short-links' | 'discounts' | 'emails' | 'blackfriday' | 'import' | 'telegram' | 'info';

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
  { id: 'telegram', label: 'تلگرام', icon: MessageCircle },
  { id: 'info', label: 'اطلاعات سیستم', icon: Info },
];

const AdminSettingsPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('system');
  const [useFullLeadsSystem, setUseFullLeadsSystem] = useState(false);
  const [quickEnrollEnabled, setQuickEnrollEnabled] = useState(false);
  const [zarinpalUseProxy, setZarinpalUseProxy] = useState(false);
  const [zarinpalProxyUrl, setZarinpalProxyUrl] = useState('');
  const [savingProxyUrl, setSavingProxyUrl] = useState(false);
  const [zarinpalEnabled, setZarinpalEnabled] = useState(true);
  const [manualPaymentEnabled, setManualPaymentEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('use_full_leads_system, quick_enroll_enabled, zarinpal_use_proxy, zarinpal_proxy_url, zarinpal_enabled, manual_payment_enabled' as any)
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setUseFullLeadsSystem((data as any).use_full_leads_system || false);
        setQuickEnrollEnabled((data as any).quick_enroll_enabled || false);
        setZarinpalUseProxy((data as any).zarinpal_use_proxy || false);
        setZarinpalProxyUrl((data as any).zarinpal_proxy_url || '');
        setZarinpalEnabled((data as any).zarinpal_enabled !== false);
        setManualPaymentEnabled((data as any).manual_payment_enabled !== false);
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, []);

  const handleTogglePaymentMethod = async (
    method: 'zarinpal' | 'manual',
    checked: boolean
  ) => {
    const column = method === 'zarinpal' ? 'zarinpal_enabled' : 'manual_payment_enabled';
    const setter = method === 'zarinpal' ? setZarinpalEnabled : setManualPaymentEnabled;
    setter(checked);
    const { error } = await supabase
      .from('admin_settings')
      .update({ [column]: checked, updated_at: new Date().toISOString() } as any)
      .eq('id', 1);
    if (error) {
      toast({ title: 'خطا', description: 'خطا در ذخیره تنظیمات', variant: 'destructive' });
      setter(!checked);
    } else {
      toast({
        title: 'ذخیره شد',
        description: `${method === 'zarinpal' ? 'پرداخت آنلاین (زرین‌پال)' : 'کارت به کارت'} ${checked ? 'فعال' : 'غیرفعال'} شد`,
      });
    }
  };

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

  const handleToggleQuickEnroll = async (checked: boolean) => {
    setQuickEnrollEnabled(checked);
    const { error } = await supabase
      .from('admin_settings')
      .update({ quick_enroll_enabled: checked, updated_at: new Date().toISOString() } as any)
      .eq('id', 1);

    if (error) {
      toast({ title: "خطا", description: "خطا در ذخیره تنظیمات", variant: "destructive" });
      setQuickEnrollEnabled(!checked);
    } else {
      toast({
        title: "ذخیره شد",
        description: checked ? "ثبت‌نام سریع فعال شد" : "ثبت‌نام سریع غیرفعال شد"
      });
    }
  };

  const handleToggleZarinpalProxy = async (checked: boolean) => {
    setZarinpalUseProxy(checked);
    const { error } = await supabase
      .from('admin_settings')
      .update({ zarinpal_use_proxy: checked, updated_at: new Date().toISOString() } as any)
      .eq('id', 1);

    if (error) {
      toast({ title: "خطا", description: "خطا در ذخیره تنظیمات", variant: "destructive" });
      setZarinpalUseProxy(!checked);
    } else {
      toast({
        title: "ذخیره شد",
        description: checked ? "پروکسی زرین‌پال فعال شد" : "پروکسی زرین‌پال غیرفعال شد"
      });
    }
  };

  const handleSaveProxyUrl = async () => {
    setSavingProxyUrl(true);
    const { error } = await supabase
      .from('admin_settings')
      .update({ zarinpal_proxy_url: zarinpalProxyUrl.trim() || null, updated_at: new Date().toISOString() } as any)
      .eq('id', 1);
    setSavingProxyUrl(false);

    if (error) {
      toast({ title: "خطا", description: "خطا در ذخیره آدرس پروکسی", variant: "destructive" });
    } else {
      toast({ title: "ذخیره شد", description: "آدرس پروکسی زرین‌پال ذخیره شد" });
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="quick-enroll" className="text-base font-medium">
                      ثبت‌نام سریع
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {quickEnrollEnabled
                        ? "با کلیک روی دکمه ثبت‌نام، فرم سریع داخل صفحه باز می‌شود"
                        : "کلیک روی دکمه ثبت‌نام به صفحه /enroll هدایت می‌شود"
                      }
                    </p>
                  </div>
                  <Switch
                    id="quick-enroll"
                    checked={quickEnrollEnabled}
                    onCheckedChange={handleToggleQuickEnroll}
                    disabled={loadingSettings}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  روش‌های پرداخت
                </CardTitle>
                <CardDescription>
                  فعال یا غیرفعال‌سازی روش‌های پرداخت در صفحه ثبت‌نام. اگر هر دو غیرفعال باشند، فقط ثبت‌نام رایگان قابل انجام است.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="zarinpal-enabled" className="text-base font-medium">
                      پرداخت آنلاین (زرین‌پال)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {zarinpalEnabled
                        ? 'کاربران می‌توانند از طریق درگاه زرین‌پال پرداخت کنند'
                        : 'درگاه زرین‌پال در صفحه ثبت‌نام نمایش داده نمی‌شود'}
                    </p>
                  </div>
                  <Switch
                    id="zarinpal-enabled"
                    checked={zarinpalEnabled}
                    onCheckedChange={(c) => handleTogglePaymentMethod('zarinpal', c)}
                    disabled={loadingSettings}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="manual-enabled" className="text-base font-medium">
                      کارت به کارت
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {manualPaymentEnabled
                        ? 'کاربران می‌توانند با واریز کارت به کارت و آپلود رسید ثبت‌نام کنند'
                        : 'گزینه کارت به کارت در صفحه ثبت‌نام نمایش داده نمی‌شود'}
                    </p>
                  </div>
                  <Switch
                    id="manual-enabled"
                    checked={manualPaymentEnabled}
                    onCheckedChange={(c) => handleTogglePaymentMethod('manual', c)}
                    disabled={loadingSettings}
                  />
                </div>
                {!zarinpalEnabled && !manualPaymentEnabled && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                    هشدار: هر دو روش پرداخت غیرفعال هستند. فقط دوره‌های رایگان قابل ثبت‌نام خواهند بود.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>

              <CardHeader>
                <CardTitle className="text-base">پروکسی زرین‌پال</CardTitle>
                <CardDescription>
                  در صورت فعال بودن، درخواست‌های زرین‌پال از طریق آدرس پروکسی (سرور داخل ایران) ارسال می‌شوند.
                  زمانی استفاده کنید که Supabase نمی‌تواند مستقیم به api.zarinpal.com متصل شود.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="zarinpal-proxy" className="text-base font-medium">
                      فعال‌سازی پروکسی زرین‌پال
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {zarinpalUseProxy
                        ? "درخواست‌ها از طریق آدرس پروکسی ارسال می‌شوند"
                        : "اتصال مستقیم به api.zarinpal.com"}
                    </p>
                  </div>
                  <Switch
                    id="zarinpal-proxy"
                    checked={zarinpalUseProxy}
                    onCheckedChange={handleToggleZarinpalProxy}
                    disabled={loadingSettings}
                  />
                </div>
                <div className="space-y-2 p-4 border rounded-lg">
                  <Label htmlFor="zarinpal-proxy-url" className="text-base font-medium">
                    آدرس پروکسی
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    آدرس پایه پروکسی بدون اسلش انتهایی. مسیر <code className="text-xs">/pg/v4/payment/request.json</code> و <code className="text-xs">/pg/v4/payment/verify.json</code> باید به <code className="text-xs">api.zarinpal.com</code> فوروارد شوند.
                  </p>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Input
                      id="zarinpal-proxy-url"
                      dir="ltr"
                      placeholder="https://ipg.rafiei.co"
                      value={zarinpalProxyUrl}
                      onChange={(e) => setZarinpalProxyUrl(e.target.value)}
                      disabled={loadingSettings}
                    />
                    <Button onClick={handleSaveProxyUrl} disabled={savingProxyUrl || loadingSettings}>
                      {savingProxyUrl ? 'در حال ذخیره...' : 'ذخیره'}
                    </Button>
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
      case 'telegram':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">تلگرام</h2>
              <p className="text-muted-foreground mt-1">مدیریت ربات تلگرام</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <TelegramBotManagement />
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
