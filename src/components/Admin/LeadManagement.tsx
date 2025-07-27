
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
  Loader2,
  BarChart3,
  TrendingUp,
  Target,
  Award
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

interface AdminLead {
  enrollment_id: string;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  payment_amount: number;
  payment_status: string;
  created_at: string;
  assigned_to_agent: string | null;
  assignment_status: string | null;
  assigned_at: string | null;
}

interface AgentSummary {
  agent_id: number;
  agent_name: string;
  total_leads: number;
  total_calls: number;
  total_sales: number;
  total_sales_amount: number;
  conversion_rate: number;
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
  const [adminLeads, setAdminLeads] = useState<AdminLead[]>([]);
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'admin'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | Assignment | AdminLead | null>(null);
  const [crmNotes, setCrmNotes] = useState<CRMNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('call');
  const [leadStatus, setLeadStatus] = useState('در انتظار پرداخت');
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    checkAdminRole();
    fetchLeads();
    fetchAssignments();
    if (isAdmin) {
      fetchAdminLeads();
      fetchAgentSummaries();
    }
  }, [isAdmin]);

  const checkAdminRole = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('is_messenger_admin')
        .eq('id', Number(user.id))
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_messenger_admin || false);
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const fetchLeads = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_courses_for_sales_agent', {
        agent_user_id: Number(user.id)
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
        agent_user_id: Number(user.id)
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

  const fetchAdminLeads = async () => {
    setAdminLoading(true);
    try {
      console.log('Fetching admin leads...');
      
      // First get all enrollments with successful payments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          email,
          phone,
          payment_amount,
          payment_status,
          created_at,
          course_id
        `)
        .in('payment_status', ['success', 'completed'])
        .order('created_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        throw enrollmentsError;
      }

      console.log('Enrollments fetched:', enrollmentsData?.length || 0);

      if (!enrollmentsData || enrollmentsData.length === 0) {
        setAdminLeads([]);
        return;
      }

      // Get course information
      const courseIds = [...new Set(enrollmentsData.map(e => e.course_id))];
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        throw coursesError;
      }

      // Get lead assignments
      const enrollmentIds = enrollmentsData.map(e => e.id);
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('lead_assignments')
        .select(`
          enrollment_id,
          status,
          assigned_at,
          sales_agent_id
        `)
        .in('enrollment_id', enrollmentIds);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }

      // Get sales agents information
      const agentIds = assignmentsData?.map(a => a.sales_agent_id).filter(Boolean) || [];
      let agentsData: any[] = [];
      if (agentIds.length > 0) {
        const { data: salesAgentsData, error: salesAgentsError } = await supabase
          .from('sales_agents')
          .select(`
            id,
            user_id
          `)
          .in('id', agentIds);

        if (salesAgentsError) {
          console.error('Error fetching sales agents:', salesAgentsError);
        } else {
          const userIds = salesAgentsData?.map(sa => sa.user_id).filter(Boolean) || [];
          if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('chat_users')
              .select('id, name')
              .in('id', userIds);

            if (usersError) {
              console.error('Error fetching users:', usersError);
            } else {
              agentsData = salesAgentsData?.map(sa => ({
                ...sa,
                user: usersData?.find(u => u.id === sa.user_id)
              })) || [];
            }
          }
        }
      }

      // Create lookup maps
      const courseMap = new Map(coursesData?.map(c => [c.id, c]) || []);
      const assignmentMap = new Map(assignmentsData?.map(a => [a.enrollment_id, a]) || []);
      const agentMap = new Map(agentsData.map(a => [a.id, a]));

      // Format the data for the UI
      const formattedLeads: AdminLead[] = enrollmentsData.map(enrollment => {
        const course = courseMap.get(enrollment.course_id);
        const assignment = assignmentMap.get(enrollment.id);
        const agent = assignment ? agentMap.get(assignment.sales_agent_id) : null;

        return {
          enrollment_id: enrollment.id,
          full_name: enrollment.full_name,
          email: enrollment.email,
          phone: enrollment.phone,
          course_title: course?.title || 'نامشخص',
          payment_amount: enrollment.payment_amount,
          payment_status: enrollment.payment_status,
          created_at: enrollment.created_at,
          assigned_to_agent: agent?.user?.name || null,
          assignment_status: assignment?.status || null,
          assigned_at: assignment?.assigned_at || null
        };
      });

      console.log('Formatted leads:', formattedLeads.length);
      setAdminLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching admin leads:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت لیدهای ادمین",
        variant: "destructive"
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAgentSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_agents')
        .select(`
          id,
          user_id,
          is_active
        `)
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        setAgentSummaries([]);
        return;
      }

      // Get user names
      const userIds = data.map(agent => agent.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('chat_users')
        .select('id, name')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      const userMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Get assignments for each agent
      const agentIds = data.map(agent => agent.id);
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('lead_assignments')
        .select(`
          sales_agent_id,
          enrollment_id
        `)
        .in('sales_agent_id', agentIds);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }

      // Get enrollment data for sales calculations
      const enrollmentIds = assignmentsData?.map(a => a.enrollment_id) || [];
      let enrollmentsData: any[] = [];
      if (enrollmentIds.length > 0) {
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select('id, payment_amount, payment_status')
          .in('id', enrollmentIds);

        if (enrollError) {
          console.error('Error fetching enrollments:', enrollError);
        } else {
          enrollmentsData = enrollData || [];
        }
      }

      const enrollmentMap = new Map(enrollmentsData.map(e => [e.id, e]));

      // Calculate summaries for each agent
      const summaries: AgentSummary[] = await Promise.all(
        data.map(async (agent) => {
          const user = userMap.get(agent.user_id);
          const agentAssignments = assignmentsData?.filter(a => a.sales_agent_id === agent.id) || [];
          
          // Get CRM notes count for calls
          const { data: crmData, error: crmError } = await supabase
            .from('crm_notes')
            .select('id')
            .eq('user_id', agent.user_id)
            .eq('type', 'call');

          if (crmError) {
            console.error('Error fetching CRM notes:', crmError);
          }

          const totalLeads = agentAssignments.length;
          const totalCalls = crmData?.length || 0;
          
          // Calculate sales
          const completedSales = agentAssignments.filter(assignment => {
            const enrollment = enrollmentMap.get(assignment.enrollment_id);
            return enrollment && ['success', 'completed'].includes(enrollment.payment_status);
          }).length;

          const totalSalesAmount = agentAssignments.reduce((sum, assignment) => {
            const enrollment = enrollmentMap.get(assignment.enrollment_id);
            if (enrollment && ['success', 'completed'].includes(enrollment.payment_status)) {
              return sum + (enrollment.payment_amount || 0);
            }
            return sum;
          }, 0);

          const conversionRate = totalLeads > 0 ? (completedSales / totalLeads) * 100 : 0;

          return {
            agent_id: agent.id,
            agent_name: user?.name || 'نامشخص',
            total_leads: totalLeads,
            total_calls: totalCalls,
            total_sales: completedSales,
            total_sales_amount: totalSalesAmount,
            conversion_rate: conversionRate
          };
        })
      );

      setAgentSummaries(summaries);
    } catch (error) {
      console.error('Error fetching agent summaries:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت خلاصه نمایندگان",
        variant: "destructive"
      });
    }
  };

  const handleAssignLead = async (enrollmentId: string) => {
    if (!user?.id) return;
    
    setAssignLoading(enrollmentId);
    
    try {
      const { data, error } = await supabase.rpc('assign_lead_to_agent', {
        p_enrollment_id: enrollmentId,
        p_agent_user_id: Number(user.id),
        p_assigned_by: Number(user.id)
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
          user_id: Number(user.id),
          content: newNote,
          type: noteType,
          status: leadStatus,
          created_by: user.name || 'Unknown'
        }]);

      if (error) throw error;

      setNewNote('');
      await fetchCRMNotes(Number(user.id));
      
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

  const openLeadDetail = async (lead: Lead | Assignment | AdminLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
    if (user?.id) {
      await fetchCRMNotes(Number(user.id));
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

  const filteredAdminLeads = adminLeads.filter(lead => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) return true;
    return lead.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           lead.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           lead.phone.includes(debouncedSearchTerm) ||
           (lead.assigned_to_agent && lead.assigned_to_agent.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
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
              {isAdmin && (
                <Button
                  variant={activeTab === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('admin')}
                >
                  مدیریت ادمین
                </Button>
              )}
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
          ) : activeTab === 'assigned' ? (
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
          ) : (
            <div className="space-y-6">
              {/* Agent Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentSummaries.map((summary) => (
                  <Card key={summary.agent_id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        {summary.agent_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-sm">لیدها:</span>
                        </div>
                        <Badge variant="secondary">{summary.total_leads}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">تماس‌ها:</span>
                        </div>
                        <Badge variant="secondary">{summary.total_calls}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">فروش:</span>
                        </div>
                        <Badge variant="secondary">{summary.total_sales}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm">مبلغ:</span>
                        </div>
                        <Badge variant="secondary">{formatPrice(summary.total_sales_amount)}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">تبدیل:</span>
                        </div>
                        <Badge variant="secondary">{summary.conversion_rate.toFixed(1)}%</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* All Leads Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    تمام لیدها
                    {adminLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {adminLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="mr-2">در حال بارگذاری لیدها...</span>
                    </div>
                  ) : filteredAdminLeads.length === 0 ? (
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
                            <TableHead>نماینده</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAdminLeads.map((lead) => (
                            <TableRow key={lead.enrollment_id}>
                              <TableCell>{lead.full_name}</TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>{lead.phone}</TableCell>
                              <TableCell>{lead.course_title}</TableCell>
                              <TableCell>{formatPrice(lead.payment_amount)}</TableCell>
                              <TableCell>{formatDate(lead.created_at)}</TableCell>
                              <TableCell>
                                {lead.assigned_to_agent ? (
                                  <Badge variant="secondary">{lead.assigned_to_agent}</Badge>
                                ) : (
                                  <Badge variant="outline">واگذار نشده</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="default">
                                  {lead.assignment_status || 'واگذار نشده'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openLeadDetail(lead)}
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
                </CardContent>
              </Card>
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
                    <p><strong>تاریخ:</strong> {formatDate('created_at' in selectedLead ? selectedLead.created_at : 'assigned_at' in selectedLead ? selectedLead.assigned_at : '')}</p>
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
