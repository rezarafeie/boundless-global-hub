import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  Clock, 
  Eye, 
  Download, 
  MessageSquare, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { activityService } from '@/lib/activityService';
import { format } from 'date-fns';

interface LearningProgressProps {
  userId: number;
}

interface CourseProgress {
  id: string;
  course_id: string;
  support_activated: boolean;
  telegram_joined: boolean;
  course_page_visited: boolean;
  total_lessons: number;
  completed_lessons: number;
  total_time_spent: number;
  progress_percentage: number;
  last_activity_at: string;
  courses?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface LessonProgress {
  id: string;
  lesson_id: string;
  is_opened: boolean;
  is_completed: boolean;
  total_time_spent: number;
  first_opened_at: string;
  last_accessed_at: string;
  completed_at: string;
  course_lessons?: {
    id: string;
    title: string;
    order_index: number;
    duration: number;
    course_sections?: {
      id: string;
      title: string;
    };
  };
}

interface ActivityLog {
  id: string;
  event_type: string;
  reference?: string;
  metadata?: any;
  duration?: number;
  created_at: string;
}

const LearningProgress: React.FC<LearningProgressProps> = ({ userId }) => {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress[]>>({});
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchProgressData();
  }, [userId]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      // Fetch course progress
      const courseData = await activityService.getUserCourseProgress(userId);
      setCourseProgress(courseData as unknown as CourseProgress[]);

      // Fetch lesson progress for each course
      const lessonData: Record<string, LessonProgress[]> = {};
      for (const course of courseData) {
        const lessons = await activityService.getUserLessonProgress(userId, course.course_id);
        lessonData[course.course_id] = lessons as unknown as LessonProgress[];
      }
      setLessonProgress(lessonData);

      // Fetch activity logs
      const logs = await activityService.getUserActivityLogs(userId, 100);
      setActivityLogs(logs as unknown as ActivityLog[]);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, React.ReactNode> = {
      user_registered: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      user_logged_in: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
      course_enrolled: <CheckCircle2 className="h-4 w-4 text-purple-500" />,
      support_activated: <MessageSquare className="h-4 w-4 text-orange-500" />,
      telegram_joined: <ExternalLink className="h-4 w-4 text-blue-600" />,
      course_page_visited: <Eye className="h-4 w-4 text-gray-500" />,
      lesson_opened: <Eye className="h-4 w-4 text-indigo-500" />,
      lesson_completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      lesson_time_spent: <Clock className="h-4 w-4 text-yellow-500" />,
      material_downloaded: <Download className="h-4 w-4 text-gray-600" />
    };
    return icons[eventType] || <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      user_registered: 'ثبت‌نام در وب‌سایت',
      user_logged_in: 'ورود به وب‌سایت',
      course_enrolled: 'ثبت‌نام در دوره',
      support_activated: 'فعال‌سازی پشتیبانی',
      telegram_joined: 'عضویت در کانال تلگرام',
      course_page_visited: 'بازدید از صفحه دوره',
      lesson_opened: 'بازکردن درس',
      lesson_completed: 'تکمیل درس',
      lesson_time_spent: 'زمان صرف شده در درس',
      material_downloaded: 'دانلود منابع آموزشی'
    };
    return labels[eventType] || eventType;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقیقه`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ساعت${remainingMinutes > 0 ? ` و ${remainingMinutes} دقیقه` : ''}`;
  };

  const getTotalStats = () => {
    const totalCourses = courseProgress.length;
    const totalLessonsViewed = Object.values(lessonProgress).flat().filter(l => l.is_opened).length;
    const totalLessonsCompleted = Object.values(lessonProgress).flat().filter(l => l.is_completed).length;
    const totalTimeSpent = courseProgress.reduce((sum, course) => sum + course.total_time_spent, 0);
    const lastActivity = courseProgress.length > 0 
      ? courseProgress.reduce((latest, course) => 
          new Date(course.last_activity_at) > new Date(latest) ? course.last_activity_at : latest, 
          courseProgress[0].last_activity_at
        )
      : null;

    return {
      totalCourses,
      totalLessonsViewed,
      totalLessonsCompleted,
      totalTimeSpent,
      lastActivity
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">دوره‌های ثبت‌نام شده</p>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-sm text-muted-foreground">درس‌های مشاهده شده</p>
                <p className="text-2xl font-bold">{stats.totalLessonsViewed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">درس‌های تکمیل شده</p>
                <p className="text-2xl font-bold">{stats.totalLessonsCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">کل زمان مطالعه</p>
                <p className="text-2xl font-bold">{formatDuration(stats.totalTimeSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">پیشرفت دوره‌ها</TabsTrigger>
          <TabsTrigger value="activity">تاریخچه فعالیت</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در دوره‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-4">
            {courseProgress
              .filter(course => 
                course.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || true
              )
              .map((course) => (
                <Card key={course.course_id}>
                  <Collapsible
                    open={expandedCourses[course.course_id]}
                    onOpenChange={() => toggleCourseExpansion(course.course_id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {expandedCourses[course.course_id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div>
                              <CardTitle className="text-lg">{course.courses?.title}</CardTitle>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant={course.support_activated ? "default" : "secondary"}>
                                  {course.support_activated ? "✅" : "❌"} پشتیبانی
                                </Badge>
                                <Badge variant={course.telegram_joined ? "default" : "secondary"}>
                                  {course.telegram_joined ? "✅" : "❌"} تلگرام
                                </Badge>
                                <Badge variant={course.course_page_visited ? "default" : "secondary"}>
                                  {course.course_page_visited ? "✅" : "❌"} صفحه دوره
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground mb-1">
                              {course.completed_lessons} از {course.total_lessons} درس
                            </div>
                            <Progress 
                              value={course.progress_percentage} 
                              className="w-32"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {course.progress_percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>زمان کل مطالعه:</span>
                            <span className="font-medium">{formatDuration(course.total_time_spent)}</span>
                          </div>
                          
                          {stats.lastActivity && (
                            <div className="flex items-center justify-between text-sm">
                              <span>آخرین فعالیت:</span>
                              <span className="font-medium">
                                {format(new Date(course.last_activity_at), 'yyyy/MM/dd HH:mm')}
                              </span>
                            </div>
                          )}

                          {lessonProgress[course.course_id] && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-3">جزئیات درس‌ها:</h4>
                              <div className="space-y-2">
                                {lessonProgress[course.course_id].map((lesson) => (
                                  <div 
                                    key={lesson.lesson_id}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="flex space-x-1">
                                        {lesson.is_opened ? (
                                          <Eye className="h-4 w-4 text-blue-500" />
                                        ) : (
                                          <Eye className="h-4 w-4 text-gray-300" />
                                        )}
                                        {lesson.is_completed ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4 text-gray-300" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {lesson.course_lessons?.title || 'نامشخص'}
                                        </p>
                                        {lesson.course_lessons?.course_sections && (
                                          <p className="text-xs text-muted-foreground">
                                            {lesson.course_lessons.course_sections.title}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <div className="text-sm font-medium">
                                        {formatDuration(lesson.total_time_spent)}
                                      </div>
                                      {lesson.last_accessed_at && (
                                        <div className="text-xs text-muted-foreground">
                                          {format(new Date(lesson.last_accessed_at), 'MM/dd HH:mm')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>تاریخچه فعالیت</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border-l-2 border-muted">
                    <div className="mt-1">
                      {getEventIcon(log.event_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {getEventLabel(log.event_type)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm')}
                        </span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.metadata.course_title && `دوره: ${log.metadata.course_title}`}
                          {log.metadata.lesson_title && ` - درس: ${log.metadata.lesson_title}`}
                        </div>
                      )}
                      {log.duration && (
                        <div className="text-xs text-muted-foreground">
                          مدت زمان: {formatDuration(log.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {activityLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    هیچ فعالیتی ثبت نشده است
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningProgress;