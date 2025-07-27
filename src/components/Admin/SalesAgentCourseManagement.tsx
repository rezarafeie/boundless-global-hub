
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface SalesAgentCourseManagementProps {
  userId: number;
}

const SalesAgentCourseManagement: React.FC<SalesAgentCourseManagementProps> = ({ userId }) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAssignedCourses();
  }, [userId]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری دوره‌ها',
        variant: 'destructive',
      });
    }
  };

  const fetchAssignedCourses = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sales_agent_courses', {
        agent_user_id: userId
      });

      if (error) throw error;
      
      const assignedCoursesData = data?.map((course: any) => ({
        id: course.course_id,
        title: course.course_title,
        slug: course.course_slug
      })) || [];
      
      setAssignedCourses(assignedCoursesData);
      setSelectedCourses(assignedCoursesData.map((course: Course) => course.id));
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری دوره‌های اختصاص داده شده',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const saveAssignments = async () => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase.rpc('assign_courses_to_sales_agent', {
        p_agent_user_id: userId,
        p_course_ids: selectedCourses
      });

      if (error) throw error;
      
      if (data) {
        toast({
          title: 'موفق',
          description: 'دوره‌ها با موفقیت اختصاص داده شدند',
        });
        
        fetchAssignedCourses();
      } else {
        toast({
          title: 'خطا',
          description: 'خطا در اختصاص دوره‌ها',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره تغییرات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden" dir="rtl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <BookOpen className="h-5 w-5" />
            مدیریت دوره‌های فروش
          </CardTitle>
        </CardHeader>
        <CardContent className="text-right">
          <div className="space-y-6">
            {/* Current Assignments */}
            <div>
              <h3 className="text-lg font-semibold mb-3">دوره‌های اختصاص داده شده</h3>
              {assignedCourses.length === 0 ? (
                <p className="text-muted-foreground">هیچ دوره‌ای اختصاص داده نشده است</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignedCourses.map((course) => (
                    <Badge key={course.id} variant="default" className="text-xs">
                      {course.title}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Course Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">انتخاب دوره‌ها</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={course.id}
                      checked={selectedCourses.includes(course.id)}
                      onCheckedChange={() => handleCourseToggle(course.id)}
                    />
                    <label 
                      htmlFor={course.id} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {course.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={saveAssignments}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { SalesAgentCourseManagement };
