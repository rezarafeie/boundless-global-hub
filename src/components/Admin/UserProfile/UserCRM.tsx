
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface EnrollmentWithoutCRM {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
  course_id: string;
  courses: {
    title: string;
    slug: string;
  };
}

interface UserCRMProps {
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  preselectedCourseId?: string;
  preselectedCourseTitle?: string;
}

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
  const [enrollmentsWithoutCRM, setEnrollmentsWithoutCRM] = useState<EnrollmentWithoutCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  
  // Form states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'follow_up',
    status: 'در انتظار پرداخت',
    course_id: preselectedCourseId || ''
  });

  useEffect(() => {
    fetchCourses();
    fetchCRMNotes();
    fetchEnrollmentsWithoutCRM();
  }, [userId]);

  useEffect(() => {
    fetchEnrollmentsWithoutCRM();
  }, [selectedCourseFilter]);

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
    }
  };

  const fetchEnrollmentsWithoutCRM = async () => {
    try {
      setLoading(true);
      
      // Build query to get enrollments without CRM records
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          email,
          phone,
          payment_status,
          payment_amount,
          created_at,
          course_id,
          chat_user_id,
          courses (
            title,
            slug
          )
        `)
        .eq('payment_status', 'completed')
        .not('chat_user_id', 'is', null);

      // Apply course filter
      if (selectedCourseFilter !== 'all') {
        query = query.eq('course_id', selectedCourseFilter);
      }

      const { data: enrollments, error } = await query;

      if (error) throw error;

      // Get enrollments that don't have CRM records
      const enrollmentsWithCRM = await supabase
        .from('crm_notes')
        .select('user_id')
        .in('user_id', (enrollments || []).map(e => e.chat_user_id).filter(Boolean));

      const userIdsWithCRM = new Set(enrollmentsWithCRM.data?.map(n => n.user_id) || []);
      
      const enrollmentsWithoutCRMRecords = (enrollments || []).filter(
        enrollment => enrollment.chat_user_id && !userIdsWithCRM.has(enrollment.chat_user_id)
      );

      setEnrollmentsWithoutCRM(enrollmentsWithoutCRMRecords);
    } catch (error) {
      console.error('Error fetching enrollments without CRM:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      toast({
        title: "خطا",
        description: "لطفا محتوای یادداشت را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: userId,
          content: newNote.content,
          type: newNote.type,
          status: newNote.status,
          course_id: newNote.course_id || null,
          created_by: 'Admin'
        });

      if (error) throw error;

      toast({
        title: "موفقیت",
        description: "یادداشت با موفقیت اضافه شد"
      });

      setNewNote({
        content: '',
        type: 'follow_up',
        status: 'در انتظار پرداخت',
        course_id: preselectedCourseId || ''
      });
      setIsAddingNote(false);
      fetchCRMNotes();
      fetchEnrollmentsWithoutCRM();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن یادداشت",
        variant: "destructive"
      });
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
      fetchEnrollmentsWithoutCRM();
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'تکمیل شده':
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
      case 'در انتظار پرداخت':
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
      case 'لغو شده':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'follow_up':
        return <Badge variant="outline">پیگیری</Badge>;
      case 'payment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">پرداخت</Badge>;
      case 'support':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">پشتیبانی</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleCreateCRMForEnrollment = (enrollment: EnrollmentWithoutCRM) => {
    setNewNote({
      content: `پیگیری ثبت‌نام ${enrollment.full_name} برای دوره ${enrollment.courses.title}`,
      type: 'follow_up',
      status: 'در انتظار پرداخت',
      course_id: enrollment.course_id
    });
    setIsAddingNote(true);
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

          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes">یادداشت‌ها</TabsTrigger>
              <TabsTrigger value="pending">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  نیاز به پیگیری
                  {enrollmentsWithoutCRM.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {enrollmentsWithoutCRM.length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-4">
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

              {isAddingNote && (
                <Card>
                  <CardHeader>
                    <CardTitle>افزودن یادداشت جدید</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">نوع</label>
                        <Select value={newNote.type} onValueChange={(value) => setNewNote({...newNote, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="follow_up">پیگیری</SelectItem>
                            <SelectItem value="payment">پرداخت</SelectItem>
                            <SelectItem value="support">پشتیبانی</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">وضعیت</label>
                        <Select value={newNote.status} onValueChange={(value) => setNewNote({...newNote, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="در انتظار پرداخت">در انتظار پرداخت</SelectItem>
                            <SelectItem value="تکمیل شده">تکمیل شده</SelectItem>
                            <SelectItem value="لغو شده">لغو شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">دوره</label>
                        <Select value={newNote.course_id} onValueChange={(value) => setNewNote({...newNote, course_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب دوره" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">هیچ دوره‌ای</SelectItem>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">محتوا</label>
                      <Textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                        placeholder="محتوای یادداشت..."
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddNote}>
                        ذخیره یادداشت
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                        انصراف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
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
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  ثبت‌نام‌های نیاز به پیگیری
                </h3>
                <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="همه دوره‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دوره‌ها</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollmentsWithoutCRM.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {selectedCourseFilter !== 'all' 
                          ? 'هیچ ثبت‌نام بدون پیگیری برای این دوره یافت نشد'
                          : 'همه ثبت‌نام‌ها دارای پیگیری هستند'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isMobile ? (
                        enrollmentsWithoutCRM.map((enrollment) => (
                          <Card key={enrollment.id}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{enrollment.full_name}</div>
                                  <Badge className="bg-orange-100 text-orange-800">
                                    نیاز به پیگیری
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div><span className="font-medium">دوره:</span> {enrollment.courses.title}</div>
                                  <div><span className="font-medium">ایمیل:</span> {enrollment.email}</div>
                                  <div><span className="font-medium">تلفن:</span> {enrollment.phone}</div>
                                  <div><span className="font-medium">مبلغ:</span> {formatPrice(enrollment.payment_amount)}</div>
                                  <div><span className="font-medium">تاریخ:</span> {formatDate(enrollment.created_at)}</div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateCRMForEnrollment(enrollment)}
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  ایجاد پیگیری
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>نام</TableHead>
                              <TableHead>دوره</TableHead>
                              <TableHead>ایمیل</TableHead>
                              <TableHead>تلفن</TableHead>
                              <TableHead>مبلغ</TableHead>
                              <TableHead>تاریخ ثبت‌نام</TableHead>
                              <TableHead>عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enrollmentsWithoutCRM.map((enrollment) => (
                              <TableRow key={enrollment.id}>
                                <TableCell className="font-medium">{enrollment.full_name}</TableCell>
                                <TableCell>{enrollment.courses.title}</TableCell>
                                <TableCell>{enrollment.email}</TableCell>
                                <TableCell>{enrollment.phone}</TableCell>
                                <TableCell>{formatPrice(enrollment.payment_amount)}</TableCell>
                                <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateCRMForEnrollment(enrollment)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    ایجاد پیگیری
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCRM;
