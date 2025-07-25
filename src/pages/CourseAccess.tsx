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
import CourseNotifications from '@/components/Course/CourseNotifications';
import CourseActionLinks from '@/components/CourseActionLinks';
import { useLessonTracker } from '@/hooks/useLessonTracker';
import { useLessonNumber } from '@/hooks/useLessonNumber';
import { useAuthTracking } from '@/hooks/useAuthTracking';

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  enable_course_access: boolean;
  is_free_access: boolean;
  support_link?: string | null;
  telegram_channel_link?: string | null;
  gifts_link?: string | null;
  support_activation_required?: boolean;
  telegram_activation_required?: boolean;
}

interface TitleGroup {
  id: string;
  title: string;
  icon: string;
  order_index: number;
  is_open: boolean;
  sections: Section[];
}

interface Section {
  id: string;
  title: string;
  order_index: number;
  title_group_id?: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  file_url: string | null;
  duration: number;
  order_index: number;
}

interface Enrollment {
  id: string;
  course_id: string;
  payment_status: string;
}

const CourseAccess: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, login, checkEnrollment } = useAuth();
  const { logCoursePageVisit, logMaterialDownload } = useAuthTracking();
  const { getLessonByNumber, getLessonNumberById } = useLessonNumber();
  
  // Function to replace user template variables in content
  const replaceUserTemplate = (content: string): string => {
    if (!content || !user) return content;
    
    return content.replace(/\[current_user_display_name\]/g, user.firstName || user.name || 'کاربر گرامی');
  };
  
  const courseSlug = searchParams.get('course');
  const lessonId = searchParams.get('lesson');
  
  const [course, setCourse] = useState<Course | null>(null);
  const [titleGroups, setTitleGroups] = useState<TitleGroup[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileLessonView, setShowMobileLessonView] = useState(false);
  const [openTitleGroups, setOpenTitleGroups] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  // Check if mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle lesson selection for mobile and URL updates
  const handleLessonSelect = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    
    // Update URL with lesson number instead of UUID
    try {
      const lessonNumber = await getLessonNumberById(lesson.id);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('lesson', lessonNumber ? lessonNumber.toString() : lesson.id);
      setSearchParams(newSearchParams, { replace: true });
    } catch (error) {
      console.error('Error getting lesson number:', error);
      // Fallback to UUID if lesson number is not available
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('lesson', lesson.id);
      setSearchParams(newSearchParams, { replace: true });
    }
    
    if (isMobile) {
      setShowMobileLessonView(true);
    }
  };

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
        .select('id, title, description, slug, price, enable_course_access, is_free_access, support_link, telegram_channel_link, gifts_link, support_activation_required, telegram_activation_required')
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

      // Log course page visit if user is authenticated
      if (isAuthenticated && user?.id) {
        try {
          console.log('Logging course page visit for user:', user.id, 'course:', courseData.id, 'title:', courseData.title);
          const metadata = {
            course_title: courseData.title,
            visit_time: new Date().toISOString()
          };
          console.log('Metadata being sent:', metadata);
          await logCoursePageVisit(parseInt(user.id.toString()), courseData.id, courseData.title);
          console.log('Course page visit logged successfully');
        } catch (error) {
          console.error('Error logging course page visit:', error);
        }
      } else {
        console.log('User not authenticated or no user ID:', { isAuthenticated, userId: user?.id });
      }

      // Check if course has free access - skip authentication if enabled
      if (courseData.is_free_access) {
        await fetchCourseContent(courseData.id);
        return;
      }

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
      // Fetch title groups with sections and their lessons via junction table
      const { data: titleGroupsData, error: titleGroupsError } = await supabase
        .from('course_title_groups')
        .select(`
          id,
          title,
          icon,
          order_index,
          is_open,
          course_sections (
            id,
            title,
            order_index,
            title_group_id,
            lesson_sections (
              course_lessons (
                id,
                title,
                content,
                video_url,
                file_url,
                duration,
                order_index
              )
            )
          )
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index');

      if (titleGroupsError) throw titleGroupsError;

      // Fetch sections that are not part of any title group with their lessons via junction table
      const { data: orphanSectionsData, error: orphanSectionsError } = await supabase
        .from('course_sections')
        .select(`
          id,
          title,
          order_index,
          title_group_id,
          lesson_sections (
            course_lessons (
              id,
              title,
              content,
              video_url,
              file_url,
              duration,
              order_index
            )
          )
        `)
        .eq('course_id', courseId)
        .is('title_group_id', null)
        .order('order_index');

      if (orphanSectionsError) throw orphanSectionsError;

      // Transform title groups data
      const formattedTitleGroups = (titleGroupsData || []).map(group => ({
        ...group,
        sections: (group.course_sections || [])
          .map(section => ({
            ...section,
            lessons: (section.lesson_sections || [])
              .map(ls => ls.course_lessons)
              .filter(lesson => lesson !== null)
              .sort((a, b) => a.order_index - b.order_index)
          }))
          .sort((a, b) => a.order_index - b.order_index)
      })).sort((a, b) => a.order_index - b.order_index);

      // Transform orphan sections data
      const formattedOrphanSections = (orphanSectionsData || []).map(section => ({
        ...section,
        lessons: (section.lesson_sections || [])
          .map(ls => ls.course_lessons)
          .filter(lesson => lesson !== null)
          .sort((a, b) => a.order_index - b.order_index)
      })).sort((a, b) => a.order_index - b.order_index);

      setTitleGroups(formattedTitleGroups);
      setSections(formattedOrphanSections);

      // Set initially open title groups based on is_open field
      const initiallyOpen = new Set<string>();
      formattedTitleGroups.forEach(group => {
        if (group.is_open) {
          initiallyOpen.add(group.id);
        }
      });
      setOpenTitleGroups(initiallyOpen);

      // Auto-select lesson based on URL parameter or first lesson
      let lessonToSelect = null;
      
      // First try to find lesson from URL parameter
      if (lessonId) {
        // Check if lessonId is a number (new system) or UUID (old system)
        const isLessonNumber = /^\d+$/.test(lessonId);
        
        if (isLessonNumber && courseSlug) {
          // New system: Find lesson by number
          try {
            const lessonByNumber = await getLessonByNumber(courseSlug, parseInt(lessonId));
            if (lessonByNumber) {
              // Find the lesson in our formatted data
              for (const group of formattedTitleGroups) {
                for (const section of group.sections) {
                  const foundLesson = section.lessons.find(lesson => lesson.id === lessonByNumber.id);
                  if (foundLesson) {
                    lessonToSelect = foundLesson;
                    initiallyOpen.add(group.id);
                    setOpenTitleGroups(initiallyOpen);
                    break;
                  }
                }
                if (lessonToSelect) break;
              }
              
              // Search in orphan sections if not found in title groups
              if (!lessonToSelect) {
                for (const section of formattedOrphanSections) {
                  const foundLesson = section.lessons.find(lesson => lesson.id === lessonByNumber.id);
                  if (foundLesson) {
                    lessonToSelect = foundLesson;
                    break;
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error fetching lesson by number:', error);
          }
        } else {
          // Old system: Find lesson by UUID
          // Search in title groups
          for (const group of formattedTitleGroups) {
            for (const section of group.sections) {
              const foundLesson = section.lessons.find(lesson => lesson.id === lessonId);
              if (foundLesson) {
                lessonToSelect = foundLesson;
                // Also open the title group containing this lesson
                initiallyOpen.add(group.id);
                setOpenTitleGroups(initiallyOpen);
                break;
              }
            }
            if (lessonToSelect) break;
          }
          
          // Search in orphan sections if not found in title groups
          if (!lessonToSelect) {
            for (const section of formattedOrphanSections) {
              const foundLesson = section.lessons.find(lesson => lesson.id === lessonId);
              if (foundLesson) {
                lessonToSelect = foundLesson;
                break;
              }
            }
          }
        }
      }
      
      // If no lesson found from URL or no URL parameter, select first available lesson
      if (!lessonToSelect) {
        if (formattedTitleGroups.length > 0 && formattedTitleGroups[0].sections.length > 0 && formattedTitleGroups[0].sections[0].lessons.length > 0) {
          lessonToSelect = formattedTitleGroups[0].sections[0].lessons[0];
        } else if (formattedOrphanSections.length > 0 && formattedOrphanSections[0].lessons.length > 0) {
          lessonToSelect = formattedOrphanSections[0].lessons[0];
        }
      }
      
      if (lessonToSelect) {
        setSelectedLesson(lessonToSelect);
        
        // Update URL if lesson was selected automatically and no lesson was in URL
        if (!lessonId && lessonToSelect) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('lesson', lessonToSelect.id);
          setSearchParams(newSearchParams, { replace: true });
        }
      }

      // Fetch completed lessons for the user
      if (isAuthenticated && user?.id) {
        await fetchCompletedLessons(courseId);
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

  // Fetch completed lessons for the user
  const fetchCompletedLessons = async (courseId: string) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', Number(user.id))
        .eq('course_id', courseId)
        .eq('is_completed', true);

      if (error) throw error;

      const completedLessonIds = new Set(data?.map(item => item.lesson_id) || []);
      setCompletedLessons(completedLessonIds);
    } catch (error) {
      console.error('Error fetching completed lessons:', error);
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

  // Lesson tracker hook for the selected lesson
  console.log('CourseAccess render - selectedLesson:', selectedLesson);
  console.log('CourseAccess render - course:', course);
  
  const { markLessonComplete } = useLessonTracker(
    selectedLesson && course ? {
      courseId: course.id,
      lessonId: selectedLesson.id,
      courseTitle: course.title,
      lessonTitle: selectedLesson.title
    } : undefined
  );
  
  console.log('CourseAccess render - markLessonComplete:', markLessonComplete);

  // Helper function to find next lesson
  const findNextLesson = (currentLesson: Lesson): Lesson | null => {
    // Get all lessons in order
    const allLessons: Lesson[] = [];
    
    titleGroups.forEach(group => {
      group.sections.forEach(section => {
        allLessons.push(...section.lessons);
      });
    });
    
    sections.forEach(section => {
      allLessons.push(...section.lessons);
    });
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    return currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  };

  const renderLessonContent = (lesson: Lesson) => {
    const nextLesson = findNextLesson(lesson);
    
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back to Course Menu Button */}
        <div className="flex justify-start">
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedLesson(null);
              if (isMobile) setShowMobileLessonView(false);
            }}
            className="flex items-center gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            بازگشت به فهرست دروس
          </Button>
        </div>

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

            {/* Next Lesson Button */}
            {nextLesson && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary mb-2">درس بعدی</h4>
                      <p className="text-sm text-muted-foreground">{nextLesson.title}</p>
                    </div>
                    <Button 
                      onClick={() => handleLessonSelect(nextLesson)}
                      className="flex items-center gap-2"
                    >
                      درس بعدی
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
                      onClick={async () => {
                        // Track material download
                        if (isAuthenticated && user?.id && course) {
                          try {
                            await logMaterialDownload(
                              parseInt(user.id.toString()),
                              course.id,
                              `${lesson.title} - منابع درس`,
                              lesson.file_url!
                            );
                          } catch (error) {
                            console.error('Error logging material download:', error);
                          }
                        }
                        window.open(lesson.file_url!, '_blank');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      دانلود منابع
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mark as Complete Button */}
            {selectedLesson && (
              <Card className={`border-2 transition-all duration-300 ${
                completedLessons.has(selectedLesson.id)
                  ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20'
                  : 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20'
              }`}>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                      completedLessons.has(selectedLesson.id)
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}>
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-2 ${
                        completedLessons.has(selectedLesson.id)
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : 'text-blue-800 dark:text-blue-300'
                      }`}>
                        {completedLessons.has(selectedLesson.id) ? 'درس تکمیل شده' : 'تکمیل درس'}
                      </h4>
                      <p className={`text-sm mb-4 ${
                        completedLessons.has(selectedLesson.id)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {completedLessons.has(selectedLesson.id) 
                          ? 'این درس با موفقیت تکمیل شده است'
                          : 'درس را به عنوان تکمیل شده علامت‌گذاری کنید'
                        }
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!selectedLesson || !user?.id || !course) return;
                        
                        setIsMarkingComplete(true);
                        
                        try {
                          if (markLessonComplete) {
                            await markLessonComplete();
                            
                            // Update local state immediately
                            setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
                            
                            toast({
                              title: "تبریک!",
                              description: "درس با موفقیت تکمیل شد",
                            });
                          } else {
                            toast({
                              title: "خطا",
                              description: "خطا در سیستم تکمیل درس",
                              variant: "destructive"
                            });
                          }
                        } catch (error) {
                          console.error('Error marking lesson as complete:', error);
                          toast({
                            title: "خطا",
                            description: "خطا در تکمیل درس",
                            variant: "destructive"
                          });
                        } finally {
                          setIsMarkingComplete(false);
                        }
                      }}
                      disabled={completedLessons.has(selectedLesson.id) || isMarkingComplete}
                      className={`w-full text-white shadow-lg transition-all duration-300 ${
                        completedLessons.has(selectedLesson.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isMarkingComplete 
                        ? 'در حال تکمیل...'
                        : completedLessons.has(selectedLesson.id) 
                          ? 'تکمیل شده' 
                          : 'تکمیل درس'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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

        {/* Not Logged In - Only show if course doesn't have free access */}
        {!isAuthenticated && !course.is_free_access && (
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">❌ شما وارد نشده‌اید</h2>
                <p className="text-muted-foreground mb-4">
                  برای دسترسی به محتوای دوره، لطفاً وارد حساب کاربری خود شوید
                </p>
                <div className="space-y-3">
                  <Button onClick={() => setShowAuth(true)} className="w-full">
                    ورود / ثبت‌نام
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`/course/${course.slug}`, '_blank')}
                    className="w-full"
                  >
                    مشاهده صفحه دوره
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {showAuth && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                    <h3 className="font-semibold">ورود / ثبت‌نام</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowAuth(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <UnifiedMessengerAuth 
                      onAuthenticated={(sessionToken: string, userName: string, user: any) => {
                        login(user, sessionToken);
                        setShowAuth(false);
                        checkAuthAndLoadCourse(); // Reload course data to check enrollment
                      }}
                      isAcademyAuth={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logged In but Not Enrolled - Only show if course doesn't have free access */}
        {isAuthenticated && !enrollment && !course.is_free_access && (
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">⛔ دسترسی محدود</h2>
                <p className="text-muted-foreground mb-4">
                  شما در این دوره ثبت‌نام نکرده‌اید
                </p>
                <Button onClick={() => window.open(`/course/${course.slug}`, '_blank')}>
                  مشاهده دوره و ثبت‌نام
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Content - Show if enrolled OR if course has free access */}
        {(enrollment || course.is_free_access) && (
          <>
            {/* Course Notifications Section */}
            <div className="container mx-auto px-4 py-4">
              <CourseNotifications courseId={course.id} />
            </div>

            {/* Main Course Content */}
            <div className="flex h-[calc(100vh-200px)]">
              {/* Course Navigation Sidebar */}
              <div className={`${isMobile ? 'w-full' : 'w-1/3 lg:w-1/4'} bg-background border-r overflow-y-auto`}>
                <div className="p-4">
                  <div className="mb-6">
                    <h2 className="font-bold text-xl mb-2 text-primary">فهرست دروس</h2>
                    <p className="text-sm text-muted-foreground">
                      {titleGroups.reduce((total, group) => total + group.sections.reduce((sectionTotal, section) => sectionTotal + section.lessons.length, 0), 0) + sections.reduce((total, section) => total + section.lessons.length, 0)} درس
                    </p>
                  </div>

                  <div className="space-y-2">
                    {titleGroups.length === 0 && sections.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">هنوز هیچ درسی اضافه نشده است</p>
                      </div>
                    ) : (
                      <>
                        {/* Title Groups */}
                        <Accordion type="multiple" value={Array.from(openTitleGroups)} onValueChange={(values) => setOpenTitleGroups(new Set(values))} className="space-y-3">
                          {titleGroups.map((titleGroup, titleGroupIndex) => (
                            <AccordionItem 
                              key={titleGroup.id} 
                              value={titleGroup.id}
                              className="border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <AccordionTrigger className="px-5 py-4 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 [&[data-state=open]]:bg-blue-50 dark:[&[data-state=open]]:bg-blue-950/50">
                                <div className="flex items-center justify-between w-full pr-3">
                                  <div className="flex items-center gap-4">
                                    <div className="text-2xl">{titleGroup.icon}</div>
                                    <div className="text-right">
                                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                                        {titleGroup.title}
                                      </h3>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        شامل {titleGroup.sections.length} فصل
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="bg-primary/20 text-primary px-3 py-1.5 text-sm font-medium shadow-sm">
                                    {titleGroup.sections.reduce((total, section) => total + section.lessons.length, 0)}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-0 pb-4">
                                <div className="space-y-2 px-4">
                                  {/* Sections under this title group */}
                                  {titleGroup.sections.map((section, sectionIndex) => (
                                    <Accordion key={section.id} type="multiple" className="space-y-1">
                                      <AccordionItem 
                                        value={section.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                                      >
                                        <AccordionTrigger className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 [&[data-state=open]]:bg-blue-50 dark:[&[data-state=open]]:bg-blue-950/50">
                                          <div className="flex items-center justify-between w-full pr-3">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                                <BookOpen className="h-4 w-4 text-white" />
                                              </div>
                                              <div className="text-right">
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-0.5">
                                                  {section.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                  {section.lessons.length} درس
                                                </p>
                                              </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                              {section.lessons.length}
                                            </Badge>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-0 pb-2">
                                          <div className="space-y-1 px-3">
                                            {section.lessons.map((lesson, lessonIndex) => {
                                              const isSelected = selectedLesson?.id === lesson.id;
                                              return (
                                                <button
                                                  key={lesson.id}
                                                  onClick={() => handleLessonSelect(lesson)}
                                                  className={`w-full text-right p-3 rounded-lg transition-all duration-200 group border ${
                                                    isSelected 
                                                      ? completedLessons.has(lesson.id)
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-sm'
                                                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm'
                                                      : completedLessons.has(lesson.id)
                                                        ? 'hover:bg-emerald-50 dark:hover:bg-emerald-800/20 border-transparent hover:border-emerald-200 dark:hover:border-emerald-700'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                                  }`}
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                      <h5 className={`font-medium text-sm mb-1 text-right truncate ${
                                                        isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                                                      }`}>
                                                        {lessonIndex + 1}. {lesson.title}
                                                      </h5>
                                                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                          <Clock className="h-3 w-3" />
                                                          <span>{lesson.duration} دقیقه</span>
                                                        </div>
                                                        {lesson.video_url && (
                                                          <div className="flex items-center gap-1">
                                                            <PlayCircle className="h-3 w-3" />
                                                            <span>ویدیو</span>
                                                          </div>
                                                        )}
                                                        {lesson.file_url && (
                                                          <div className="flex items-center gap-1">
                                                            <FileText className="h-3 w-3" />
                                                            <span>فایل</span>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                     <div className="flex items-center gap-2">
                                                       {completedLessons.has(lesson.id) && (
                                                         <div className="flex items-center gap-1">
                                                           <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                           <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">تکمیل شده</span>
                                                         </div>
                                                       )}
                                                       {isSelected && !completedLessons.has(lesson.id) && (
                                                         <div className="flex items-center gap-1">
                                                           <PlayCircle className="h-4 w-4 text-blue-500" />
                                                           <span className="text-xs font-medium text-blue-600 dark:text-blue-400">در حال پخش</span>
                                                         </div>
                                                        )}
                                                     </div>
                                                   </div>
                                                </button>
                                              );
                                            })}
                           </div>
                         </AccordionContent>
                       </AccordionItem>
                     </Accordion>
                   ))}
                 </div>
               </AccordionContent>
             </AccordionItem>
           ))}
         </Accordion>

                        {/* Show orphan sections if they exist */}
                        {sections.length > 0 && (
                          <div className="mt-4">
                            <Accordion type="multiple" className="space-y-1">
                              {sections.map((section, sectionIndex) => (
                                <AccordionItem 
                                  key={section.id} 
                                  value={section.id}
                                  className="border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                  <AccordionTrigger className="px-5 py-4 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 [&[data-state=open]]:bg-blue-50 dark:[&[data-state=open]]:bg-blue-950/50">
                                    <div className="flex items-center justify-between w-full pr-3">
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                                          <BookOpen className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="text-right">
                                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                                            {section.title}
                                          </h3>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {section.lessons.length} درس
                                          </p>
                                        </div>
                                      </div>
                                      <Badge variant="secondary" className="bg-primary/20 text-primary px-3 py-1.5 text-sm font-medium shadow-sm">
                                        {section.lessons.length}
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-0 pb-4">
                                    <div className="space-y-1 px-4">
                                      {section.lessons.map((lesson, lessonIndex) => {
                                        const isSelected = selectedLesson?.id === lesson.id;
                                        return (
                                          <button
                                            key={lesson.id}
                                             onClick={() => handleLessonSelect(lesson)}
                                             className={`w-full text-right p-4 rounded-xl transition-all duration-200 group border ${
                                               isSelected 
                                                 ? completedLessons.has(lesson.id)
                                                   ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-md'
                                                   : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-md'
                                                 : completedLessons.has(lesson.id)
                                                   ? 'hover:bg-emerald-50 dark:hover:bg-emerald-800/20 border-transparent hover:border-emerald-200 dark:hover:border-emerald-700'
                                                   : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                             }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                <h4 className={`font-semibold text-base mb-2 text-right truncate ${
                                                  isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                                                }`}>
                                                  {lessonIndex + 1}. {lesson.title}
                                                </h4>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{lesson.duration} دقیقه</span>
                                                  </div>
                                                  {lesson.video_url && (
                                                    <div className="flex items-center gap-1">
                                                      <PlayCircle className="h-4 w-4" />
                                                      <span>ویدیو</span>
                                                    </div>
                                                  )}
                                                  {lesson.file_url && (
                                                    <div className="flex items-center gap-1">
                                                      <FileText className="h-4 w-4" />
                                                      <span>فایل</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                               <div className="flex items-center gap-2">
                                                 {completedLessons.has(lesson.id) && (
                                                   <div className="flex items-center gap-2">
                                                     <CheckCircle className="h-5 w-5 text-emerald-500" />
                                                     <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">تکمیل شده</span>
                                                   </div>
                                                 )}
                                                 {isSelected && !completedLessons.has(lesson.id) && (
                                                   <div className="flex items-center gap-2">
                                                     <PlayCircle className="h-5 w-5 text-blue-500" />
                                                     <span className="text-xs font-medium text-blue-600 dark:text-blue-400">در حال پخش</span>
                                                   </div>
                                                 )}
                                               </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        )}
                       </>
                     )}

                     {/* Course Action Links at the bottom of the menu */}
                     {course && (course.support_link || course.telegram_channel_link || course.gifts_link) && enrollment && (
                       <div className="mt-6 pt-4 border-t border-border">
                         <CourseActionLinks 
                           course={{
                             id: course.id,
                             title: course.title,
                             support_link: course.support_link,
                             telegram_channel_link: course.telegram_channel_link,
                             gifts_link: course.gifts_link,
                             support_activation_required: course.support_activation_required || false,
                             telegram_activation_required: course.telegram_activation_required || false,
                             smart_activation_enabled: false
                           }}
                           enrollment={{
                             id: enrollment.id,
                             full_name: user?.name || user?.firstName || 'کاربر',
                             email: user?.email || ''
                           }}
                           userEmail={user?.email || ''}
                           onSupportActivated={() => {}}
                           onTelegramActivated={() => {}}
                         />
                       </div>
                     )}
                   </div>
                 </div>
               </div>

              {/* Desktop Main Content Area */}
              {!isMobile && (
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  {selectedLesson ? (
                    <div className="p-4 lg:p-6">
                      {renderLessonContent(selectedLesson)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full p-6">
                      <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">شروع یادگیری</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          از منوی کناری یک درس انتخاب کنید
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Lesson View */}
            {isMobile && showMobileLessonView && selectedLesson && (
              <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowMobileLessonView(false)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    بازگشت
                  </Button>
                  <h2 className="font-medium text-lg truncate flex-1">{selectedLesson.title}</h2>
                </div>
                <div className="p-4">
                  {renderLessonContent(selectedLesson)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CourseAccess;