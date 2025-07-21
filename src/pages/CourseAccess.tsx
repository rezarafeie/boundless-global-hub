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
  X,
  ExternalLink,
  ChevronDown,
  Clock,
  PlayCircle
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
  
  // Function to replace user template variables in content
  const replaceUserTemplate = (content: string): string => {
    if (!content || !user) return content;
    
    return content.replace(/\[current_user_display_name\]/g, user.firstName || user.name || 'کاربر گرامی');
  };
  
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

  // Video Embed Component - Same as in CourseContentManagement
  const VideoEmbed: React.FC<{ embedCode: string; className?: string }> = ({ embedCode, className = "" }) => {
    // Check if it's HTML embed code (contains < and >)
    const isHtmlEmbed = embedCode.includes('<') && embedCode.includes('>');
    
    if (isHtmlEmbed) {
      // Create a unique container ID for each embed to avoid conflicts
      const containerId = `video-embed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      React.useEffect(() => {
        const container = document.getElementById(containerId);
        if (container) {
          // Clear any existing content
          container.innerHTML = '';
          // Set the HTML content which will execute any scripts
          container.innerHTML = embedCode;
        }
      }, [embedCode, containerId]);
      
      return <div id={containerId} className={`video-embed-container ${className}`} />;
    } else {
      // Treat as regular URL
      return (
        <div className={`${className}`}>
          <a 
            href={embedCode} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
            مشاهده ویدیو
          </a>
        </div>
      );
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
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border p-4">
              <VideoEmbed embedCode={lesson.video_url} className="w-full" />
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
                    <div dangerouslySetInnerHTML={{ __html: replaceUserTemplate(lesson.content) }} />
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
            <div className="lg:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">محتوای دوره</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sections.reduce((total, section) => total + section.lessons.length, 0)} درس در {sections.length} بخش
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {sections.reduce((total, section) => total + section.lessons.length, 0)} درس
                </Badge>
              </div>
            </div>

            {/* Sidebar - Course Navigation */}
            <div className="w-full lg:w-96 bg-white dark:bg-gray-950 lg:border-l border-gray-200 dark:border-gray-800 overflow-y-auto lg:max-h-[calc(100vh-140px)]">
              <div className="p-6">
                <div className="hidden lg:flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-2xl text-gray-900 dark:text-gray-100">محتوای دوره</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {sections.reduce((total, section) => total + section.lessons.length, 0)} درس در {sections.length} بخش
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
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
                  <Accordion type="multiple" className="space-y-2">
                    {sections.map((section, sectionIndex) => (
                      <AccordionItem 
                        key={section.id} 
                        value={section.id}
                        className="border rounded-xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 [&[data-state=open]]:bg-gray-50 dark:[&[data-state=open]]:bg-gray-800">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary" />
                              </div>
                              <div className="text-right">
                                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                  {section.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {section.lessons.length} درس
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-3 py-1">
                                {section.lessons.length} درس
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 pb-0">
                          <div className="border-t border-gray-100 dark:border-gray-800">
                            {section.lessons.map((lesson, lessonIndex) => {
                              const isSelected = selectedLesson?.id === lesson.id;
                              const lessonNumber = sections.slice(0, sectionIndex).reduce((total, s) => total + s.lessons.length, 0) + lessonIndex + 1;
                              
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => setSelectedLesson(lesson)}
                                  className={`w-full text-right px-6 py-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 group border-b border-gray-50 dark:border-gray-800 last:border-b-0 ${
                                    isSelected 
                                      ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500' 
                                      : 'border-l-4 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                        isSelected 
                                          ? 'bg-blue-500 text-white' 
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900'
                                      }`}>
                                        {lessonNumber}
                                      </div>
                                      {lesson.video_url && (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                          isSelected 
                                            ? 'bg-blue-100 dark:bg-blue-900' 
                                            : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900'
                                        }`}>
                                          <PlayCircle className={`h-4 w-4 ${
                                            isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                                          }`} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 text-right">
                                      <h5 className={`font-medium text-base leading-tight mb-1 ${
                                        isSelected 
                                          ? 'text-blue-700 dark:text-blue-300' 
                                          : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                                      }`}>
                                        {lesson.title}
                                      </h5>
                                      <div className="flex items-center gap-4 justify-end">
                                        {lesson.video_url && (
                                          <div className="flex items-center gap-2">
                                            <Play className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">ویدیو</span>
                                          </div>
                                        )}
                                        {lesson.file_url && (
                                          <div className="flex items-center gap-2">
                                            <Download className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">فایل</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-3 w-3 text-gray-400" />
                                          <span className="text-xs text-gray-500 dark:text-gray-400">15 دقیقه</span>
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight className={`h-5 w-5 transition-all duration-200 ${
                                      isSelected 
                                        ? 'text-blue-500 rotate-90' 
                                        : 'text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1'
                                    }`} />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {selectedLesson ? (
                <div className="p-6 lg:p-10">
                  {renderLessonContent(selectedLesson)}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center max-w-lg">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-8">
                      <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">شروع یادگیری</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                      از منوی کناری یک درس انتخاب کنید و آموزش خود را آغاز کنید
                    </p>
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        💡 نکته: می‌توانید با کلیک بر روی هر بخش، فهرست درس‌های آن را مشاهده کنید
                      </p>
                    </div>
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