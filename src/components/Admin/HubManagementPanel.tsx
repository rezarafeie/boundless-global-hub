
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Radio, Video, RefreshCw, Save, Eye, Users } from 'lucide-react';
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

interface RafieiMeetSettings {
  id: number;
  is_active: boolean;
  meet_url?: string;
  title?: string;
  description?: string;
  updated_at: string;
}

const HubManagementPanel = () => {
  const { toast } = useToast();
  const [liveSettings, setLiveSettings] = useState<LiveSettings | null>(null);
  const [rafieiMeetSettings, setRafieiMeetSettings] = useState<RafieiMeetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch live settings
      const { data: liveData, error: liveError } = await supabase
        .from('live_settings')
        .select('*')
        .single();

      if (liveError && liveError.code !== 'PGRST116') {
        console.error('Error fetching live settings:', liveError);
      } else if (liveData) {
        setLiveSettings(liveData);
      }

      // Fetch Rafiei Meet settings
      const { data: meetData, error: meetError } = await supabase
        .from('rafiei_meet_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (meetError && meetError.code !== 'PGRST116') {
        console.error('Error fetching meet settings:', meetError);
      } else if (meetData) {
        setRafieiMeetSettings(meetData);
      }

    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateLiveSettings = async (updates: Partial<LiveSettings>) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('live_settings')
        .upsert({
          id: liveSettings?.id || 1,
          ...liveSettings,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setLiveSettings(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'موفق',
        description: 'تنظیمات پخش زنده به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating live settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات پخش زنده',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateRafieiMeetSettings = async (updates: Partial<RafieiMeetSettings>) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('rafiei_meet_settings')
        .upsert({
          id: 1,
          ...rafieiMeetSettings,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setRafieiMeetSettings(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'موفق',
        description: 'تنظیمات Rafiei Meet به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating Rafiei Meet settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات Rafiei Meet',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span>در حال بارگذاری تنظیمات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Stream Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            تنظیمات پخش زنده
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">وضعیت پخش زنده</label>
              <p className="text-xs text-slate-500">فعال/غیرفعال کردن پخش زنده</p>
            </div>
            <Switch
              checked={liveSettings?.is_live || false}
              onCheckedChange={(checked) => updateLiveSettings({ is_live: checked })}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">کد پخش آپارات</label>
              <Input
                value={liveSettings?.stream_code || ''}
                onChange={(e) => setLiveSettings(prev => prev ? { ...prev, stream_code: e.target.value } : null)}
                placeholder="کد پخش آپارات"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-sm font-medium">عنوان پخش</label>
              <Input
                value={liveSettings?.title || ''}
                onChange={(e) => setLiveSettings(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="عنوان پخش زنده"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">
              تعداد بینندگان: <Badge variant="outline">{liveSettings?.viewers || 0}</Badge>
            </span>
          </div>

          <Button 
            onClick={() => updateLiveSettings({
              stream_code: liveSettings?.stream_code,
              title: liveSettings?.title
            })}
            disabled={saving}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات پخش زنده'}
          </Button>
        </CardContent>
      </Card>

      {/* Rafiei Meet Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-green-500" />
            تنظیمات Rafiei Meet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">وضعیت جلسه تصویری</label>
              <p className="text-xs text-slate-500">فعال/غیرفعال کردن جلسه تصویری</p>
            </div>
            <Switch
              checked={rafieiMeetSettings?.is_active || false}
              onCheckedChange={(checked) => updateRafieiMeetSettings({ is_active: checked })}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">عنوان جلسه</label>
              <Input
                value={rafieiMeetSettings?.title || ''}
                onChange={(e) => setRafieiMeetSettings(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="عنوان جلسه تصویری"
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={rafieiMeetSettings?.description || ''}
                onChange={(e) => setRafieiMeetSettings(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="توضیحات جلسه تصویری"
                rows={2}
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">لینک جلسه</label>
              <Input
                value={rafieiMeetSettings?.meet_url || ''}
                onChange={(e) => setRafieiMeetSettings(prev => prev ? { ...prev, meet_url: e.target.value } : null)}
                placeholder="https://meet.jit.si/rafiei"
                disabled={saving}
              />
            </div>
          </div>

          <Button 
            onClick={() => updateRafieiMeetSettings({
              title: rafieiMeetSettings?.title,
              description: rafieiMeetSettings?.description,
              meet_url: rafieiMeetSettings?.meet_url
            })}
            disabled={saving}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات جلسه تصویری'}
          </Button>
        </CardContent>
      </Card>

      {/* Hub Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            وضعیت کلی Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Radio className={`w-8 h-8 mx-auto mb-2 ${liveSettings?.is_live ? 'text-red-500' : 'text-slate-400'}`} />
              <p className="text-sm font-medium">پخش زنده</p>
              <Badge variant={liveSettings?.is_live ? 'destructive' : 'secondary'}>
                {liveSettings?.is_live ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Video className={`w-8 h-8 mx-auto mb-2 ${rafieiMeetSettings?.is_active ? 'text-green-500' : 'text-slate-400'}`} />
              <p className="text-sm font-medium">جلسه تصویری</p>
              <Badge variant={rafieiMeetSettings?.is_active ? 'default' : 'secondary'}>
                {rafieiMeetSettings?.is_active ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubManagementPanel;
