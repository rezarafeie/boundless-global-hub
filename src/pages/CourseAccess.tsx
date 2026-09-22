import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  Lock, 
  User,
  FileText,
  Download,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Clock,
  PlayCircle,
  List,
  WifiOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import CourseNotifications from '@/components/Course/CourseNotifications';
import CourseCountdownNotification from '@/components/Gamification/CourseCountdownNotification';
import ReactivationDialog from '@/components/Gamification/ReactivationDialog';
import { useCourseGamification } from '@/hooks/useCourseGamification';
import CourseActionLinks from '@/components/CourseActionLinks';
import { useLessonTracker } from '@/hooks/useLessonTracker';
import { useLessonNumber } from '@/hooks/useLessonNumber';
import { useAuthTracking } from '@/hooks/useAuthTracking';
import { TelegramEnrollmentActivation } from '@/components/TelegramEnrollmentActivation';
import { useIsIranianIP } from '@/hooks/useIsIranianIP';
import { AssignmentSection } from '@/components/Assignment/AssignmentSection';
import { Progress } from '@/components/ui/progress';
import { useLessonWatchTime } from '@/hooks/useLessonWatchTime';
import LessonWatchProgress from '@/components/Course/LessonWatchProgress';

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
  vpn_warning_enabled?: boolean;
  telegram_support_activation_enabled?: boolean;
  telegram_course_access_via_bot_enabled?: boolean;

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
  const isIranianIP = useIsIranianIP();
  
  // Function to replace user template variables in content
  const replaceUserTemplate = (content: string): string => {
    if (!content || !user) return content;
    
    return content.replace(/\[current_user_display_name\]/g, user.firstName || user.name || 'کاربر گرامی');
  };
  
  // Check for direct access with multiple courses
  const isDirectAccess = searchParams.has('direct');
  const courseSlug = searchParams.get('course');
  const lessonId = searchParams.get('lesson');
  
  // Parse multiple courses from URL params
  const getMultipleCourses = (): string[] => {
    if (!isDirectAccess) return courseSlug ? [courseSlug] : [];
    
    const courses: string[] = [];
    
    // Add the main course parameter
    if (courseSlug) {
      courses.push(courseSlug);
    }
    
    // Parse additional courses from URL params - they appear as keys with empty values
    // Format: ?direct=&course=passive-income&american-business=&change=
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      // Skip known parameters
      if (key === 'direct' || key === 'course' || key === 'lesson' || key === '__lovable_token') {
        return;
      }
      
      // If the parameter has an empty value, it's likely a course slug
      if (value === '' || value === null) {
        courses.push(key);
      }
    });
    
    console.log('Parsed courses from URL:', courses);
    return courses;
  };
  
  const multipleCourses = getMultipleCourses();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [titleGroups, setTitleGroups] = useState<TitleGroup[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);
  const gam = useCourseGamification(course?.id, course?.slug);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileLessonView, setShowMobileLessonView] = useState(false);
  const [, setOpenTitleGroups] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  
  // Multi-course support
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(null);
  const [showCourseSelection, setShowCourseSelection] = useState(false);

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
      if (isDirectAccess && multipleCourses.length > 0) {
        loadMultipleCourses();
      } else {
        checkAuthAndLoadCourse();
      }
    }
  }, [courseSlug, authLoading, isAuthenticated, isDirectAccess, multipleCourses.length]);

  // Load multiple courses for direct access
  const loadMultipleCourses = async () => {
    setLoading(true);
    try {
      console.log('Loading multiple courses:', multipleCourses);
      if (multipleCourses.length === 0) {
        toast({
          title: "خطا",
          description: "هیچ دوره‌ای مشخص نشده است",
          variant: "destructive"
        });
        return;
      }

      // Fetch all courses that match the slugs and have free access
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, description, slug, price, enable_course_access, is_free_access, support_link, telegram_channel_link, gifts_link, support_activation_required, telegram_activation_required, vpn_warning_enabled, telegram_support_activation_enabled, telegram_course_access_via_bot_enabled')
        .in('slug', multipleCourses)
        .eq('is_active', true)
        .eq('is_free_access', true)
        .eq('enable_course_access', true);

      if (coursesError) throw coursesError;

      const validCourses = coursesData || [];
      console.log('Valid courses found:', validCourses);
      setAvailableCourses(validCourses);

      if (validCourses.length === 0) {
        toast({
          title: "دسترسی محدود",
          description: "هیچ دوره‌ای با دسترسی رایگان یافت نشد",
          variant: "destructive"
        });
        return;
      }

      // Load content for all courses and combine them
      await loadMultipleCoursesContent(validCourses);

    } catch (error) {
      console.error('Error loading multiple courses:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری دوره‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load content for multiple courses and combine them
  const loadMultipleCoursesContent = async (courses: Course[]) => {
    try {
      let allTitleGroups: TitleGroup[] = [];
      let allSections: Section[] = [];

      // Create a virtual course object for the combined view
      const combinedCourse: Course = {
        id: 'combined',
        title: '',
        description: '',
        slug: 'combined',
        price: 0,
        enable_course_access: true,
        is_free_access: true
      };
      setCourse(combinedCourse);

      for (const courseItem of courses) {
        // Fetch title groups for this course
        const { data: titleGroupsData } = await supabase
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
          .eq('course_id', courseItem.id)
          .eq('is_active', true)
          .order('order_index');

        // Fetch orphan sections for this course
        const { data: orphanSectionsData } = await supabase
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
          .eq('course_id', courseItem.id)
          .is('title_group_id', null)
          .order('order_index');

        // Process title groups for this course
        const formattedTitleGroups = (titleGroupsData || []).map(group => ({
          ...group,
          title: `${courseItem.title} - ${group.title}`, // Add course name prefix
          is_open: true, // Always open for direct access
          sections: (group.course_sections || [])
            .map(section => ({
              ...section,
              lessons: (section.lesson_sections || [])
                .map(ls => ls.course_lessons)
                .filter(lesson => lesson !== null)
                .sort((a, b) => a.order_index - b.order_index)
            }))
            .sort((a, b) => a.order_index - b.order_index)
        }));

        // Process orphan sections for this course
        const formattedOrphanSections = (orphanSectionsData || []).map(section => ({
          ...section,
          title: `${courseItem.title} - ${section.title}`, // Add course name prefix
          lessons: (section.lesson_sections || [])
            .map(ls => ls.course_lessons)
            .filter(lesson => lesson !== null)
            .sort((a, b) => a.order_index - b.order_index)
        }));

        // Add to combined arrays
        allTitleGroups = [...allTitleGroups, ...formattedTitleGroups];
        allSections = [...allSections, ...formattedOrphanSections];
      }

      setTitleGroups(allTitleGroups);
      setSections(allSections);

      // Set all title groups as open
      const initiallyOpen = new Set<string>();
      allTitleGroups.forEach(group => {
        initiallyOpen.add(group.id);
      });
      setOpenTitleGroups(initiallyOpen);

      // Auto-select first lesson if available
      if (allTitleGroups.length > 0 && allTitleGroups[0].sections.length > 0 && allTitleGroups[0].sections[0].lessons.length > 0) {
        setSelectedLesson(allTitleGroups[0].sections[0].lessons[0]);
      } else if (allSections.length > 0 && allSections[0].lessons.length > 0) {
        setSelectedLesson(allSections[0].lessons[0]);
      }

    } catch (error) {
      console.error('Error loading multiple courses content:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری محتوای دوره‌ها",
        variant: "destructive"
      });
    }
  };

  const selectCourseFromMultiple = async (courseSlug: string) => {
    const selectedCourse = availableCourses.find(c => c.slug === courseSlug);
    if (!selectedCourse) return;

    setSelectedCourseSlug(courseSlug);
    setCourse(selectedCourse);
    setShowCourseSelection(false);
    
    // Update URL to reflect the selected course
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('course', courseSlug);
    setSearchParams(newSearchParams, { replace: true });
    
    await fetchCourseContent(selectedCourse.id);
  };

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
        .select('id, title, description, slug, price, enable_course_access, is_free_access, support_link, telegram_channel_link, gifts_link, support_activation_required, telegram_activation_required, vpn_warning_enabled, telegram_support_activation_enabled, telegram_course_access_via_bot_enabled')
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
  
  // All lessons in order + overall progress
  const allCourseLessons = React.useMemo(() => {
    const list: Lesson[] = [];
    titleGroups.forEach(group => group.sections.forEach(section => list.push(...section.lessons)));
    sections.forEach(section => list.push(...section.lessons));
    return list;
  }, [titleGroups, sections]);

  const totalLessonsCount = allCourseLessons.length;
  const completedLessonsCount = allCourseLessons.filter(l => completedLessons.has(l.id)).length;
  const courseProgressPercent = totalLessonsCount > 0
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
    : 0;

  // Shared completion handler (manual click or automatic after enough watch time)
  const completeSelectedLesson = async (auto = false) => {
    if (!selectedLesson || !user?.id || !course) return;
    if (completedLessons.has(selectedLesson.id)) return;

    if (!auto) setIsMarkingComplete(true);
    const lessonId = selectedLesson.id;

    try {
      if (markLessonComplete) {
        await markLessonComplete();
      }
      setCompletedLessons(prev => new Set([...prev, lessonId]));

      if (gam.status?.enabled) {
        try {
          await gam.completeMission(lessonId);
        } catch (e) {
          console.error('mission complete error', e);
        }
      }

      toast({
        title: auto ? 'آفرین! 🎉' : 'تبریک!',
        description: auto ? 'این درس را تا انتها دیدید و تکمیل شد' : 'درس با موفقیت تکمیل شد',
      });
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      if (!auto) {
        toast({ title: 'خطا', description: 'خطا در تکمیل درس', variant: 'destructive' });
      }
    } finally {
      if (!auto) setIsMarkingComplete(false);
    }
  };

  // Real time-on-lesson tracking with automatic completion
  const { secondsRef, requiredRef } = useLessonWatchTime({
    userId: user?.id ? Number(user.id) : null,
    courseId: course?.id,
    lessonId: selectedLesson?.id,
    durationMinutes: selectedLesson?.duration || 0,
    isCompleted: selectedLesson ? completedLessons.has(selectedLesson.id) : true,
    onAutoComplete: () => { completeSelectedLesson(true); },
  });


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

  const renderLessonRow = (lesson: Lesson, index: number) => {
    const isSelected = selectedLesson?.id === lesson.id;
    const isCompleted = completedLessons.has(lesson.id);

    return (
      <Button
        key={lesson.id}
        variant="ghost"
        onClick={() => handleLessonSelect(lesson)}
        className={`h-auto w-full justify-start gap-3 rounded-lg px-3 py-3 text-right font-normal ${
          isSelected ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : 'hover:bg-accent'
        }`}
      >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
          isSelected
            ? 'border-primary-foreground/25 bg-primary-foreground/10'
            : isCompleted
              ? 'border-primary/20 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground'
        }`}>
          {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{lesson.title}</span>
          <span className={`mt-1 flex items-center gap-2 text-[11px] ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {lesson.duration > 0 && <span>{lesson.duration} دقیقه</span>}
            {isSelected && <span>در حال پخش</span>}
            {!isSelected && isCompleted && <span>تکمیل شده</span>}
          </span>
        </span>
      </Button>
    );
  };

  const renderCurriculum = () => {
    let lessonIndex = 0;

    return (
      <div className="flex h-full min-h-0 flex-col bg-muted/30">
        <div className="border-b border-border/70 px-5 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">فهرست دوره</p>
              <p className="mt-1 text-xs text-muted-foreground">{completedLessonsCount} از {totalLessonsCount} درس تکمیل شده</p>
            </div>
            <span className="text-sm font-semibold text-primary">{courseProgressPercent}٪</span>
          </div>
          <Progress value={courseProgressPercent} className="h-1.5" />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {titleGroups.map((group) => (
            <section key={group.id}>
              <div className="mb-2 flex items-center gap-2 px-3">
                <span aria-hidden="true" className="text-base">{group.icon}</span>
                <h3 className="text-xs font-semibold text-muted-foreground">{group.title}</h3>
              </div>
              <div className="space-y-4">
                {group.sections.map((section) => (
                  <div key={section.id}>
                    <p className="mb-1 px-3 text-[11px] text-muted-foreground">{section.title}</p>
                    <div className="space-y-0.5">
                      {section.lessons.map((lesson) => {
                        const row = renderLessonRow(lesson, lessonIndex);
                        lessonIndex += 1;
                        return row;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {sections.map((section) => (
            <section key={section.id}>
              <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{section.title}</p>
              <div className="space-y-0.5">
                {section.lessons.map((lesson) => {
                  const row = renderLessonRow(lesson, lessonIndex);
                  lessonIndex += 1;
                  return row;
                })}
              </div>
            </section>
          ))}

          {totalLessonsCount === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">هنوز درسی اضافه نشده است</div>
          )}
        </div>

        {course && (course.support_link || course.telegram_channel_link || course.gifts_link) && enrollment && (
          <div className="border-t border-border/70 p-4">
            <CourseActionLinks
              course={{
                id: course.id,
                title: course.title,
                support_link: course.support_link,
                telegram_channel_link: course.telegram_channel_link,
                gifts_link: course.gifts_link,
                support_activation_required: course.support_activation_required || false,
                telegram_activation_required: course.telegram_activation_required || false,
                smart_activation_enabled: false,
                telegram_support_activation_enabled: course.telegram_support_activation_enabled || false,
                telegram_course_access_via_bot_enabled: course.telegram_course_access_via_bot_enabled || false
              }}
              enrollment={{
                id: enrollment.id,
                full_name: user?.name || user?.firstName || 'کاربر',
                email: user?.email || ''
              }}
              userEmail={user?.email || ''}
              userId={user?.id ? parseInt(user.id) : null}
              onSupportActivated={() => {}}
              onTelegramActivated={() => {}}
            />
          </div>
        )}
      </div>
    );
  };

  const renderLessonContent = (lesson: Lesson) => {
    const nextLesson = findNextLesson(lesson);
    const lessonNumber = Math.max(1, allCourseLessons.findIndex(item => item.id === lesson.id) + 1);
    const isLessonCompleted = completedLessons.has(lesson.id);
    
    return (
      <div className="mx-auto w-full max-w-5xl pb-16">
        <header className="mb-6 flex items-start justify-between gap-4 border-b border-border/70 pb-5">
          <div className="min-w-0 text-right">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>درس {lessonNumber} از {totalLessonsCount}</span>
              <span aria-hidden="true">·</span>
              {lesson.duration > 0 && <span>{lesson.duration} دقیقه</span>}
              {isLessonCompleted && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <CheckCircle className="h-3.5 w-3.5" /> تکمیل شده
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-relaxed text-foreground lg:text-3xl">{lesson.title}</h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSelectedLesson(null);
              if (isMobile) setShowMobileLessonView(false);
            }}
            className="shrink-0 lg:hidden"
            aria-label="نمایش فهرست دروس"
          >
            <List className="h-4 w-4" />
          </Button>
        </header>

        {/* VPN Warning */}
        {course?.vpn_warning_enabled && isIranianIP === false && (lesson.video_url || (lesson.content && lesson.content.includes('<iframe'))) && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">برای پخش ویدیو، VPN خود را خاموش کنید</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              در صورت روشن بودن VPN ممکن است ویدیو بارگذاری نشود یا کیفیت پخش کاهش پیدا کند.
            </AlertDescription>
          </Alert>
        )}

        {/* Video Section */}
        {lesson.video_url && (
          <div className="aspect-video overflow-hidden rounded-lg bg-foreground shadow-sm [&_.video-embed-container]:h-full [&_iframe]:h-full [&_iframe]:w-full">
            <VideoEmbed embedCode={lesson.video_url} className="w-full" />
          </div>
        )}

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0 space-y-8">
            {lesson.content && (
              <section className="border-b border-border/70 pb-8">
                <h2 className="mb-4 text-sm font-semibold text-foreground">درباره این درس</h2>
                <div className="prose max-w-none text-right dark:prose-invert prose-headings:text-foreground prose-p:leading-8 prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
                  <div dangerouslySetInnerHTML={{ __html: replaceUserTemplate(lesson.content) }} />
                </div>
              </section>
            )}
            <div className="-mx-4"><AssignmentSection lessonId={lesson.id} /></div>
          </div>

          <aside className="space-y-5 lg:border-r lg:border-border/70 lg:pr-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle className={`h-4 w-4 ${isLessonCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                {isLessonCompleted ? 'این درس تکمیل شده' : 'پیشرفت این درس'}
              </div>
              <LessonWatchProgress secondsRef={secondsRef} requiredRef={requiredRef} completed={isLessonCompleted} />
              <Button
                onClick={() => completeSelectedLesson(false)}
                disabled={isLessonCompleted || isMarkingComplete}
                variant={isLessonCompleted ? 'outline' : 'default'}
                className="w-full gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isMarkingComplete ? 'در حال ثبت...' : isLessonCompleted ? 'تکمیل شده' : 'تکمیل کردم'}
              </Button>
            </div>

            {lesson.file_url && (
              <div className="border-t border-border/70 pt-5">
                <p className="mb-3 text-xs font-medium text-muted-foreground">فایل‌های این درس</p>
                <Button
                  onClick={async () => {
                    const fileUrl = lesson.file_url;
                    if (!fileUrl) return;
                    if (isAuthenticated && user?.id && course) {
                      try {
                        await logMaterialDownload(parseInt(user.id.toString()), course.id, `${lesson.title} - منابع درس`, fileUrl);
                      } catch (error) {
                        console.error('Error logging material download:', error);
                      }
                    }
                    window.open(fileUrl, '_blank');
                  }}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Download className="h-4 w-4" /> دانلود منابع
                </Button>
              </div>
            )}

            {nextLesson && (
              <div className="border-t border-border/70 pt-5">
                <p className="mb-1 text-xs text-muted-foreground">درس بعدی</p>
                <p className="mb-3 line-clamp-2 text-sm font-medium leading-6">{nextLesson.title}</p>
                <Button onClick={() => handleLessonSelect(nextLesson)} variant="outline" className="w-full justify-between">
                  ادامه یادگیری <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            )}
          </aside>
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
      <div className="min-h-screen bg-muted/20" dir="rtl">
        <div className="border-b border-border/70 bg-background">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-foreground lg:text-lg">{course.title}</h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{course.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <TelegramEnrollmentActivation courseId={course.id} badgeWhenLinked />
              {(enrollment || course.is_free_access) && (
                <Button variant="outline" size="sm" className="gap-2 lg:hidden" onClick={() => setShowMobileLessonView(false)}>
                  <List className="h-4 w-4" /> فهرست
                </Button>
              )}
            </div>
          </div>
        </div>

        {!isAuthenticated && !course.is_free_access && (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <User className="mx-auto mb-5 h-10 w-10 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">برای ادامه وارد شوید</h2>
            <p className="mb-6 text-sm text-muted-foreground">برای دسترسی به محتوای دوره، وارد حساب کاربری خود شوید.</p>
            <Button onClick={() => setShowAuth(true)} className="w-full">ورود / ثبت‌نام</Button>
            {showAuth && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
                <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background">
                  <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
                    <h3 className="font-semibold">ورود / ثبت‌نام</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowAuth(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="p-4">
                    <UnifiedMessengerAuth
                      onAuthenticated={(sessionToken: string, userName: string, authenticatedUser: any) => {
                        login(authenticatedUser, sessionToken);
                        setShowAuth(false);
                        checkAuthAndLoadCourse();
                      }}
                      isAcademyAuth={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthenticated && !enrollment && !course.is_free_access && (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <Lock className="mx-auto mb-5 h-10 w-10 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">دسترسی به این دوره فعال نیست</h2>
            <p className="mb-6 text-sm text-muted-foreground">برای مشاهده درس‌ها ابتدا در دوره ثبت‌نام کنید.</p>
            <Button onClick={() => window.open(`/course/${course.slug}`, '_blank')}>مشاهده دوره و ثبت‌نام</Button>
          </div>
        )}

        {(enrollment || course.is_free_access) && (
          <>
            <div className="mx-auto max-w-[1600px] space-y-3 px-4 py-3 lg:px-8">
              <CourseCountdownNotification status={gam.status} onReactivate={() => setShowReactivate(true)} />
              <CourseNotifications courseId={course.id} />
            </div>
            <ReactivationDialog
              open={showReactivate}
              onOpenChange={setShowReactivate}
              courseId={course.id}
              courseTitle={course.title}
            />

            <div className="mx-auto max-w-[1600px] px-0 lg:px-8 lg:pb-8">
              <div className="overflow-hidden border-y border-border/70 bg-background lg:grid lg:h-[calc(100dvh-13rem)] lg:min-h-[680px] lg:grid-cols-[21rem_minmax(0,1fr)] lg:rounded-lg lg:border">
                <aside className={`${isMobile && showMobileLessonView ? 'hidden' : 'block'} min-h-[calc(100dvh-12rem)] border-l border-border/70 lg:min-h-0`}>
                  {renderCurriculum()}
                </aside>

                <main className={`${isMobile && !showMobileLessonView ? 'hidden' : 'block'} min-w-0 overflow-y-auto bg-background`}>
                  {selectedLesson ? (
                    <div className="px-4 py-5 sm:px-6 lg:px-10 lg:py-8">{renderLessonContent(selectedLesson)}</div>
                  ) : (
                    <div className="flex h-full min-h-[520px] items-center justify-center p-8 text-center">
                      <div className="max-w-sm">
                        <BookOpen className="mx-auto mb-4 h-9 w-9 text-muted-foreground" />
                        <h2 className="mb-2 text-lg font-semibold">یک درس را انتخاب کنید</h2>
                        <p className="text-sm leading-7 text-muted-foreground">از فهرست دوره، درس موردنظرتان را باز کنید.</p>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CourseAccess;