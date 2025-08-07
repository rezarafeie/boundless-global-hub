import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDeviceNameInPersian, getCountryNameInPersian, getSourceNameInPersian, calculatePercentages } from '@/lib/analyticsService';
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  currentVisitors: number;
  visitors: number;
  pageviews: number;
  viewsPerVisit: number;
  visitDuration: number;
  bounceRate: number;
  visitorsSources: Array<{ source: string; visitors: number; percentage: number }>;
  visitorsPages: Array<{ page: string; views: number; percentage: number }>;
  visitorsCountries: Array<{ country: string; visitors: number; percentage: number }>;
  visitorsDevices: Array<{ device: string; visitors: number; percentage: number }>;
}

const AnalyticsReports: React.FC = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const now = new Date();
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startISO = start.toISOString();
      const fiveMinAgoISO = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

      // Fetch sessions and events in parallel (lightweight columns only)
      const [sessionsRes, eventsRes] = await Promise.all([
        supabase
          .from('analytics_sessions')
          .select('session_id, first_seen, last_seen, pageviews, device, country, source')
          .gte('first_seen', startISO),
        supabase
          .from('analytics_events')
          .select('path, created_at')
          .eq('event_type', 'pageview')
          .gte('created_at', startISO)
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const sessions: any[] = sessionsRes.data || [];
      const events: any[] = eventsRes.data || [];

      // Metrics
      const visitors = sessions.length;
      const pageviews = events.length;
      const currentVisitors = sessions.filter(s => s.last_seen && new Date(s.last_seen) >= new Date(fiveMinAgoISO)).length;

      const avgDurationSecs = sessions.length
        ? Math.round(
            sessions.reduce((acc, s) => {
              const fs = s.first_seen ? new Date(s.first_seen).getTime() : 0;
              const ls = s.last_seen ? new Date(s.last_seen).getTime() : fs;
              const diff = Math.max(0, (ls - fs) / 1000);
              return acc + diff;
            }, 0) / sessions.length
          )
        : 0;

      const bounceSessions = sessions.filter(s => (s.pageviews || 0) <= 1).length;
      const bounceRate = visitors ? Math.round((bounceSessions / visitors) * 100) : 0;
      const viewsPerVisit = visitors ? Math.round((pageviews / visitors) * 100) / 100 : 0;

      // Group helpers
      const countBy = <T, K extends string>(items: T[], keyFn: (item: T) => K) => {
        const map = new Map<K, number>();
        for (const it of items) {
          const key = keyFn(it);
          map.set(key, (map.get(key) || 0) + 1);
        }
        return Array.from(map.entries()).map(([key, count]) => ({ key, count }));
      };

      // Top pages
      const pagesRaw = countBy(events, (e: any) => (e.path as string) || '/');
      pagesRaw.sort((a, b) => b.count - a.count);
      const topPages = pagesRaw.slice(0, 7).map(p => ({ page: p.key as string, views: p.count }));
      const visitorsPages = calculatePercentages(topPages).map((p: any) => ({ page: p.page, views: p.views, percentage: p.percentage }));

      // Sources from sessions
      const sourcesRaw = countBy(sessions, (s: any) => (s.source as string) || 'direct');
      const visitorsSources = calculatePercentages(
        sourcesRaw
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(s => ({ source: getSourceNameInPersian(String(s.key)), visitors: s.count }))
      ).map((s: any) => ({ source: s.source, visitors: s.visitors, percentage: s.percentage }));

      // Countries from sessions
      const countriesRaw = countBy(sessions, (s: any) => (s.country as string) || 'Unknown');
      const visitorsCountries = calculatePercentages(
        countriesRaw
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map(c => ({ country: getCountryNameInPersian(String(c.key)), visitors: c.count }))
      ).map((c: any) => ({ country: c.country, visitors: c.visitors, percentage: c.percentage }));

      // Devices from sessions
      const devicesRaw = countBy(sessions, (s: any) => (s.device as string) || 'desktop');
      const visitorsDevices = calculatePercentages(
        devicesRaw
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map(d => ({ device: getDeviceNameInPersian(String(d.key)), visitors: d.count }))
      ).map((d: any) => ({ device: d.device, visitors: d.visitors, percentage: d.percentage }));

      const processed: AnalyticsData = {
        currentVisitors,
        visitors,
        pageviews,
        viewsPerVisit,
        visitDuration: avgDurationSecs,
        bounceRate,
        visitorsSources,
        visitorsPages,
        visitorsCountries,
        visitorsDevices,
      };

      setAnalytics(processed);
      // Save snapshot (upsert by date)
      saveDailyReport(processed);
    } catch (error) {
      console.error('❌ Error fetching analytics from Supabase:', error);
      toast({ title: 'خطا', description: 'خطا در دریافت آمار', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  // Save today's analytics snapshot to Supabase
  const saveDailyReport = async (data: AnalyticsData) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        reportDate: today,
        visitors: data.visitors,
        pageviews: data.pageviews,
        viewsPerVisit: data.viewsPerVisit,
        avgSessionDuration: data.visitDuration,
        bounceRate: data.bounceRate,
        pages: data.visitorsPages,
        sources: data.visitorsSources,
        devices: data.visitorsDevices,
        countries: data.visitorsCountries,
      };
      const { data: resp, error } = await supabase.functions.invoke('save-analytics-report', {
        body: payload,
      });
      if (error) {
        console.warn('⚠️ Failed to save analytics daily report:', error);
      } else {
        console.log('✅ Saved analytics daily report:', resp);
      }
    } catch (e) {
      console.warn('⚠️ Error calling save-analytics-report:', e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num));
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'موبایل':
        return <Smartphone className="h-4 w-4" />;
      case 'تبلت':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">گزارش آمار</h1>
            <p className="text-muted-foreground mt-2">آمار و تحلیل ترافیک وبسایت</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">هیچ آماری یافت نشد</p>
          <Button onClick={() => fetchAnalytics()} className="mt-4">
            <RefreshCw className="h-4 w-4 ml-2" />
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">گزارش آمار</h1>
          <p className="text-muted-foreground mt-2">آمار و تحلیل ترافیک وبسایت (7 روز گذشته)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
          </div>
          <Button 
            variant="outline" 
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">بازدیدکنندگان آنلاین</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.currentVisitors)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">کل بازدیدکنندگان</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.visitors)}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">بازدید صفحات</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.pageviews)}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">بازدید در هر نشست</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.viewsPerVisit)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مدت زمان بازدید</p>
                <p className="text-2xl font-bold">{formatDuration(analytics.visitDuration)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نرخ خروج سریع</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.bounceRate)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              منابع ترافیک
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.visitorsSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{source.source}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{formatNumber(source.visitors)}</div>
                    <Badge variant="secondary">{source.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              صفحات پربازدید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.visitorsPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium font-mono">{page.page}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{formatNumber(page.views)}</div>
                    <Badge variant="secondary">{page.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              کشورهای بازدیدکننده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.visitorsCountries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{country.country}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{formatNumber(country.visitors)}</div>
                    <Badge variant="secondary">{country.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              دستگاه‌های بازدیدکننده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.visitorsDevices.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(device.device)}
                    <div className="text-sm font-medium">{device.device}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{formatNumber(device.visitors)}</div>
                    <Badge variant="secondary">{device.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsReports;