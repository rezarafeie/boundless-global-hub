import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Lock, 
  User,
  Play,
  FileText,
  Download,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  enable_course_access: boolean;
}

interface Section {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  file_url: string | null;
  order_index: number;
}

interface Enrollment {
  id: string;
  course_id: string;
  payment_status: string;
}

const CourseAccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, login, checkEnrollment } = useAuth();
  
  const courseSlug = searchParams.get('course');
  
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      checkAuthAndLoadCourse();
    }
  }, [courseSlug, authLoading, isAuthenticated]);

  const checkAuthAndLoadCourse = async () => {
    setLoading(true);
    try {
      if (!courseSlug) {
        toast({
          title: "خطا",
          description: "شناسه دوره مشخص نشده است",
          variant: "destructive"
        });
        return;
      }

      // Fetch course information
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description, slug, price, enable_course_access')
        .eq('slug', courseSlug)
        .eq('is_active', true)
        .single();

      if (courseError) throw courseError;
      
      if (!courseData.enable_course_access) {
        toast({
          title: "دسترسی محدود",
          description: "سیستم دسترسی برای این دوره فعال نشده است",
          variant: "destructive"
        });
        return;
      }

      setCourse(courseData);

      // If user is logged in, check enrollment
      if (isAuthenticated && user) {
        const isEnrolled = await checkEnrollment(courseData.id);
        setEnrollment(isEnrolled ? { id: 'enrolled', course_id: courseData.id, payment_status: 'completed' } : null);

        // If enrolled, fetch course content
        if (isEnrolled) {
          await fetchCourseContent(courseData.id);
        }
      }

    } catch (error) {
      console.error('Error loading course:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات دوره",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseContent = async (courseId: string) => {
    try {
      // Fetch sections with lessons
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select(`
          id,
          title,
          order_index,
          course_lessons (
            id,
            title,
            content,
            video_url,
            file_url,
            order_index
          )
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      // Transform data to match our interface
      const formattedSections = sectionsData.map(section => ({
        ...section,
        lessons: (section.course_lessons || [])
          .sort((a, b) => a.order_index - b.order_index)
      })).sort((a, b) => a.order_index - b.order_index);

      setSections(formattedSections);

      // Auto-select first lesson if available
      if (formattedSections.length > 0 && formattedSections[0].lessons.length > 0) {
        setSelectedLesson(formattedSections[0].lessons[0]);
      }

    } catch (error) {
      console.error('Error fetching course content:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری محتوای دوره",
        variant: "destructive"
      });
    }
  };

  const renderLessonContent = (lesson: Lesson) => {
    return (
      <div className="space-y-6">
        {/* Lesson Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
        </div>

        {/* Video Section */}
        {lesson.video_url && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        )}

        {/* File Download */}
        {lesson.file_url && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-300">فایل ضمیمه</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">دانلود منابع درس</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(lesson.file_url!, '_blank')}
                  className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Download className="h-4 w-4 ml-2" />
                  دانلود
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      </div>
    );
  };

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">دوره یافت نشد</h2>
              <p className="text-muted-foreground">
                دوره مورد نظر یافت نشد یا غیرفعال است
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <p className="text-muted-foreground">{course.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Not Logged In */}
        {!isAuthenticated && (
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">❌ شما وارد نشده‌اید</h2>
                <p className="text-muted-foreground mb-4">
                  برای دسترسی به محتوای دوره باید وارد شوید
                </p>
                <Button onClick={() => setShowAuth(true)}>
                  ورود / ثبت‌نام
                </Button>
              </CardContent>
            </Card>
            
            {showAuth && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-background rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">ورود / ثبت‌نام</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowAuth(false)}>
                      ✕
                    </Button>
                  </div>
                  <div className="p-4">
                    <UnifiedMessengerAuth onAuthenticated={(token, name, user) => {
                      login(user, token);
                      setShowAuth(false);
                      toast({
                        title: "ورود موفق",
                        description: `خوش آمدید ${name}!`
                      });
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logged In but Not Enrolled */}
        {isAuthenticated && !enrollment && (
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">⛔ دسترسی محدود</h2>
                <p className="text-muted-foreground mb-4">
                  شما در این دوره ثبت‌نام نکرده‌اید
                </p>
                <Button 
                  onClick={() => window.location.href = `/enroll?course=${course.slug}`}
                  className="bg-primary hover:bg-primary/90"
                >
                  خرید دوره
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enrolled - Show Course Content */}
        {isAuthenticated && enrollment && (
          <div className="flex h-[calc(100vh-140px)]">
            {/* Sidebar - Course Navigation */}
            <div className="w-80 bg-card border-r overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-4">محتوای دوره</h3>
                
                {sections.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">هنوز درسی اضافه نشده است</p>
                  </div>
                ) : (
                  <Accordion type="multiple" defaultValue={sections.map(s => s.id)}>
                    {sections.map((section) => (
                      <AccordionItem key={section.id} value={section.id}>
                        <AccordionTrigger className="text-sm font-medium">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1 pl-4">
                            {section.lessons.map((lesson) => (
                              <button
                                key={lesson.id}
                                onClick={() => setSelectedLesson(lesson)}
                                className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                                  selectedLesson?.id === lesson.id 
                                    ? 'bg-primary/10 border-l-2 border-primary' 
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Play className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {selectedLesson ? (
                  renderLessonContent(selectedLesson)
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">درسی انتخاب نشده</h3>
                    <p className="text-muted-foreground">
                      از فهرست سمت چپ درسی را انتخاب کنید
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CourseAccess;