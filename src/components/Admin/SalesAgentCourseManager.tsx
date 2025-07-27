
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Plus, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesAgent {
  id: number;
  name: string;
  phone: string;
  email: string;
  assigned_courses: {
    id: string;
    course_id: string;
    course_title: string;
    created_at: string;
  }[];
}

interface Course {
  id: string;
  title: string;
}

export function SalesAgentCourseManager() {
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<SalesAgent | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get all sales agents
      const { data: agents } = await supabase
        .from('chat_users')
        .select('id, name, phone, email')
        .eq('is_approved', true);

      const { data: salesAgentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_name', 'sales_agent')
        .eq('is_active', true);

      const salesAgentIds = salesAgentRoles?.map(r => r.user_id) || [];
      const salesAgentsData = agents?.filter(agent => salesAgentIds.includes(agent.id)) || [];

      // Get course assignments for each sales agent
      const { data: assignments } = await supabase
        .from('sales_agent_courses')
        .select(`
          id,
          sales_agent_id,
          course_id,
          created_at,
          courses(title)
        `);

      // Combine data
      const enrichedAgents = salesAgentsData.map(agent => ({
        ...agent,
        assigned_courses: assignments?.filter(a => a.sales_agent_id === agent.id).map(a => ({
          id: a.id,
          course_id: a.course_id,
          course_title: a.courses?.title || 'نامشخص',
          created_at: a.created_at
        })) || []
      }));

      setSalesAgents(enrichedAgents);

      // Get all courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      setCourses(coursesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داده‌ها.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourses = async () => {
    if (!selectedAgent || selectedCourses.length === 0) return;

    try {
      // Remove existing assignments
      await supabase
        .from('sales_agent_courses')
        .delete()
        .eq('sales_agent_id', selectedAgent.id);

      // Add new assignments
      const assignments = selectedCourses.map(courseId => ({
        sales_agent_id: selectedAgent.id,
        course_id: courseId
      }));

      const { error } = await supabase
        .from('sales_agent_courses')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "دوره‌ها با موفقیت اختصاص داده شدند."
      });

      setIsAssignDialogOpen(false);
      setSelectedAgent(null);
      setSelectedCourses([]);
      fetchData();
    } catch (error) {
      console.error('Error assigning courses:', error);
      toast({
        title: "خطا",
        description: "خطا در اختصاص دوره‌ها.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCourse = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('sales_agent_courses')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "دوره با موفقیت حذف شد."
      });

      fetchData();
    } catch (error) {
      console.error('Error removing course:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف دوره.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            مدیریت دسترسی نمایندگان فروش به دوره‌ها
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {salesAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ نماینده فروشی یافت نشد.
            </div>
          ) : (
            <div className="space-y-6">
              {salesAgents.map((agent) => (
                <Card key={agent.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">{agent.phone}</p>
                      </div>
                      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setSelectedCourses(agent.assigned_courses.map(c => c.course_id));
                            }}
                            className="flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            مدیریت دوره‌ها
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>اختصاص دوره‌ها</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4" dir="rtl">
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="font-medium">{selectedAgent?.name}</div>
                              <div className="text-sm text-muted-foreground">{selectedAgent?.phone}</div>
                            </div>
                            
                            <div>
                              <Label>دوره‌های قابل دسترسی:</Label>
                              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                {courses.map(course => (
                                  <div key={course.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={course.id}
                                      checked={selectedCourses.includes(course.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedCourses([...selectedCourses, course.id]);
                                        } else {
                                          setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={course.id} className="text-sm cursor-pointer">
                                      {course.title}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                                لغو
                              </Button>
                              <Button onClick={handleAssignCourses}>
                                ذخیره تغییرات
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {agent.assigned_courses.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        هیچ دوره‌ای اختصاص داده نشده است.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {agent.assigned_courses.map((course) => (
                          <div key={course.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{course.course_title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(course.created_at)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCourse(course.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
