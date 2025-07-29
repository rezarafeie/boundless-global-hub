
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserCog, Shield, Settings, BookOpen, Key } from 'lucide-react';
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
  isApproved: boolean;
  bedounMarz: boolean;
  notificationEnabled: boolean;
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
  isApproved,
  bedounMarz,
  notificationEnabled,
  onRoleUpdate
}) => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [updating, setUpdating] = useState(false);
  const [isSalesAgent, setIsSalesAgent] = useState(false);
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);

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

  const handlePermissionToggle = async (permission: string, value: boolean) => {
    setUpdatingPermissions(true);
    try {
      let updateData: any = { updated_at: new Date().toISOString() };
      
      switch (permission) {
        case 'messenger_admin':
          updateData.is_messenger_admin = value;
          break;
        case 'support_agent':
          updateData.is_support_agent = value;
          break;
        case 'approved':
          updateData.is_approved = value;
          break;
        case 'bedoun_marz':
          updateData.bedoun_marz = value;
          break;
        case 'notification_enabled':
          updateData.notification_enabled = value;
          break;
        default:
          throw new Error('Invalid permission type');
      }

      const { error } = await supabase
        .from('chat_users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "دسترسی با موفقیت به‌روزرسانی شد",
      });
      
      onRoleUpdate();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی دسترسی",
        variant: "destructive"
      });
    } finally {
      setUpdatingPermissions(false);
    }
  };

  const availableRoles = [
    { value: 'user', label: 'کاربر عادی' },
    { value: 'admin', label: 'مدیر' },
    { value: 'enrollments_manager', label: 'مدیر ثبت‌نام‌ها' },
    { value: 'sales_manager', label: 'مدیر فروش' },
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

            <Separator />
            
            {/* Permissions and Access Section */}
            <div className="text-right">
              <h3 className="font-medium mb-4 text-right flex items-center gap-2 justify-end">
                <Key className="h-5 w-5" />
                مجوزها و دسترسی‌ها
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Permissions */}
                <div className="space-y-3 p-4 bg-background/50 rounded-lg border">
                  <h4 className="font-medium text-sm text-right">دسترسی‌های پایه</h4>
                   <div className="space-y-3">
                     <div className="flex items-center justify-between text-sm">
                       <Switch 
                         checked={isApproved}
                         onCheckedChange={(checked) => handlePermissionToggle('approved', checked)}
                         disabled={updatingPermissions}
                       />
                       <span>ورود به سیستم</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                       <Switch 
                         checked={bedounMarz}
                         onCheckedChange={(checked) => handlePermissionToggle('bedoun_marz', checked)}
                         disabled={updatingPermissions}
                       />
                       <span>دسترسی بدون مرز</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                       <Switch 
                         checked={notificationEnabled}
                         onCheckedChange={(checked) => handlePermissionToggle('notification_enabled', checked)}
                         disabled={updatingPermissions}
                       />
                       <span>اعلان‌ها</span>
                     </div>
                   </div>
                 </div>

                 {/* Administrative Permissions */}
                 <div className="space-y-3 p-4 bg-background/50 rounded-lg border">
                   <h4 className="font-medium text-sm text-right">دسترسی‌های مدیریتی</h4>
                   <div className="space-y-3">
                     <div className="flex items-center justify-between text-sm">
                       <Switch 
                         checked={isMessengerAdmin}
                         onCheckedChange={(checked) => handlePermissionToggle('messenger_admin', checked)}
                         disabled={updatingPermissions}
                       />
                       <span>مدیریت پیام‌رسان</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                       <Switch 
                         checked={isSupportAgent}
                         onCheckedChange={(checked) => handlePermissionToggle('support_agent', checked)}
                         disabled={updatingPermissions}
                       />
                       <span>پشتیبانی</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                       <Badge variant={isSalesAgent ? "default" : "secondary"} className="text-xs">
                         {isSalesAgent ? "فعال" : "غیرفعال"}
                       </Badge>
                       <span>نمایندگی فروش</span>
                       <p className="text-xs text-muted-foreground">از طریق تغییر نقش</p>
                     </div>
                   </div>
                 </div>
               </div>
               
               <p className="text-xs text-muted-foreground mt-3 text-right">
                 دسترسی‌ها بر اساس نقش کاربر و تنظیمات سیستم تعیین می‌شوند. نمایندگی فروش از طریق تغییر نقش فعال می‌شود.
               </p>
             </div>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 };

export default UserRoleManagement;
