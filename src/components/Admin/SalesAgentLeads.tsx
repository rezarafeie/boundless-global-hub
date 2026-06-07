import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Mail, 
  MessageSquare,
  Search, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  User,
  FileText,
  RefreshCw,
  CreditCard,
  Key,
  Activity,
  DollarSign,
  X,
  Download,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import UserCRM from '@/components/Admin/UserProfile/UserCRM';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
import UserFinancialHistory from '@/components/Admin/UserProfile/UserFinancialHistory';

interface Lead {
  id: string;
  assignment_id: number;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  course_id: string;
  payment_amount: number;
  payment_status: string;
  assigned_at: string;
  chat_user_id: number | null;
  crm_status: 'none' | 'has_notes' | 'has_calls';
  latest_crm_status: string | null;
  last_activity: string | null;
  notes_count: number;
}

interface CRMNote {
  id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  created_by: string;
}

const CRM_TYPES = [
  { value: 'note', label: 'یادداشت' },
  { value: 'call', label: 'تماس' },
  { value: 'message', label: 'پیام' },
  { value: 'follow_up', label: 'پیگیری' },
];

const CRM_STATUSES = [
  { value: 'در انتظار پرداخت', label: 'در انتظار پرداخت' },
  { value: 'پاسخ نداده', label: 'پاسخ نداده' },
  { value: 'موفق', label: 'موفق' },
  { value: 'کنسل', label: 'کنسل' },
];

interface Course {
  id: string;
  title: string;
}

interface UserData {
  id: number;
  name: string;
  email?: string;
  phone: string;
  created_at: string;
  last_seen?: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  bedoun_marz_approved: boolean;
  signup_source?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  country_code?: string;
  [key: string]: any;
}

const SalesAgentLeads: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [crmFilter, setCrmFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>('all');
  const [excludeCourseFilter, setExcludeCourseFilter] = useState<string>('');
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Lead detail/CRM states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [crmNotes, setCrmNotes] = useState<CRMNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  
  // Add note states
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'call',
    status: 'در انتظار پرداخت'
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    contacted: 0,
    untouched: 0
  });

  const fetchLeads = async () => {
    if (!user?.messengerData?.id) return;
    
    setLoading(true);
    try {
      const chatUserId = user.messengerData.id;

      // First get the sales_agent_id for this user
      const { data: agentData, error: agentError } = await supabase
        .from('sales_agents')
        .select('id')
        .eq('user_id', chatUserId)
        .eq('is_active', true)
        .maybeSingle();

      if (agentError) throw agentError;
      
      if (!agentData) {
        console.log('No active sales agent found for user:', chatUserId);
        setLeads([]);
        setAllLeads([]);
        setStats({ total: 0, contacted: 0, untouched: 0 });
        setLoading(false);
        return;
      }

      const salesAgentId = agentData.id;
      console.log('Sales agent ID:', salesAgentId, 'for user:', chatUserId);

      // Fetch assignments for this agent
      const { data: assignments, error: assignError } = await supabase
        .from('lead_assignments')
        .select(`
          id,
          enrollment_id,
          assigned_at,
          enrollments!inner(
            id,
            full_name,
            email,
            phone,
            chat_user_id,
            payment_amount,
            payment_status,
            course_id,
            courses!inner(id, title)
          )
        `)
        .eq('sales_agent_id', salesAgentId)
        .order('assigned_at', { ascending: false });

      if (assignError) throw assignError;
      
      console.log('Found', assignments?.length || 0, 'lead assignments');

      // Extract unique courses from leads
      const courseMap = new Map<string, string>();
      assignments?.forEach(a => {
        const enrollment = a.enrollments as any;
        if (enrollment?.courses?.id && enrollment?.courses?.title) {
          courseMap.set(enrollment.courses.id, enrollment.courses.title);
        }
      });
      const uniqueCourses = Array.from(courseMap.entries()).map(([id, title]) => ({ id, title }));
      setCourses(uniqueCourses);

      // Get chat_user_ids for CRM lookup
      const chatUserIds = assignments
        ?.map(a => (a.enrollments as any)?.chat_user_id)
        .filter(Boolean) || [];

      // Fetch CRM notes with status
      const { data: crmData } = await supabase
        .from('crm_notes')
        .select('user_id, type, status, created_at')
        .in('user_id', chatUserIds)
        .order('created_at', { ascending: false });

      // Create CRM status map with latest status
      const crmMap = new Map<number, { count: number; hasCall: boolean; latestStatus: string | null }>();
      crmData?.forEach(note => {
        const current = crmMap.get(note.user_id) || { count: 0, hasCall: false, latestStatus: null };
        current.count++;
        if (note.type === 'call') current.hasCall = true;
        // Only set latestStatus once (first one is most recent due to order)
        if (!current.latestStatus && note.status) current.latestStatus = note.status;
        crmMap.set(note.user_id, current);
      });

      // Process leads
      const processedLeads: Lead[] = (assignments || []).map(a => {
        const enrollment = a.enrollments as any;
        const chatUserId = enrollment?.chat_user_id;
        const crmInfo = chatUserId ? crmMap.get(chatUserId) : null;
        
        let crmStatus: 'none' | 'has_notes' | 'has_calls' = 'none';
        if (crmInfo?.hasCall) crmStatus = 'has_calls';
        else if (crmInfo?.count && crmInfo.count > 0) crmStatus = 'has_notes';

        return {
          id: enrollment?.id || '',
          assignment_id: a.id,
          full_name: enrollment?.full_name || '',
          email: enrollment?.email || '',
          phone: enrollment?.phone || '',
          course_title: enrollment?.courses?.title || '',
          course_id: enrollment?.course_id || '',
          payment_amount: enrollment?.payment_amount || 0,
          payment_status: enrollment?.payment_status || 'pending',
          assigned_at: a.assigned_at,
          chat_user_id: chatUserId,
          crm_status: crmStatus,
          latest_crm_status: crmInfo?.latestStatus || null,
          last_activity: null,
          notes_count: crmInfo?.count || 0
        };
      });

      setAllLeads(processedLeads);

      // Update stats
      const contacted = processedLeads.filter(l => l.crm_status !== 'none').length;
      setStats({
        total: processedLeads.length,
        contacted,
        untouched: processedLeads.length - contacted
      });

    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری لیدها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses for exclude filter
  const fetchAllCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_active', true)
      .order('title');
    setAllCourses(data || []);
  };

  // State for users who purchased excluded course
  const [excludedUserIds, setExcludedUserIds] = React.useState<Set<number>>(new Set());

  // Fetch excluded course users when filter changes
  React.useEffect(() => {
    const fetchExcludedUsers = async () => {
      if (!excludeCourseFilter) {
        setExcludedUserIds(new Set());
        return;
      }
      
      const { data } = await supabase
        .from('enrollments')
        .select('chat_user_id')
        .eq('course_id', excludeCourseFilter)
        .in('payment_status', ['success', 'completed']);
      
      const ids = new Set<number>();
      data?.forEach(e => {
        if (e.chat_user_id) ids.add(e.chat_user_id);
      });
      setExcludedUserIds(ids);
    };
    
    fetchExcludedUsers();
  }, [excludeCourseFilter]);

  // Auto-load leads on mount
  React.useEffect(() => {
    if (user?.messengerData?.id) {
      fetchLeads();
      fetchAllCourses();
    }
  }, [user?.messengerData?.id]);

  // Apply filters whenever allLeads or filters change
  React.useEffect(() => {
    let filteredLeads = [...allLeads];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredLeads = filteredLeads.filter(l => 
        l.full_name.toLowerCase().includes(search) ||
        l.phone.includes(search) ||
        l.email.toLowerCase().includes(search)
      );
    }

    if (courseFilter !== 'all') {
      filteredLeads = filteredLeads.filter(l => l.course_id === courseFilter);
    }

    if (crmFilter === 'untouched') {
      filteredLeads = filteredLeads.filter(l => l.crm_status === 'none');
    } else if (crmFilter === 'contacted') {
      filteredLeads = filteredLeads.filter(l => l.crm_status !== 'none');
    }

    if (paymentStatusFilter !== 'all') {
      if (paymentStatusFilter === 'paid') {
        filteredLeads = filteredLeads.filter(l => l.payment_status === 'completed' || l.payment_status === 'success');
      } else if (paymentStatusFilter === 'pending') {
        filteredLeads = filteredLeads.filter(l => l.payment_status === 'pending');
      } else if (paymentStatusFilter === 'failed') {
        filteredLeads = filteredLeads.filter(l => l.payment_status === 'failed');
      }
    }

    // Apply CRM status filter
    if (crmStatusFilter !== 'all') {
      if (crmStatusFilter === 'no_crm') {
        filteredLeads = filteredLeads.filter(l => l.crm_status === 'none');
      } else {
        filteredLeads = filteredLeads.filter(l => l.latest_crm_status === crmStatusFilter);
      }
    }

    // Apply exclude course filter
    if (excludeCourseFilter && excludedUserIds.size > 0) {
      filteredLeads = filteredLeads.filter(l => !l.chat_user_id || !excludedUserIds.has(l.chat_user_id));
    }

    setLeads(filteredLeads);
  }, [allLeads, searchTerm, courseFilter, crmFilter, paymentStatusFilter, crmStatusFilter, excludeCourseFilter, excludedUserIds]);

  const openLeadDetail = async (lead: Lead) => {
    setSelectedLead(lead);
    setSelectedUser(null);
    setShowLeadDetail(true);
    
    if (lead.chat_user_id) {
      setUserLoading(true);
      setNotesLoading(true);
      try {
        // Fetch user data and CRM notes in parallel
        const [userResult, notesResult] = await Promise.all([
          supabase
            .from('chat_users')
            .select('*')
            .eq('id', lead.chat_user_id)
            .single(),
          supabase
            .from('crm_notes')
            .select('*')
            .eq('user_id', lead.chat_user_id)
            .order('created_at', { ascending: false })
        ]);
        
        if (userResult.data) {
          setSelectedUser(userResult.data as UserData);
        }
        setCrmNotes(notesResult.data || []);
      } catch (error) {
        console.error('Error fetching lead details:', error);
      } finally {
        setUserLoading(false);
        setNotesLoading(false);
      }
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">پرداخت شده</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">در انتظار</Badge>;
      case 'failed':
        return <Badge variant="destructive">ناموفق</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead?.chat_user_id || !newNote.content.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً محتوای یادداشت را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setNoteSubmitting(true);
    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: selectedLead.chat_user_id,
          content: newNote.content,
          type: newNote.type,
          status: newNote.status,
          created_by: user?.messengerData?.name || 'کارشناس'
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت ثبت شد"
      });

      setShowAddNote(false);
      setNewNote({ content: '', type: 'call', status: 'در انتظار پرداخت' });
      
      // Refresh notes
      if (selectedLead.chat_user_id) {
        const { data } = await supabase
          .from('crm_notes')
          .select('*')
          .eq('user_id', selectedLead.chat_user_id)
          .order('created_at', { ascending: false });
        setCrmNotes(data || []);
      }

      // Refresh leads list
      fetchLeads();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت یادداشت",
        variant: "destructive"
      });
    } finally {
      setNoteSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'yyyy/MM/dd HH:mm');
    } catch {
      return date;
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    return phone.startsWith('0') ? phone : `0${phone}`;
  };

  const getCRMStatusIcon = (status: string) => {
    switch (status) {
      case 'has_calls': return <span title="تماس گرفته شده">📞</span>;
      case 'has_notes': return <span title="یادداشت دارد">✅</span>;
      default: return <span title="بدون فعالیت">⚠️</span>;
    }
  };

  const getNoteTypeLabel = (type: string) => {
    return CRM_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل لیدهای من</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تماس گرفته شده</p>
                <p className="text-2xl font-bold">{stats.contacted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">بدون فعالیت</p>
                <p className="text-2xl font-bold">{stats.untouched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs text-muted-foreground mb-1 block">جستجو</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="نام، تلفن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1 block">دوره</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دوره‌ها</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1 block">وضعیت پرداخت</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="paid">پرداخت شده ✅</SelectItem>
                  <SelectItem value="pending">در انتظار ⏳</SelectItem>
                  <SelectItem value="failed">ناموفق ❌</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1 block">فعالیت CRM</Label>
              <Select value={crmFilter} onValueChange={setCrmFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="untouched">بدون فعالیت ⚠️</SelectItem>
                  <SelectItem value="contacted">تماس گرفته شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1 block">وضعیت CRM</Label>
              <Select value={crmStatusFilter} onValueChange={setCrmStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="no_crm">بدون CRM</SelectItem>
                  <SelectItem value="در انتظار پرداخت">در انتظار پرداخت</SelectItem>
                  <SelectItem value="پاسخ نداده">پاسخ نداده</SelectItem>
                  <SelectItem value="موفق">موفق</SelectItem>
                  <SelectItem value="کنسل">کنسل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">حذف خریداران دوره</Label>
              <Select value={excludeCourseFilter || "none"} onValueChange={(v) => setExcludeCourseFilter(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="بدون فیلتر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون فیلتر</SelectItem>
                  {allCourses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchLeads} disabled={loading} variant="outline" size="icon" title="بروزرسانی">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">CRM</TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>تلفن</TableHead>
                  <TableHead>دوره</TableHead>
                  <TableHead>وضعیت پرداخت</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تاریخ واگذاری</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      لیدی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map(lead => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openLeadDetail(lead)}>
                      <TableCell className="text-lg">
                        {getCRMStatusIcon(lead.crm_status)}
                      </TableCell>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>
                        <a 
                          href={`tel:${formatPhone(lead.phone)}`} 
                          className="flex items-center gap-1 text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          {formatPhone(lead.phone)}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{lead.course_title}</TableCell>
                      <TableCell>{getPaymentStatusBadge(lead.payment_status)}</TableCell>
                      <TableCell>{lead.payment_amount?.toLocaleString()} تومان</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(lead.assigned_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowAddNote(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Modal - Full Screen */}
      {showLeadDetail && (
        <div className="fixed inset-0 top-16 z-50 bg-background overflow-y-auto" dir="rtl">
          <div className="container mx-auto p-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-background py-2 border-b">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{selectedLead?.full_name}</h2>
                {selectedLead && (
                  <span className="mr-2">{getPaymentStatusBadge(selectedLead.payment_status)}</span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowLeadDetail(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {selectedLead && (
              <div className="space-y-4">
                {/* Quick Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${formatPhone(selectedLead.phone)}`} className="text-primary hover:underline text-sm">
                      {formatPhone(selectedLead.phone)}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{selectedLead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{selectedLead.course_title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedLead.payment_amount?.toLocaleString()} تومان</span>
                  </div>
                </div>

                {/* Add Note Button */}
                <Button 
                  onClick={() => setShowAddNote(true)}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  ثبت فعالیت جدید
                </Button>

                {/* User Details Tabs */}
                {userLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedUser ? (
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-6 h-auto">
                      <TabsTrigger value="overview" className="flex items-center gap-1 text-xs px-2 py-2">
                        <User className="h-3 w-3" />
                        <span className="hidden sm:inline">اطلاعات</span>
                      </TabsTrigger>
                      <TabsTrigger value="enrollments" className="flex items-center gap-1 text-xs px-2 py-2">
                        <CreditCard className="h-3 w-3" />
                        <span className="hidden sm:inline">ثبت‌نام‌ها</span>
                      </TabsTrigger>
                      <TabsTrigger value="licenses" className="flex items-center gap-1 text-xs px-2 py-2">
                        <Key className="h-3 w-3" />
                        <span className="hidden sm:inline">لایسنس‌ها</span>
                      </TabsTrigger>
                      <TabsTrigger value="crm" className="flex items-center gap-1 text-xs px-2 py-2">
                        <MessageSquare className="h-3 w-3" />
                        <span className="hidden sm:inline">CRM</span>
                      </TabsTrigger>
                      <TabsTrigger value="financials" className="flex items-center gap-1 text-xs px-2 py-2">
                        <DollarSign className="h-3 w-3" />
                        <span className="hidden sm:inline">مالی</span>
                      </TabsTrigger>
                      <TabsTrigger value="activity" className="flex items-center gap-1 text-xs px-2 py-2">
                        <Activity className="h-3 w-3" />
                        <span className="hidden sm:inline">فعالیت</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-4">
                      <UserOverview user={selectedUser} />
                    </TabsContent>
                    
                    <TabsContent value="enrollments" className="mt-4">
                      <UserEnrollments userId={selectedUser.id} />
                    </TabsContent>
                    
                    <TabsContent value="licenses" className="mt-4">
                      <UserLicenses userId={selectedUser.id} userPhone={selectedUser.phone} />
                    </TabsContent>
                    
                    <TabsContent value="crm" className="mt-4">
                      <UserCRM 
                        userId={selectedUser.id} 
                        userName={selectedUser.name}
                        userPhone={selectedUser.phone}
                        userEmail={selectedUser.email || ''}
                      />
                    </TabsContent>
                    
                    <TabsContent value="financials" className="mt-4">
                      <UserFinancialHistory userId={selectedUser.id} />
                    </TabsContent>
                    
                    <TabsContent value="activity" className="mt-4">
                      <UserActivity userId={selectedUser.id} />
                    </TabsContent>
                  </Tabs>
                ) : selectedLead.chat_user_id === null ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>این لید هنوز به کاربر پیام‌رسان متصل نشده است</p>
                    <p className="text-sm mt-2">اطلاعات کامل کاربر پس از ورود به سیستم پیام‌رسان در دسترس خواهد بود</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    خطا در بارگذاری اطلاعات کاربر
                  </div>
                )}
              </div>
            )}

            {/* Fixed Close Button at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setShowLeadDetail(false)}
              >
                <X className="h-4 w-4" />
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت فعالیت جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>نوع فعالیت</Label>
              <Select value={newNote.type} onValueChange={(v) => setNewNote(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>وضعیت</Label>
              <Select value={newNote.status} onValueChange={(v) => setNewNote(prev => ({ ...prev, status: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>توضیحات</Label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="توضیحات فعالیت..."
                rows={4}
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAddNote}
              disabled={noteSubmitting || !newNote.content.trim()}
            >
              {noteSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              ثبت فعالیت
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesAgentLeads;
