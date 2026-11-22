import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { courseEnrollmentCounts } from '@/lib/courseEnrollmentCounts';
import { enrollmentInterval, enrollmentTrend, type EnrollmentTrendPoint } from '@/lib/enrollmentTrend';

type TimePeriod = 'hour' | 'day' | 'week' | 'month';

interface CourseEnrollmentData {
  id: string;
  title: string;
  enrollmentCount: number;
}

interface PopularCoursesCardProps {
  loading?: boolean;
}

const PopularCoursesCard: React.FC<PopularCoursesCardProps> = ({ loading: parentLoading }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
  const [view, setView] = useState('list');
  const [trend, setTrend] = useState<EnrollmentTrendPoint[]>([]);
  const [coursesData, setCoursesData] = useState<CourseEnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const fetchCoursesWithEnrollments = async () => {
    const currentRequest = ++requestId.current;
    try {
      setLoading(true);
      setError(false);
      const interval = enrollmentInterval(timePeriod);
      const timeFilter = new Date(interval.from).toISOString();
      const endTime = new Date(interval.to).toISOString();

      // Fetch all active courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true);

      if (coursesError) throw coursesError;
      const courseIds = new Set((courses ?? []).map(course => course.id));
      const timestamps: string[] = [];

      // Match Telegram's registration-record definition and [from, to) time interval.
      const enrollmentCounts = await courseEnrollmentCounts(async (from, to) => {
        const { data, error } = await supabase
          .from('enrollments')
          .select('course_id, created_at')
          .gte('created_at', timeFilter)
          .lt('created_at', endTime)
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to);
        if (error) throw error;
        for (const row of data ?? []) {
          if (courseIds.has(row.course_id)) timestamps.push(row.created_at);
        }
        return data ?? [];
      });

      // Map courses with enrollment counts and sort by count
      const coursesWithCounts: CourseEnrollmentData[] = (courses || [])
        .map(course => ({
          id: course.id,
          title: course.title,
          enrollmentCount: enrollmentCounts[course.id] || 0
        }))
        .sort((a, b) => b.enrollmentCount - a.enrollmentCount);

      if (currentRequest === requestId.current) {
        setCoursesData(coursesWithCounts);
        setTrend(enrollmentTrend(timestamps, interval));
      }
    } catch (error) {
      console.error('Error fetching courses with enrollments:', error);
      if (currentRequest === requestId.current) setError(true);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesWithEnrollments();
  }, [timePeriod]);

  // Subscribe to realtime enrollment changes
  useEffect(() => {
    const channel = supabase
      .channel('popular-courses-enrollments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments'
        },
        () => {
          fetchCoursesWithEnrollments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timePeriod]);

  const isLoading = loading || parentLoading;
  const nonzeroCourses = coursesData.filter(course => course.enrollmentCount > 0);
  const zeroCount = coursesData.length - nonzeroCourses.length;
  const total = coursesData.reduce((sum, course) => sum + course.enrollmentCount, 0);
  const formatTime = (value: number, detailed = false) => new Date(value).toLocaleString('fa-IR', {
    timeZone: 'Asia/Tehran',
    ...(timePeriod === 'hour' || timePeriod === 'day'
      ? { hour: '2-digit' as const, minute: '2-digit' as const, ...(detailed ? { month: 'short' as const, day: 'numeric' as const } : {}) }
      : { month: 'short' as const, day: 'numeric' as const }),
  });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            آمار ثبت‌نام دوره‌ها
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="hour" className="text-xs px-2">ساعت</TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-2">روز</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2">هفته</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">ماه</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={view} onValueChange={setView} aria-label="نمایش آمار">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="list" className="gap-2 text-xs"><List className="h-4 w-4" />لیست عددی</TabsTrigger>
              <TabsTrigger value="chart" className="gap-2 text-xs"><TrendingUp className="h-4 w-4" />نمودار خطی</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">دریافت آمار کامل انجام نشد</div>
        ) : coursesData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هنوز دوره‌ای وجود ندارد
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">جمع ثبت‌نام‌ها</span>
              <span className="text-2xl font-semibold tabular-nums">{total.toLocaleString('fa-IR')}</span>
            </div>
            {view === 'chart' ? (
              <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{timePeriod === 'hour' ? 'ثبت‌نام در هر ۵ دقیقه' : timePeriod === 'day' ? 'ثبت‌نام در هر ساعت' : 'ثبت‌نام در هر روز'}</p>
              <ChartContainer
                config={{ count: { label: 'ثبت‌نام', color: 'hsl(var(--primary))' } }}
                className="h-80 w-full aspect-auto"
                dir="ltr"
                aria-label="نمودار روند زمانی ثبت‌نام"
              >
                <LineChart accessibilityLayer data={trend} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} minTickGap={28} tickFormatter={value => formatTime(Number(value))} />
                  <YAxis width={36} allowDecimals={false} axisLine={false} tickLine={false} tickFormatter={value => Number(value).toLocaleString('fa-IR')} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => (
                    <div className="flex max-w-64 items-center justify-between gap-3" dir="rtl">
                      <span className="break-words">{formatTime(Number(item.payload.time), true)}</span>
                      <span className="font-semibold tabular-nums">{Number(value).toLocaleString('fa-IR')}</span>
                    </div>
                  )} />} />
                  <Line type="linear" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                </LineChart>
              </ChartContainer>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {nonzeroCourses.map(course => (
                  <li key={course.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <span className="min-w-0 break-words">{course.title}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{course.enrollmentCount.toLocaleString('fa-IR')}</span>
                  </li>
                ))}
              </ul>
            )}
            {zeroCount > 0 && <p className="text-xs text-muted-foreground">{nonzeroCourses.length ? 'سایر ' : ''}{zeroCount.toLocaleString('fa-IR')} دوره: صفر ثبت‌نام</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularCoursesCard;
