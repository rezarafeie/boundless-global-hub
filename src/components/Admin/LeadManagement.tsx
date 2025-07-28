import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Award,
  Plus,
  FileText,
  MessageSquare,
  Share2,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';
import LeadDistributionSystem from './LeadDistributionSystem';

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
  course_id: string;
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
  total_leads: number; // Assigned leads from admin
  delegated_leads: number; // Leads delegated by agent to himself
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
  courses?: {
    title: string;
    slug: string;
  } | null;
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

const LeadManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [adminLeads, setAdminLeads] = useState<AdminLead[]>([]);
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([]);
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'admin' | 'distribution'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | Assignment | AdminLead | null>(null);
  const [crmNotes, setCrmNotes] = useState<CRMNote[]>([]);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  // Filter states for admin leads
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [agents, setAgents] = useState<{ id: number; name: string }[]>([]);
  
  // CRM popup states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'note',
    status: 'در انتظار پرداخت',
    course_id: 'none'
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 150);

  useEffect(() => {
    checkAdminRole();
    fetchLeads();
    fetchAssignments();
    fetchCourses();
    fetchAgents();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedAgent, debouncedSearchTerm]);

  // Separate useEffect for admin leads that reacts to filter changes
  useEffect(() => {
    if (isAdmin) {
      fetchAdminLeads(currentPage);
      fetchAgentSummaries();
    }
  }, [isAdmin, currentPage, selectedCourse, selectedAgent, debouncedSearchTerm]);

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

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_agents')
        .select(`
          id,
          user_id,
          chat_users!inner(name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      
      const agentsData = data?.map(agent => ({
        id: agent.id,
        name: (agent as any).chat_users.name
      })) || [];
      
      setAgents(agentsData);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

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

  const fetchAdminLeads = async (page: number = 1) => {
    setAdminLoading(true);
    try {
      console.log('Fetching admin leads for page:', page, 'Course:', selectedCourse, 'Agent:', selectedAgent);
      
      // Build the query with filters
      let countQuery = supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .in('payment_status', ['success', 'completed']);

      // Apply course filter if selected
      if (selectedCourse !== 'all') {
        countQuery = countQuery.eq('course_id', selectedCourse);
      }

      // Apply search filter if provided
      if (debouncedSearchTerm) {
        countQuery = countQuery.or(`full_name.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
      }

      // For agent filter, we need to check if we're filtering by assigned/unassigned
      // Since agent filtering requires joining with lead_assignments, we'll handle this after getting basic count
      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Error counting enrollments:', countError);
        throw countError;
      }

      // For now, use the base count - we'll refine this if agent filtering is needed
      let totalCount = count || 0;

      setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));
      
      // Build the main query with filters
      let enrollmentsQuery = supabase
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
        .in('payment_status', ['success', 'completed']);

      // Apply course filter if selected
      if (selectedCourse !== 'all') {
        enrollmentsQuery = enrollmentsQuery.eq('course_id', selectedCourse);
      }

      // Apply search filter if provided
      if (debouncedSearchTerm) {
        enrollmentsQuery = enrollmentsQuery.or(`full_name.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
      }

      const { data: enrollmentsData, error: enrollmentsError } = await enrollmentsQuery
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

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
      let formattedLeads: AdminLead[] = enrollmentsData.map(enrollment => {
        const course = courseMap.get(enrollment.course_id);
        const assignment = assignmentMap.get(enrollment.id);
        const agent = assignment ? agentMap.get(assignment.sales_agent_id) : null;

        return {
          enrollment_id: enrollment.id,
          full_name: enrollment.full_name,
          email: enrollment.email,
          phone: enrollment.phone,
          course_id: enrollment.course_id,
          course_title: course?.title || 'نامشخص',
          payment_amount: enrollment.payment_amount,
          payment_status: enrollment.payment_status,
          created_at: enrollment.created_at,
          assigned_to_agent: agent?.user?.name || null,
          assignment_status: assignment?.status || null,
          assigned_at: assignment?.assigned_at || null
        };
      });

      // Apply agent filter after formatting (since it requires assignment data)
      if (selectedAgent !== 'all') {
        if (selectedAgent === 'unassigned') {
          // Only show unassigned leads
          formattedLeads = formattedLeads.filter(lead => !lead.assigned_to_agent);
        } else {
          // Show only leads assigned to the specific agent
          formattedLeads = formattedLeads.filter(lead => 
            lead.assigned_to_agent && lead.assigned_to_agent.includes(selectedAgent)
          );
        }
        
        // Update pagination based on filtered results
        const filteredCount = formattedLeads.length;
        setTotalPages(Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE)));
      }

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
      console.log('Fetching agent summaries...');
      
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
        console.log('No active sales agents found');
        setAgentSummaries([]);
        return;
      }

      console.log('Found agents:', data.length);

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

      // Debug: Check what agents we have
      console.log('Sales agents:', data.map(a => ({ id: a.id, user_id: a.user_id, name: userMap.get(a.user_id)?.name })));

      // Get ALL leads (total available leads) - not just assigned ones
      const { data: totalLeadsData, error: totalLeadsError } = await supabase
        .from('enrollments')
        .select('id, payment_amount, payment_status')
        .in('payment_status', ['success', 'completed']);

      if (totalLeadsError) {
        console.error('Error fetching total leads:', totalLeadsError);
      }

      const totalAvailableLeads = totalLeadsData?.length || 0;
      console.log('Total available leads:', totalAvailableLeads);

      // Get assignments for each agent
      const agentIds = data.map(agent => agent.id);
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('lead_assignments')
        .select(`
          sales_agent_id,
          enrollment_id,
          status,
          assigned_at
        `)
        .in('sales_agent_id', agentIds);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }

      console.log('Found assignments:', assignmentsData?.length || 0);

      // Get enrollment data for assigned leads only
      const enrollmentIds = assignmentsData?.map(a => a.enrollment_id) || [];
      let enrollmentsData: any[] = [];
      if (enrollmentIds.length > 0) {
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select('id, payment_amount, payment_status, chat_user_id')
          .in('id', enrollmentIds);

        if (enrollError) {
          console.error('Error fetching enrollments:', enrollError);
        } else {
          enrollmentsData = enrollData || [];
        }
      }

      const enrollmentMap = new Map(enrollmentsData.map(e => [e.id, e]));

      // Get all CRM notes for call tracking
      const { data: allCrmData, error: crmError } = await supabase
        .from('crm_notes')
        .select('id, user_id, type, created_by')
        .eq('type', 'call');

      if (crmError) {
        console.error('Error fetching CRM notes:', crmError);
      }

      // Calculate summaries for each agent
      const summaries: AgentSummary[] = data.map((agent) => {
        const user = userMap.get(agent.user_id);
        const agentAssignments = assignmentsData?.filter(a => a.sales_agent_id === agent.id) || [];
        
        console.log(`Agent ${user?.name || 'Unknown'} (ID: ${agent.id}) assignments:`, agentAssignments);
        
        // Count calls made by this agent (using agent's name in created_by)
        const agentName = user?.name || '';
        const totalCalls = allCrmData?.filter(crm => 
          crm.created_by === agentName
        ).length || 0;
        
        // Assigned leads count
        const assignedLeads = agentAssignments.length;
        console.log(`Agent ${agentName}: assigned leads count = ${assignedLeads}`);
        
        // Calculate sales from assigned leads
        const completedSales = agentAssignments.filter(assignment => {
          const enrollment = enrollmentMap.get(assignment.enrollment_id);
          return enrollment && ['success', 'completed'].includes(enrollment.payment_status);
        }).length;

        const totalSalesAmount = agentAssignments.reduce((sum, assignment) => {
          const enrollment = enrollmentMap.get(assignment.enrollment_id);
          if (enrollment && ['success', 'completed'].includes(enrollment.payment_status)) {
            return sum + (Number(enrollment.payment_amount) || 0);
          }
          return sum;
        }, 0);

        const conversionRate = assignedLeads > 0 ? (completedSales / assignedLeads) * 100 : 0;

        console.log(`Agent ${agentName}: total_leads=${totalAvailableLeads}, assigned=${assignedLeads}, calls=${totalCalls}, sales=${completedSales}, amount=${totalSalesAmount}`);

        return {
          agent_id: agent.id,
          agent_name: agentName || 'نامشخص',
          total_leads: assignedLeads, // Show only assigned leads
          delegated_leads: assignedLeads, // For now, same as assigned (can be modified later for self-delegation logic)
          total_calls: totalCalls,
          total_sales: completedSales,
          total_sales_amount: totalSalesAmount,
          conversion_rate: conversionRate
        };
      });

      console.log('Agent summaries calculated:', summaries);
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
      setCrmNotes(data || []);
    } catch (error) {
      console.error('Error fetching CRM notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim() || !selectedLead || !user?.id) return;

    // Get user ID from selected lead
    let targetUserId: number;
    
    // Try to find the user in chat_users table using email or phone
    try {
      const { data: userData, error: userError } = await supabase
        .from('chat_users')
        .select('id')
        .or(`email.eq.${selectedLead.email},phone.eq.${selectedLead.phone}`)
        .single();

      if (userError || !userData) {
        toast({
          title: "خطا",
          description: "کاربر در سیستم چت یافت نشد",
          variant: "destructive"
        });
        return;
      }

      targetUserId = userData.id;
    } catch (error) {
      console.error('Error finding user:', error);
      toast({
        title: "خطا",
        description: "خطا در یافتن کاربر",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert([{
          user_id: targetUserId,
          content: newNote.content,
          type: newNote.type,
          status: newNote.status,
          course_id: newNote.course_id === 'none' ? null : newNote.course_id,
          created_by: user.name || 'مدیر'
        }]);

      if (error) throw error;

      setNewNote({
        content: '',
        type: 'note',
        status: 'در انتظار پرداخت',
        course_id: 'none'
      });
      
      await fetchCRMNotes(targetUserId);
      setIsAddingNote(false);
      
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLeadDetail = async (lead: Lead | Assignment | AdminLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
    
    // Find user ID and fetch CRM notes
    try {
      const { data: userData, error: userError } = await supabase
        .from('chat_users')
        .select('id')
        .or(`email.eq.${lead.email},phone.eq.${lead.phone}`)
        .single();

      if (userData && !userError) {
        await fetchCRMNotes(userData.id);
      }
    } catch (error) {
      console.error('Error finding user for CRM notes:', error);
    }
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

  // Helper function to blur phone number if not assigned to current user
  const formatPhoneNumber = (phone: string, assignedToAgent: string | null, isAssigned: boolean = false) => {
    // If user is admin, always show full phone
    if (isAdmin) {
      return phone;
    }
    
    // If lead is assigned to current user, show full phone
    if (assignedToAgent && user?.name && assignedToAgent === user.name) {
      return phone;
    }
    
    // If this is in the "assigned" tab, show full phone (user's own assignments)
    if (isAssigned) {
      return phone;
    }
    
    // Otherwise blur the phone number
    if (phone.length > 4) {
      return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
    }
    return '****';
  };

  // Helper function to render phone as clickable link
  const renderPhoneLink = (phone: string) => {
    return (
      <a 
        href={`tel:${phone}`}
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        {phone}
      </a>
    );
  };

  const filteredLeads = searchTerm ? 
    leads.filter(lead => 
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm)
    ) : leads;

  const filteredAssignments = searchTerm ? 
    assignments.filter(assignment => 
      assignment.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.phone.includes(searchTerm)
    ) : assignments;

  // Use adminLeads directly since filtering is now done server-side
  const filteredAdminLeads = adminLeads;

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
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Users className="h-5 w-5" />
            مدیریت لیدها
          </CardTitle>
          
          {/* Search and Tabs - Mobile Responsive */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 w-full">
                <Search className="h-4 w-4 flex-shrink-0" />
                <Input
                  placeholder="جستجو نام، ایمیل یا تلفن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              {searchLoading && (
                <div className="flex justify-center py-1">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Tabs - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col sm:flex-row rounded-md bg-muted p-1 gap-1 sm:gap-0 w-full sm:w-auto">
                <Button
                  variant={activeTab === 'available' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('available')}
                  className="w-full sm:w-auto text-sm whitespace-nowrap"
                >
                  لیدهای موجود
                </Button>
                <Button
                  variant={activeTab === 'assigned' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('assigned')}
                  className="w-full sm:w-auto text-sm whitespace-nowrap"
                >
                  واگذار شده‌ها
                </Button>
                 {isAdmin && (
                   <>
                     <Button
                       variant={activeTab === 'admin' ? 'default' : 'ghost'}
                       size="sm"
                       onClick={() => setActiveTab('admin')}
                       className="w-full sm:w-auto text-sm whitespace-nowrap"
                     >
                       مدیریت ادمین
                     </Button>
                     <Button
                       variant={activeTab === 'distribution' ? 'default' : 'ghost'}
                       size="sm"
                       onClick={() => setActiveTab('distribution')}
                       className="w-full sm:w-auto text-sm whitespace-nowrap flex items-center gap-1"
                     >
                       <Share2 className="h-4 w-4" />
                       توزیع لید
                     </Button>
                   </>
                 )}
              </div>
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
                <>
                  {/* Mobile Card Layout */}
                  <div className="block md:hidden space-y-4">
                    {filteredLeads.map((lead) => (
                      <Card key={lead.enrollment_id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{lead.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{formatPhoneNumber(lead.phone, lead.assigned_to_agent, false)}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLeadDetail(lead)}
                                className="w-full sm:w-auto flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sm:hidden">مشاهده</span>
                              </Button>
                              {!lead.is_assigned && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAssignLead(lead.enrollment_id)}
                                  disabled={assignLoading === lead.enrollment_id}
                                  className="w-full sm:w-auto flex items-center gap-1"
                                >
                                  {assignLoading === lead.enrollment_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="h-4 w-4" />
                                  )}
                                  <span className="sm:hidden">واگذاری</span>
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">دوره: </span>
                              <span>{lead.course_title}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">مبلغ: </span>
                              <span>{formatPrice(lead.payment_amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">تاریخ: </span>
                              <span>{formatDate(lead.created_at)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">وضعیت: </span>
                              {lead.is_assigned ? (
                                <Badge variant="secondary" className="text-xs">
                                  واگذار شده
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">موجود</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lead.email}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Desktop Table Layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>نام و نام خانوادگی</TableHead>
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
                </>
              )}
            </div>
          ) : activeTab === 'assigned' ? (
            <div className="space-y-4">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm && searchTerm.length >= 3 ? 'هیچ واگذاری یافت نشد' : 'هیچ واگذاری یافت نشد'}
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="block md:hidden space-y-4">
                    {filteredAssignments.map((assignment) => (
                      <Card key={assignment.assignment_id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{assignment.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{renderPhoneLink(assignment.phone)}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLeadDetail(assignment)}
                                className="w-full sm:w-auto flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>مشاهده</span>
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">دوره: </span>
                              <span>{assignment.course_title}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">مبلغ: </span>
                              <span>{formatPrice(assignment.payment_amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">تاریخ واگذاری: </span>
                              <span>{formatDate(assignment.assigned_at)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">وضعیت: </span>
                              <Badge variant="default" className="text-xs">{assignment.status}</Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {assignment.email}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Desktop Table Layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>نام و نام خانوادگی</TableHead>
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
                            <TableCell>{renderPhoneLink(assignment.phone)}</TableCell>
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
                </>
              )}
            </div>
           ) : activeTab === 'admin' ? (
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
                          <UserPlus className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">لید های واگذار شده:</span>
                        </div>
                        <Badge variant="secondary">{summary.delegated_leads}</Badge>
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
                   
                   {/* Filter Controls */}
                   <div className="flex flex-col sm:flex-row gap-4 mt-4">
                     <div className="flex-1">
                       <Label htmlFor="course-filter" className="text-sm font-medium">فیلتر بر اساس دوره</Label>
                       <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                         <SelectTrigger id="course-filter" className="w-full">
                           <SelectValue placeholder="همه دوره‌ها" />
                         </SelectTrigger>
                         <SelectContent className="bg-white z-50">
                           <SelectItem value="all">همه دوره‌ها</SelectItem>
                           {courses.map((course) => (
                             <SelectItem key={course.id} value={course.id}>
                               {course.title}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="flex-1">
                       <Label htmlFor="agent-filter" className="text-sm font-medium">فیلتر بر اساس نماینده</Label>
                       <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                         <SelectTrigger id="agent-filter" className="w-full">
                           <SelectValue placeholder="همه نمایندگان" />
                         </SelectTrigger>
                         <SelectContent className="bg-white z-50">
                           <SelectItem value="all">همه نمایندگان</SelectItem>
                           <SelectItem value="unassigned">واگذار نشده</SelectItem>
                           {agents.map((agent) => (
                             <SelectItem key={agent.id} value={agent.name}>
                               {agent.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                      </div>
                    </div>
                    
                    {selectedAgent !== 'all' && selectedAgent !== 'unassigned' && (
                      <div className="bg-muted p-3 rounded-lg mt-4">
                        <p className="text-sm">
                          لیدهای واگذار شده به <strong>{selectedAgent}</strong>: {filteredAdminLeads.length} لید
                        </p>
                      </div>
                    )}
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
                     <>
                       {/* Mobile Card Layout */}
                       <div className="block md:hidden space-y-4">
                         {filteredAdminLeads.map((lead) => (
                           <Card key={lead.enrollment_id} className="p-4">
                             <div className="space-y-3">
                               <div className="flex items-start justify-between">
                                 <div>
                                   <h3 className="font-medium">{lead.full_name}</h3>
                                   <p className="text-sm text-muted-foreground">{formatPhoneNumber(lead.phone, lead.assigned_to_agent, false)}</p>
                                 </div>
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openLeadDetail(lead)}
                                      className="w-full sm:w-auto flex items-center gap-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span>مشاهده</span>
                                    </Button>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-2 text-sm">
                                 <div>
                                   <span className="text-muted-foreground">دوره: </span>
                                   <span>{lead.course_title}</span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">مبلغ: </span>
                                   <span>{formatPrice(lead.payment_amount)}</span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">تاریخ: </span>
                                   <span>{formatDate(lead.created_at)}</span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">نماینده: </span>
                                   {lead.assigned_to_agent ? (
                                     <Badge variant="secondary" className="text-xs">{lead.assigned_to_agent}</Badge>
                                   ) : (
                                     <Badge variant="outline" className="text-xs">واگذار نشده</Badge>
                                   )}
                                 </div>
                                 <div className="col-span-2">
                                   <span className="text-muted-foreground">وضعیت: </span>
                                   <Badge variant="default" className="text-xs">
                                     {lead.assignment_status || 'واگذار نشده'}
                                   </Badge>
                                 </div>
                               </div>
                               <div className="text-xs text-muted-foreground">
                                 {lead.email}
                               </div>
                             </div>
                           </Card>
                         ))}
                       </div>
                       
                       {/* Desktop Table Layout */}
                       <div className="hidden md:block overflow-x-auto">
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead>نام و نام خانوادگی</TableHead>
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
                                 <TableCell>{formatPhoneNumber(lead.phone, lead.assigned_to_agent, false)}</TableCell>
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
                     </>
                   )}
                   
                   {/* Pagination Controls - show on both mobile and desktop */}
                   {totalPages > 1 && (
                     <div className="flex items-center justify-between mt-4 pt-4 border-t">
                       <div className="text-sm text-muted-foreground">
                         صفحه {currentPage} از {totalPages}
                       </div>
                       <div className="flex items-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setCurrentPage(currentPage - 1)}
                           disabled={currentPage === 1}
                         >
                           قبلی
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setCurrentPage(currentPage + 1)}
                           disabled={currentPage === totalPages}
                         >
                           بعدی
                         </Button>
                        </div>
                      </div>
                   )}
                 </CardContent>
               </Card>
             </div>
           ) : activeTab === 'distribution' ? (
             <LeadDistributionSystem />
           ) : null}
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">یادداشت‌های CRM</h3>
                  <Button 
                    onClick={() => setIsAddingNote(true)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    افزودن یادداشت
                  </Button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {crmNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">هنوز یادداشتی وجود ندارد</p>
                    </div>
                  ) : (
                    crmNotes.map((note) => (
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
                            <span className="text-sm text-muted-foreground">
                              {formatDate(note.created_at)} - {note.created_by}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{note.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog - Main CRM Popup */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن یادداشت CRM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            {selectedLead && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedLead.full_name}</div>
                <div className="text-sm text-muted-foreground">{selectedLead.phone}</div>
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

export default LeadManagement;
