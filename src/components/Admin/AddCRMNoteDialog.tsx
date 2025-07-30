import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';

interface Course {
  id: string;
  title: string;
}

interface ChatUser {
  id: number;
  name: string;
  phone: string;
}

interface AddCRMNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userPhone: string;
  preselectedCourseId?: string;
  onNoteAdded?: () => void;
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

export function AddCRMNoteDialog({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  userPhone, 
  preselectedCourseId,
  onNoteAdded 
}: AddCRMNoteDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [newNote, setNewNote] = useState({
    type: 'note',
    content: '',
    status: 'در انتظار پرداخت',
    course_id: preselectedCourseId || 'none',
    schedule_followup: false,
    followup_title: '',
    followup_date_option: 'tomorrow',
    followup_time: '10:00',
    followup_custom_date: ''
  });

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewNote({
        type: 'note',
        content: '',
        status: 'در انتظار پرداخت',
        course_id: preselectedCourseId || 'none',
        schedule_followup: false,
        followup_title: '',
        followup_date_option: 'tomorrow',
        followup_time: '10:00',
        followup_custom_date: ''
      });
    }
  }, [isOpen, preselectedCourseId]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً محتوای یادداشت را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Add CRM note
      const { data: noteData, error: noteError } = await supabase
        .from('crm_notes')
        .insert({
          user_id: userId,
          type: newNote.type,
          content: newNote.content,
          status: newNote.status,
          course_id: newNote.course_id === 'none' ? null : newNote.course_id,
          created_by: 'admin'
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Handle follow-up scheduling
      if (newNote.schedule_followup && newNote.followup_title) {
        let dueDate: Date;
        const now = new Date();
        const [hours, minutes] = newNote.followup_time.split(':').map(Number);

        switch (newNote.followup_date_option) {
          case 'tomorrow':
            dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + 1);
            break;
          case 'day_after_tomorrow':
            dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + 2);
            break;
          case 'next_week':
            dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + 7);
            break;
          case 'custom':
            if (!newNote.followup_custom_date) {
              toast({
                title: "خطا",
                description: "لطفاً تاریخ دلخواه را انتخاب کنید",
                variant: "destructive",
              });
              setIsSubmitting(false);
              return;
            }
            dueDate = new Date(newNote.followup_custom_date);
            break;
          default:
            dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + 1);
        }

        dueDate.setHours(hours, minutes, 0, 0);

        const { error: followupError } = await supabase
          .from('crm_followups')
          .insert({
            user_id: userId,
            crm_activity_id: noteData.id,
            title: newNote.followup_title,
            due_at: dueDate.toISOString(),
            assigned_to: userId,
            status: 'open'
          });

        if (followupError) {
          console.error('Error creating follow-up:', followupError);
          // Don't fail the whole operation for follow-up errors
        }
      }

      toast({
        title: "موفقیت",
        description: "یادداشت CRM با موفقیت اضافه شد",
      });

      onClose();
      if (onNoteAdded) {
        onNoteAdded();
      }

    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در افزودن یادداشت",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>افزودن یادداشت CRM</DialogTitle>
          <DialogDescription>
            یادداشت جدید اضافه کنید و در صورت نیاز پیگیری زمان‌بندی کنید
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4" dir="rtl">
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-muted-foreground">{userPhone}</div>
          </div>
          
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

          {/* Follow-up Scheduling Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2" dir="rtl">
              <Checkbox
                id="schedule_followup"
                checked={newNote.schedule_followup}
                onCheckedChange={(checked) => 
                  setNewNote({...newNote, schedule_followup: checked as boolean})
                }
              />
              <Label htmlFor="schedule_followup" className="flex items-center gap-2 cursor-pointer">
                <Clock className="w-4 h-4" />
                زمان‌بندی پیگیری
              </Label>
            </div>

            {newNote.schedule_followup && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="followup_title">عنوان پیگیری</Label>
                  <Input
                    id="followup_title"
                    placeholder="مثال: پیگیری پرداخت"
                    value={newNote.followup_title}
                    onChange={(e) => setNewNote({...newNote, followup_title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="followup_date">زمان پیگیری</Label>
                    <Select
                      value={newNote.followup_date_option}
                      onValueChange={(value) => setNewNote({...newNote, followup_date_option: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب زمان" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tomorrow">فردا</SelectItem>
                        <SelectItem value="day_after_tomorrow">پس‌فردا</SelectItem>
                        <SelectItem value="next_week">هفته آینده</SelectItem>
                        <SelectItem value="custom">تاریخ دلخواه</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="followup_time">ساعت</Label>
                    <Input
                      id="followup_time"
                      type="time"
                      value={newNote.followup_time}
                      onChange={(e) => setNewNote({...newNote, followup_time: e.target.value})}
                    />
                  </div>
                </div>

                {newNote.followup_date_option === 'custom' && (
                  <div>
                    <Label htmlFor="followup_custom_date">تاریخ دلخواه</Label>
                    <Input
                      id="followup_custom_date"
                      type="date"
                      value={newNote.followup_custom_date}
                      onChange={(e) => setNewNote({...newNote, followup_custom_date: e.target.value})}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              لغو
            </Button>
            <Button onClick={addNote} disabled={isSubmitting}>
              {isSubmitting ? 'در حال افزودن...' : 'افزودن یادداشت'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}