
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
}

interface SalesAgentCourseSelectorProps {
  userId: number;
  userName: string;
  onClose?: () => void;
}

const SalesAgentCourseSelector: React.FC<SalesAgentCourseSelectorProps> = ({
  userId,
  userName,
  onClose
}) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
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
        .select('id, title, slug, is_active')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت دوره‌ها",
        variant: "destructive"
      });
    }
  };

  const fetchAssignedCourses = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sales_agent_courses', {
        agent_user_id: userId
      });

      if (error) throw error;
      setSelectedCourses((data || []).map((course: any) => course.course_id));
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
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

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { data, error } = await supabase.rpc('assign_courses_to_sales_agent', {
        p_agent_user_id: userId,
        p_course_ids: selectedCourses
      });

      if (error) throw error;
      
      if (data) {
        toast({
          title: "موفق",
          description: "دوره‌ها با موفقیت واگذار شدند",
        });
        onClose?.();
      } else {
        toast({
          title: "خطا",
          description: "خطا در واگذاری دوره‌ها",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning courses:', error);
      toast({
        title: "خطا",
        description: "خطا در واگذاری دوره‌ها",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-2">در حال بارگذاری...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          انتخاب دوره‌ها برای {userName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          دوره‌هایی که این نماینده فروش می‌تواند لیدهای آن‌ها را مشاهده کند
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium">دوره‌های موجود:</p>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                <Checkbox
                  id={course.id}
                  checked={selectedCourses.includes(course.id)}
                  onCheckedChange={() => handleCourseToggle(course.id)}
                />
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={course.id}
                    className="text-sm font-medium cursor-pointer truncate block"
                  >
                    {course.title}
                  </label>
                  <p className="text-xs text-muted-foreground">{course.slug}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-medium">دوره‌های انتخاب شده:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCourses.length === 0 ? (
              <span className="text-sm text-muted-foreground">هیچ دوره‌ای انتخاب نشده</span>
            ) : (
              selectedCourses.map((courseId) => {
                const course = courses.find(c => c.id === courseId);
                return course ? (
                  <Badge key={courseId} variant="secondary">
                    {course.title}
                  </Badge>
                ) : null;
              })
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                ذخیره
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesAgentCourseSelector;
