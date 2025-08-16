import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/Layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  User, 
  Play, 
  Clock,
  Brain,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Star
} from "lucide-react";

interface EnrolledCourse {
  id: string;
  title: string;
  description?: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  enrollment_date: string;
  payment_status: string;
  slug?: string;
}

interface UserStats {
  totalCourses: number;
  completedCourses: number;
  totalAmountPaid: number;
  totalLessons: number;
  completedLessons: number;
}

const AppDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalCourses: 0,
    completedCourses: 0,
    totalAmountPaid: 0,
    totalLessons: 0,
    completedLessons: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchUserData();
  }, [isAuthenticated, navigate]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          created_at,
          payment_status,
          payment_amount,
          courses (
            id,
            title,
            description,
            slug
          )
        `)
        .eq('chat_user_id', parseInt(user.id))
        .eq('payment_status', 'completed');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        return;
      }

      // Transform enrollment data
      const coursesData: EnrolledCourse[] = enrollments?.map(enrollment => ({
        id: enrollment.course_id,
        title: enrollment.courses?.title || 'نامشخص',
        description: enrollment.courses?.description,
        progress: Math.floor(Math.random() * 100), // TODO: Calculate real progress
        totalLessons: Math.floor(Math.random() * 20) + 5, // TODO: Get real lesson count
        completedLessons: Math.floor(Math.random() * 10), // TODO: Get real completed count
        enrollment_date: enrollment.created_at,
        payment_status: enrollment.payment_status,
        slug: enrollment.courses?.slug
      })) || [];

      setEnrolledCourses(coursesData);
      
      // Calculate stats
      const totalAmount = enrollments?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;
      const completedCoursesCount = coursesData.filter(c => c.progress === 100).length;
      const totalLessonsCount = coursesData.reduce((sum, c) => sum + c.totalLessons, 0);
      const completedLessonsCount = coursesData.reduce((sum, c) => sum + c.completedLessons, 0);

      setStats({
        totalCourses: coursesData.length,
        completedCourses: completedCoursesCount,
        totalAmountPaid: totalAmount,
        totalLessons: totalLessonsCount,
        completedLessons: completedLessonsCount
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: BookOpen, label: "دوره‌های من", path: "/app/my-courses" },
    { icon: Brain, label: "مرکز آزمون", path: "/app/tests" },
    { icon: Target, label: "برنامه یادگیری", path: "/app/learning" },
    { icon: User, label: "پروفایل", path: "/app/profile" }
  ];

  if (loading) {
    return (
      <AppLayout title="داشبورد" showBackButton={false}>
        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="داشبورد" showBackButton={false}>
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            سلام {user?.firstName || 'کاربر گرامی'}! 👋
          </h2>
          <p className="text-muted-foreground">
            آماده برای ادامه یادگیری هستید؟
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              پیشرفت کلی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalCourses}</div>
                <div className="text-sm text-muted-foreground">دوره</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.completedLessons}</div>
                <div className="text-sm text-muted-foreground">درس تکمیل شده</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.completedCourses}</div>
                <div className="text-sm text-muted-foreground">دوره تکمیل شده</div>
              </div>
            </div>
            {stats.totalLessons > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>پیشرفت کلی</span>
                  <span>{Math.round((stats.completedLessons / stats.totalLessons) * 100)}%</span>
                </div>
                <Progress value={(stats.completedLessons / stats.totalLessons) * 100} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">دوره‌های من</h3>
            {enrolledCourses.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/app/my-courses')}
              >
                مشاهده همه
              </Button>
            )}
          </div>
          
          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  دوره‌های آکادمی رفیعی را بررسی کنید و یادگیری را شروع کنید
                </p>
                <Button onClick={() => navigate('/courses')}>
                  مشاهده دوره‌ها
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.slice(0, 2).map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.completedLessons} از {course.totalLessons} درس تکمیل شده
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {course.completedLessons}/{course.totalLessons}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{course.progress}% تکمیل شده</span>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(course.slug ? `/app/course/${course.slug}` : '/app/my-courses')}
                          className="h-8 px-3"
                        >
                          <Play size={14} className="ml-1" />
                          ادامه
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {enrolledCourses.length > 2 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/app/my-courses')}
                >
                  مشاهده همه دوره‌ها
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">دسترسی سریع</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-4 text-center">
                  <action.icon size={24} className="mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium">{action.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Summary for enrolled users */}
        {stats.totalCourses > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star size={20} />
                آمار یادگیری
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <GraduationCap className="text-primary" size={20} />
                  <div>
                    <p className="font-medium text-sm">{stats.completedCourses} دوره تکمیل شده</p>
                    <p className="text-xs text-muted-foreground">از {stats.totalCourses} دوره ثبت‌نام شده</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                  <Clock className="text-accent-foreground" size={20} />
                  <div>
                    <p className="font-medium text-sm">{stats.completedLessons} درس تکمیل شده</p>
                    <p className="text-xs text-muted-foreground">از {stats.totalLessons} درس کل</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AppDashboard;