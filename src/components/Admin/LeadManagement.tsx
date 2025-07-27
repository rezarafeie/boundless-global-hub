import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';

interface Lead {
  enrollment_id: string;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
  is_assigned: boolean;
  assigned_to_agent: string | null;
}

interface Assignment {
  assignment_id: number;
  enrollment_id: string;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  payment_amount: number;
  assigned_at: string;
  status: string;
}

interface CRMNote {
  id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  created_by: string;
}

const LeadManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | Assignment | null>(null);
  const [crmNotes, setCrmNotes] = useState<CRMNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('call');
  const [leadStatus, setLeadStatus] = useState('در انتظار پرداخت');
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchLeads();
    fetchAssignments();
  }, []);

  const fetchLeads = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_courses_for_sales_agent', {
        agent_user_id: parseInt(user.id.toString())
      });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت لیدها",
        variant: "destructive"
      });
    }
  };

  const fetchAssignments = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_lead_assignments', {
        agent_user_id: parseInt(user.id.toString())
      });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت واگذاری‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLead = async (enrollmentId: string) => {
    if (!user?.id) return;
    
    setAssignLoading(enrollmentId);
    
    try {
      const { data, error } = await supabase.rpc('assign_lead_to_agent', {
        p_enrollment_id: enrollmentId,
        p_agent_user_id: parseInt(user.id.toString()),
        p_assigned_by: parseInt(user.id.toString())
      });

      if (error) throw error;
      
      if (data) {
        toast({
          title: "موفق",
          description: "لید با موفقیت واگذار شد",
        });
        await fetchLeads();
        await fetchAssignments();
      } else {
        toast({
          title: "خطا",
          description: "خطا در واگذاری لید",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: "خطا",
        description: "خطا در واگذاری لید",
        variant: "destructive"
      });
    } finally {
      setAssignLoading(null);
    }
  };

  const fetchCRMNotes = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrmNotes(data || []);
    } catch (error) {
      console.error('Error fetching CRM notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedLead || !user?.id) return;

    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert([{
          user_id: parseInt(user.id.toString()),
          content: newNote,
          type: noteType,
          status: leadStatus,
          created_by: user.name || 'Unknown'
        }]);

      if (error) throw error;

      setNewNote('');
      await fetchCRMNotes(parseInt(user.id.toString()));
      
      toast({
        title: "موفق",
        description: "یادداشت اضافه شد",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن یادداشت",
        variant: "destructive"
      });
    }
  };

  const openLeadDetail = async (lead: Lead | Assignment) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
    if (user?.id) {
      await fetchCRMNotes(parseInt(user.id.toString()));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const filteredLeads = leads.filter(lead => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) return true;
    return lead.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           lead.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           lead.phone.includes(debouncedSearchTerm);
  });

  const filteredAssignments = assignments.filter(assignment => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) return true;
    return assignment.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           assignment.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           assignment.phone.includes(debouncedSearchTerm);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-2">در حال بارگذاری...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            مدیریت لیدها
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="جستجو نام، ایمیل یا تلفن... (حداقل ۳ کاراکتر)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex rounded-md bg-muted p-1">
              <Button
                variant={activeTab === 'available' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('available')}
              >
                لیدهای موجود
              </Button>
              <Button
                variant={activeTab === 'assigned' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('assigned')}
              >
                واگذار شده‌ها
              </Button>
            </div>
          </div>
          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <p className="text-sm text-muted-foreground">حداقل ۳ کاراکتر برای جستجو وارد کنید</p>
          )}
        </CardHeader>
        <CardContent>
          {activeTab === 'available' ? (
            <div className="space-y-4">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm && searchTerm.length >= 3 ? 'هیچ لیدی یافت نشد' : 'هیچ لیدی یافت نشد'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نام و نام خانوادگی</TableHead>
                        <TableHead>ایمیل</TableHead>
                        <TableHead>تلفن</TableHead>
                        <TableHead>دوره</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>تاریخ ثبت‌نام</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.enrollment_id}>
                          <TableCell>{lead.full_name}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.phone}</TableCell>
                          <TableCell>{lead.course_title}</TableCell>
                          <TableCell>{formatPrice(lead.payment_amount)}</TableCell>
                          <TableCell>{formatDate(lead.created_at)}</TableCell>
                          <TableCell>
                            {lead.is_assigned ? (
                              <Badge variant="secondary">
                                واگذار شده به {lead.assigned_to_agent}
                              </Badge>
                            ) : (
                              <Badge variant="outline">موجود</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLeadDetail(lead)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!lead.is_assigned && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAssignLead(lead.enrollment_id)}
                                  disabled={assignLoading === lead.enrollment_id}
                                >
                                  {assignLoading === lead.enrollment_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="h-4 w-4" />
                                  )}
                                  واگذاری
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm && searchTerm.length >= 3 ? 'هیچ واگذاری یافت نشد' : 'هیچ واگذاری یافت نشد'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نام و نام خانوادگی</TableHead>
                        <TableHead>ایمیل</TableHead>
                        <TableHead>تلفن</TableHead>
                        <TableHead>دوره</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>تاریخ واگذاری</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignments.map((assignment) => (
                        <TableRow key={assignment.assignment_id}>
                          <TableCell>{assignment.full_name}</TableCell>
                          <TableCell>{assignment.email}</TableCell>
                          <TableCell>{assignment.phone}</TableCell>
                          <TableCell>{assignment.course_title}</TableCell>
                          <TableCell>{formatPrice(assignment.payment_amount)}</TableCell>
                          <TableCell>{formatDate(assignment.assigned_at)}</TableCell>
                          <TableCell>
                            <Badge variant="default">{assignment.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openLeadDetail(assignment)}
                            >
                              <Eye className="h-4 w-4" />
                              مشاهده
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={isLeadDetailOpen} onOpenChange={setIsLeadDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>جزئیات لید</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">اطلاعات کاربر</h3>
                  <div className="space-y-1">
                    <p><strong>نام:</strong> {selectedLead.full_name}</p>
                    <p><strong>ایمیل:</strong> {selectedLead.email}</p>
                    <p><strong>تلفن:</strong> {selectedLead.phone}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">اطلاعات ثبت‌نام</h3>
                  <div className="space-y-1">
                    <p><strong>دوره:</strong> {selectedLead.course_title}</p>
                    <p><strong>مبلغ:</strong> {formatPrice(selectedLead.payment_amount)}</p>
                    <p><strong>تاریخ:</strong> {formatDate('created_at' in selectedLead ? selectedLead.created_at : selectedLead.assigned_at)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">افزودن یادداشت CRM</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger>
                      <SelectValue placeholder="نوع یادداشت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">تماس</SelectItem>
                      <SelectItem value="email">ایمیل</SelectItem>
                      <SelectItem value="meeting">جلسه</SelectItem>
                      <SelectItem value="note">یادداشت</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={leadStatus} onValueChange={setLeadStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="وضعیت لید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="در انتظار پرداخت">در انتظار پرداخت</SelectItem>
                      <SelectItem value="پرداخت شده">پرداخت شده</SelectItem>
                      <SelectItem value="لغو شده">لغو شده</SelectItem>
                      <SelectItem value="در حال پیگیری">در حال پیگیری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="متن یادداشت..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  افزودن یادداشت
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">تاریخچه یادداشت‌ها</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {crmNotes.length === 0 ? (
                    <p className="text-muted-foreground">هیچ یادداشتی یافت نشد</p>
                  ) : (
                    crmNotes.map((note) => (
                      <div key={note.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{note.type}</Badge>
                            <Badge variant="secondary">{note.status}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(note.created_at)} - {note.created_by}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagement;
