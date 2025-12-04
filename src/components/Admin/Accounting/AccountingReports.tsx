import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns-jalali';

interface ReportData {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  revenueByProduct: { name: string; value: number }[];
  revenueByAgent: { name: string; value: number }[];
  revenueByPaymentMethod: { name: string; value: number }[];
  dailyRevenue: { date: string; amount: number }[];
  topAgents: { name: string; sales: number; commission: number }[];
  pendingCommissions: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28'];

export const AccountingReports: React.FC = () => {
  const [period, setPeriod] = useState<string>('month');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    revenueByProduct: [],
    revenueByAgent: [],
    revenueByPaymentMethod: [],
    dailyRevenue: [],
    topAgents: [],
    pendingCommissions: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { start: subDays(now, 7), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: subDays(now, 90), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    try {
      // Fetch invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Fetch invoice items with product/course info
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('*, invoices!inner(created_at, status)')
        .gte('invoices.created_at', start.toISOString())
        .lte('invoices.created_at', end.toISOString());

      // Fetch earned commissions
      const { data: earnedCommissions } = await supabase
        .from('earned_commissions')
        .select('*')
        .eq('status', 'pending');

      // Process data
      const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.paid_amount), 0);

      // Revenue by payment method
      const paymentMethods: Record<string, number> = {};
      paidInvoices.forEach(inv => {
        const method = inv.payment_type === 'online' ? 'آنلاین' :
                       inv.payment_type === 'card_to_card' ? 'کارت به کارت' :
                       inv.payment_type === 'installment' ? 'اقساطی' : 'دستی';
        paymentMethods[method] = (paymentMethods[method] || 0) + Number(inv.paid_amount);
      });

      // Revenue by agent
      const agentRevenue: Record<string, number> = {};
      const agentIds = [...new Set(paidInvoices.map(i => i.sales_agent_id).filter(Boolean))];
      
      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from('chat_users')
          .select('id, name')
          .in('id', agentIds);
        
        paidInvoices.forEach(inv => {
          if (inv.sales_agent_id) {
            const agent = agents?.find(a => a.id === inv.sales_agent_id);
            const name = agent?.name || 'نامشخص';
            agentRevenue[name] = (agentRevenue[name] || 0) + Number(inv.paid_amount);
          } else {
            agentRevenue['وبسایت'] = (agentRevenue['وبسایت'] || 0) + Number(inv.paid_amount);
          }
        });
      }

      // Daily revenue
      const dailyMap: Record<string, number> = {};
      paidInvoices.forEach(inv => {
        const day = format(new Date(inv.created_at), 'MM/dd');
        dailyMap[day] = (dailyMap[day] || 0) + Number(inv.paid_amount);
      });

      // Top agents with commission
      const topAgentsData = Object.entries(agentRevenue)
        .map(([name, sales]) => ({ name, sales, commission: sales * 0.1 })) // Assuming 10% default
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setReportData({
        totalRevenue,
        totalInvoices: invoices?.length || 0,
        paidInvoices: paidInvoices.length,
        unpaidInvoices: invoices?.filter(i => i.status === 'unpaid').length || 0,
        revenueByProduct: [], // Would need to join with products/courses
        revenueByAgent: Object.entries(agentRevenue).map(([name, value]) => ({ name, value })),
        revenueByPaymentMethod: Object.entries(paymentMethods).map(([name, value]) => ({ name, value })),
        dailyRevenue: Object.entries(dailyMap).map(([date, amount]) => ({ date, amount })),
        topAgents: topAgentsData,
        pendingCommissions: earnedCommissions?.reduce((sum, ec) => sum + Number(ec.amount), 0) || 0
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['شاخص', 'مقدار'];
    const rows = [
      ['کل درآمد', reportData.totalRevenue.toLocaleString()],
      ['تعداد فاکتور', reportData.totalInvoices.toString()],
      ['فاکتورهای پرداخت شده', reportData.paidInvoices.toString()],
      ['فاکتورهای پرداخت نشده', reportData.unpaidInvoices.toString()],
      ['کمیسیون در انتظار', reportData.pendingCommissions.toLocaleString()]
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `گزارش-مالی-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">گزارشات مالی</h1>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">هفته اخیر</SelectItem>
              <SelectItem value="month">ماه جاری</SelectItem>
              <SelectItem value="quarter">سه ماه اخیر</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="ml-2 h-4 w-4" />
            خروجی CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{reportData.totalRevenue.toLocaleString()}</div>
                <p className="text-muted-foreground">کل درآمد (تومان)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{reportData.totalInvoices}</div>
                <p className="text-muted-foreground">کل فاکتورها</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{reportData.paidInvoices}</div>
                <p className="text-muted-foreground">پرداخت شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{reportData.pendingCommissions.toLocaleString()}</div>
                <p className="text-muted-foreground">کمیسیون در انتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>درآمد روزانه</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} تومان`} />
                <Bar dataKey="amount" fill="#8884d8" name="درآمد" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>درآمد بر اساس روش پرداخت</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.revenueByPaymentMethod}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.revenueByPaymentMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} تومان`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Agent */}
        <Card>
          <CardHeader>
            <CardTitle>درآمد بر اساس نماینده فروش</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.revenueByAgent} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} تومان`} />
                <Bar dataKey="value" fill="#82ca9d" name="درآمد" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle>برترین نمایندگان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topAgents.map((agent, index) => (
                <div key={agent.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">{agent.sales.toLocaleString()} تومان</div>
                    <div className="text-sm text-muted-foreground">
                      کمیسیون: {agent.commission.toLocaleString()} تومان
                    </div>
                  </div>
                </div>
              ))}
              {reportData.topAgents.length === 0 && (
                <p className="text-center text-muted-foreground py-8">داده‌ای موجود نیست</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountingReports;
