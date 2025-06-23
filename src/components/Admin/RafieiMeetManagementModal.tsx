
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Video, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RafieiMeetSettings {
  id: number;
  is_active: boolean;
  meet_url?: string;
  title?: string;
  description?: string;
  updated_at: string;
}

interface RafieiMeetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RafieiMeetManagementModal: React.FC<RafieiMeetManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [meetSettings, setMeetSettings] = useState<RafieiMeetSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    is_active: false,
    meet_url: 'https://meet.jit.si/rafiei',
    title: 'جلسه تصویری رفیعی',
    description: 'جلسه تصویری زنده برای اعضای بدون مرز'
  });

  const fetchMeetSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rafiei_meet_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      const settings = data || {
        id: 1,
        is_active: false,
        meet_url: 'https://meet.jit.si/rafiei',
        title: 'جلسه تصویری رفیعی',
        description: 'جلسه تصویری زنده برای اعضای بدون مرز',
        updated_at: new Date().toISOString()
      };

      setMeetSettings(settings);
      setFormData({
        is_active: settings.is_active,
        meet_url: settings.meet_url || 'https://meet.jit.si/rafiei',
        title: settings.title || 'جلسه تصویری رفیعی',
        description: settings.description || 'جلسه تصویری زنده برای اعضای بدون مرز'
      });
    } catch (error: any) {
      console.error('Error fetching meet settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تنظیمات جلسه',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMeetSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('rafiei_meet_settings')
        .upsert({
          id: 1,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'تنظیمات جلسه ذخیره شد',
      });

      fetchMeetSettings();
    } catch (error: any) {
      console.error('Error saving meet settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const newIsActive = !formData.is_active;
    setFormData(prev => ({ ...prev, is_active: newIsActive }));

    try {
      setSaving(true);
      const { error } = await supabase
        .from('rafiei_meet_settings')
        .upsert({
          id: 1,
          ...formData,
          is_active: newIsActive,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: newIsActive ? 'جلسه تصویری فعال شد' : 'جلسه تصویری غیرفعال شد',
      });

      fetchMeetSettings();
    } catch (error: any) {
      console.error('Error toggling meet status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت جلسه',
        variant: 'destructive',
      });
      // Revert the change
      setFormData(prev => ({ ...prev, is_active: !newIsActive }));
    } finally {
      setSaving(false);
    }
  };

  const openMeetUrl = () => {
    if (formData.meet_url) {
      window.open(formData.meet_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>مدیریت جلسه تصویری</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span>در حال بارگذاری...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            مدیریت جلسه تصویری رفیعی
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>وضعیت فعلی</span>
                <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                  {formData.is_active ? 'فعال' : 'غیرفعال'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">
                    {formData.is_active ? 'جلسه تصویری برای کاربران قابل دسترس است' : 'جلسه تصویری غیرفعال است'}
                  </p>
                  {formData.is_active && formData.meet_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={openMeetUrl}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      ورود به جلسه
                    </Button>
                  )}
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={handleToggleActive}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات جلسه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">عنوان جلسه</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان جلسه تصویری"
                />
              </div>

              <div>
                <label className="text-sm font-medium">توضیحات</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات جلسه"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">لینک جلسه</label>
                <Input
                  value={formData.meet_url}
                  onChange={(e) => setFormData({ ...formData, meet_url: e.target.value })}
                  placeholder="https://meet.jit.si/rafiei"
                />
                <p className="text-xs text-slate-500 mt-1">
                  لینک جلسه تصویری (Jitsi Meet، Google Meet، Zoom و...)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>راهنمای استفاده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-600">
                <p>• برای استفاده از Jitsi Meet رایگان: https://meet.jit.si/نام-اتاق</p>
                <p>• برای Google Meet: لینک جلسه از Google Calendar</p>
                <p>• برای Zoom: لینک جلسه از Zoom</p>
                <p>• پس از فعال کردن، کاربران می‌توانند از بخش Hub به جلسه بپیوندند</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              بستن
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RafieiMeetManagementModal;
