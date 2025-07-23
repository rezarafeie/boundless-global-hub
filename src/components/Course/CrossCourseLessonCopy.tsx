import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Copy, BookOpen, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface CourseLesson {
  id: string;
  title: string;
  content: string;
  video_url?: string;
  file_url?: string;
  duration: number;
  order_index: number;
  section_id: string;
  course_id: string;
}

interface CourseSection {
  id: string;
  title: string;
  course_id: string;
  lessons?: CourseLesson[];
}

interface CrossCourseLessonCopyProps {
  currentCourseId: string;
  onLessonsCopied: () => void;
}

const CrossCourseLessonCopy: React.FC<CrossCourseLessonCopyProps> = ({
  currentCourseId,
  onLessonsCopied
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sourceCourseId, setSourceCourseId] = useState<string>('');
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [sourceLessons, setSourceLessons] = useState<CourseLesson[]>([]);
  const [targetSections, setTargetSections] = useState<CourseSection[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchTargetSections();
  }, [currentCourseId]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .neq('id', currentCourseId)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchTargetSections = async () => {
    try {
      const { data, error } = await supabase
        .from('course_sections')
        .select('id, title, course_id')
        .eq('course_id', currentCourseId)
        .order('order_index');

      if (error) throw error;
      setTargetSections(data || []);
    } catch (error) {
      console.error('Error fetching target sections:', error);
    }
  };

  const fetchSourceLessons = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select(`
          id,
          title,
          content,
          video_url,
          file_url,
          duration,
          order_index,
          section_id,
          course_id,
          course_sections!inner(title)
        `)
        .eq('course_id', courseId)
        .order('section_id')
        .order('order_index');

      if (error) throw error;
      setSourceLessons(data || []);
    } catch (error) {
      console.error('Error fetching source lessons:', error);
    }
  };

  const handleSourceCourseChange = (courseId: string) => {
    setSourceCourseId(courseId);
    setSelectedLessons(new Set());
    if (courseId) {
      fetchSourceLessons(courseId);
    } else {
      setSourceLessons([]);
    }
  };

  const toggleLessonSelection = (lessonId: string) => {
    const newSelection = new Set(selectedLessons);
    if (newSelection.has(lessonId)) {
      newSelection.delete(lessonId);
    } else {
      newSelection.add(lessonId);
    }
    setSelectedLessons(newSelection);
  };

  const selectAllLessons = () => {
    setSelectedLessons(new Set(sourceLessons.map(l => l.id)));
  };

  const clearSelection = () => {
    setSelectedLessons(new Set());
  };

  const copyLessons = async () => {
    if (!targetSectionId || selectedLessons.size === 0) {
      toast({
        title: "خطا",
        description: "لطفاً بخش مقصد و حداقل یک درس انتخاب کنید",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get max order index in target section
      const { data: existingLessons, error: orderError } = await supabase
        .from('course_lessons')
        .select('order_index')
        .eq('section_id', targetSectionId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (orderError) throw orderError;

      const maxOrderIndex = existingLessons?.[0]?.order_index || 0;

      // Copy selected lessons
      const lessonsToCopy = sourceLessons.filter(lesson => selectedLessons.has(lesson.id));
      
      for (let i = 0; i < lessonsToCopy.length; i++) {
        const lesson = lessonsToCopy[i];
        
        const { error: insertError } = await supabase
          .from('course_lessons')
          .insert({
            title: lesson.title,
            content: lesson.content,
            video_url: lesson.video_url,
            file_url: lesson.file_url,
            duration: lesson.duration,
            order_index: maxOrderIndex + i + 1,
            section_id: targetSectionId,
            course_id: currentCourseId
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "موفق",
        description: `${selectedLessons.size} درس با موفقیت کپی شد`
      });

      setIsOpen(false);
      setSelectedLessons(new Set());
      setSourceCourseId('');
      setTargetSectionId('');
      setSourceLessons([]);
      onLessonsCopied();
    } catch (error) {
      console.error('Error copying lessons:', error);
      toast({
        title: "خطا",
        description: "خطا در کپی کردن درس‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Group lessons by section
  const lessonsBySection = sourceLessons.reduce((acc, lesson) => {
    const sectionTitle = (lesson as any).course_sections?.title || 'نامشخص';
    if (!acc[sectionTitle]) {
      acc[sectionTitle] = [];
    }
    acc[sectionTitle].push(lesson);
    return acc;
  }, {} as Record<string, CourseLesson[]>);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        کپی درس از دوره دیگر
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              کپی درس‌ها از دوره دیگر
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Source Course Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">دوره مبدا</label>
                <Select value={sourceCourseId} onValueChange={handleSourceCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دوره مبدا" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">بخش مقصد</label>
                <Select value={targetSectionId} onValueChange={setTargetSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب بخش مقصد" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lessons Selection */}
            {sourceLessons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>انتخاب درس‌ها</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllLessons}
                        className="gap-1"
                      >
                        <CheckSquare className="h-4 w-4" />
                        انتخاب همه
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearSelection}
                        className="gap-1"
                      >
                        <Square className="h-4 w-4" />
                        لغو انتخاب
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(lessonsBySection).map(([sectionTitle, lessons]) => (
                      <div key={sectionTitle} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                          {sectionTitle}
                        </h4>
                        <div className="space-y-2">
                          {lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleLessonSelection(lesson.id)}
                            >
                              <Checkbox
                                checked={selectedLessons.has(lesson.id)}
                                onChange={() => toggleLessonSelection(lesson.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{lesson.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{lesson.duration} دقیقه</span>
                                  {lesson.video_url && <Badge variant="secondary">ویدیو</Badge>}
                                  {lesson.file_url && <Badge variant="secondary">فایل</Badge>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedLessons.size > 0 && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm">
                        {selectedLessons.size} درس انتخاب شده
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Copy Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                انصراف
              </Button>
              <Button
                onClick={copyLessons}
                disabled={loading || selectedLessons.size === 0 || !targetSectionId}
                className="gap-2"
              >
                {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                <Copy className="h-4 w-4" />
                کپی {selectedLessons.size > 0 && `(${selectedLessons.size})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrossCourseLessonCopy;