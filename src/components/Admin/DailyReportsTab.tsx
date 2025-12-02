import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns-jalali';
import { Calendar, Phone, MessageSquare, TrendingUp, Users, Brain, RefreshCw, Filter } from 'lucide-react';
import AIReportAnalysis from './AIReportAnalysis';

interface DailyReport {
  id: string;
  user_id: number;
  role: string;
  report_date: string;
  data: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    phone: string;
  };
}

interface PlatformMetrics {
  newEnrollments: number;
  newCrmNotes: number;
  supportMessages: number;
}

const DailyReportsTab = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics>({ newEnrollments: 0, newCrmNotes: 0, supportMessages: 0 });
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    fetchReports();
    fetchPlatformMetrics();
  }, [roleFilter, dateFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', dateFilter)
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user info for each report
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: users } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .in('id', userIds);

      const reportsWithUsers = data?.map(report => ({
        ...report,
        user: users?.find(u => u.id === report.user_id)
      })) || [];

      setReports(reportsWithUsers);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('خطا در دریافت گزارشات');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformMetrics = async () => {
    const startOfDay = `${dateFilter}T00:00:00`;
    const endOfDay = `${dateFilter}T23:59:59`;

    try {
      const [enrollments, crmNotes, messages] = await Promise.all([
        supabase
          .from('enrollments')
          .select('id', { count: 'exact' })
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay),
        supabase
          .from('crm_notes')
          .select('id', { count: 'exact' })
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay),
        supabase
          .from('messenger_messages')
          .select('id', { count: 'exact' })
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
      ]);

      setPlatformMetrics({
        newEnrollments: enrollments.count || 0,
        newCrmNotes: crmNotes.count || 0,
        supportMessages: messages.count || 0
      });
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
    }
  };

  const calculateSalesTotals = () => {
    const salesReports = reports.filter(r => r.role === 'sales');
    return {
      calls: salesReports.reduce((sum, r) => sum + (r.data?.calls_made || 0), 0),
      crmEntries: salesReports.reduce((sum, r) => sum + (r.data?.crm_entries || 0), 0),
      conversions: salesReports.reduce((sum, r) => sum + (r.data?.successful_conversions || 0), 0),
      failedLeads: salesReports.reduce((sum, r) => sum + (r.data?.failed_leads || 0), 0),
      followups: salesReports.reduce((sum, r) => sum + (r.data?.followups_scheduled || 0), 0),
    };
  };

  const calculateSupportTotals = () => {
    const supportReports = reports.filter(r => r.role === 'support');
    return {
      telegramAcademy: supportReports.reduce((sum, r) => sum + (r.data?.telegram_academy_replies || 0), 0),
      telegramBoundless: supportReports.reduce((sum, r) => sum + (r.data?.telegram_boundless_replies || 0), 0),
      websiteSupport: supportReports.reduce((sum, r) => sum + (r.data?.website_support_replies || 0), 0),
    };
  };

  const salesTotals = calculateSalesTotals();
  const supportTotals = calculateSupportTotals();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="gap-2">
            <Users className="w-4 h-4" />
            گزارشات روزانه
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="gap-2">
            <Brain className="w-4 h-4" />
            تحلیل هوش مصنوعی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">فیلتر:</span>
                </div>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-auto"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="sales">فروش</SelectItem>
                    <SelectItem value="support">پشتیبانی</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchReports}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تماس‌های فروش</p>
                    <p className="text-2xl font-bold">{salesTotals.calls}</p>
                  </div>
                  <Phone className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تبدیل موفق</p>
                    <p className="text-2xl font-bold text-green-600">{salesTotals.conversions}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">پیام‌های پشتیبانی</p>
                    <p className="text-2xl font-bold">{supportTotals.telegramAcademy + supportTotals.telegramBoundless + supportTotals.websiteSupport}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ثبت‌نام سیستم</p>
                    <p className="text-2xl font-bold text-purple-600">{platformMetrics.newEnrollments}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform vs Reported Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مقایسه گزارش با داده‌های سیستم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">ثبت‌نام‌های واقعی</p>
                  <p className="text-xl font-bold">{platformMetrics.newEnrollments}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">CRM واقعی</p>
                  <p className="text-xl font-bold">{platformMetrics.newCrmNotes}</p>
                  <p className="text-xs text-muted-foreground">گزارش: {salesTotals.crmEntries}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">پیام‌های سیستم</p>
                  <p className="text-xl font-bold">{platformMetrics.supportMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                گزارشات {format(new Date(dateFilter), 'yyyy/MM/dd')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">گزارشی یافت نشد</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کاربر</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>جزئیات</TableHead>
                      <TableHead>یادداشت</TableHead>
                      <TableHead>زمان</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{report.user?.name || 'نامشخص'}</p>
                            <p className="text-xs text-muted-foreground">{report.user?.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.role === 'sales' ? 'default' : 'secondary'}>
                            {report.role === 'sales' ? 'فروش' : 'پشتیبانی'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.role === 'sales' ? (
                            <div className="text-sm space-y-1">
                              <p>📞 تماس: {report.data?.calls_made || 0}</p>
                              <p>✅ تبدیل: {report.data?.successful_conversions || 0}</p>
                              <p>📝 CRM: {report.data?.crm_entries || 0}</p>
                            </div>
                          ) : (
                            <div className="text-sm space-y-1">
                              <p>🔵 آکادمی: {report.data?.telegram_academy_replies || 0}</p>
                              <p>🟣 بدون مرز: {report.data?.telegram_boundless_replies || 0}</p>
                              <p>🌐 سایت: {report.data?.website_support_replies || 0}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-xs truncate">
                            {report.notes || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{format(new Date(report.updated_at), 'HH:mm')}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis">
          <AIReportAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyReportsTab;
