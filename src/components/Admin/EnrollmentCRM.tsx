import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Plus, Phone, FileText, Users, Calendar, Filter, Search, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface CRMNote {
  id: string;
  type: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  course_id: string | null;
  status: string;
  user_name?: string;
  user_phone?: string;
  course_title?: string;
}

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

const PAYMENT_STATUSES = [
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'failed', label: 'ناموفق' },
  { value: 'cancelled', label: 'لغو شده' },
  { value: 'cancelled_payment', label: 'لغو پرداخت' }
];

export function EnrollmentCRM() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [enrollmentsWithoutCRM, setEnrollmentsWithoutCRM] = useState<EnrollmentWithoutCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [enrollmentFilterCourse, setEnrollmentFilterCourse] = useState('all');
  const [enrollmentFilterStatus, setEnrollmentFilterStatus] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const enrollmentsPerPage = 50;
  const totalPages = Math.ceil(totalEnrollments / enrollmentsPerPage);
  
  // New note form
  const [newNote, setNewNote] = useState({
    type: 'note',
    content: '',
    course_id: 'none',
    status: 'در انتظار پرداخت',
    user_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchEnrollmentsWithoutCRM();
  }, [enrollmentFilterCourse, enrollmentFilterStatus, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [enrollmentFilterCourse, enrollmentFilterStatus]);

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .eq('is_approved', true)
        .order('name')
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = (user: ChatUser) => {
    setSelectedUser(user);
    setNewNote({ ...newNote, user_id: user.id.toString() });
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setNewNote({ ...newNote, user_id: '' });
  };

  const openAddNoteDialog = () => {
    if (!selectedUser) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا کاربر را انتخاب کنید.",
        variant: "destructive"
      });
      return;
    }
    setIsAddingNote(true);
  };

  const fetchData = async () => {
    try {
      // Fetch CRM notes with manual joins
      const { data: notesData, error: notesError } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (coursesError) throw coursesError;

      // Fetch chat users for user names and user selection
      const { data: chatUsersData, error: chatUsersError } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .eq('is_approved', true)
        .order('name');

      if (chatUsersError) throw chatUsersError;

      // Enrich notes with user and course data
      const enrichedNotes = (notesData || []).map(note => {
        const user = chatUsersData?.find(u => u.id === note.user_id);
        const course = coursesData?.find(c => c.id === note.course_id);
        
        return {
          ...note,
          user_name: user?.name || 'نامشخص',
          user_phone: user?.phone || '',
          course_title: course?.title || 'بدون دوره'
        };
      });

      setNotes(enrichedNotes);
      setCourses(coursesData || []);
      setChatUsers(chatUsersData || []);
      
      // Extract unique agents
      const uniqueAgents = [...new Set(enrichedNotes.map(note => note.created_by))];
      setAgents(uniqueAgents);
      
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داده‌های CRM.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentsWithoutCRM = async () => {
    try {
      setLoadingEnrollments(true);
      
      // Build query to get enrollments without CRM records
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
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
        .not('chat_user_id', 'is', null)
        .order('created_at', { ascending: false });

      // Apply course filter
      if (enrollmentFilterCourse !== 'all') {
        query = query.eq('course_id', enrollmentFilterCourse);
      }

      // Apply status filter
      if (enrollmentFilterStatus !== 'all') {
        query = query.eq('payment_status', enrollmentFilterStatus);
      }

      // Apply pagination
      const offset = (currentPage - 1) * enrollmentsPerPage;
      query = query.range(offset, offset + enrollmentsPerPage - 1);

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

      // Get total count of enrollments without CRM for pagination
      let allEnrollmentsQuery = supabase
        .from('enrollments')
        .select('chat_user_id')
        .not('chat_user_id', 'is', null);

      if (enrollmentFilterCourse !== 'all') {
        allEnrollmentsQuery = allEnrollmentsQuery.eq('course_id', enrollmentFilterCourse);
      }

      if (enrollmentFilterStatus !== 'all') {
        allEnrollmentsQuery = allEnrollmentsQuery.eq('payment_status', enrollmentFilterStatus);
      }

      const { data: allEnrollments } = await allEnrollmentsQuery;
      
      if (allEnrollments) {
        const allEnrollmentsWithCRM = await supabase
          .from('crm_notes')
          .select('user_id')
          .in('user_id', allEnrollments.map(e => e.chat_user_id).filter(Boolean));

        const allUserIdsWithCRM = new Set(allEnrollmentsWithCRM.data?.map(n => n.user_id) || []);
        const totalWithoutCRM = allEnrollments.filter(
          enrollment => enrollment.chat_user_id && !allUserIdsWithCRM.has(enrollment.chat_user_id)
        ).length;
        
        setTotalEnrollments(totalWithoutCRM);
      }

      setEnrollmentsWithoutCRM(enrollmentsWithoutCRMRecords);
    } catch (error) {
      console.error('Error fetching enrollments without CRM:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری ثبت‌نام‌های بدون CRM.",
        variant: "destructive"
      });
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleCreateCRMForEnrollment = async (enrollment: EnrollmentWithoutCRM) => {
    try {
      // Find the user in chatUsers array
      const user = chatUsers.find(u => u.id === enrollment.chat_user_id);
      
      if (!user) {
        toast({
          title: "خطا",
          description: "کاربر یافت نشد",
          variant: "destructive"
        });
        return;
      }

      // Set the selected user
      setSelectedUser(user);
      
      // Pre-fill the new note form with enrollment data
      setNewNote({
        type: 'note',
        content: `پیگیری ثبت‌نام ${enrollment.full_name} برای دوره ${enrollment.courses.title}`,
        course_id: enrollment.course_id,
        status: 'در انتظار پرداخت',
        user_id: user.id.toString()
      });

      // Open the add note dialog
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

  const addNote = async () => {
    console.log('Adding note with data:', newNote);
    
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
      
      // Close dialog
      setIsAddingNote(false);
      
      // Refresh data
      await fetchData();
      await fetchEnrollmentsWithoutCRM();
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'consultation':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabel = CRM_TYPES.find(t => t.value === type)?.label || type;
    return <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'موفق': 'default',
      'کنسل': 'destructive',
      'در انتظار پرداخت': 'secondary',
      'پاسخ نداده': 'outline',
      'امکان مکالمه نداشت': 'destructive'
    };
    
    return <Badge variant={variants[status] || 'default'} className="text-xs">{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'completed': 'default',
      'pending': 'secondary',
      'failed': 'destructive',
      'cancelled': 'destructive',
      'cancelled_payment': 'destructive'
    };
    
    const labels: Record<string, string> = {
      'completed': 'تکمیل شده',
      'pending': 'در انتظار',
      'failed': 'ناموفق',
      'cancelled': 'لغو شده',
      'cancelled_payment': 'لغو پرداخت'
    };
    
    return <Badge variant={variants[status] || 'default'} className="text-xs">{labels[status] || status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  // Apply filters
  const filteredNotes = notes.filter(note => {
    if (filterCourse !== 'all' && note.course_id !== filterCourse) return false;
    if (filterAgent !== 'all' && note.created_by !== filterAgent) return false;
    if (filterType !== 'all' && note.type !== filterType) return false;
    if (filterStatus !== 'all' && note.status !== filterStatus) return false;
    return true;
  });

  // Search users with debounce
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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
          {/* Enrollments without CRM - Always visible at the top */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                ثبت‌نام‌های بدون CRM
                {totalEnrollments > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {totalEnrollments}
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <Select value={enrollmentFilterCourse} onValueChange={setEnrollmentFilterCourse}>
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
                <Select value={enrollmentFilterStatus} onValueChange={setEnrollmentFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="همه وضعیت‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingEnrollments ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollmentsWithoutCRM.length === 0 ? (
                  <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p className="text-green-700 font-medium">
                      {enrollmentFilterCourse !== 'all' || enrollmentFilterStatus !== 'all'
                        ? 'هیچ ثبت‌نامی با فیلترهای انتخابی بدون CRM یافت نشد'
                        : 'همه ثبت‌نام‌ها دارای CRM هستند'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {isMobile ? (
                        enrollmentsWithoutCRM.map((enrollment) => (
                          <Card key={enrollment.id} className="border-orange-200 bg-orange-50">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{enrollment.full_name}</div>
                                  <Badge className="bg-orange-100 text-orange-800">
                                    نیاز به CRM
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div><span className="font-medium">دوره:</span> {enrollment.courses.title}</div>
                                  <div><span className="font-medium">تلفن:</span> {enrollment.phone}</div>
                                  <div><span className="font-medium">وضعیت:</span> {getPaymentStatusBadge(enrollment.payment_status)}</div>
                                  <div><span className="font-medium">مبلغ:</span> {formatPrice(enrollment.payment_amount)}</div>
                                  <div><span className="font-medium">تاریخ:</span> {formatDate(enrollment.created_at)}</div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateCRMForEnrollment(enrollment)}
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  ایجاد CRM
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="border border-orange-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-orange-50">
                              <TableRow>
                                <TableHead>نام</TableHead>
                                <TableHead>دوره</TableHead>
                                <TableHead>تلفن</TableHead>
                                <TableHead>وضعیت پرداخت</TableHead>
                                <TableHead>مبلغ</TableHead>
                                <TableHead>تاریخ ثبت‌نام</TableHead>
                                <TableHead>عملیات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {enrollmentsWithoutCRM.map((enrollment) => (
                                <TableRow key={enrollment.id} className="hover:bg-orange-50">
                                  <TableCell className="font-medium">{enrollment.full_name}</TableCell>
                                  <TableCell>{enrollment.courses.title}</TableCell>
                                  <TableCell>{enrollment.phone}</TableCell>
                                  <TableCell>{getPaymentStatusBadge(enrollment.payment_status)}</TableCell>
                                  <TableCell>{formatPrice(enrollment.payment_amount)}</TableCell>
                                  <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCreateCRMForEnrollment(enrollment)}
                                      className="bg-orange-600 hover:bg-orange-700"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      ایجاد CRM
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          نمایش {(currentPage - 1) * enrollmentsPerPage + 1} تا{' '}
                          {Math.min(currentPage * enrollmentsPerPage, totalEnrollments)} از {totalEnrollments} ثبت‌نام
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1 || loadingEnrollments}
                          >
                            <ChevronRight className="h-4 w-4 mr-2" />
                            قبلی
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            صفحه {currentPage} از {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || loadingEnrollments}
                          >
                            بعدی
                            <ChevronLeft className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* CRM Activities Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              فعالیت‌های CRM ({filteredNotes.length})
            </h3>
            
            {/* User Search Section */}
            <div className="border rounded-lg p-4 bg-muted/50 mb-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="text-sm font-medium">جستجو و انتخاب کاربر:</span>
                </div>
                
                {selectedUser ? (
                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium">{selectedUser.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.phone}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelectedUser}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="جستجو بر اساس نام یا شماره تلفن..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      dir="rtl"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => selectUser(user)}
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {isSearching && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg mt-1 p-3 text-center">
                        <div className="text-sm text-muted-foreground">در حال جستجو...</div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={openAddNoteDialog}
                  disabled={!selectedUser}
                  className="flex items-center gap-2 w-fit"
                >
                  <Plus className="w-4 h-4" />
                  افزودن یادداشت
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">فیلتر:</span>
              </div>
              
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دوره‌ها</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نماینده" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه نمایندگان</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  {CRM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  {CRM_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هیچ فعالیت CRM یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نوع</TableHead>
                      <TableHead className="text-right">کاربر</TableHead>
                      <TableHead className="text-right">دوره</TableHead>
                      <TableHead className="text-right">محتوا</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">نماینده</TableHead>
                      <TableHead className="text-right">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(note.type)}
                            {getTypeBadge(note.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{note.user_name}</span>
                            <span className="text-sm text-muted-foreground">{note.user_phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{note.course_title}</span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm leading-relaxed">{note.content}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(note.status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{note.created_by}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(note.created_at)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
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
