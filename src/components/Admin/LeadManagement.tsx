
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserPlus, Eye, Phone, Mail, Calendar, Filter, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EnrollmentCRM } from '@/components/Admin/EnrollmentCRM';

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  payment_amount: number;
  payment_status: string;
  created_at: string;
  course_id: string;
  course_title: string;
  chat_user_id: number;
  assigned_agent?: {
    id: number;
    name: string;
    phone: string;
  };
  assignment_id?: string;
}

interface SalesAgent {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCRMDialogOpen, setIsCRMDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user's role to determine what leads to show
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user?.id || 0)
        .eq('is_active', true);

      const isAdmin = userRoles?.some(role => role.role_name === 'admin');
      const isSalesAgent = userRoles?.some(role => role.role_name === 'sales_agent');

      let leadsQuery = supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          phone,
          email,
          payment_amount,
          payment_status,
          created_at,
          course_id,
          chat_user_id,
          courses(title)
        `)
        .in('payment_status', ['pending', 'completed', 'success']);

      const { data: enrollments, error: enrollmentsError } = await leadsQuery
        .order('created_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Get lead assignments - use direct query since RPC doesn't exist
      const { data: assignments } = await supabase
        .from('lead_assignments')
        .select(`
          id,
          enrollment_id,
          sales_agent_id,
          chat_users!sales_agent_id(id, name, phone)
        `);

      // Combine data
      const enrichedLeads = enrollments?.map(enrollment => {
        const assignment = assignments?.find(a => a.enrollment_id === enrollment.id);
        return {
          id: enrollment.id,
          full_name: enrollment.full_name,
          phone: enrollment.phone,
          email: enrollment.email,
          payment_amount: enrollment.payment_amount,
          payment_status: enrollment.payment_status,
          created_at: enrollment.created_at,
          course_id: enrollment.course_id,
          course_title: enrollment.courses?.title || 'نامشخص',
          chat_user_id: enrollment.chat_user_id,
          assigned_agent: assignment?.chat_users || undefined,
          assignment_id: assignment?.id || undefined
        };
      }) || [];

      setLeads(enrichedLeads);

      // Fetch sales agents
      const { data: agents } = await supabase
        .from('chat_users')
        .select('id, name, phone, email')
        .eq('is_approved', true);

      const { data: salesAgentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_name', 'sales_agent')
        .eq('is_active', true);

      const salesAgentIds = salesAgentRoles?.map(r => r.user_id) || [];
      const salesAgentsData = agents?.filter(agent => salesAgentIds.includes(agent.id)) || [];
      setSalesAgents(salesAgentsData);

      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      setCourses(coursesData || []);

    } catch (error) {
      console.error('Error fetching lead data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داده‌های لیدها.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLead = async () => {
    if (!selectedLead || !selectedAgent) return;

    try {
      const { error } = await supabase
        .from('lead_assignments')
        .insert({
          enrollment_id: selectedLead.id,
          sales_agent_id: parseInt(selectedAgent),
          assigned_by: user?.id || 0,
          notes: assignmentNotes || null
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "لید با موفقیت اختصاص داده شد."
      });

      setIsAssignDialogOpen(false);
      setSelectedLead(null);
      setSelectedAgent('');
      setAssignmentNotes('');
      fetchData();
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: "خطا",
        description: "خطا در اختصاص لید.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'completed': 'default',
      'success': 'default',
      'pending': 'secondary',
      'cancelled_payment': 'destructive'
    };
    
    const labels: Record<string, string> = {
      'completed': 'تکمیل شده',
      'success': 'موفق',
      'pending': 'در انتظار',
      'cancelled_payment': 'لغو شده'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.payment_status !== filterStatus) return false;
    if (filterCourse !== 'all' && lead.course_id !== filterCourse) return false;
    if (searchTerm && !lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !lead.phone.includes(searchTerm) && !lead.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

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
          <div className="flex flex-col gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              مدیریت لیدها ({filteredLeads.length})
            </CardTitle>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">فیلتر:</span>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="success">موفق</SelectItem>
                </SelectContent>
              </Select>
              
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
              
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو بر اساس نام، تلفن یا ایمیل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ لیدی یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام و نام خانوادگی</TableHead>
                    <TableHead className="text-right">تماس</TableHead>
                    <TableHead className="text-right">دوره</TableHead>
                    <TableHead className="text-right">مبلغ</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">نماینده فروش</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.full_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{lead.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{lead.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{lead.course_title}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{formatCurrency(lead.payment_amount)}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lead.payment_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(lead.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.assigned_agent ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{lead.assigned_agent.name}</span>
                            <span className="text-xs text-muted-foreground">{lead.assigned_agent.phone}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">اختصاص داده نشده</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!lead.assigned_agent && (
                            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedLead(lead)}
                                  className="flex items-center gap-1"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  اختصاص
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>اختصاص لید</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4" dir="rtl">
                                  <div className="p-3 bg-muted rounded-lg">
                                    <div className="font-medium">{selectedLead?.full_name}</div>
                                    <div className="text-sm text-muted-foreground">{selectedLead?.phone}</div>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="agent">نماینده فروش</Label>
                                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="انتخاب نماینده فروش" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {salesAgents.map(agent => (
                                          <SelectItem key={agent.id} value={agent.id.toString()}>
                                            {agent.name} ({agent.phone})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="notes">یادداشت (اختیاری)</Label>
                                    <Textarea
                                      id="notes"
                                      placeholder="یادداشت برای اختصاص..."
                                      value={assignmentNotes}
                                      onChange={(e) => setAssignmentNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                                      لغو
                                    </Button>
                                    <Button 
                                      onClick={handleAssignLead}
                                      disabled={!selectedAgent}
                                    >
                                      اختصاص لید
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsCRMDialogOpen(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            مشاهده
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRM Dialog */}
      <Dialog open={isCRMDialogOpen} onOpenChange={setIsCRMDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات لید و CRM</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <EnrollmentCRM 
              userId={selectedLead.chat_user_id}
              userInfo={{
                name: selectedLead.full_name,
                phone: selectedLead.phone,
                email: selectedLead.email
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
