
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EnrollmentsWithoutCRM from './EnrollmentCRM/EnrollmentsWithoutCRM';
import CRMActivities from './EnrollmentCRM/CRMActivities';

interface Course {
  id: string;
  title: string;
}

interface ChatUser {
  id: number;
  name: string;
  phone: string;
}

interface EnrollmentWithoutCRM {
  id: string;
  full_name: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
  course_id: string;
  chat_user_id: number;
  courses: {
    title: string;
    slug: string;
  };
}

const CRM_TYPES = [
  { value: 'note', label: 'یادداشت' },
  { value: 'call', label: 'تماس' },
  { value: 'message', label: 'پیام' },
  { value: 'consultation', label: 'جلسه مشاوره' }
];

const CRM_STATUSES = [
  { value: 'در انتظار پرداخت', label: 'در انتظار پرداخت' },
  { value: 'کنسل', label: 'کنسل' },
  { value: 'موفق', label: 'موفق' },
  { value: 'پاسخ نداده', label: 'پاسخ نداده' },
  { value: 'امکان مکالمه نداشت', label: 'امکان مکالمه نداشت' }
];

export function EnrollmentCRM() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  
  // New note form
  const [newNote, setNewNote] = useState({
    type: 'note',
    content: '',
    course_id: 'none',
    status: 'در انتظار پرداخت',
    user_id: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (coursesError) throw coursesError;

      // Fetch chat users
      const { data: chatUsersData, error: chatUsersError } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .eq('is_approved', true)
        .order('name');

      if (chatUsersError) throw chatUsersError;

      setCourses(coursesData || []);
      setChatUsers(chatUsersData || []);
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داده‌های اولیه.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCRMForEnrollment = async (enrollment: EnrollmentWithoutCRM) => {
    try {
      const user = chatUsers.find(u => u.id === enrollment.chat_user_id);
      
      if (!user) {
        toast({
          title: "خطا",
          description: "کاربر یافت نشد",
          variant: "destructive"
        });
        return;
      }

      setSelectedUser(user);
      
      setNewNote({
        type: 'note',
        content: `پیگیری ثبت‌نام ${enrollment.full_name} برای دوره ${enrollment.courses.title}`,
        course_id: enrollment.course_id,
        status: 'در انتظار پرداخت',
        user_id: user.id.toString()
      });

      setIsAddingNote(true);
    } catch (error) {
      console.error('Error preparing CRM for enrollment:', error);
      toast({
        title: "خطا",
        description: "خطا در آماده‌سازی CRM",
        variant: "destructive"
      });
    }
  };

  const handleAddNoteForUser = (userId: number) => {
    const user = chatUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setNewNote({
        type: 'note',
        content: '',
        course_id: 'none',
        status: 'در انتظار پرداخت',
        user_id: userId.toString()
      });
      setIsAddingNote(true);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim()) {
      toast({
        title: "خطا",
        description: "محتوای یادداشت نمی‌تواند خالی باشد.",
        variant: "destructive"
      });
      return;
    }

    if (!newNote.user_id) {
      toast({
        title: "خطا",
        description: "لطفاً کاربر را انتخاب کنید.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: parseInt(newNote.user_id),
          type: newNote.type,
          content: newNote.content,
          course_id: newNote.course_id === 'none' ? null : newNote.course_id,
          status: newNote.status,
          created_by: 'مدیر'
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت CRM با موفقیت اضافه شد."
      });

      // Reset form
      setNewNote({
        type: 'note',
        content: '',
        course_id: 'none',
        status: 'در انتظار پرداخت',
        user_id: ''
      });
      
      setIsAddingNote(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('Error adding CRM note:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن یادداشت CRM.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <MessageSquare className="w-5 h-5" />
            مدیریت CRM
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Enrollments without CRM */}
          <EnrollmentsWithoutCRM 
            courses={courses} 
            onCreateCRM={handleCreateCRMForEnrollment}
          />

          {/* CRM Activities */}
          <CRMActivities 
            courses={courses}
            onAddNote={handleAddNoteForUser}
          />
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن یادداشت CRM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedUser.name}</div>
                <div className="text-sm text-muted-foreground">{selectedUser.phone}</div>
              </div>
            )}
            
            <div>
              <Label htmlFor="type">نوع</Label>
              <Select value={newNote.type} onValueChange={(value) => setNewNote({...newNote, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="course">دوره</Label>
              <Select value={newNote.course_id} onValueChange={(value) => setNewNote({...newNote, course_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون دوره</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">وضعیت</Label>
              <Select value={newNote.status} onValueChange={(value) => setNewNote({...newNote, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="content">محتوا</Label>
              <Textarea
                id="content"
                placeholder="محتوای یادداشت خود را وارد کنید..."
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                لغو
              </Button>
              <Button onClick={addNote} disabled={isSubmitting}>
                {isSubmitting ? 'در حال افزودن...' : 'افزودن یادداشت'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
