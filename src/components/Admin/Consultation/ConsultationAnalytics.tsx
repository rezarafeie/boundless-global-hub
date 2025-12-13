import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, Clock, XCircle, DollarSign } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns-jalali';

interface ConsultationBooking {
  id: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  deal_id: string | null;
  crm_added: boolean;
  slot?: {
    date: string;
    start_time: string;
  };
}

interface Props {
  bookings: ConsultationBooking[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const ConsultationAnalytics: React.FC<Props> = ({ bookings }) => {
  // Consultations per day (last 14 days)
  const dailyData = useMemo(() => {
    const last14Days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = date.toISOString().split('T')[0];
      last14Days[dateStr] = 0;
    }

    bookings.forEach(b => {
      if (b.slot?.date && last14Days[b.slot.date] !== undefined) {
        last14Days[b.slot.date]++;
      }
    });

    return Object.entries(last14Days).map(([date, count]) => ({
      date: format(new Date(date), 'MM/dd'),
      count
    }));
  }, [bookings]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      'pending': 0,
      'confirmed': 0,
      'completed': 0,
      'cancelled': 0,
      'no_show': 0
    };

    bookings.forEach(b => {
      if (counts[b.status] !== undefined) {
        counts[b.status]++;
      }
    });

    const labels: Record<string, string> = {
      'pending': 'در انتظار',
      'confirmed': 'تایید شده',
      'completed': 'انجام شده',
      'cancelled': 'لغو شده',
      'no_show': 'عدم حضور'
    };

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: labels[status],
        value: count
      }));
  }, [bookings]);

  // Peak hours
  const hourlyData = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 8; i <= 20; i++) hours[i] = 0;

    bookings.forEach(b => {
      if (b.slot?.start_time) {
        const hour = parseInt(b.slot.start_time.split(':')[0]);
        if (hours[hour] !== undefined) hours[hour]++;
      }
    });

    return Object.entries(hours).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }));
  }, [bookings]);

  // Calculate rates
  const rates = useMemo(() => {
    const total = bookings.length;
    if (total === 0) return { approval: 0, noShow: 0, conversion: 0 };

    const confirmedOrCompleted = bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'completed'
    ).length;
    const noShow = bookings.filter(b => b.status === 'no_show').length;
    
    // Only count sales consultations for conversion rate (those with crm_added but excluding education-only)
    // Sales consultations can have deal_id, education consultations never have deal_id
    const salesConsultations = bookings.filter(b => b.crm_added && b.deal_id !== null);
    const converted = salesConsultations.length;
    const totalSalesConsultations = bookings.filter(b => b.crm_added).length;

    return {
      approval: Math.round((confirmedOrCompleted / total) * 100),
      noShow: Math.round((noShow / total) * 100),
      conversion: totalSalesConsultations > 0 ? Math.round((converted / totalSalesConsultations) * 100) : 0
    };
  }, [bookings]);

  // Average response time (booking to approval)
  const avgResponseTime = useMemo(() => {
    const withApproval = bookings.filter(b => b.confirmed_at);
    if (withApproval.length === 0) return 'N/A';

    const totalMinutes = withApproval.reduce((acc, b) => {
      const created = new Date(b.created_at).getTime();
      const confirmed = new Date(b.confirmed_at!).getTime();
      return acc + (confirmed - created) / (1000 * 60);
    }, 0);

    const avg = Math.round(totalMinutes / withApproval.length);
    if (avg < 60) return `${avg} دقیقه`;
    return `${Math.round(avg / 60)} ساعت`;
  }, [bookings]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">آمار و تحلیل</h3>
      
      {/* Rate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نرخ تایید</p>
                <p className="text-2xl font-bold">{rates.approval}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نرخ عدم حضور</p>
                <p className="text-2xl font-bold">{rates.noShow}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نرخ تبدیل به معامله</p>
                <p className="text-2xl font-bold">{rates.conversion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">میانگین زمان پاسخ</p>
                <p className="text-2xl font-bold">{avgResponseTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Consultations Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">مشاوره‌ها در ۱۴ روز اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزیع وضعیت</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ساعات پرتراکم مشاوره</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsultationAnalytics;
