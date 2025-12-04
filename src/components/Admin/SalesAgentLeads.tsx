import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  Mail, 
  MessageSquare,
  Search, 
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';

interface Lead {
  id: string;
  assignment_id: number;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  payment_amount: number;
  assigned_at: string;
  chat_user_id: number | null;
  crm_status: 'none' | 'has_notes' | 'has_calls';
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

const SalesAgentLeads: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [crmFilter, setCrmFilter] = useState<string>('all');
  
  // Lead detail/CRM states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (user?.messengerData?.id) {
      fetchLeads();
    }
  }, [user?.messengerData?.id, debouncedSearch, crmFilter]);

  const fetchLeads = async () => {
    if (!user?.messengerData?.id) return;
    
    setLoading(true);
    try {
      const agentId = user.messengerData.id;

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
            courses!inner(title)
          )
        `)
        .eq('sales_agent_id', agentId)
        .order('assigned_at', { ascending: false });

      if (assignError) throw assignError;

      // Get chat_user_ids for CRM lookup
      const chatUserIds = assignments
        ?.map(a => (a.enrollments as any)?.chat_user_id)
        .filter(Boolean) || [];

      // Fetch CRM notes counts
      const { data: crmData } = await supabase
        .from('crm_notes')
        .select('user_id, type')
        .in('user_id', chatUserIds);

      // Create CRM status map
      const crmMap = new Map<number, { count: number; hasCall: boolean }>();
      crmData?.forEach(note => {
        const current = crmMap.get(note.user_id) || { count: 0, hasCall: false };
        current.count++;
        if (note.type === 'call') current.hasCall = true;
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
          payment_amount: enrollment?.payment_amount || 0,
          assigned_at: a.assigned_at,
          chat_user_id: chatUserId,
          crm_status: crmStatus,
          last_activity: null,
          notes_count: crmInfo?.count || 0
        };
      });

      // Apply filters
      let filteredLeads = processedLeads;

      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        filteredLeads = filteredLeads.filter(l => 
          l.full_name.toLowerCase().includes(search) ||
          l.phone.includes(search) ||
          l.email.toLowerCase().includes(search)
        );
      }

      if (crmFilter === 'untouched') {
        filteredLeads = filteredLeads.filter(l => l.crm_status === 'none');
      } else if (crmFilter === 'contacted') {
        filteredLeads = filteredLeads.filter(l => l.crm_status !== 'none');
      }

      setLeads(filteredLeads);

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

  const openLeadDetail = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
    
    if (lead.chat_user_id) {
      setNotesLoading(true);
      try {
        const { data } = await supabase
          .from('crm_notes')
          .select('*')
          .eq('user_id', lead.chat_user_id)
          .order('created_at', { ascending: false });
        
        setCrmNotes(data || []);
      } catch (error) {
        console.error('Error fetching CRM notes:', error);
      } finally {
        setNotesLoading(false);
      }
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
          <div className="flex gap-3 items-end">
            <div className="flex-1">
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
            <div className="w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">وضعیت CRM</Label>
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
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تاریخ واگذاری</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
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

      {/* Lead Detail Modal */}
      <Dialog open={showLeadDetail} onOpenChange={setShowLeadDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedLead?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${formatPhone(selectedLead.phone)}`} className="text-primary hover:underline">
                    {formatPhone(selectedLead.phone)}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedLead.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedLead.course_title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(selectedLead.assigned_at)}</span>
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

              {/* CRM Notes */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  سابقه فعالیت‌ها
                </h4>
                
                {notesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : crmNotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    هنوز فعالیتی ثبت نشده است
                  </p>
                ) : (
                  <div className="space-y-3">
                    {crmNotes.map(note => (
                      <div key={note.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{getNoteTypeLabel(note.type)}</Badge>
                            <Badge variant="outline">{note.status}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          ثبت توسط: {note.created_by}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
