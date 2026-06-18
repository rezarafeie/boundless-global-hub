import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Phone, MessageSquare, CheckCircle, XCircle, Calendar, FileText, Send, Clock, User, Wand2, Loader2 } from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import { format } from 'date-fns-jalali';

interface SalesReportData {
  calls_made: number;
  crm_entries: number;
  successful_conversions: number;
  failed_leads: number;
  followups_scheduled: number;
}

interface SupportReportData {
  telegram_academy_replies: number;
  telegram_boundless_replies: number;
  website_support_replies: number;
}

const DailyReport = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeRole, setActiveRole] = useState<'sales' | 'support'>('sales');
  const [loading, setLoading] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [notes, setNotes] = useState('');
  
  const [salesData, setSalesData] = useState<SalesReportData>({
    calls_made: 0,
    crm_entries: 0,
    successful_conversions: 0,
    failed_leads: 0,
    followups_scheduled: 0,
  });

  const [supportData, setSupportData] = useState<SupportReportData>({
    telegram_academy_replies: 0,
    telegram_boundless_replies: 0,
    website_support_replies: 0,
  });

  const today = new Date().toISOString().split('T')[0];
  const todayJalali = format(new Date(), 'yyyy/MM/dd');

  useEffect(() => {
    if (user?.messengerData?.id) {
      fetchTodayReport();
    }
  }, [user, activeRole]);

  const fetchTodayReport = async () => {
    if (!user?.messengerData?.id) return;
    
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', user.messengerData.id)
      .eq('report_date', today)
      .eq('role', activeRole)
      .maybeSingle();

    if (data) {
      setExistingReport(data);
      setNotes(data.notes || '');
      if (activeRole === 'sales') {
        setSalesData(data.data as unknown as SalesReportData);
      } else {
        setSupportData(data.data as unknown as SupportReportData);
      }
    } else {
      setExistingReport(null);
      setNotes('');
      if (activeRole === 'sales') {
        setSalesData({
          calls_made: 0,
          crm_entries: 0,
          successful_conversions: 0,
          failed_leads: 0,
          followups_scheduled: 0,
        });
      } else {
        setSupportData({
          telegram_academy_replies: 0,
          telegram_boundless_replies: 0,
          website_support_replies: 0,
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!user?.messengerData?.id) {
      toast.error('لطفا وارد حساب کاربری شوید');
      return;
    }

    setLoading(true);
    const reportData = activeRole === 'sales' ? salesData : supportData;

    try {
      if (existingReport) {
        const { error } = await supabase
          .from('daily_reports')
          .update({
            data: JSON.parse(JSON.stringify(reportData)),
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReport.id);

        if (error) throw error;
        toast.success('گزارش با موفقیت بروزرسانی شد');
      } else {
        const { error } = await supabase
          .from('daily_reports')
          .insert([{
            user_id: user.messengerData.id,
            role: activeRole,
            report_date: today,
            data: JSON.parse(JSON.stringify(reportData)),
            notes,
          }]);

        if (error) throw error;
        toast.success('گزارش با موفقیت ثبت شد');
      }
      
      fetchTodayReport();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(error.message || 'خطا در ثبت گزارش');
    } finally {
      setLoading(false);
    }
  };

  const [autoDetecting, setAutoDetecting] = useState(false);

  const autoDetectSalesActivity = async () => {
    if (!user?.messengerData?.id) {
      toast.error('لطفا وارد حساب کاربری شوید');
      return;
    }
    setAutoDetecting(true);
    try {
      const creatorName = user.messengerData.name;
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);

      // Pull today's CRM notes authored by this agent (created_by stores the name)
      const { data: notes, error: notesError } = await supabase
        .from('crm_notes')
        .select('id, type, status, created_at, created_by')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('created_by', creatorName);

      if (notesError) throw notesError;

      const all = notes || [];
      const calls_made = all.filter(n => n.type === 'call').length;
      const crm_entries = all.length;
      const successful_conversions = all.filter(n => n.status === 'موفق').length;
      const failed_leads = all.filter(n => n.status === 'کنسل' || n.status === 'پاسخ نداده').length;

      // Followups scheduled today linked to this agent's notes today
      const noteIds = all.map(n => n.id);
      let followups_scheduled = 0;
      if (noteIds.length > 0) {
        const { count } = await supabase
          .from('crm_followups')
          .select('id', { count: 'exact', head: true })
          .in('crm_activity_id', noteIds)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        followups_scheduled = count || 0;
      }

      setSalesData({
        calls_made,
        crm_entries,
        successful_conversions,
        failed_leads,
        followups_scheduled,
      });

      toast.success('فعالیت‌های امروز شما به‌صورت خودکار پر شد. می‌توانید مقادیر را ویرایش کنید.');
    } catch (e: any) {
      console.error('Auto-detect error:', e);
      toast.error('خطا در تشخیص خودکار فعالیت‌ها');
    } finally {
      setAutoDetecting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">ورود به حساب کاربری</h2>
              <p className="text-muted-foreground">برای ثبت گزارش روزانه ابتدا وارد حساب کاربری خود شوید</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">گزارش روزانه</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              <span>{todayJalali}</span>
            </CardDescription>
            {user?.messengerData?.name && (
              <p className="text-sm text-muted-foreground mt-1">
                {user.messengerData.name}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="pt-4">
            <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as 'sales' | 'support')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="sales" className="gap-2">
                  <Phone className="w-4 h-4" />
                  فروش
                </TabsTrigger>
                <TabsTrigger value="support" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  پشتیبانی
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-4">
                <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border">
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    بر اساس فعالیت امروز شما در پنل (یادداشت‌های CRM و پیگیری‌ها) فیلدها به‌صورت خودکار پر می‌شوند. مقادیر قابل ویرایش هستند.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={autoDetectSalesActivity}
                    disabled={autoDetecting}
                    className="gap-2 shrink-0"
                  >
                    {autoDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    تشخیص خودکار
                  </Button>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      تعداد تماس‌های برقرار شده
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={salesData.calls_made}
                      onChange={(e) => setSalesData({ ...salesData, calls_made: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      ورودی‌های CRM
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={salesData.crm_entries}
                      onChange={(e) => setSalesData({ ...salesData, crm_entries: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      تبدیل‌های موفق
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={salesData.successful_conversions}
                      onChange={(e) => setSalesData({ ...salesData, successful_conversions: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      لیدهای ناموفق / بدون پاسخ
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={salesData.failed_leads}
                      onChange={(e) => setSalesData({ ...salesData, failed_leads: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      پیگیری‌های برنامه‌ریزی شده
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={salesData.followups_scheduled}
                      onChange={(e) => setSalesData({ ...salesData, followups_scheduled: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      پیام‌های تلگرام آکادمی
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={supportData.telegram_academy_replies}
                      onChange={(e) => setSupportData({ ...supportData, telegram_academy_replies: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      پیام‌های تلگرام بدون مرز
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={supportData.telegram_boundless_replies}
                      onChange={(e) => setSupportData({ ...supportData, telegram_boundless_replies: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      پیام‌های پشتیبانی سایت
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={supportData.website_support_replies}
                      onChange={(e) => setSupportData({ ...supportData, website_support_replies: parseInt(e.target.value) || 0 })}
                      className="text-center text-lg"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2 mt-6">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                یادداشت (اختیاری)
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات اضافی..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full mt-6 gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              {existingReport ? 'بروزرسانی گزارش' : 'ثبت گزارش'}
            </Button>

            {existingReport && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                آخرین بروزرسانی: {format(new Date(existingReport.updated_at), 'HH:mm')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DailyReport;
