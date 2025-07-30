
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Edit, Trash2, User, Calendar, FileText, ChevronDown, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

interface CRMNote {
  id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  created_by: string;
  course_id: string | null;
  courses?: {
    title: string;
    slug: string;
  } | null;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface UserCRMProps {
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  preselectedCourseId?: string;
  preselectedCourseTitle?: string;
}

const CRM_TYPES = [
  { value: 'note', label: 'یادداشت' },
  { value: 'call', label: 'تماس' },
  { value: 'message', label: 'پیام' },
  { value: 'consultation', label: 'جلسه مشاوره' },
  { value: 'follow_up', label: 'پیگیری' },
  { value: 'payment', label: 'پرداخت' },
  { value: 'support', label: 'پشتیبانی' }
];

const CRM_STATUSES = [
  { value: 'در انتظار پرداخت', label: 'در انتظار پرداخت' },
  { value: 'کنسل', label: 'کنسل' },
  { value: 'موفق', label: 'موفق' },
  { value: 'پاسخ نداده', label: 'پاسخ نداده' },
  { value: 'امکان مکالمه نداشت', label: 'امکان مکالمه نداشت' },
  { value: 'تکمیل شده', label: 'تکمیل شده' },
  { value: 'لغو شده', label: 'لغو شده' }
];

const UserCRM: React.FC<UserCRMProps> = ({ 
  userId, 
  userName, 
  userPhone, 
  userEmail,
  preselectedCourseId,
  preselectedCourseTitle
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'note',
    status: 'در انتظار پرداخت',
    course_id: preselectedCourseId || 'none'
  });

  // User editing states
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    username: '',
    bio: '',
    gender: '',
    age: '',
    education: '',
    job: '',
    specialized_program: '',
    country: '',
    province: ''
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchCRMNotes();
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setCurrentUser(data);
      setUserFormData({
        name: data.name || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        email: data.email || '',
        username: data.username || '',
        bio: data.bio || '',
        gender: data.gender || '',
        age: data.age?.toString() || '',
        education: data.education || '',
        job: data.job || '',
        specialized_program: data.specialized_program || '',
        country: data.country || '',
        province: data.province || ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    setIsUpdatingUser(true);
    try {
      const updateData = {
        name: userFormData.name,
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        phone: userFormData.phone,
        email: userFormData.email || null,
        username: userFormData.username || null,
        bio: userFormData.bio || null,
        gender: (userFormData.gender as 'male' | 'female') || null,
        age: userFormData.age ? parseInt(userFormData.age) : null,
        education: userFormData.education || null,
        job: userFormData.job || null,
        specialized_program: userFormData.specialized_program as any || null,
        country: userFormData.country || null,
        province: userFormData.province as any || null
      };

      const { error } = await supabase
        .from('chat_users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "اطلاعات کاربر با موفقیت به‌روزرسانی شد"
      });

      setIsEditingUser(false);
      await fetchUserData(); // Refresh user data
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی اطلاعات کاربر",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

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
    }
  };

  const fetchCRMNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_notes')
        .select(`
          *,
          courses (
            title,
            slug
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching CRM notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    console.log('Adding note with data:', newNote);
    
    if (!newNote.content.trim()) {
      toast({
        title: "خطا",
        description: "محتوای یادداشت نمی‌تواند خالی باشد.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: userId,
          content: newNote.content,
          type: newNote.type,
          status: newNote.status,
          course_id: newNote.course_id === 'none' ? null : newNote.course_id,
          created_by: 'مدیر'
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت CRM با موفقیت اضافه شد."
      });

      // Reset form
      setNewNote({
        content: '',
        type: 'note',
        status: 'در انتظار پرداخت',
        course_id: preselectedCourseId || 'none'
      });
      
      // Close dialog
      setIsAddingNote(false);
      
      // Refresh data
      await fetchCRMNotes();
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

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "موفقیت",
        description: "یادداشت حذف شد"
      });

      fetchCRMNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف یادداشت",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'موفق': 'default',
      'کنسل': 'destructive',
      'تکمیل شده': 'default',
      'در انتظار پرداخت': 'secondary',
      'پاسخ نداده': 'outline',
      'امکان مکالمه نداشت': 'destructive',
      'لغو شده': 'destructive'
    };
    
    return <Badge variant={variants[status] || 'default'} className="text-xs">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeLabel = CRM_TYPES.find(t => t.value === type)?.label || type;
    return <Badge variant="outline" className="text-xs">{typeLabel}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {preselectedCourseTitle ? `CRM - ${preselectedCourseTitle}` : 'مدیریت ارتباط با مشتری (CRM)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">نام کاربر</div>
              <div className="font-medium">{userName}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">شماره تماس</div>
              <div className="font-medium">{userPhone}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">ایمیل</div>
              <div className="font-medium">{userEmail}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">یادداشت‌های CRM</h3>
              <Button 
                onClick={() => setIsAddingNote(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                افزودن یادداشت
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
                </div>
              ) : (
                <>
                  {notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeBadge(note.type)}
                            {getStatusBadge(note.status)}
                            {note.courses && (
                              <Badge variant="outline" className="bg-gray-50">
                                {note.courses.title}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(note.created_at)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                        <div className="text-xs text-muted-foreground">
                          توسط: {note.created_by}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">هنوز یادداشتی وجود ندارد</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Note Dialog - Same as EnrollmentCRM */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>افزودن یادداشت CRM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">{userName}</div>
              <div className="text-sm text-muted-foreground">{userPhone}</div>
            </div>

            {/* Update User Details Section - Always visible for all users */}
            <div className="w-full">
              <Collapsible open={isEditingUser} onOpenChange={setIsEditingUser}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2" 
                    style={{ display: 'flex' }}
                  >
                    <Settings className="h-4 w-4" />
                    به‌روزرسانی اطلاعات کاربر
                    <ChevronDown className={`h-4 w-4 transition-transform ${isEditingUser ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <h4 className="font-medium text-sm">اطلاعات شخصی</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="user_name">نام کامل</Label>
                      <Input
                        id="user_name"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        placeholder="نام کامل"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_phone">شماره تماس</Label>
                      <Input
                        id="user_phone"
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                        placeholder="شماره تماس"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="user_first_name">نام</Label>
                      <Input
                        id="user_first_name"
                        value={userFormData.first_name}
                        onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })}
                        placeholder="نام"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_last_name">نام خانوادگی</Label>
                      <Input
                        id="user_last_name"
                        value={userFormData.last_name}
                        onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                        placeholder="نام خانوادگی"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="user_email">ایمیل</Label>
                      <Input
                        id="user_email"
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        placeholder="ایمیل"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_username">نام کاربری</Label>
                      <Input
                        id="user_username"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                        placeholder="نام کاربری"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="user_gender">جنسیت</Label>
                      <Select value={userFormData.gender} onValueChange={(value) => setUserFormData({ ...userFormData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب جنسیت" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">مرد</SelectItem>
                          <SelectItem value="female">زن</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="user_age">سن</Label>
                      <Input
                        id="user_age"
                        type="number"
                        value={userFormData.age}
                        onChange={(e) => setUserFormData({ ...userFormData, age: e.target.value })}
                        placeholder="سن"
                        min="1"
                        max="150"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="user_education">تحصیلات</Label>
                      <Input
                        id="user_education"
                        value={userFormData.education}
                        onChange={(e) => setUserFormData({ ...userFormData, education: e.target.value })}
                        placeholder="سطح تحصیلات"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_job">شغل</Label>
                      <Input
                        id="user_job"
                        value={userFormData.job}
                        onChange={(e) => setUserFormData({ ...userFormData, job: e.target.value })}
                        placeholder="شغل"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="user_specialized_program">برنامه تخصصی</Label>
                    <Select value={userFormData.specialized_program} onValueChange={(value) => setUserFormData({ ...userFormData, specialized_program: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب برنامه تخصصی" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drop_shipping">دراپ شیپینگ</SelectItem>
                        <SelectItem value="drop_servicing">دراپ سرویسینگ</SelectItem>
                        <SelectItem value="digital_goods">کالاهای دیجیتال</SelectItem>
                        <SelectItem value="ai">هوش مصنوعی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="user_country">کشور</Label>
                      <Input
                        id="user_country"
                        value={userFormData.country}
                        onChange={(e) => setUserFormData({ ...userFormData, country: e.target.value })}
                        placeholder="کشور"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_province">استان</Label>
                      <Select value={userFormData.province} onValueChange={(value) => setUserFormData({ ...userFormData, province: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب استان" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="آذربایجان شرقی">آذربایجان شرقی</SelectItem>
                          <SelectItem value="آذربایجان غربی">آذربایجان غربی</SelectItem>
                          <SelectItem value="اردبیل">اردبیل</SelectItem>
                          <SelectItem value="اصفهان">اصفهان</SelectItem>
                          <SelectItem value="البرز">البرز</SelectItem>
                          <SelectItem value="ایلام">ایلام</SelectItem>
                          <SelectItem value="بوشهر">بوشهر</SelectItem>
                          <SelectItem value="تهران">تهران</SelectItem>
                          <SelectItem value="چهارمحال و بختیاری">چهارمحال و بختیاری</SelectItem>
                          <SelectItem value="خراسان جنوبی">خراسان جنوبی</SelectItem>
                          <SelectItem value="خراسان رضوی">خراسان رضوی</SelectItem>
                          <SelectItem value="خراسان شمالی">خراسان شمالی</SelectItem>
                          <SelectItem value="خوزستان">خوزستان</SelectItem>
                          <SelectItem value="زنجان">زنجان</SelectItem>
                          <SelectItem value="سمنان">سمنان</SelectItem>
                          <SelectItem value="سیستان و بلوچستان">سیستان و بلوچستان</SelectItem>
                          <SelectItem value="فارس">فارس</SelectItem>
                          <SelectItem value="قزوین">قزوین</SelectItem>
                          <SelectItem value="قم">قم</SelectItem>
                          <SelectItem value="کردستان">کردستان</SelectItem>
                          <SelectItem value="کرمان">کرمان</SelectItem>
                          <SelectItem value="کرمانشاه">کرمانشاه</SelectItem>
                          <SelectItem value="کهگیلویه و بویراحمد">کهگیلویه و بویراحمد</SelectItem>
                          <SelectItem value="گلستان">گلستان</SelectItem>
                          <SelectItem value="گیلان">گیلان</SelectItem>
                          <SelectItem value="لرستان">لرستان</SelectItem>
                          <SelectItem value="مازندران">مازندران</SelectItem>
                          <SelectItem value="مرکزی">مرکزی</SelectItem>
                          <SelectItem value="هرمزگان">هرمزگان</SelectItem>
                          <SelectItem value="همدان">همدان</SelectItem>
                          <SelectItem value="یزد">یزد</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="user_bio">بیوگرافی</Label>
                    <Textarea
                      id="user_bio"
                      value={userFormData.bio}
                      onChange={(e) => setUserFormData({ ...userFormData, bio: e.target.value })}
                      placeholder="بیوگرافی کاربر"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingUser(false)}
                      disabled={isUpdatingUser}
                    >
                      لغو
                    </Button>
                    <Button 
                      onClick={handleUpdateUser}
                      disabled={isUpdatingUser || !userFormData.name.trim()}
                    >
                      {isUpdatingUser ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی اطلاعات'}
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
              </Collapsible>
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
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                لغو
              </Button>
              <Button onClick={handleAddNote} disabled={isSubmitting}>
                {isSubmitting ? 'در حال افزودن...' : 'افزودن یادداشت'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserCRM;
