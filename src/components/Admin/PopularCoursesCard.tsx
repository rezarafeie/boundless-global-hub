import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    try {
      setLoading(true);
      const timeFilter = getTimeFilter(timePeriod);

      // Fetch all active courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      // Fetch enrollments for the time period
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id')
        .gte('created_at', timeFilter);

      if (enrollmentsError) throw enrollmentsError;

      // Count enrollments per course
      const enrollmentCounts: Record<string, number> = {};
      enrollments?.forEach(enrollment => {
        if (enrollment.course_id) {
          enrollmentCounts[enrollment.course_id] = (enrollmentCounts[enrollment.course_id] || 0) + 1;
        }
      });

      // Map courses with enrollment counts and sort by count
      const coursesWithCounts: CourseEnrollmentData[] = (courses || [])
        .map(course => ({
          id: course.id,
          title: course.title,
          enrollmentCount: enrollmentCounts[course.id] || 0
        }))
        .sort((a, b) => b.enrollmentCount - a.enrollmentCount);

      setCoursesData(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching courses with enrollments:', error);
    } finally {
      setLoading(false);
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
          event: 'INSERT',
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

  const periodLabels: Record<TimePeriod, string> = {
    hour: 'ساعت',
    day: 'روز',
    week: 'هفته',
    month: 'ماه'
  };

  const isLoading = loading || parentLoading;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            دوره‌های محبوب
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
        ) : coursesData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هنوز دوره‌ای وجود ندارد
          </div>
        ) : (
          <div className="space-y-3">
            {coursesData.map((course, index) => (
              <div 
                key={course.id} 
                className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{course.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {course.enrollmentCount > 0 
                      ? `${course.enrollmentCount} ثبت‌نام در ${periodLabels[timePeriod]} اخیر`
                      : `بدون ثبت‌نام در ${periodLabels[timePeriod]} اخیر`
                    }
                  </p>
                </div>
                <div className="text-left flex items-center gap-2">
                  <p className="font-medium">{course.enrollmentCount}</p>
                  {index < 3 && course.enrollmentCount > 0 && (
                    <Badge variant="secondary">
                      #{index + 1}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularCoursesCard;
