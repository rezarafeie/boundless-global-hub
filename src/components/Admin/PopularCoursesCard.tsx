import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { courseEnrollmentCounts } from '@/lib/courseEnrollmentCounts';

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
  const [coursesData, setCoursesData] = useState<CourseEnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const getTimeFilter = (period: TimePeriod): string => {
    const now = new Date();
    switch (period) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const fetchCoursesWithEnrollments = async () => {
    const currentRequest = ++requestId.current;
    try {
      setLoading(true);
      setError(false);
      const timeFilter = getTimeFilter(timePeriod);
      const endTime = new Date().toISOString();

      // Fetch all active courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      // Match Telegram's registration-record definition and [from, to) time interval.
      const enrollmentCounts = await courseEnrollmentCounts(async (from, to) => {
        const { data, error } = await supabase
          .from('enrollments')
          .select('course_id')
          .gte('created_at', timeFilter)
          .lt('created_at', endTime)
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to);
        if (error) throw error;
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

      if (currentRequest === requestId.current) setCoursesData(coursesWithCounts);
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
            {nonzeroCourses.length > 0 && (
              <ChartContainer
                config={{ enrollmentCount: { label: 'ثبت‌نام', color: 'hsl(var(--primary))' } }}
                className="h-80 w-full aspect-auto"
                dir="ltr"
                aria-label="نمودار ثبت‌نام دوره‌ها"
              >
                <BarChart accessibilityLayer data={nonzeroCourses} layout="vertical" margin={{ left: 0, right: 32, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tickFormatter={value => Number(value).toLocaleString('fa-IR')} />
                  <YAxis type="category" dataKey="title" width={130} axisLine={false} tickLine={false} interval={0} tickFormatter={value => String(value).length > 21 ? `${String(value).slice(0, 20)}…` : String(value)} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => (
                    <div className="flex max-w-64 items-center justify-between gap-3" dir="rtl">
                      <span className="break-words">{item.payload.title}</span>
                      <span className="font-semibold tabular-nums">{Number(value).toLocaleString('fa-IR')}</span>
                    </div>
                  )} />} />
                  <Bar dataKey="enrollmentCount" radius={[0, 4, 4, 0]} maxBarSize={28} isAnimationActive={false}>
                    {nonzeroCourses.map((course, index) => <Cell key={course.id} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--chart-2))'} />)}
                    <LabelList dataKey="enrollmentCount" position="right" className="fill-foreground" formatter={(value: number) => value.toLocaleString('fa-IR')} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
            <ul className="sr-only">
              {nonzeroCourses.map(course => <li key={course.id}>{course.title}: {course.enrollmentCount.toLocaleString('fa-IR')} ثبت‌نام</li>)}
            </ul>
            {zeroCount > 0 && <p className="text-xs text-muted-foreground">{nonzeroCourses.length ? 'سایر ' : ''}{zeroCount.toLocaleString('fa-IR')} دوره: صفر ثبت‌نام</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularCoursesCard;
