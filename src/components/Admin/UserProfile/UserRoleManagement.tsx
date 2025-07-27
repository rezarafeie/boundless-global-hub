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

      setIsSalesAgent(!error && data);
    } catch (error) {
      console.error('Error checking sales agent:', error);
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
      } else {
        // If role is not sales_agent, deactivate sales agent record
        const { error: deactivateError } = await supabase
          .from('sales_agents')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (deactivateError) throw deactivateError;
        setIsSalesAgent(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          مدیریت نقش کاربر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">نقش فعلی:</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentRole}</Badge>
              {isMessengerAdmin && <Badge variant="secondary">مدیر پیام‌رسان</Badge>}
              {isSupportAgent && <Badge variant="secondary">پشتیبان</Badge>}
              {isSalesAgent && <Badge variant="secondary">نماینده فروش</Badge>}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">تغییر نقش:</h3>
            <div className="flex items-center gap-2">
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
              <Button 
                onClick={handleRoleUpdate} 
                disabled={updating || selectedRole === currentRole}
              >
                {updating ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
              </Button>
            </div>
          </div>

          {(selectedRole === 'sales_agent' || isSalesAgent) && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">تنظیمات نماینده فروش:</h3>
                <Dialog open={showCourseSelector} onOpenChange={setShowCourseSelector}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      مدیریت دوره‌های واگذار شده
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>مدیریت دوره‌های نماینده فروش</DialogTitle>
                    </DialogHeader>
                    <SalesAgentCourseSelector
                      userId={userId}
                      userName={userName}
                      onClose={() => setShowCourseSelector(false)}
                    />
                  </DialogContent>
                </Dialog>
                <p className="text-sm text-muted-foreground mt-2">
                  انتخاب کنید که این نماینده فروش لیدهای کدام دوره‌ها را می‌تواند مشاهده کند
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleManagement;
