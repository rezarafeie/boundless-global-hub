import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Target, Calendar, CheckCircle, Play, Clock, BookOpen } from "lucide-react";

interface LearningTask {
  id: string;
  title: string;
  type: 'lesson' | 'course' | 'test';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  course_title?: string;
  course_slug?: string;
  lesson_id?: string;
}

interface LearningStats {
  weeklyProgress: number;
  dailyGoal: { current: number; target: number };
  completedThisWeek: number;
  totalActiveTasks: number;
}

const AppLearning = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LearningStats>({
    weeklyProgress: 0,
    dailyGoal: { current: 0, target: 5 },
    completedThisWeek: 0,
    totalActiveTasks: 0
  });
  const [tasks, setTasks] = useState<LearningTask[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchLearningData();
  }, [isAuthenticated, navigate]);

  const fetchLearningData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch user's enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          created_at,
          payment_status,
          courses (
            id,
            title,
            slug,
            description
          )
        `)
        .eq('chat_user_id', parseInt(user.id))
        .eq('payment_status', 'completed');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        return;
      }

      // Generate learning tasks based on enrolled courses
      const generatedTasks: LearningTask[] = [];
      
      enrollments?.forEach((enrollment, index) => {
        const course = enrollment.courses;
        if (course) {
          // Add course completion task
          generatedTasks.push({
            id: `course-${course.id}`,
            title: `ادامه دوره ${course.title}`,
            type: 'course',
            priority: index === 0 ? 'high' : 'medium',
            dueDate: index === 0 ? 'امروز' : index === 1 ? 'فردا' : '۲ روز',
            completed: false,
            course_title: course.title,
            course_slug: course.slug
          });
          
          // Add lesson task
          generatedTasks.push({
            id: `lesson-${course.id}`,
            title: `تکمیل درس بعدی - ${course.title}`,
            type: 'lesson',
            priority: 'medium',
            dueDate: 'امروز',
            completed: Math.random() > 0.7, // Random completion status
            course_title: course.title,
            course_slug: course.slug
          });
        }
      });

      // Add test task if available
      const { data: testsData } = await supabase
        .from('test_enrollments')
        .select('*')
        .eq('user_id', parseInt(user.id))
        .limit(1);
      
      if (testsData && testsData.length === 0) {
        generatedTasks.push({
          id: 'test-assessment',
          title: 'شرکت در آزمون شخصیت‌شناسی',
          type: 'test',
          priority: 'low',
          dueDate: '۳ روز',
          completed: false
        });
      }

      setTasks(generatedTasks);

      // Calculate stats
      const completedTasks = generatedTasks.filter(task => task.completed);
      const totalTasks = generatedTasks.length;
      const weeklyProgress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
      
      setStats({
        weeklyProgress,
        dailyGoal: { 
          current: Math.min(completedTasks.length, 5), 
          target: 5 
        },
        completedThisWeek: completedTasks.length,
        totalActiveTasks: totalTasks - completedTasks.length
      });

    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: LearningTask) => {
    if (task.completed) return;
    
    switch (task.type) {
      case 'course':
        if (task.course_slug) {
          navigate(`/app/course/${task.course_slug}`);
        }
        break;
      case 'lesson':
        if (task.course_slug) {
          navigate(`/app/course/${task.course_slug}`);
        }
        break;
      case 'test':
        navigate('/app/tests');
        break;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'فوری';
      case 'medium': return 'متوسط';
      case 'low': return 'کم';
      default: return 'متوسط';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <AppLayout title="مسیر یادگیری">
        <div className="p-4 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </CardContent>
          </Card>
          
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="مسیر یادگیری">
      <div className="p-4 space-y-6">
        {/* Weekly Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} />
              هدف هفتگی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stats.dailyGoal.current}/{stats.dailyGoal.target}
                </div>
                <div className="text-sm text-muted-foreground">وظیفه امروز</div>
              </div>
              <Progress value={stats.weeklyProgress} />
              <div className="text-center text-sm text-muted-foreground">
                {stats.weeklyProgress}% از هدف هفتگی تکمیل شده
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.completedThisWeek}</p>
              <p className="text-xs text-muted-foreground">تکمیل شده</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalActiveTasks}</p>
              <p className="text-xs text-muted-foreground">در انتظار</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">کل وظایف</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        <div>
          <h3 className="text-lg font-semibold mb-4">وظایف یادگیری</h3>
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">هیچ وظیفه‌ای موجود نیست</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  در دوره‌ای ثبت‌نام کنید تا وظایف یادگیری برای شما تعریف شود
                </p>
                <Button onClick={() => navigate('/courses')}>
                  مشاهده دوره‌ها
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card 
                  key={task.id} 
                  className={`${task.completed ? "opacity-60" : "cursor-pointer hover:bg-accent/50"} transition-colors`}
                  onClick={() => handleTaskClick(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {task.completed ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border border-primary rounded-full" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{task.dueDate}</Badge>
                            <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            {task.course_title && (
                              <Badge variant="secondary" className="text-xs">
                                {task.course_title}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {!task.completed && (
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}>
                          <Play size={14} className="ml-1" />
                          شروع
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Learning Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نکات یادگیری</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>هر روز حداقل ۳۰ دقیقه به یادگیری اختصاص دهید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>درس‌ها را به ترتیب و با دقت مطالعه کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>یادداشت‌برداری به یادگیری بهتر کمک می‌کند</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AppLearning;