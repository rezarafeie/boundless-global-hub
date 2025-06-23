
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Radio, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LiveSettings {
  id: number;
  is_live: boolean;
  stream_code?: string;
  title?: string;
  viewers: number;
  updated_at: string;
}

interface LiveStreamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveStreamManagementModal: React.FC<LiveStreamManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [liveSettings, setLiveSettings] = useState<LiveSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    is_live: false,
    stream_code: '',
    title: '',
    viewers: 0
  });

  const fetchLiveSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('live_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const settings = data || {
        id: 1,
        is_live: false,
        stream_code: '',
        title: 'پخش زنده بدون مرز',
        viewers: 0,
        updated_at: new Date().toISOString()
      };

      setLiveSettings(settings);
      setFormData({
        is_live: settings.is_live,
        stream_code: settings.stream_code || '',
        title: settings.title || 'پخش زنده بدون مرز',
        viewers: settings.viewers
      });
    } catch (error: any) {
      console.error('Error fetching live settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تنظیمات پخش زنده',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('live_settings')
        .upsert({
          id: 1,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'تنظیمات پخش زنده ذخیره شد',
      });

      fetchLiveSettings();
    } catch (error: any) {
      console.error('Error saving live settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLive = async () => {
    const newIsLive = !formData.is_live;
    setFormData(prev => ({ ...prev, is_live: newIsLive }));

    if (newIsLive && !formData.stream_code.trim()) {
      toast({
        title: 'اخطار',
        description: 'لطفا کد استریم را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('live_settings')
        .upsert({
          id: 1,
          ...formData,
          is_live: newIsLive,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: newIsLive ? 'پخش زنده فعال شد' : 'پخش زنده متوقف شد',
      });

      fetchLiveSettings();
    } catch (error: any) {
      console.error('Error toggling live:', error);
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت پخش زنده',
        variant: 'destructive',
      });
      // Revert the change
      setFormData(prev => ({ ...prev, is_live: !newIsLive }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>مدیریت پخش زنده</DialogTitle>
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
            <Radio className="w-5 h-5" />
            مدیریت پخش زنده
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>وضعیت فعلی</span>
                <Badge variant={formData.is_live ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${formData.is_live ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                  {formData.is_live ? 'زنده' : 'آفلاین'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">
                    {formData.is_live ? 'پخش زنده در حال اجرا است' : 'پخش زنده غیرفعال است'}
                  </p>
                  {formData.is_live && (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{formData.viewers} بیننده</span>
                    </div>
                  )}
                </div>
                <Switch
                  checked={formData.is_live}
                  onCheckedChange={handleToggleLive}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات پخش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">عنوان پخش</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان پخش زنده"
                />
              </div>

              <div>
                <label className="text-sm font-medium">کد استریم آپارات</label>
                <Input
                  value={formData.stream_code}
                  onChange={(e) => setFormData({ ...formData, stream_code: e.target.value })}
                  placeholder="مثال: vd5o0y7o4gs3o0g"
                />
                <p className="text-xs text-slate-500 mt-1">
                  کد استریم آپارات را از بخش پخش زنده آپارات دریافت کنید
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">تعداد بینندگان</label>
                <Input
                  type="number"
                  value={formData.viewers}
                  onChange={(e) => setFormData({ ...formData, viewers: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              {!formData.stream_code.trim() && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    برای فعال کردن پخش زنده، ابتدا کد استریم را وارد کنید
                  </p>
                </div>
              )}
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

export default LiveStreamManagementModal;
