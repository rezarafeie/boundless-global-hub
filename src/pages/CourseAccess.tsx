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
  AlertCircle,
  X
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Lesson Header */}
        <div className="text-center lg:text-right space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            درس در حال پخش
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">{lesson.title}</h1>
        </div>

        {/* Video Section */}
        {lesson.video_url && (
          <div className="relative">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border">
              <iframe
                src={lesson.video_url}
                className="w-full h-full"
                allowFullScreen
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )}

        {/* Content and Download Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Content */}
            {lesson.content && (
              <Card className="border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 lg:p-8">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    توضیحات درس
                  </h3>
                  <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* File Download */}
            {lesson.file_url && (
              <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">منابع درس</h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">
                        فایل‌های ضمیمه و منابع اضافی این درس
                      </p>
                    </div>
                    <Button
                      onClick={() => window.open(lesson.file_url!, '_blank')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      دانلود منابع
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Progress */}
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">پیشرفت دوره</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                      در حال مطالعه درس {sections.findIndex(s => s.lessons.some(l => l.id === lesson.id)) + 1}
                    </p>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">45% تکمیل شده</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="w-screen h-screen bg-background relative flex items-center justify-center">
                  <button
                    onClick={() => setShowAuth(false)}
                    className="absolute top-6 right-6 z-50 p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <div className="w-full max-w-md mx-auto px-6">
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
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)]">
            {/* Mobile Course Navigation Header */}
            <div className="lg:hidden bg-card border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">محتوای دوره</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {sections.reduce((total, section) => total + section.lessons.length, 0)} درس
                </Badge>
              </div>
            </div>

            {/* Sidebar - Course Navigation */}
            <div className="w-full lg:w-80 bg-card lg:border-l overflow-y-auto lg:max-h-[calc(100vh-140px)]">
              <div className="p-4 lg:p-6">
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-xl">محتوای دوره</h3>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {sections.reduce((total, section) => total + section.lessons.length, 0)} درس
                  </Badge>
                </div>
                
                {sections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-lg mb-2">هنوز درسی اضافه نشده</h4>
                    <p className="text-muted-foreground text-sm">محتوای دوره به زودی اضافه خواهد شد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, sectionIndex) => (
                      <div key={section.id} className="border rounded-lg overflow-hidden bg-background">
                        <div className="p-4 bg-muted/30 border-b">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">{section.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {section.lessons.length} درس
                            </Badge>
                          </div>
                        </div>
                        <div className="divide-y">
                          {section.lessons.map((lesson, lessonIndex) => {
                            const isSelected = selectedLesson?.id === lesson.id;
                            const lessonNumber = sections.slice(0, sectionIndex).reduce((total, s) => total + s.lessons.length, 0) + lessonIndex + 1;
                            
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => setSelectedLesson(lesson)}
                                className={`w-full text-right p-4 transition-all duration-200 hover:bg-muted/50 group ${
                                  isSelected 
                                    ? 'bg-primary/5 border-l-4 border-primary' 
                                    : 'border-l-4 border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
                                  }`}>
                                    {lessonNumber}
                                  </div>
                                  <div className="flex-1 text-right">
                                    <h5 className={`font-medium text-sm leading-tight ${
                                      isSelected ? 'text-primary' : 'text-foreground'
                                    }`}>
                                      {lesson.title}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      {lesson.video_url && (
                                        <div className="flex items-center gap-1">
                                          <Play className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">ویدیو</span>
                                        </div>
                                      )}
                                      {lesson.file_url && (
                                        <div className="flex items-center gap-1">
                                          <FileText className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">فایل</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className={`h-4 w-4 transition-transform ${
                                    isSelected ? 'text-primary rotate-90' : 'text-muted-foreground'
                                  }`} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
              {selectedLesson ? (
                <div className="p-4 lg:p-8">
                  {renderLessonContent(selectedLesson)}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">درسی انتخاب نشده</h3>
                    <p className="text-muted-foreground text-lg">
                      از فهرست کناری درسی را انتخاب کنید تا شروع کنید
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CourseAccess;