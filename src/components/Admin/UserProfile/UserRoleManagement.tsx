
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserCog, Shield, Settings, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SalesAgentCourseSelector from '@/components/Admin/SalesAgentCourseSelector';

interface UserRoleManagementProps {
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  currentRole: string;
  isMessengerAdmin: boolean;
  isSupportAgent: boolean;
  onRoleUpdate: () => void;
}

interface AssignedCourse {
  course_id: string;
  course_title: string;
  course_slug: string;
}

const UserRoleManagement: React.FC<UserRoleManagementProps> = ({
  userId,
  userName,
  userPhone,
  userEmail,
  currentRole,
  isMessengerAdmin,
  isSupportAgent,
  onRoleUpdate
}) => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [updating, setUpdating] = useState(false);
  const [isSalesAgent, setIsSalesAgent] = useState(false);
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  useEffect(() => {
    checkSalesAgent();
  }, [userId]);

  const checkSalesAgent = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_agents')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      const isAgent = !!data && !error;
      setIsSalesAgent(isAgent);
      
      if (isAgent) {
        fetchAssignedCourses();
      }
    } catch (error) {
      console.error('Error checking sales agent:', error);
    }
  };

  const fetchAssignedCourses = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sales_agent_courses', {
        agent_user_id: userId
      });

      if (error) throw error;
      
      const courses = (data || []).map((course: any) => ({
        course_id: course.course_id,
        course_title: course.course_title,
        course_slug: course.course_slug
      }));
      
      setAssignedCourses(courses);
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
    }
  };

  const handleRoleUpdate = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('chat_users')
        .update({
          role: selectedRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // If role is sales_agent, create or activate sales agent record
      if (selectedRole === 'sales_agent') {
        const { error: salesAgentError } = await supabase
          .from('sales_agents')
          .upsert({
            user_id: userId,
            is_active: true,
            updated_at: new Date().toISOString()
          });

        if (salesAgentError) throw salesAgentError;
        setIsSalesAgent(true);
        fetchAssignedCourses();
      } else {
        // If role is not sales_agent, deactivate sales agent record
        const { error: deactivateError } = await supabase
          .from('sales_agents')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (deactivateError) throw deactivateError;
        setIsSalesAgent(false);
        setAssignedCourses([]);
      }

      toast({
        title: "موفق",
        description: "نقش کاربر با موفقیت به‌روزرسانی شد",
      });
      
      onRoleUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی نقش کاربر",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const availableRoles = [
    { value: 'user', label: 'کاربر عادی' },
    { value: 'admin', label: 'مدیر' },
    { value: 'enrollments_manager', label: 'مدیر ثبت‌نام‌ها' },
    { value: 'sales_agent', label: 'نماینده فروش' },
    { value: 'support_agent', label: 'پشتیبان' },
    { value: 'moderator', label: 'مدیر محتوا' },
  ];

  return (
    <div dir="rtl" className="text-right">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <UserCog className="h-5 w-5" />
            مدیریت نقش کاربر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-right">
              <h3 className="font-medium mb-2 text-right">نقش فعلی:</h3>
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="outline">{currentRole}</Badge>
                {isMessengerAdmin && <Badge variant="secondary">مدیر پیام‌رسان</Badge>}
                {isSupportAgent && <Badge variant="secondary">پشتیبان</Badge>}
                {isSalesAgent && <Badge variant="secondary">نماینده فروش</Badge>}
              </div>
            </div>

            <Separator />

            <div className="text-right">
              <h3 className="font-medium mb-2 text-right">تغییر نقش:</h3>
              <div className="flex items-center gap-2 justify-end">
                <Button 
                  onClick={handleRoleUpdate} 
                  disabled={updating || selectedRole === currentRole}
                >
                  {updating ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
                </Button>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedRole === 'sales_agent' || isSalesAgent) && (
              <>
                <Separator />
                <div className="text-right">
                  <h3 className="font-medium mb-2 text-right">تنظیمات نماینده فروش:</h3>
                  
                  {/* Show assigned courses */}
                  {assignedCourses.length > 0 && (
                    <div className="mb-4 text-right">
                      <p className="text-sm font-medium mb-2 text-right">دوره‌های واگذار شده:</p>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {assignedCourses.map((course) => (
                          <Badge key={course.course_id} variant="outline" className="text-right">
                            {course.course_title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Dialog open={showCourseSelector} onOpenChange={setShowCourseSelector}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        مدیریت دوره‌های واگذار شده
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-right">مدیریت دوره‌های نماینده فروش</DialogTitle>
                      </DialogHeader>
                      <SalesAgentCourseSelector
                        userId={userId}
                        userName={userName}
                        onClose={() => {
                          setShowCourseSelector(false);
                          fetchAssignedCourses(); // Refresh courses after closing
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <p className="text-sm text-muted-foreground mt-2 text-right">
                    انتخاب کنید که این نماینده فروش لیدهای کدام دوره‌ها را می‌تواند مشاهده کند
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManagement;
