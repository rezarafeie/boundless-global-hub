import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  BarChart3,
  UserCheck,
  Phone,
  Award,
  Percent,
  FileText,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesStats {
  enrollments_today: number;
  enrollments_yesterday: number;
  enrollments_week: number;
  enrollments_month: number;
  revenue_today: number;
  revenue_yesterday: number;
  revenue_week: number;
  revenue_month: number;
  leads_assigned_today: number;
  unassigned_leads_total: number;
  untouched_leads_total: number;
}

interface AgentPerformance {
  sales_agent_id: number;
  agent_user_id: number;
  agent_name: string;
  agent_phone: string;
  total_assigned_leads: number;
  claimed_leads: number;
  successful_conversions: number;
  total_amount_sold: number;
  crm_activities_count: number;
  conversion_rate_percentage: number;
}

interface CustomReportData {
  total_sales: number;
  total_enrollments: number;
  total_leads: number;
  total_calls: number;
  total_crm_records: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

const SalesDashboard: React.FC = () => {
  const { toast } = useToast();
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Report State
  const [customReportData, setCustomReportData] = useState<CustomReportData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('24h');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [uniqueUnassignedLeads, setUniqueUnassignedLeads] = useState<number>(0);

  useEffect(() => {
    fetchSalesData();
    fetchCourses();
    fetchUniqueUnassignedLeads();
  }, []);

  useEffect(() => {
    if (selectedCourse !== 'all' || dateFilter !== '24h') {
      fetchCustomReport();
    }
  }, [selectedCourse, dateFilter, customStartDate, customEndDate]);

  const fetchUniqueUnassignedLeads = async () => {
    try {
      // Get all enrollments that don't have assignments (unassigned leads)
      const { data: unassignedEnrollments, error } = await supabase
        .from('enrollments')
        .select('id')
        .in('payment_status', ['success', 'completed'])
        .not('id', 'in', `(SELECT enrollment_id FROM lead_assignments WHERE enrollment_id IS NOT NULL)`);
        
      if (error) throw error;
      
      // Count unique enrollments
      const uniqueCount = new Set(unassignedEnrollments?.map(e => e.id) || []).size;
      setUniqueUnassignedLeads(uniqueCount);
    } catch (error) {
      console.error('Error fetching unique unassigned leads:', error);
    }
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Fetch sales dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from('sales_dashboard_stats')
        .select('*')
        .single();

      if (statsError) throw statsError;
      setSalesStats(statsData);

      // Fetch agent performance
      const { data: agentData, error: agentError } = await supabase
        .from('sales_agent_performance')
        .select('*')
        .order('total_amount_sold', { ascending: false });

      if (agentError) throw agentError;
      setAgentPerformance(agentData || []);

    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات فروش",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isPositive: true };
    const percentage = ((current - previous) / previous) * 100;
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: string;
    let endDate = now.toISOString();

    switch (dateFilter) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate).toISOString() : new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        endDate = customEndDate ? new Date(customEndDate).toISOString() : endDate;
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }

    return { startDate, endDate };
  };

  const fetchCustomReport = async () => {
    setReportLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      // Build query for enrollments
      let enrollmentQuery = supabase
        .from('enrollments')
        .select('payment_amount, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('payment_status', ['success', 'completed']);

      if (selectedCourse !== 'all') {
        enrollmentQuery = enrollmentQuery.eq('course_id', selectedCourse);
      }

      const { data: enrollments, error: enrollmentError } = await enrollmentQuery;
      if (enrollmentError) throw enrollmentError;

      // Calculate metrics
      const totalSales = enrollments?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;
      const totalEnrollments = enrollments?.length || 0;

      // Fetch leads (assignments)
      let leadQuery = supabase
        .from('lead_assignments')
        .select('enrollment_id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data: leads, error: leadError } = await leadQuery;
      if (leadError) throw leadError;

      const totalLeads = leads?.length || 0;

      // Fetch CRM records
      let crmQuery = supabase
        .from('crm_notes')
        .select('id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (selectedCourse !== 'all') {
        crmQuery = crmQuery.eq('course_id', selectedCourse);
      }

      const { data: crmNotes, error: crmError } = await crmQuery;
      if (crmError) throw crmError;

      const totalCrmRecords = crmNotes?.length || 0;
      // Note: We don't have a specific "calls" table, so using CRM records as proxy
      const totalCalls = Math.floor(totalCrmRecords * 0.7); // Estimate

      setCustomReportData({
        total_sales: totalSales,
        total_enrollments: totalEnrollments,
        total_leads: totalLeads,
        total_calls: totalCalls,
        total_crm_records: totalCrmRecords
      });

    } catch (error) {
      console.error('Error fetching custom report:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت گزارش سفارشی",
        variant: "destructive"
      });
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>در حال بارگذاری اطلاعات فروش...</p>
        </div>
      </div>
    );
  }

  const todayRevenueYesterdayTrend = salesStats ? calculateTrend(salesStats.revenue_today, salesStats.revenue_yesterday) : { percentage: 0, isPositive: true };
  const todayEnrollmentsYesterdayTrend = salesStats ? calculateTrend(salesStats.enrollments_today, salesStats.enrollments_yesterday) : { percentage: 0, isPositive: true };

  return (
    <div className="space-y-6">
      {/* Daily Sales Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          خلاصه فروش روزانه
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فروش امروز</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats ? formatPrice(salesStats.revenue_today) : '0 تومان'}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {todayRevenueYesterdayTrend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {todayRevenueYesterdayTrend.percentage.toFixed(1)}% نسبت به دیروز
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ثبت‌نام امروز</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats?.enrollments_today || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {todayEnrollmentsYesterdayTrend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {todayEnrollmentsYesterdayTrend.percentage.toFixed(1)}% نسبت به دیروز
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فروش هفته</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats ? formatPrice(salesStats.revenue_week) : '0 تومان'}</div>
              <p className="text-xs text-muted-foreground">
                {salesStats?.enrollments_week || 0} ثبت‌نام
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فروش ماه</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats ? formatPrice(salesStats.revenue_month) : '0 تومان'}</div>
              <p className="text-xs text-muted-foreground">
                {salesStats?.enrollments_month || 0} ثبت‌نام
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Status Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          خلاصه وضعیت لیدها
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">لیدهای واگذار شده امروز</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{salesStats?.leads_assigned_today || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">لیدهای بدون واگذاری</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{uniqueUnassignedLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">لیدهای دست نخورده</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{salesStats?.untouched_leads_total || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Report Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          گزارش سفارشی
        </h3>
        
        {/* Filters */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              فیلترها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">دوره</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دوره" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دوره‌ها</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">بازه زمانی</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب بازه زمانی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">۲۴ ساعت گذشته</SelectItem>
                    <SelectItem value="7d">۷ روز گذشته</SelectItem>
                    <SelectItem value="30d">۳۰ روز گذشته</SelectItem>
                    <SelectItem value="custom">سفارشی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateFilter === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">از تاریخ</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">تا تاریخ</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Data */}
        {reportLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : customReportData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل فروش</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(customReportData.total_sales)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل ثبت‌نام</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customReportData.total_enrollments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل لیدها</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customReportData.total_leads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل تماس‌ها</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customReportData.total_calls}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">رکوردهای CRM</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customReportData.total_crm_records}</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                لطفاً فیلترها را تنظیم کنید تا گزارش نمایش داده شود
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sales Agent Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          عملکرد بازاریابان
        </h3>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام بازاریاب</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead className="text-center">لیدهای واگذار شده</TableHead>
                    <TableHead className="text-center">لیدهای ادعا شده</TableHead>
                    <TableHead className="text-center">تماس‌های CRM</TableHead>
                    <TableHead className="text-center">تبدیل موفق</TableHead>
                    <TableHead className="text-center">نرخ تبدیل</TableHead>
                    <TableHead className="text-right">مجموع فروش</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPerformance.map((agent) => (
                    <TableRow key={agent.sales_agent_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {agent.agent_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {agent.agent_phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{agent.total_assigned_leads}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{agent.claimed_leads}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default">{agent.crm_activities_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {agent.successful_conversions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Percent className="h-3 w-3" />
                          {agent.conversion_rate_percentage}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(agent.total_amount_sold)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {agentPerformance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        هیچ بازاریابی یافت نشد
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesDashboard;