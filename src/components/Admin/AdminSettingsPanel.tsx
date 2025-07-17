import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type AdminSettings } from '@/lib/messengerService';
import { Settings, Shield, Users } from 'lucide-react';

const AdminSettingsPanel: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings>({
    id: 1,
    manual_approval_enabled: false,
    updated_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const adminSettings = await messengerService.getAdminSettings();
      setSettings(adminSettings);
    } catch (error: any) {
      console.error('Error loading admin settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualApprovalToggle = async (enabled: boolean) => {
    try {
      setUpdating(true);
      await messengerService.updateAdminSettings({
        manual_approval_enabled: enabled
      });
      
      setSettings(prev => ({
        ...prev,
        manual_approval_enabled: enabled,
        updated_at: new Date().toISOString()
      }));

      toast({
        title: 'موفق',
        description: enabled 
          ? 'تایید دستی کاربران فعال شد' 
          : 'تایید خودکار کاربران فعال شد',
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            تنظیمات سیستم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          تنظیمات سیستم
        </CardTitle>
        <CardDescription>
          مدیریت تنظیمات عمومی پیام‌رسان
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <Label htmlFor="manual-approval" className="font-medium">
                تایید دستی کاربران
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.manual_approval_enabled 
                ? 'کاربران جدید نیاز به تایید مدیر دارند'
                : 'کاربران جدید به طور خودکار تایید می‌شوند'
              }
            </p>
          </div>
          <Switch
            id="manual-approval"
            checked={settings.manual_approval_enabled}
            onCheckedChange={handleManualApprovalToggle}
            disabled={updating}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            آخرین به‌روزرسانی: {new Date(settings.updated_at).toLocaleString('fa-IR')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSettingsPanel;
