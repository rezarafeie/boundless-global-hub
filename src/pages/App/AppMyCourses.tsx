import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/Layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, 
  Clock, 
  CheckCircle,
  BookOpen
} from "lucide-react";

interface EnrolledCourse {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: 'in_progress' | 'completed' | 'not_started';
  totalLessons: number;
  completedLessons: number;
  enrollmentDate: string;
  payment_status: string;
  slug?: string;
  course_id: string;
}

const AppMyCourses = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchEnrolledCourses();
  }, [isAuthenticated, navigate]);

  const fetchEnrolledCourses = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const { data: enrollments, error } = await supabase
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
            slug,
            price
          )
        `)
        .eq('chat_user_id', parseInt(user.id))
        .in('payment_status', ['completed', 'success']);

      if (error) {
        console.error('Error fetching enrolled courses:', error);
        return;
      }

      const coursesData: EnrolledCourse[] = enrollments?.map(enrollment => {
        const progress = Math.floor(Math.random() * 100); // TODO: Calculate real progress
        const totalLessons = Math.floor(Math.random() * 20) + 5; // TODO: Get real lesson count
        const completedLessons = Math.floor((progress / 100) * totalLessons); // TODO: Get real completed count
        
        return {
          id: enrollment.id,
          course_id: enrollment.course_id,
          title: enrollment.courses?.title || 'نامشخص',
          description: enrollment.courses?.description,
          progress: progress,
          status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
          totalLessons: totalLessons,
          completedLessons: completedLessons,
          enrollmentDate: new Date(enrollment.created_at).toLocaleDateString('fa-IR'),
          payment_status: enrollment.payment_status,
          slug: enrollment.courses?.slug
        };
      }) || [];

      setEnrolledCourses(coursesData);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "not_started":
        return "bg-gray-500/10 text-gray-600 border-gray-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "تکمیل شده";
      case "in_progress":
        return "در حال یادگیری";
      case "not_started":
        return "شروع نشده";
      default:
        return "نامشخص";
    }
  };

  if (loading) {
    return (
      <AppLayout title="دوره‌های من">
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-8 w-12 mx-auto mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="دوره‌های من">
      <div className="p-4 space-y-4">
        {/* Summary Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{enrolledCourses.length}</div>
                <div className="text-sm text-muted-foreground">دوره ثبت‌نام</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {enrolledCourses.filter(c => c.status === "completed").length}
                </div>
                <div className="text-sm text-muted-foreground">تکمیل شده</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {enrolledCourses.filter(c => c.status === "in_progress").length}
                </div>
                <div className="text-sm text-muted-foreground">در حال یادگیری</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        <div className="space-y-4">
          {enrolledCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Course Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(course.status)}`}
                    >
                      {getStatusLabel(course.status)}
                    </Badge>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} />
                      <span>{course.totalLessons} درس</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      <span>{course.completedLessons}/{course.totalLessons}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">پیشرفت</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-4 py-3 bg-muted/20 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      تاریخ ثبت‌نام: {course.enrollmentDate}
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => navigate(course.slug ? `/app/course/${course.slug}` : `/app/course/${course.course_id}`)}
                      className="h-8 px-4"
                    >
                      {course.status === "completed" ? (
                        <>
                          <CheckCircle size={14} className="ml-1" />
                          مرور
                        </>
                      ) : (
                        <>
                          <Play size={14} className="ml-1" />
                          ادامه
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {enrolledCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">هنوز دوره‌ای ندارید</h3>
            <p className="text-muted-foreground mb-4">
              در دوره‌های آکادمی رفیعی ثبت‌نام کنید و یادگیری را شروع کنید
            </p>
            <Button onClick={() => navigate('/courses')}>
              مشاهده دوره‌ها
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AppMyCourses;