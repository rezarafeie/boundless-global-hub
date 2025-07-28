import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
  BarChart3,
  UserCheck,
  Phone,
  Award,
  Percent
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

const SalesDashboard: React.FC = () => {
  const { toast } = useToast();
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('boundless-taste');
  const [dateFilter, setDateFilter] = useState('24h');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  useEffect(() => {
    fetchCourses();
    fetchSalesData();
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [selectedCourse, dateFilter, customStartDate, customEndDate]);

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
    let startDate: Date;
    let endDate = now;

    switch (dateFilter) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = customStartDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = customEndDate || now;
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      // Build query for enrollments with filters
      let enrollmentsQuery = supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(id, title, slug)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('payment_status', ['completed', 'success']);

      if (selectedCourse !== 'all') {
        enrollmentsQuery = enrollmentsQuery.eq('courses.slug', selectedCourse);
      }

      const { data: enrollmentsData, error: enrollmentsError } = await enrollmentsQuery;
      if (enrollmentsError) throw enrollmentsError;

      // Calculate stats from filtered data
      const totalEnrollments = enrollmentsData?.length || 0;
      const totalRevenue = enrollmentsData?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;

      // Get yesterday's data for comparison
      const yesterdayStart = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      
      let yesterdayQuery = supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(id, title, slug)
        `)
        .gte('created_at', yesterdayStart.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())
        .in('payment_status', ['completed', 'success']);

      if (selectedCourse !== 'all') {
        yesterdayQuery = yesterdayQuery.eq('courses.slug', selectedCourse);
      }

      const { data: yesterdayData } = await yesterdayQuery;
      const yesterdayEnrollments = yesterdayData?.length || 0;
      const yesterdayRevenue = yesterdayData?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;

      // Mock stats structure for compatibility
      const calculatedStats: SalesStats = {
        enrollments_today: totalEnrollments,
        enrollments_yesterday: yesterdayEnrollments,
        enrollments_week: totalEnrollments,
        enrollments_month: totalEnrollments,
        revenue_today: totalRevenue,
        revenue_yesterday: yesterdayRevenue,
        revenue_week: totalRevenue,
        revenue_month: totalRevenue,
        leads_assigned_today: 0,
        unassigned_leads_total: 0,
        untouched_leads_total: 0
      };

      setSalesStats(calculatedStats);

      // Fetch agent performance (this stays global for now)
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">دوره</label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب دوره" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دوره‌ها</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.slug}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
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
          <>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">از تاریخ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, 'yyyy-MM-dd') : 'انتخاب تاریخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">تا تاریخ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, 'yyyy-MM-dd') : 'انتخاب تاریخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>

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
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
              <div className="text-2xl font-bold text-orange-600">{salesStats?.unassigned_leads_total || 0}</div>
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