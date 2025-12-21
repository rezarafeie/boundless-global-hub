import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Search, 
  Loader2,
  UserPlus,
  Percent,
  Brain,
  Phone,
  CheckCircle,
  AlertCircle,
  Filter,
  Mail,
  Calendar,
  CreditCard,
  ExternalLink,
  X,
  AlertTriangle,
  ArrowRightLeft,
  UserX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  course_id: string;
  course_title: string;
  payment_amount: number;
  payment_status: string;
  created_at: string;
  chat_user_id: number | null;
  is_assigned: boolean;
  assigned_agent_id: number | null;
  assigned_agent_name: string | null;
  ai_score?: number;
  ai_category?: 'hot' | 'warm' | 'cold';
  ai_reason?: string;
}

interface Agent {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  lead_count?: number;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
}

interface Pipeline {
  id: string;
  title: string;
  stages: PipelineStage[];
}

interface PipelineStage {
  id: string;
  title: string;
  order_index: number;
}

interface PercentageAllocation {
  agent_id: number;
  agent_name: string;
  percentage: number;
}

interface AgentLeadCount {
  agent_id: number;
  agent_name: string;
  count: number;
  is_active: boolean;
}

interface AIScoreResult {
  enrollment_id: string;
  score: number;
  category: 'hot' | 'warm' | 'cold';
  reason: string;
}

const SimplifiedLeadManagement: React.FC = () => {
  const { toast } = useToast();
  
  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiScoreLoading, setAiScoreLoading] = useState(false);
  
  // Filter states - initialize from localStorage
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('leads_searchTerm') || '');
  const [selectedCourse, setSelectedCourse] = useState<string>(() => localStorage.getItem('leads_selectedCourse') || '');
  const [statusFilter, setStatusFilter] = useState<string>(() => localStorage.getItem('leads_statusFilter') || 'all');
  const [paymentFilter, setPaymentFilter] = useState<string>(() => localStorage.getItem('leads_paymentFilter') || 'all');
  const [agentFilter, setAgentFilter] = useState<string>(() => localStorage.getItem('leads_agentFilter') || 'all');
  const [dateFrom, setDateFrom] = useState(() => localStorage.getItem('leads_dateFrom') || '');
  const [dateTo, setDateTo] = useState(() => localStorage.getItem('leads_dateTo') || '');
  const [excludeCourseFilter, setExcludeCourseFilter] = useState<string>(() => localStorage.getItem('leads_excludeCourse') || '');
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>(() => localStorage.getItem('leads_crmStatusFilter') || 'all');
  
  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [showPercentageAssign, setShowPercentageAssign] = useState(false);
  const [showAiScore, setShowAiScore] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAgentForManual, setSelectedAgentForManual] = useState<string>('');
  const [percentageAllocations, setPercentageAllocations] = useState<PercentageAllocation[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
    hot: 0,
    warm: 0,
    cold: 0
  });
  
  // Agent lead counts
  const [agentLeadCounts, setAgentLeadCounts] = useState<AgentLeadCount[]>([]);

  const [hasLoaded, setHasLoaded] = useState(false);
  
  // AI Score states
  const [aiScoreResults, setAiScoreResults] = useState<AIScoreResult[]>([]);
  const [aiScoreProgress, setAiScoreProgress] = useState({ current: 0, total: 0 });
  const [aiScoreFilter, setAiScoreFilter] = useState<string>('all');

  // Pipeline states
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [createDealForPipeline, setCreateDealForPipeline] = useState(false);

  // Assignment report states
  interface AssignmentReportItem {
    agent_id: number;
    agent_name: string;
    leads: Lead[];
  }
  const [showAssignmentReport, setShowAssignmentReport] = useState(false);
  const [assignmentReportData, setAssignmentReportData] = useState<AssignmentReportItem[]>([]);
  
  // Assignment progress states
  const [assignmentProgress, setAssignmentProgress] = useState({ current: 0, total: 0, status: '' });
  const [isAssigning, setIsAssigning] = useState(false);

  // Bulk transfer states
  const [bulkTransferDialogOpen, setBulkTransferDialogOpen] = useState(false);
  const [selectedInactiveAgentId, setSelectedInactiveAgentId] = useState<number | null>(null);
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('leads_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('leads_selectedCourse', selectedCourse);
  }, [selectedCourse]);

  useEffect(() => {
    localStorage.setItem('leads_statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('leads_paymentFilter', paymentFilter);
  }, [paymentFilter]);

  useEffect(() => {
    localStorage.setItem('leads_agentFilter', agentFilter);
  }, [agentFilter]);

  useEffect(() => {
    localStorage.setItem('leads_dateFrom', dateFrom);
  }, [dateFrom]);

  useEffect(() => {
    localStorage.setItem('leads_dateTo', dateTo);
  }, [dateTo]);

  useEffect(() => {
    localStorage.setItem('leads_excludeCourse', excludeCourseFilter);
  }, [excludeCourseFilter]);

  useEffect(() => {
    localStorage.setItem('leads_crmStatusFilter', crmStatusFilter);
  }, [crmStatusFilter]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setInitialLoading(true);
    await Promise.all([fetchCourses(), fetchAgents(), fetchPipelines()]);
    setInitialLoading(false);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_active', true)
      .order('title');
    setCourses(data || []);
  };

  const fetchPipelines = async () => {
    const { data } = await supabase
      .from('pipelines')
      .select(`
        id,
        title,
        pipeline_stages (id, title, order_index)
      `)
      .eq('is_active', true)
      .order('title');
    
    const pipelinesWithStages = (data || []).map(p => ({
      id: p.id,
      title: p.title,
      stages: (p.pipeline_stages || []).sort((a: any, b: any) => a.order_index - b.order_index)
    }));
    
    setPipelines(pipelinesWithStages);
  };

  const fetchAgents = async () => {
    // Fetch ALL agents (active and inactive) for comprehensive view
    const { data: salesAgentsData } = await supabase
      .from('sales_agents')
      .select(`
        id,
        user_id,
        is_active,
        chat_users!inner(name, phone)
      `);

    const agents: Agent[] = (salesAgentsData || []).map((sa: any) => ({
      id: sa.id,
      user_id: sa.user_id,
      name: sa.chat_users?.name || 'Unknown',
      phone: sa.chat_users?.phone || '',
      is_active: sa.is_active
    }));
    
    setAgents(agents);
    
    // Initialize percentage allocations (only for active agents)
    setPercentageAllocations(agents.filter(a => a.is_active).map(agent => ({
      agent_id: agent.id,
      agent_name: agent.name,
      percentage: 0
    })));
  };

  const handleLoadLeads = async () => {
    if (!selectedCourse) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا دوره را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setHasLoaded(true);
    try {
      // Build query with filters
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          email,
          phone,
          course_id,
          payment_amount,
          payment_status,
          created_at,
          chat_user_id,
          courses!inner(title)
        `)
        .eq('course_id', selectedCourse)
        .order('created_at', { ascending: false });

      // Apply payment status filter at DB level
      if (paymentFilter !== 'all') {
        if (paymentFilter === 'success') {
          query = query.in('payment_status', ['success', 'completed']);
        } else {
          query = query.eq('payment_status', paymentFilter);
        }
      }

      // Apply date filters
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data: enrollments, error } = await query;
      if (error) throw error;

      // Fetch assignments for this course only
      const { data: assignments } = await supabase
        .from('lead_assignments')
        .select('enrollment_id, sales_agent_id')
        .in('enrollment_id', (enrollments || []).map(e => e.id));

      // Create assignment map
      const assignmentMap = new Map<string, number>();
      assignments?.forEach(a => {
        if (a.enrollment_id) assignmentMap.set(a.enrollment_id, a.sales_agent_id!);
      });

      // Create agent name map
      const agentNameMap = new Map<number, string>();
      agents.forEach(a => agentNameMap.set(a.id, a.name));

      // Get chat_user_ids for CRM and exclude course lookup
      const chatUserIds = (enrollments || [])
        .map(e => e.chat_user_id)
        .filter(Boolean) as number[];

      // Fetch users who have purchased the excluded course (if filter is set)
      let excludedUserIds = new Set<number>();
      if (excludeCourseFilter && excludeCourseFilter !== selectedCourse) {
        const { data: excludedEnrollments } = await supabase
          .from('enrollments')
          .select('chat_user_id')
          .eq('course_id', excludeCourseFilter)
          .in('payment_status', ['success', 'completed']);
        
        excludedEnrollments?.forEach(e => {
          if (e.chat_user_id) excludedUserIds.add(e.chat_user_id);
        });
      }

      // Fetch CRM notes for filtering by CRM status
      let crmStatusMap = new Map<number, string | null>();
      if (crmStatusFilter !== 'all' && chatUserIds.length > 0) {
        const { data: crmNotes } = await supabase
          .from('crm_notes')
          .select('user_id, status')
          .in('user_id', chatUserIds)
          .order('created_at', { ascending: false });
        
        // Get latest CRM status for each user
        crmNotes?.forEach(note => {
          if (!crmStatusMap.has(note.user_id)) {
            crmStatusMap.set(note.user_id, note.status);
          }
        });
      }

      // Process leads
      let processedLeads: Lead[] = (enrollments || []).map(e => {
        const agentId = assignmentMap.get(e.id) || null;
        return {
          id: e.id,
          full_name: e.full_name,
          email: e.email,
          phone: e.phone,
          course_id: e.course_id,
          course_title: (e.courses as any)?.title || '',
          payment_amount: e.payment_amount,
          payment_status: e.payment_status,
          created_at: e.created_at,
          chat_user_id: e.chat_user_id,
          is_assigned: !!agentId,
          assigned_agent_id: agentId,
          assigned_agent_name: agentId ? agentNameMap.get(agentId) || null : null
        };
      });

      // Apply exclude course filter - remove users who purchased the excluded course
      if (excludeCourseFilter && excludedUserIds.size > 0) {
        processedLeads = processedLeads.filter(l => !l.chat_user_id || !excludedUserIds.has(l.chat_user_id));
      }

      // Apply CRM status filter
      if (crmStatusFilter !== 'all') {
        if (crmStatusFilter === 'no_crm') {
          // Users without any CRM notes
          processedLeads = processedLeads.filter(l => !l.chat_user_id || !crmStatusMap.has(l.chat_user_id));
        } else {
          // Users with specific CRM status
          processedLeads = processedLeads.filter(l => 
            l.chat_user_id && crmStatusMap.get(l.chat_user_id) === crmStatusFilter
          );
        }
      }

      // Apply assignment status filter
      if (statusFilter === 'assigned') {
        processedLeads = processedLeads.filter(l => l.is_assigned);
      } else if (statusFilter === 'unassigned') {
        processedLeads = processedLeads.filter(l => !l.is_assigned);
      }

      // Apply agent filter
      if (agentFilter !== 'all') {
        processedLeads = processedLeads.filter(l => l.assigned_agent_id === parseInt(agentFilter));
      }

      setLeads(processedLeads);
      
      // Update stats based on all processed leads (before agent filter)
      const allLeads = (enrollments || []).map(e => ({
        is_assigned: !!assignmentMap.get(e.id),
        agent_id: assignmentMap.get(e.id) || null
      }));
      const totalAssigned = allLeads.filter(l => l.is_assigned).length;
      setStats(prev => ({
        ...prev,
        total: allLeads.length,
        assigned: totalAssigned,
        unassigned: allLeads.length - totalAssigned
      }));

      // Reset AI score results when loading new leads
      setAiScoreResults([]);

      // Calculate lead counts per agent
      const agentCounts = new Map<number, number>();
      allLeads.forEach(l => {
        if (l.agent_id) {
          agentCounts.set(l.agent_id, (agentCounts.get(l.agent_id) || 0) + 1);
        }
      });
      
      const counts: AgentLeadCount[] = agents
        .map(a => ({
          agent_id: a.id,
          agent_name: a.name,
          count: agentCounts.get(a.id) || 0,
          is_active: a.is_active
        }))
        .filter(c => c.count > 0)
        .sort((a, b) => b.count - a.count);
      
      setAgentLeadCounts(counts);

      toast({
        title: "بارگذاری شد",
        description: `${processedLeads.length} لید یافت شد`
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

  const handleAiScoreLeads = async () => {
    console.log('AI Score clicked', { selectedCourse, leadsCount: leads.length, selectedLeadsCount: selectedLeads.length });
    
    if (!selectedCourse) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا دوره را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }

    const leadsToScore = selectedLeads.length > 0 
      ? leads.filter(l => selectedLeads.includes(l.id))
      : leads.filter(l => !l.is_assigned);

    console.log('Leads to score:', leadsToScore.length);

    if (leadsToScore.length === 0) {
      toast({
        title: "خطا", 
        description: "لیدی برای امتیازدهی وجود ندارد. ابتدا لیدها را بارگذاری کنید.",
        variant: "destructive"
      });
      return;
    }

    setAiScoreLoading(true);
    setAiScoreProgress({ current: 0, total: leadsToScore.length });
    setShowAiScore(false); // Close modal to show progress
    
    try {
      console.log('Creating AI analysis job...');
      // Create a new AI analysis job
      const { data: job, error: jobError } = await supabase
        .from('lead_analysis_jobs')
        .insert({
          course_id: selectedCourse,
          status: 'running',
          progress_current: 0,
          progress_total: leadsToScore.length,
          start_date: dateFrom || null,
          end_date: dateTo || null
        })
        .select()
        .single();

      if (jobError) {
        console.error('Job creation error:', jobError);
        throw jobError;
      }

      console.log('Job created:', job.id, 'Calling edge function...');

      // Call the edge function to process the leads
      const { data: result, error: funcError } = await supabase.functions.invoke('ai-lead-scoring', {
        body: {
          courseId: selectedCourse,
          startDate: dateFrom || null,
          endDate: dateTo || null,
          batchSize: 50,
          offset: 0
        }
      });

      console.log('Edge function response:', { result, funcError });

      if (funcError) {
        // Update job status to failed
        await supabase
          .from('lead_analysis_jobs')
          .update({ status: 'failed', error_message: funcError.message })
          .eq('id', job.id);
        throw funcError;
      }

      // Update job with results
      await supabase
        .from('lead_analysis_jobs')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          results: result 
        })
        .eq('id', job.id);

      // Process AI results and update leads
      const aiResults: AIScoreResult[] = (result?.leads || []).map((lead: any) => ({
        enrollment_id: lead.enrollment_id,
        score: lead.score || 50,
        category: lead.score >= 70 ? 'hot' : lead.score >= 40 ? 'warm' : 'cold',
        reason: lead.reason || ''
      }));
      
      setAiScoreResults(aiResults);
      setAiScoreProgress({ current: aiResults.length, total: leadsToScore.length });
      
      // Update leads with AI scores and sort from hot to cold
      setLeads(prevLeads => {
        const updatedLeads = prevLeads.map(lead => {
          const aiResult = aiResults.find(r => r.enrollment_id === lead.id);
          if (aiResult) {
            return {
              ...lead,
              ai_score: aiResult.score,
              ai_category: aiResult.category,
              ai_reason: aiResult.reason
            };
          }
          return lead;
        });
        
        // Sort by AI category: hot first, then warm, then cold, then unscored
        const categoryOrder = { hot: 0, warm: 1, cold: 2 };
        return updatedLeads.sort((a, b) => {
          const aOrder = a.ai_category ? categoryOrder[a.ai_category] : 3;
          const bOrder = b.ai_category ? categoryOrder[b.ai_category] : 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          // Secondary sort by score within same category
          return (b.ai_score || 0) - (a.ai_score || 0);
        });
      });
      
      // Update stats with AI categories
      const hotCount = aiResults.filter(r => r.category === 'hot').length;
      const warmCount = aiResults.filter(r => r.category === 'warm').length;
      const coldCount = aiResults.filter(r => r.category === 'cold').length;
      
      setStats(prev => ({
        ...prev,
        hot: hotCount,
        warm: warmCount,
        cold: coldCount
      }));

      toast({
        title: "تکمیل شد",
        description: `تحلیل هوش مصنوعی برای ${aiResults.length} لید انجام شد (${hotCount} داغ، ${warmCount} گرم، ${coldCount} سرد)`,
      });

    } catch (error: any) {
      console.error('Error in AI analysis:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در تحلیل هوش مصنوعی",
        variant: "destructive"
      });
    } finally {
      setAiScoreLoading(false);
    }
  };
  
  const getAiScoreBadge = (category?: 'hot' | 'warm' | 'cold', score?: number) => {
    if (!category) return null;
    switch (category) {
      case 'hot':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">🔥 داغ ({score})</Badge>;
      case 'warm':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">☀️ گرم ({score})</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">❄️ سرد ({score})</Badge>;
      default:
        return null;
    }
  };

  const handleOpenLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetails(true);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedLeads(leads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
      setSelectAll(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedAgentForManual || selectedLeads.length === 0) {
      toast({
        title: "خطا",
        description: "لطفاً کارشناس و لیدها را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }

    if (createDealForPipeline && !selectedPipeline) {
      toast({
        title: "خطا",
        description: "لطفاً پایپ‌لاین را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    setIsAssigning(true);
    setShowManualAssign(false);
    setAssignmentProgress({ current: 0, total: selectedLeads.length, status: 'در حال آماده‌سازی...' });
    
    try {
      const agentId = parseInt(selectedAgentForManual);
      const agent = agents.find(a => a.id === agentId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      setAssignmentProgress(prev => ({ ...prev, status: 'در حال حذف واگذاری‌های قبلی...' }));
      
      // First remove existing assignments for selected leads
      await supabase
        .from('lead_assignments')
        .delete()
        .in('enrollment_id', selectedLeads);

      setAssignmentProgress(prev => ({ ...prev, status: 'در حال ایجاد واگذاری‌ها...' }));

      // Create new assignments - use agent.user_id for assigned_by (references chat_users.id)
      const assignments = selectedLeads.map(enrollmentId => ({
        enrollment_id: enrollmentId,
        sales_agent_id: agentId,
        assigned_by: agent.user_id,
        assignment_type: 'distributed',
        status: 'assigned'
      }));

      const { error } = await supabase
        .from('lead_assignments')
        .insert(assignments);

      if (error) throw error;
      
      setAssignmentProgress(prev => ({ ...prev, current: selectedLeads.length, status: 'واگذاری‌ها ایجاد شد' }));

      // Create deals if pipeline is selected
      if (createDealForPipeline && selectedPipeline) {
        const pipeline = pipelines.find(p => p.id === selectedPipeline);
        const firstStage = pipeline?.stages?.[0];
        
        setAssignmentProgress(prev => ({ ...prev, current: 0, status: 'در حال ایجاد معاملات...' }));
        
        let dealCount = 0;
        for (const enrollmentId of selectedLeads) {
          const lead = leads.find(l => l.id === enrollmentId);
          if (!lead) continue;

          // Check if deal already exists
          const { data: existingDeal } = await supabase
            .from('deals')
            .select('id')
            .eq('enrollment_id', enrollmentId)
            .single();

          if (!existingDeal) {
            await supabase
              .from('deals')
              .insert({
                enrollment_id: enrollmentId,
                course_id: lead.course_id,
                pipeline_id: selectedPipeline,
                current_stage_id: firstStage?.id || null,
                price: lead.payment_amount || 0,
                assigned_salesperson_id: agent.user_id,
                assigned_by_id: agent.user_id,
                status: 'in_progress',
                stage_entered_at: new Date().toISOString()
              });
          }
          dealCount++;
          setAssignmentProgress(prev => ({ ...prev, current: dealCount, status: `ایجاد معامله ${dealCount} از ${selectedLeads.length}` }));
        }
      }

      setAssignmentProgress(prev => ({ ...prev, status: 'تکمیل شد!' }));

      // Generate assignment report
      const assignedLeadsData = leads.filter(l => selectedLeads.includes(l.id));
      const reportData = [{
        agent_id: agentId,
        agent_name: agent.name,
        leads: assignedLeadsData
      }];
      setAssignmentReportData(reportData);
      
      // Small delay to show completion status before showing report
      setTimeout(() => {
        setIsAssigning(false);
        setShowAssignmentReport(true);
      }, 500);

      toast({
        title: "موفق",
        description: `${selectedLeads.length} لید به ${agent.name} واگذار شد${createDealForPipeline ? ' و معامله ایجاد شد' : ''}`
      });

      setSelectedLeads([]);
      setSelectAll(false);
      setSelectedAgentForManual('');
      setCreateDealForPipeline(false);
      setSelectedPipeline('');
      handleLoadLeads();
    } catch (error) {
      console.error('Error assigning leads:', error);
      setIsAssigning(false);
      toast({
        title: "خطا",
        description: "خطا در واگذاری لیدها",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePercentageAssign = async () => {
    const totalPercentage = percentageAllocations.reduce((sum, a) => sum + a.percentage, 0);
    if (totalPercentage !== 100) {
      toast({
        title: "خطا",
        description: "مجموع درصدها باید ۱۰۰ باشد",
        variant: "destructive"
      });
      return;
    }

    if (createDealForPipeline && !selectedPipeline) {
      toast({
        title: "خطا",
        description: "لطفاً پایپ‌لاین را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }

    const unassignedLeads = selectedLeads.length > 0 
      ? leads.filter(l => selectedLeads.includes(l.id) && !l.is_assigned)
      : leads.filter(l => !l.is_assigned);

    if (unassignedLeads.length === 0) {
      toast({
        title: "خطا",
        description: "لیدی برای توزیع وجود ندارد",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    setIsAssigning(true);
    setShowPercentageAssign(false);
    setAssignmentProgress({ current: 0, total: unassignedLeads.length, status: 'در حال آماده‌سازی توزیع...' });
    
    try {
      // Shuffle leads for random distribution
      const shuffled = [...unassignedLeads].sort(() => Math.random() - 0.5);
      
      const assignments: { enrollment_id: string; sales_agent_id: number; assigned_by: number; assignment_type: string; status: string }[] = [];
      let currentIndex = 0;

      setAssignmentProgress(prev => ({ ...prev, status: 'در حال محاسبه توزیع...' }));

      for (const allocation of percentageAllocations) {
        if (allocation.percentage === 0) continue;
        
        const agent = agents.find(a => a.id === allocation.agent_id);
        const count = Math.round((allocation.percentage / 100) * shuffled.length);
        for (let i = 0; i < count && currentIndex < shuffled.length; i++) {
          assignments.push({
            enrollment_id: shuffled[currentIndex].id,
            sales_agent_id: allocation.agent_id,
            assigned_by: agent?.user_id || allocation.agent_id,
            assignment_type: 'distributed',
            status: 'assigned'
          });
          currentIndex++;
        }
      }

      // Assign remaining leads to first agent with percentage > 0
      const firstAllocation = percentageAllocations.find(a => a.percentage > 0);
      const firstAgent = firstAllocation ? agents.find(a => a.id === firstAllocation.agent_id) : null;
      while (currentIndex < shuffled.length && firstAllocation) {
        assignments.push({
          enrollment_id: shuffled[currentIndex].id,
          sales_agent_id: firstAllocation.agent_id,
          assigned_by: firstAgent?.user_id || firstAllocation.agent_id,
          assignment_type: 'distributed',
          status: 'assigned'
        });
        currentIndex++;
      }

      if (assignments.length > 0) {
        setAssignmentProgress(prev => ({ ...prev, status: 'در حال ایجاد واگذاری‌ها...' }));
        
        const { error } = await supabase
          .from('lead_assignments')
          .insert(assignments);

        if (error) throw error;
        
        setAssignmentProgress(prev => ({ ...prev, current: assignments.length, status: 'واگذاری‌ها ایجاد شد' }));

        // Create deals if pipeline is selected
        if (createDealForPipeline && selectedPipeline) {
          const pipeline = pipelines.find(p => p.id === selectedPipeline);
          const firstStage = pipeline?.stages?.[0];
          
          setAssignmentProgress(prev => ({ ...prev, current: 0, status: 'در حال ایجاد معاملات...' }));
          
          let dealCount = 0;
          for (const assignment of assignments) {
            const lead = shuffled.find(l => l.id === assignment.enrollment_id);
            const agent = agents.find(a => a.id === assignment.sales_agent_id);
            if (!lead || !agent) continue;

            // Check if deal already exists
            const { data: existingDeal } = await supabase
              .from('deals')
              .select('id')
              .eq('enrollment_id', assignment.enrollment_id)
              .single();

            if (!existingDeal) {
              await supabase
                .from('deals')
                .insert({
                  enrollment_id: assignment.enrollment_id,
                  course_id: lead.course_id,
                  pipeline_id: selectedPipeline,
                  current_stage_id: firstStage?.id || null,
                  price: lead.payment_amount || 0,
                  assigned_salesperson_id: agent.user_id,
                  assigned_by_id: agent.user_id,
                  status: 'in_progress',
                  stage_entered_at: new Date().toISOString()
                });
            }
            dealCount++;
            setAssignmentProgress(prev => ({ ...prev, current: dealCount, status: `ایجاد معامله ${dealCount} از ${assignments.length}` }));
          }
        }
      }

      setAssignmentProgress(prev => ({ ...prev, status: 'تکمیل شد!' }));

      // Generate assignment report grouped by agent
      const reportMap = new Map<number, { agent_name: string; leads: Lead[] }>();
      assignments.forEach(assignment => {
        const lead = shuffled.find(l => l.id === assignment.enrollment_id);
        const agent = agents.find(a => a.id === assignment.sales_agent_id);
        if (lead && agent) {
          const existing = reportMap.get(assignment.sales_agent_id);
          if (existing) {
            existing.leads.push(lead);
          } else {
            reportMap.set(assignment.sales_agent_id, {
              agent_name: agent.name,
              leads: [lead]
            });
          }
        }
      });

      const reportData = Array.from(reportMap.entries()).map(([agent_id, data]) => ({
        agent_id,
        agent_name: data.agent_name,
        leads: data.leads
      }));
      setAssignmentReportData(reportData);
      
      // Small delay to show completion status before showing report
      setTimeout(() => {
        setIsAssigning(false);
        setShowAssignmentReport(true);
      }, 500);

      toast({
        title: "موفق",
        description: `${assignments.length} لید توزیع شد${createDealForPipeline ? ' و معامله ایجاد شد' : ''}`
      });

      setSelectedLeads([]);
      setSelectAll(false);
      setCreateDealForPipeline(false);
      setSelectedPipeline('');
      handleLoadLeads();
    } catch (error) {
      console.error('Error distributing leads:', error);
      setIsAssigning(false);
      toast({
        title: "خطا",
        description: "خطا در توزیع لیدها",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk transfer leads from inactive agent to active agent
  const handleBulkTransferLeads = async () => {
    if (!selectedInactiveAgentId || !targetAgentId) {
      toast({
        title: "خطا",
        description: "لطفا نماینده مقصد را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }

    setTransferLoading(true);
    try {
      // Update all lead assignments from inactive agent to target agent
      const { error } = await supabase
        .from('lead_assignments')
        .update({ 
          sales_agent_id: parseInt(targetAgentId),
          assigned_at: new Date().toISOString()
        })
        .eq('sales_agent_id', selectedInactiveAgentId);

      if (error) throw error;

      const sourceAgent = agentLeadCounts.find(a => a.agent_id === selectedInactiveAgentId);
      const targetAgent = agents.find(a => a.id === parseInt(targetAgentId));
      
      toast({
        title: "موفقیت",
        description: `${sourceAgent?.count || 0} لید از ${sourceAgent?.agent_name} به ${targetAgent?.name} منتقل شد`,
      });

      // Refresh data
      await handleLoadLeads();
      
      // Close dialog and reset
      setBulkTransferDialogOpen(false);
      setSelectedInactiveAgentId(null);
      setTargetAgentId('');
    } catch (error) {
      console.error('Error transferring leads:', error);
      toast({
        title: "خطا",
        description: "خطا در انتقال لیدها",
        variant: "destructive"
      });
    } finally {
      setTransferLoading(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">پرداخت شده</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">در انتظار</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">کل لیدها</p>
                <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">واگذار شده</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">{stats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">واگذار نشده</p>
                <p className="text-lg md:text-2xl font-bold text-orange-600">{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Score Progress Card */}
      {aiScoreLoading && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-600">در حال تحلیل هوش مصنوعی...</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${aiScoreProgress.total > 0 ? (aiScoreProgress.current / aiScoreProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {aiScoreProgress.current} / {aiScoreProgress.total}
                  </span>
                </div>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Progress Card */}
      {isAssigning && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-green-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-600">{assignmentProgress.status}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${assignmentProgress.total > 0 ? (assignmentProgress.current / assignmentProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {assignmentProgress.current} / {assignmentProgress.total}
                  </span>
                </div>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Score Stats - Show when we have results */}
      {aiScoreResults.length > 0 && !aiScoreLoading && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              نتایج تحلیل هوش مصنوعی
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`p-3 rounded-lg cursor-pointer transition-all ${aiScoreFilter === 'hot' ? 'ring-2 ring-red-500' : ''} bg-red-500/10`}
                onClick={() => setAiScoreFilter(aiScoreFilter === 'hot' ? 'all' : 'hot')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <div>
                    <p className="text-xs text-muted-foreground">داغ</p>
                    <p className="text-xl font-bold text-red-600">{stats.hot}</p>
                  </div>
                </div>
              </div>
              <div 
                className={`p-3 rounded-lg cursor-pointer transition-all ${aiScoreFilter === 'warm' ? 'ring-2 ring-yellow-500' : ''} bg-yellow-500/10`}
                onClick={() => setAiScoreFilter(aiScoreFilter === 'warm' ? 'all' : 'warm')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">☀️</span>
                  <div>
                    <p className="text-xs text-muted-foreground">گرم</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.warm}</p>
                  </div>
                </div>
              </div>
              <div 
                className={`p-3 rounded-lg cursor-pointer transition-all ${aiScoreFilter === 'cold' ? 'ring-2 ring-blue-500' : ''} bg-blue-500/10`}
                onClick={() => setAiScoreFilter(aiScoreFilter === 'cold' ? 'all' : 'cold')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">❄️</span>
                  <div>
                    <p className="text-xs text-muted-foreground">سرد</p>
                    <p className="text-xl font-bold text-blue-600">{stats.cold}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning for Orphaned Leads - Only show if there are inactive agents with leads */}
      {hasLoaded && (() => {
        const inactiveAgentsWithLeads = agentLeadCounts.filter(ac => !ac.is_active && ac.count > 0);
        const totalOrphanedLeads = inactiveAgentsWithLeads.reduce((sum, ac) => sum + ac.count, 0);
        
        if (totalOrphanedLeads > 0) {
          return (
            <Card className="bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                      هشدار: لیدهای یتیم
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {totalOrphanedLeads} لید به نمایندگان غیرفعال تخصیص یافته‌اند و نیاز به انتقال دارند.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {inactiveAgentsWithLeads.map(ac => (
                        <div key={ac.agent_id} className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-400">
                            <UserX className="h-3 w-3 mr-1" />
                            {ac.agent_name}: {ac.count} لید
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs text-amber-700 border-amber-400 hover:bg-amber-100"
                            onClick={() => {
                              setSelectedInactiveAgentId(ac.agent_id);
                              setBulkTransferDialogOpen(true);
                            }}
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            انتقال
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Agent Lead Distribution - Only show after loading */}
      {hasLoaded && agentLeadCounts.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              توزیع لیدها بین کارشناسان
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {agentLeadCounts.map(ac => (
                <Badge 
                  key={ac.agent_id} 
                  variant="outline" 
                  className={`text-xs md:text-sm py-1.5 px-3 cursor-pointer hover:bg-muted ${
                    !ac.is_active ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950' : ''
                  }`}
                  onClick={() => setAgentFilter(ac.agent_id.toString())}
                >
                  {!ac.is_active && <UserX className="h-3 w-3 mr-1 inline" />}
                  {ac.agent_name}: <span className="font-bold mr-1">{ac.count}</span> لید
                  {!ac.is_active && <span className="text-[10px] mr-1">(غیرفعال)</span>}
                </Badge>
              ))}
              <Badge 
                variant="outline" 
                className="text-xs md:text-sm py-1.5 px-3 border-orange-500/50 text-orange-600 cursor-pointer hover:bg-orange-500/10"
                onClick={() => setStatusFilter('unassigned')}
              >
                بدون کارشناس: <span className="font-bold mr-1">{stats.unassigned}</span> لید
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">جستجو</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="نام، تلفن، ایمیل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            {/* Course Filter */}
            <div className="w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">دوره *</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دوره" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status Filter */}
            <div className="w-[140px]">
              <Label className="text-xs text-muted-foreground mb-1 block">وضعیت پرداخت</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="success">پرداخت شده</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="failed">ناموفق</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Status Filter */}
            <div className="w-[140px]">
              <Label className="text-xs text-muted-foreground mb-1 block">وضعیت واگذاری</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="unassigned">واگذار نشده</SelectItem>
                  <SelectItem value="assigned">واگذار شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent Filter */}
            <div className="w-[150px]">
              <Label className="text-xs text-muted-foreground mb-1 block">کارشناس</Label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">همه کارشناسان</SelectItem>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      <span className="flex items-center gap-1">
                        {!a.is_active && <UserX className="h-3 w-3 text-amber-600" />}
                        {a.name}
                        {!a.is_active && <span className="text-[10px] text-amber-600">(غیرفعال)</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CRM Status Filter */}
            <div className="w-[150px]">
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

            {/* Exclude Course Filter */}
            <div className="w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">حذف خریداران دوره</Label>
              <Select value={excludeCourseFilter || "none"} onValueChange={(v) => setExcludeCourseFilter(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون فیلتر</SelectItem>
                  {courses.filter(c => c.id !== selectedCourse).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="w-[130px]">
              <Label className="text-xs text-muted-foreground mb-1 block">از تاریخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="w-[140px]">
              <Label className="text-xs text-muted-foreground mb-1 block">تا تاریخ</Label>
              <Input
              type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Load Button */}
            <Button 
              onClick={handleLoadLeads} 
              disabled={loading || !selectedCourse}
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              بارگذاری
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t items-center">
            <Button
              onClick={() => setShowManualAssign(true)}
              disabled={selectedLeads.length === 0}
              size="sm"
              className="gap-1.5 text-xs md:text-sm"
            >
              <UserPlus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">واگذاری دستی</span>
              <span className="sm:hidden">واگذاری</span>
              ({selectedLeads.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPercentageAssign(true)}
              size="sm"
              className="gap-1.5 text-xs md:text-sm"
            >
              <Percent className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">توزیع درصدی</span>
              <span className="sm:hidden">توزیع</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAiScore(true)}
              disabled={!hasLoaded || leads.length === 0}
              size="sm"
              className="gap-1.5 text-xs md:text-sm"
            >
              <Brain className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">امتیازدهی AI</span>
              <span className="sm:hidden">AI</span>
            </Button>
            {hasLoaded && (
              <span className="text-xs md:text-sm text-muted-foreground mr-auto">
                نمایش {aiScoreFilter !== 'all' ? leads.filter(l => l.ai_category === aiScoreFilter).length : leads.length} لید
                {aiScoreFilter !== 'all' && ` (فیلتر: ${aiScoreFilter === 'hot' ? 'داغ' : aiScoreFilter === 'warm' ? 'گرم' : 'سرد'})`}
              </span>
            )}
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
          ) : !hasLoaded ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Filter className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">دوره مورد نظر را انتخاب کنید</p>
              <p className="text-sm">سپس روی دکمه "بارگذاری" کلیک کنید</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>تلفن</TableHead>
                  {aiScoreResults.length > 0 && <TableHead>امتیاز AI</TableHead>}
                  <TableHead>دوره</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>وضعیت پرداخت</TableHead>
                  <TableHead>کارشناس</TableHead>
                  <TableHead>تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.filter(l => aiScoreFilter === 'all' || l.ai_category === aiScoreFilter).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={aiScoreResults.length > 0 ? 9 : 8} className="text-center py-10 text-muted-foreground">
                      لیدی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  leads
                    .filter(l => aiScoreFilter === 'all' || l.ai_category === aiScoreFilter)
                    .map(lead => (
                    <TableRow 
                      key={lead.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenLeadDetails(lead)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {lead.full_name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <a href={`tel:${formatPhone(lead.phone)}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3 w-3" />
                          {formatPhone(lead.phone)}
                        </a>
                      </TableCell>
                      {aiScoreResults.length > 0 && (
                        <TableCell>
                          {getAiScoreBadge(lead.ai_category, lead.ai_score)}
                        </TableCell>
                      )}
                      <TableCell className="max-w-[150px] truncate">{lead.course_title}</TableCell>
                      <TableCell>{lead.payment_amount?.toLocaleString()} تومان</TableCell>
                      <TableCell>{getStatusBadge(lead.payment_status)}</TableCell>
                      <TableCell>
                        {lead.is_assigned ? (
                          <Badge variant="secondary">{lead.assigned_agent_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Assignment Modal */}
      <Dialog open={showManualAssign} onOpenChange={(open) => {
        setShowManualAssign(open);
        if (!open) {
          setCreateDealForPipeline(false);
          setSelectedPipeline('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>واگذاری دستی لیدها</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedLeads.length} لید انتخاب شده است
            </p>
            <div>
              <Label>کارشناس فروش</Label>
              <Select value={selectedAgentForManual} onValueChange={setSelectedAgentForManual}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="انتخاب کارشناس" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pipeline Deal Creation Option */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="createDeal"
                checked={createDealForPipeline}
                onCheckedChange={(checked) => setCreateDealForPipeline(!!checked)}
              />
              <Label htmlFor="createDeal" className="text-sm cursor-pointer">
                ایجاد معامله در پایپ‌لاین فروش
              </Label>
            </div>

            {createDealForPipeline && (
              <div>
                <Label>پایپ‌لاین</Label>
                <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="انتخاب پایپ‌لاین" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map(pipeline => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedLeads.length === 0 && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                لطفاً ابتدا لیدها را انتخاب کنید
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleManualAssign}
              disabled={actionLoading || !selectedAgentForManual || selectedLeads.length === 0 || (createDealForPipeline && !selectedPipeline)}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              واگذاری {selectedLeads.length} لید{createDealForPipeline ? ' و ایجاد معامله' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Percentage Distribution Modal */}
      <Dialog open={showPercentageAssign} onOpenChange={(open) => {
        setShowPercentageAssign(open);
        if (!open) {
          setCreateDealForPipeline(false);
          setSelectedPipeline('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>توزیع درصدی لیدها</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedLeads.length > 0 
                ? `${selectedLeads.filter(id => !leads.find(l => l.id === id)?.is_assigned).length} لید انتخاب شده واگذار نشده`
                : `${stats.unassigned} لید واگذار نشده`
              }
            </p>
            
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {percentageAllocations.map((allocation, index) => (
                <div key={allocation.agent_id} className="flex items-center gap-3">
                  <span className="w-32 text-sm truncate">{allocation.agent_name}</span>
                  <Slider
                    value={[allocation.percentage]}
                    onValueChange={([value]) => {
                      const newAllocations = [...percentageAllocations];
                      newAllocations[index].percentage = value;
                      setPercentageAllocations(newAllocations);
                    }}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-left">{allocation.percentage}%</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm">مجموع:</span>
              <span className={`font-bold ${
                percentageAllocations.reduce((sum, a) => sum + a.percentage, 0) === 100 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {percentageAllocations.reduce((sum, a) => sum + a.percentage, 0)}%
              </span>
            </div>

            {/* Pipeline Deal Creation Option */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Checkbox
                id="createDealPercent"
                checked={createDealForPipeline}
                onCheckedChange={(checked) => setCreateDealForPipeline(!!checked)}
              />
              <Label htmlFor="createDealPercent" className="text-sm cursor-pointer">
                ایجاد معامله در پایپ‌لاین فروش
              </Label>
            </div>

            {createDealForPipeline && (
              <div>
                <Label>پایپ‌لاین</Label>
                <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="انتخاب پایپ‌لاین" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map(pipeline => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handlePercentageAssign}
              disabled={actionLoading || percentageAllocations.reduce((sum, a) => sum + a.percentage, 0) !== 100 || (createDealForPipeline && !selectedPipeline)}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              توزیع لیدها{createDealForPipeline ? ' و ایجاد معامله' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Score Modal */}
      <Dialog open={showAiScore} onOpenChange={setShowAiScore}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              امتیازدهی هوش مصنوعی
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedCourse ? (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                <AlertCircle className="h-4 w-4 inline ml-2" />
                ابتدا یک دوره انتخاب کنید
              </div>
            ) : leads.length === 0 ? (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                <AlertCircle className="h-4 w-4 inline ml-2" />
                ابتدا لیدها را بارگذاری کنید
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {selectedLeads.length > 0 
                  ? `${selectedLeads.length} لید انتخاب شده برای تحلیل`
                  : `${stats.unassigned} لید واگذار نشده برای تحلیل`
                }
              </p>
            )}
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">امتیازدهی AI شامل:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>تحلیل احتمال خرید بر اساس رفتار کاربر</li>
                <li>دسته‌بندی به گروه‌های Hot / Warm / Cold</li>
                <li>پیشنهاد اولویت پیگیری</li>
              </ul>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => {
                console.log('AI Score Button clicked', { 
                  selectedCourse, 
                  leadsLength: leads.length, 
                  aiScoreLoading,
                  buttonDisabled: aiScoreLoading || !selectedCourse || leads.length === 0
                });
                if (!selectedCourse) {
                  toast({ title: "خطا", description: "ابتدا دوره انتخاب کنید", variant: "destructive" });
                  return;
                }
                if (leads.length === 0) {
                  toast({ title: "خطا", description: "ابتدا لیدها را بارگذاری کنید", variant: "destructive" });
                  return;
                }
                handleAiScoreLeads();
              }}
              disabled={aiScoreLoading}
            >
              {aiScoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {!selectedCourse ? 'انتخاب دوره' : leads.length === 0 ? 'بارگذاری لید' : 'شروع تحلیل'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Details Dialog */}
      <Dialog open={showLeadDetails} onOpenChange={setShowLeadDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              جزئیات لید
            </DialogTitle>
            <DialogDescription>اطلاعات کامل لید و وضعیت پرداخت</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 p-1">
                {/* Header with name and status */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">{selectedLead.full_name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {selectedLead.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  {getStatusBadge(selectedLead.payment_status)}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">اطلاعات تماس</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Phone className="h-4 w-4 text-primary" />
                        <a href={`tel:${formatPhone(selectedLead.phone)}`} className="text-primary hover:underline font-medium">
                          {formatPhone(selectedLead.phone)}
                        </a>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLead.email || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">اطلاعات ثبت‌نام</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(selectedLead.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{selectedLead.payment_amount?.toLocaleString()} تومان</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">دوره</h4>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="font-medium">{selectedLead.course_title}</p>
                  </div>
                </div>

                {/* Assignment Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">وضعیت واگذاری</h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    {selectedLead.is_assigned ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>واگذار شده به: </span>
                        <Badge variant="secondary">{selectedLead.assigned_agent_name}</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-muted-foreground">هنوز واگذار نشده</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => window.open(`tel:${formatPhone(selectedLead.phone)}`, '_self')}
                  >
                    <Phone className="h-4 w-4" />
                    تماس
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setSelectedLeads([selectedLead.id]);
                      setShowLeadDetails(false);
                      setShowManualAssign(true);
                    }}
                    disabled={selectedLead.is_assigned}
                  >
                    <UserPlus className="h-4 w-4" />
                    واگذاری
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Report Dialog */}
      <Dialog open={showAssignmentReport} onOpenChange={setShowAssignmentReport}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              گزارش واگذاری لیدها
            </DialogTitle>
            <DialogDescription>
              خلاصه واگذاری لیدها به کارشناسان
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 p-1">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {assignmentReportData.reduce((sum, item) => sum + item.leads.length, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">کل لیدهای واگذار شده</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{assignmentReportData.length}</p>
                    <p className="text-xs text-muted-foreground">کارشناس</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {assignmentReportData.reduce((sum, item) => 
                        sum + item.leads.reduce((s, l) => s + (l.payment_amount || 0), 0), 0
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">مجموع ارزش (تومان)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Per Agent Details */}
              {assignmentReportData.map(item => (
                <Card key={item.agent_id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {item.agent_name}
                      </div>
                      <Badge variant="secondary">{item.leads.length} لید</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>نام</TableHead>
                          <TableHead>تلفن</TableHead>
                          <TableHead>ایمیل</TableHead>
                          <TableHead>مبلغ</TableHead>
                          <TableHead>تاریخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.leads.map(lead => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.full_name}</TableCell>
                            <TableCell>
                              <a href={`tel:${formatPhone(lead.phone)}`} className="text-primary hover:underline flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatPhone(lead.phone)}
                              </a>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{lead.email || '-'}</TableCell>
                            <TableCell>{lead.payment_amount?.toLocaleString()} تومان</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowAssignmentReport(false)}>
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Transfer Dialog */}
      <Dialog open={bulkTransferDialogOpen} onOpenChange={setBulkTransferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              انتقال دسته‌جمعی لیدها
            </DialogTitle>
            <DialogDescription>
              انتقال لیدها از نماینده غیرفعال به نماینده فعال
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInactiveAgentId && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>نماینده مبدا:</strong>{' '}
                  {agentLeadCounts.find(a => a.agent_id === selectedInactiveAgentId)?.agent_name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>تعداد لیدها:</strong>{' '}
                  {agentLeadCounts.find(a => a.agent_id === selectedInactiveAgentId)?.count} لید
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>انتخاب نماینده مقصد (فعال)</Label>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <div className="space-y-2">
                  {(() => {
                    const activeAgents = agents.filter(a => a.is_active && a.id !== selectedInactiveAgentId);
                    const totalActiveLeads = agentLeadCounts
                      .filter(ac => ac.is_active && ac.agent_id !== selectedInactiveAgentId)
                      .reduce((sum, ac) => sum + ac.count, 0);
                    
                    return activeAgents.map((agent) => {
                      const agentCount = agentLeadCounts.find(ac => ac.agent_id === agent.id)?.count || 0;
                      const percentage = totalActiveLeads > 0 
                        ? Math.round((agentCount / totalActiveLeads) * 100) 
                        : 0;
                      const isSelected = targetAgentId === agent.id.toString();
                      
                      return (
                        <div
                          key={agent.id}
                          onClick={() => setTargetAgentId(agent.id.toString())}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-primary/10 border-2 border-primary' 
                              : 'bg-muted/50 hover:bg-muted border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full border-2 ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`}>
                              {isSelected && <div className="w-full h-full rounded-full bg-primary" />}
                            </div>
                            <span className="font-medium">{agent.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {agentCount} لید
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </ScrollArea>
              {!targetAgentId && (
                <p className="text-xs text-muted-foreground">یک نماینده فعال را برای انتقال انتخاب کنید</p>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  این عملیات تمام لیدهای نماینده غیرفعال را به نماینده انتخاب شده منتقل می‌کند. این عمل غیرقابل بازگشت است.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkTransferDialogOpen(false);
                  setSelectedInactiveAgentId(null);
                  setTargetAgentId('');
                }}
              >
                لغو
              </Button>
              <Button 
                onClick={handleBulkTransferLeads} 
                disabled={transferLoading || !targetAgentId}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {transferLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    در حال انتقال...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    انتقال لیدها
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimplifiedLeadManagement;
