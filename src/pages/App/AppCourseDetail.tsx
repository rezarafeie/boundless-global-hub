import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLessonNumber } from "@/hooks/useLessonNumber";
import { 
  Play, 
  CheckCircle,
  Lock,
  Clock,
  BookOpen,
  FileText,
  Share,
  User
} from "lucide-react";

interface CourseData {
  id: string;
  title: string;
  description: string;
  slug: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
  enrollment_date: string;
}

interface CourseSection {
  id: string;
  title: string;
  order_index: number;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  duration: number;
  order_index: number;
  lesson_number: number;
  completed: boolean;
  locked: boolean;
}

const AppCourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getLessonByNumber } = useLessonNumber();
  const [activeTab, setActiveTab] = useState("lessons");
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (slug) {
      fetchCourseData();
    }
  }, [slug, isAuthenticated, navigate]);

  const fetchCourseData = async () => {
    if (!slug || !user?.id) return;
    
    try {
      setLoading(true);
      
      // First get the course by slug
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (courseError || !courseData) {
        console.error('Course not found:', courseError);
        navigate('/app/my-courses');
        return;
      }

      // Then check if user is enrolled in this course using the course ID
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, course_id, created_at, payment_status')
        .eq('chat_user_id', parseInt(user.id))
        .eq('course_id', courseData.id)
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (enrollmentError) {
        console.error('Error checking enrollment:', enrollmentError);
        navigate('/app/my-courses');
        return;
      }

      if (!enrollment) {
        console.error('User not enrolled in this course');
        navigate('/app/my-courses');
        return;
      }

      // Fetch course sections and lessons
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select(`
          id,
          title,
          order_index,
          course_lessons (
            id,
            title,
            duration,
            order_index,
            lesson_number
          )
        `)
        .eq('course_id', courseData.id)
        .order('order_index');

      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
      }

      // If no sections exist, create a virtual section with all lessons
      let transformedSections: CourseSection[] = [];
      
      if (!sectionsData || sectionsData.length === 0) {
        // Fetch lessons directly for courses without sections
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('id, title, duration, order_index, lesson_number')
          .eq('course_id', courseData.id)
          .order('lesson_number');

        if (!lessonsError && lessonsData && lessonsData.length > 0) {
          transformedSections = [{
            id: 'virtual-section',
            title: 'دروس دوره',
            order_index: 0,
            lessons: lessonsData.map((lesson, index) => ({
              id: lesson.id,
              title: lesson.title,
              duration: lesson.duration || 15,
              order_index: lesson.order_index || index + 1,
              lesson_number: lesson.lesson_number || index + 1,
              completed: Math.random() > 0.5, // TODO: Get real completion status
              locked: false // Don't lock lessons for courses without sections
            }))
          }];
        }
      } else {
        // Transform sections data with lesson completion status
        transformedSections = sectionsData.map(section => ({
          id: section.id,
          title: section.title,
          order_index: section.order_index,
          lessons: section.course_lessons?.map((lesson, index) => ({
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration || 15,
            order_index: lesson.order_index,
            lesson_number: lesson.lesson_number || index + 1,
            completed: Math.random() > 0.5, // TODO: Get real completion status
            locked: index > 3 // Lock lessons after the first 4
          })) || []
        }));
      }
      // Calculate course progress
      const totalLessons = transformedSections.reduce((sum, section) => sum + section.lessons.length, 0);
      const completedLessons = transformedSections.reduce((sum, section) => 
        sum + section.lessons.filter(lesson => lesson.completed).length, 0
      );
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      setCourse({
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || '',
        slug: courseData.slug,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress: progress,
        enrollment_date: enrollment.created_at
      });

      setSections(transformedSections);

    } catch (error) {
      console.error('Error fetching course data:', error);
      navigate('/app/my-courses');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = async (lesson: CourseLesson) => {
    if (lesson.locked) return;
    
    try {
      // Use the course slug and lesson number to navigate
      navigate(`/app/course/${slug}/lesson/${lesson.lesson_number}`);
    } catch (error) {
      console.error('Error navigating to lesson:', error);
    }
  };

  const rightAction = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Share size={18} />
    </Button>
  );

  if (loading) {
    return (
      <AppLayout title="بارگذاری..." rightAction={rightAction}>
        <div className="space-y-6">
          <div className="p-4 pb-0">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="px-4">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout title="خطا" rightAction={rightAction}>
        <div className="p-4">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">دوره یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              دوره مورد نظر یافت نشد یا شما در آن ثبت‌نام نکرده‌اید
            </p>
            <Button onClick={() => navigate('/app/my-courses')}>
              بازگشت به دوره‌های من
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={course.title} rightAction={rightAction}>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="p-4 pb-0">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                  <p className="text-muted-foreground text-sm">{course.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>{course.total_lessons} درس</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>رضا رفیعی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{course.completed_lessons}/{course.total_lessons} تکمیل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">مقدماتی تا پیشرفته</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>پیشرفت دوره</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="lessons">درس‌ها</TabsTrigger>
              <TabsTrigger value="homework">تکالیف</TabsTrigger>
              <TabsTrigger value="notes">یادداشت‌ها</TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="mt-4 space-y-4">
              {sections.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">هنوز درسی برای این دوره تعریف نشده است</p>
                  </CardContent>
                </Card>
              ) : (
                sections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {section.lessons.map((lesson) => (
                          <div 
                            key={lesson.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              lesson.locked 
                                ? 'bg-muted/50 cursor-not-allowed opacity-60' 
                                : lesson.completed 
                                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                  : 'hover:bg-accent/50'
                            }`}
                            onClick={() => handleLessonClick(lesson)}
                          >
                            <div className="flex items-center gap-3">
                              {lesson.locked ? (
                                <Lock size={16} className="text-muted-foreground" />
                              ) : lesson.completed ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <Play size={16} className="text-primary" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">{lesson.duration} دقیقه</p>
                              </div>
                            </div>
                            {lesson.completed && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                                تکمیل
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="homework" className="mt-4 space-y-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">تکالیف به‌زودی</h3>
                  <p className="text-sm text-muted-foreground">
                    تکالیف و پروژه‌های عملی این دوره به‌زودی اضافه خواهد شد
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">یادداشت‌ها</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    یادداشت‌های خود را در اینجا ذخیره کنید
                  </p>
                  <Button variant="outline">
                    <FileText size={16} className="ml-2" />
                    افزودن یادداشت جدید
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppCourseDetail;