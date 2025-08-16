import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLessonNumber } from "@/hooks/useLessonNumber";
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CheckCircle,
  FileText,
  Download,
  Volume2,
  BookOpen
} from "lucide-react";

interface LessonData {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  file_url: string | null;
  duration: number;
  course_id: string;
  lesson_number: number;
  courseTitle?: string;
  courseSlug?: string;
  nextLessonNumber?: number;
  prevLessonNumber?: number;
}

const AppLessonView = () => {
  const { courseSlug: paramCourseSlug, lessonNumber } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getLessonByNumber } = useLessonNumber();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseSlug, setCourseSlug] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (lessonNumber) {
      fetchLessonData();
    }
  }, [lessonNumber, isAuthenticated, navigate]);

  const fetchLessonData = async () => {
    if (!lessonNumber || !user?.id) return;
    
    try {
      setLoading(true);
      
      let foundLesson = null;
      let foundCourse = null;
      
      // If we have course slug from params, use it directly
      if (paramCourseSlug) {
        // Verify user is enrolled in this specific course
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            course_id,
            courses!inner (
              id,
              title,
              slug,
              is_active
            )
          `)
          .eq('chat_user_id', parseInt(user.id))
          .eq('payment_status', 'completed')
          .eq('courses.slug', paramCourseSlug)
          .eq('courses.is_active', true);

        if (enrollmentError || !enrollments || enrollments.length === 0) {
          console.error('User not enrolled in course:', enrollmentError);
          navigate('/app/my-courses');
          return;
        }

        // Use the first valid enrollment
        const enrollment = enrollments[0];

        // Get the lesson data
        const lessonData = await getLessonByNumber(paramCourseSlug, parseInt(lessonNumber));
        if (!lessonData) {
          console.error('Lesson not found');
          navigate(`/app/course/${paramCourseSlug}`);
          return;
        }

        foundLesson = lessonData;
        foundCourse = enrollment.courses;
      } else {
        // Fallback: search through all enrolled courses
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            course_id,
            courses!inner (
              id,
              title,
              slug,
              is_active
            )
          `)
          .eq('chat_user_id', parseInt(user.id))
          .eq('payment_status', 'completed')
          .eq('courses.is_active', true);

        if (enrollmentError || !enrollments) {
          console.error('Error fetching enrollments:', enrollmentError);
          navigate('/app/my-courses');
          return;
        }

        // Try to find the lesson in each enrolled course
        for (const enrollment of enrollments) {
          const course = enrollment.courses;
          if (!course) continue;

          const lessonData = await getLessonByNumber(course.slug, parseInt(lessonNumber));
          if (lessonData) {
            foundLesson = lessonData;
            foundCourse = course;
            break;
          }
        }
      }

      if (!foundLesson || !foundCourse) {
        console.error('Lesson not found or user not enrolled');
        navigate('/app/my-courses');
        return;
      }

      // Get adjacent lesson numbers for navigation
      const { data: adjacentLessons } = await supabase
        .from('course_lessons')
        .select('lesson_number')
        .eq('course_id', foundLesson.course_id)
        .order('lesson_number');

      const currentIndex = adjacentLessons?.findIndex(l => l.lesson_number === foundLesson.lesson_number) ?? -1;
      const nextLessonNumber = currentIndex >= 0 && currentIndex < (adjacentLessons?.length ?? 0) - 1 
        ? adjacentLessons?.[currentIndex + 1]?.lesson_number 
        : undefined;
      const prevLessonNumber = currentIndex > 0 
        ? adjacentLessons?.[currentIndex - 1]?.lesson_number 
        : undefined;

      setLesson({
        ...foundLesson,
        courseTitle: foundCourse.title,
        courseSlug: foundCourse.slug,
        nextLessonNumber,
        prevLessonNumber
      });

      setCourseSlug(foundCourse.slug);

      // Check if lesson is completed (you can implement this based on your progress tracking)
      // For now, we'll use a simple check
      setIsCompleted(false);

    } catch (error) {
      console.error('Error fetching lesson data:', error);
      // Instead of redirecting, show error state
      setLesson(null);
    } finally {
      setLoading(false);
    }
  };

  const totalDuration = lesson?.duration || 0;
  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    // Here you would call Supabase to mark lesson as completed
  };

  const handleNextLesson = () => {
    if (lesson?.nextLessonNumber && courseSlug) {
      navigate(`/app/course/${courseSlug}/lesson/${lesson.nextLessonNumber}`);
    }
  };

  const handlePrevLesson = () => {
    if (lesson?.prevLessonNumber && courseSlug) {
      navigate(`/app/course/${courseSlug}/lesson/${lesson.prevLessonNumber}`);
    }
  };

  const handleBackToCourse = () => {
    if (courseSlug) {
      navigate(`/app/course/${courseSlug}`);
    }
  };

  const rightAction = (
    <div className="flex items-center gap-2">
      {lesson?.file_url && (
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download size={16} />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBackToCourse}>
        <BookOpen size={16} />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <AppLayout title="بارگذاری..." rightAction={null}>
        <div className="space-y-4">
          <div className="px-4 pt-2">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="px-4">
            <Card className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
            </Card>
          </div>
          <div className="px-4">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!lesson) {
    return (
      <AppLayout title="خطا" rightAction={null}>
        <div className="p-4">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">درس یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              درس مورد نظر یافت نشد یا شما در دوره آن ثبت‌نام نکرده‌اید
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
    <AppLayout title={lesson.title} rightAction={rightAction}>
      <div className="space-y-4">
        {/* Course Context */}
        <div className="px-4 pt-2">
          <Badge variant="outline" className="text-xs">
            {lesson.courseTitle}
          </Badge>
        </div>

        {/* Video Player - only show if there's video content */}
        {(lesson.video_url || (lesson.content && lesson.content.includes('<iframe'))) && (
          <div className="px-4">
            <Card className="overflow-hidden">
              <div className="relative">
                {/* Video Content */}
                {lesson.video_url ? (
                  <div 
                    className="aspect-video w-full"
                    dangerouslySetInnerHTML={{ __html: lesson.video_url }}
                  />
                ) : lesson.content && lesson.content.includes('<iframe') ? (
                  <div 
                    className="aspect-video w-full"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                ) : null}
              </div>
            </Card>
          </div>
        )}

        {/* Lesson Content */}
        <div className="px-4">
          <Card>
            <CardContent className="p-4">
              {lesson.content && !lesson.content.includes('<iframe') ? (
                <div 
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
                />
              ) : !lesson.video_url && (!lesson.content || !lesson.content.includes('<iframe')) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>محتوای این درس در حال آماده‌سازی است</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-6">
          <div className="space-y-3">
            {!isCompleted ? (
              <Button 
                onClick={handleComplete}
                className="w-full"
                size="lg"
              >
                <CheckCircle size={18} className="ml-2" />
                علامت‌گذاری به عنوان تکمیل شده
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-green-600 font-medium">این درس تکمیل شده است</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Button 
                variant="outline"
                onClick={handlePrevLesson}
                disabled={!lesson.prevLessonNumber}
                className="w-full"
              >
                <SkipBack size={16} className="ml-2" />
                درس قبلی
              </Button>
              <Button 
                onClick={handleNextLesson}
                disabled={!lesson.nextLessonNumber}
                className="w-full"
              >
                درس بعدی
                <SkipForward size={16} className="mr-2" />
              </Button>
            </div>

            {lesson.file_url && (
              <Button variant="outline" className="w-full" onClick={() => window.open(lesson.file_url!, '_blank')}>
                <Download size={16} className="ml-2" />
                دانلود فایل‌های درس
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppLessonView;