import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Share2, 
  Users, 
  Percent, 
  Target, 
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  UserCheck,
  Copy,
  ArrowRightLeft,
  User,
  TrendingUp,
  BookOpen,
  Key,
  GraduationCap,
  MessageSquare,
  Settings,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';

interface Course {
  id: string;
  title: string;
}

interface SalesAgent {
  id: number;
  name: string;
  user_id: number;
}

interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_amount: number;
  payment_status: string;
  created_at: string;
  course_id: string;
  is_assigned?: boolean;
  assigned_agent_id?: number | null;
  assigned_agent_name?: string | null;
  chat_user_id?: number | null;
  crm_status?: 'none' | 'has_records' | 'has_calls';
  crm_creators?: string[];
}

interface PercentageDistribution {
  agent_id: number;
  agent_name: string;
  percentage: number;
}

interface PreviewData {
  agent_name: string;
  percentage: number;
  count: number;
}

const LeadDistributionSystem: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Basic state
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('paid');
  const [assignmentStatus, setAssignmentStatus] = useState<string>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>(
    localStorage.getItem('leadDistribution_selectedAgentFilter') || 'all'
  );
  const [crmFilter, setCrmFilter] = useState<string>('all');
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(
    localStorage.getItem('leadDistribution_removeDuplicates') === 'true'
  );
  
  // Percentage distribution
  const [percentages, setPercentages] = useState<PercentageDistribution[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [isDistributionEnabled, setIsDistributionEnabled] = useState(false);
  
  // Manual assignment
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [selectedAgentForBulk, setSelectedAgentForBulk] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  // Statistics
  const [totalCount, setTotalCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [unassignedCount, setUnassignedCount] = useState(0);
  
  // Available agents (filtered based on course)
  const [availableAgents, setAvailableAgents] = useState<SalesAgent[]>([]);

  // Move lead state
  const [moveLeadModal, setMoveLeadModal] = useState(false);
  const [selectedLeadForMove, setSelectedLeadForMove] = useState<string>('');
  const [newAgentForMove, setNewAgentForMove] = useState<string>('');
  const [currentAgentForMove, setCurrentAgentForMove] = useState<string>('');
  
  // Lead details modal state
  const [leadDetailsModal, setLeadDetailsModal] = useState(false);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Enrollment | null>(null);
  const [selectedLeadUserId, setSelectedLeadUserId] = useState<number | null>(null);
  const [selectedLeadUser, setSelectedLeadUser] = useState<any | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchSalesAgents();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments();
    }
  }, [selectedCourse, dateFrom, dateTo, paymentStatus, assignmentStatus, selectedAgentFilter, crmFilter, removeDuplicates]);

  useEffect(() => {
    localStorage.setItem('leadDistribution_removeDuplicates', removeDuplicates.toString());
  }, [removeDuplicates]);

  useEffect(() => {
    localStorage.setItem('leadDistribution_selectedAgentFilter', selectedAgentFilter);
  }, [selectedAgentFilter]);

  // Function to get CRM status indicator
  const getCRMStatusIcon = (crmStatus?: string) => {
    switch (crmStatus) {
      case 'has_calls':
        return '📞';
      case 'has_records':
        return '✅';
      case 'none':
      default:
        return '⚠️';
    }
  };

  const fetchUserDetails = async (userId: number) => {
    setLoadingUserDetails(true);
    try {
      const { data: userData, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setSelectedLeadUser(userData);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "خطا",
        description: "امکان بارگذاری اطلاعات کاربر وجود ندارد",
        variant: "destructive"
      });
    } finally {
      setLoadingUserDetails(false);
    }
  };

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
      toast({
        title: "خطا",
        description: "امکان بارگذاری دوره‌ها وجود ندارد",
        variant: "destructive"
      });
    }
  };

  const fetchSalesAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id, name')
        .eq('is_messenger_admin', true)
        .order('name');
      
      if (error) throw error;
      
      const agents = data?.map(agent => ({
        id: agent.id,
        name: agent.name,
        user_id: agent.id
      })) || [];
      
      setSalesAgents(agents);
      setAvailableAgents(agents);
      
      // Initialize percentages
      setPercentages(agents.map(agent => ({
        agent_id: agent.id,
        agent_name: agent.name,
        percentage: 0
      })));
    } catch (error) {
      console.error('Error fetching sales agents:', error);
      toast({
        title: "خطا",
        description: "امکان بارگذاری فروشندگان وجود ندارد",
        variant: "destructive"
      });
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      console.log('🔍 fetchEnrollments called with filters:', {
        selectedCourse,
        dateFrom,
        dateTo,
        paymentStatus,
        assignmentStatus,
        selectedAgentFilter,
        crmFilter,
        removeDuplicates
      });

      // Build the base query
      let query = supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', selectedCourse);

      // Apply filters
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }
      
      // Payment status filter
      if (paymentStatus !== 'all') {
        if (paymentStatus === 'paid') {
          query = query.in('payment_status', ['success', 'completed']);
        } else {
          query = query.eq('payment_status', paymentStatus);
        }
      }

      const { data: enrollmentData, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      console.log(`📊 Found ${enrollmentData?.length || 0} enrollments before processing`);

      let processedData = enrollmentData || [];

      // Remove duplicates if enabled
      if (removeDuplicates && processedData.length > 0) {
        const phoneSet = new Set<string>();
        const filteredData: typeof processedData = [];
        
        for (const enrollment of processedData) {
          const normalizedPhone = enrollment.phone?.replace(/\D/g, '') || '';
          if (!phoneSet.has(normalizedPhone) && normalizedPhone) {
            phoneSet.add(normalizedPhone);
            filteredData.push(enrollment);
          }
        }
        
        processedData = filteredData;
        console.log(`📞 After removing duplicates by phone: ${processedData.length} enrollments`);
      }

      // Get assignment information
      const enrollmentIds = processedData.map(e => e.id);
      let assignmentData: any[] = [];
      
      if (enrollmentIds.length > 0) {
        const { data: assignments, error: assignmentError } = await supabase
          .from('lead_assignments')
          .select(`
            enrollment_id,
            sales_agent_id,
            chat_users!inner(id, name)
          `)
          .in('enrollment_id', enrollmentIds);

        if (assignmentError) {
          console.error('Assignment fetch error:', assignmentError);
        } else {
          assignmentData = assignments || [];
        }
      }

      // Create assignment lookup
      const assignmentMap = assignmentData.reduce((acc, assignment) => {
        acc[assignment.enrollment_id] = {
          agentId: assignment.sales_agent_id,
          agentName: assignment.chat_users?.name
        };
        return acc;
      }, {} as Record<string, { agentId: number; agentName: string }>);

      // Fetch CRM status for each enrollment
      const enrollmentUserIds = processedData.map(e => e.chat_user_id).filter(id => id !== null);
      let crmStatusMap: Record<number, string> = {};
      let crmCreatorMap: Record<number, string[]> = {};
      
      if (enrollmentUserIds.length > 0) {
        // Get all CRM notes for these users with more comprehensive data
        const { data: crmData } = await supabase
          .from('crm_notes')
          .select('user_id, type, created_by')
          .in('user_id', enrollmentUserIds);

        // Build CRM status map and CRM creator map
        crmStatusMap = (crmData || []).reduce((acc, note) => {
          if (!acc[note.user_id] || acc[note.user_id] === 'none') {
            acc[note.user_id] = 'has_records';
          }
          if (note.type === 'call') {
            acc[note.user_id] = 'has_calls';
          }
          
          // Track CRM creators for this user
          if (!crmCreatorMap[note.user_id]) {
            crmCreatorMap[note.user_id] = [];
          }
          if (!crmCreatorMap[note.user_id].includes(note.created_by)) {
            crmCreatorMap[note.user_id].push(note.created_by);
          }
          
          return acc;
        }, {} as Record<number, string>);
      }

      // Create final data structure with all information
      const enrichedEnrollments: Enrollment[] = processedData.map(enrollment => {
        const assignmentInfo = assignmentMap[enrollment.id];
        return {
          ...enrollment,
          is_assigned: !!assignmentInfo,
          assigned_agent_id: assignmentInfo?.agentId || null,
          assigned_agent_name: assignmentInfo?.agentName || null,
          chat_user_id: enrollment.chat_user_id,
          crm_status: enrollment.chat_user_id ? (crmStatusMap[enrollment.chat_user_id] || 'none') as 'none' | 'has_records' | 'has_calls' : 'none',
          crm_creators: enrollment.chat_user_id ? (crmCreatorMap[enrollment.chat_user_id] || []) : []
        };
      });

      console.log('📈 Assignment mapping complete:', {
        totalEnrollments: enrichedEnrollments.length,
        assignedEnrollments: enrichedEnrollments.filter(e => e.is_assigned).length
      });

      let filteredEnrollments = enrichedEnrollments;

      // Apply sales agent filter
      if (selectedAgentFilter && selectedAgentFilter !== '' && selectedAgentFilter !== 'all') {
        const agentId = parseInt(selectedAgentFilter);
        
        // Find the agent's name from the sales agents list
        const selectedAgent = salesAgents.find(agent => agent.id === agentId);
        const agentName = selectedAgent?.name;
        
        filteredEnrollments = filteredEnrollments.filter(e => 
          // Either assigned to this agent
          e.assigned_agent_id === agentId ||
          // Or has CRM records created by this agent
          (agentName && e.crm_creators && e.crm_creators.includes(agentName))
        );
      }

      // Apply CRM status filter
      if (crmFilter !== 'all') {
        filteredEnrollments = filteredEnrollments.filter(e => e.crm_status === crmFilter);
      }

      // Apply assignment status filter
      if (assignmentStatus !== 'all') {
        if (assignmentStatus === 'assigned') {
          filteredEnrollments = filteredEnrollments.filter(e => e.is_assigned);
        } else if (assignmentStatus === 'unassigned') {
          filteredEnrollments = filteredEnrollments.filter(e => !e.is_assigned);
        }
      }

      // Update statistics
      const total = filteredEnrollments.length;
      const assigned = filteredEnrollments.filter(e => e.is_assigned).length;
      const unassigned = total - assigned;

      setTotalCount(total);
      setAssignedCount(assigned);
      setUnassignedCount(unassigned);
      setEnrollments(filteredEnrollments);

      console.log('📊 Final statistics:', { total, assigned, unassigned });

    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "خطا",
        description: "امکان بارگذاری ثبت‌نام‌ها وجود ندارد",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePercentagePreview = () => {
    console.log('🎯 generatePercentagePreview called!', { percentages, unassignedCount });
    
    const totalPercentage = percentages.reduce((sum, p) => sum + p.percentage, 0);
    if (totalPercentage !== 100) {
      console.log('❌ Invalid total percentage:', totalPercentage);
      toast({
        title: "خطا",
        description: "مجموع درصدها باید ۱۰۰٪ باشد",
        variant: "destructive"
      });
      return;
    }

    if (unassignedCount === 0) {
      console.log('❌ No unassigned leads');
      toast({
        title: "اطلاع",
        description: "لیدی برای توزیع وجود ندارد",
        variant: "default"
      });
      return;
    }

    const preview = percentages
      .filter(p => p.percentage > 0)
      .map(p => ({
        agent_name: p.agent_name,
        percentage: p.percentage,
        count: Math.round((unassignedCount * p.percentage) / 100)
      }));

    console.log('✅ Generated preview:', preview);
    setPreviewData(preview);
    setShowPreview(true);
  };

  const executePercentageDistribution = async () => {
    console.log('🚀 executePercentageDistribution called!', { selectedCourse, userId: user?.id, userObject: user, percentages, unassignedCount });
    
    if (!selectedCourse || !user?.id) {
      console.log('❌ Missing requirements:', { selectedCourse, userId: user?.id });
      toast({
        title: "خطا",
        description: "دوره انتخاب نشده یا کاربر وارد نشده",
        variant: "destructive"
      });
      return;
    }

    const totalPercentage = percentages.reduce((sum, p) => sum + p.percentage, 0);
    if (totalPercentage !== 100) {
      toast({
        title: "خطا",
        description: "مجموع درصدها باید ۱۰۰٪ باشد",
        variant: "destructive"
      });
      return;
    }

    if (unassignedCount === 0) {
      toast({
        title: "اطلاع",
        description: "لیدی برای توزیع وجود ندارد",
        variant: "default"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Starting percentage distribution...', { selectedCourse, userId: user.id });
      
      // Get the current user's chat_users ID for assigned_by field
      const assignedById = user.isMessengerUser && user.messengerData ? user.messengerData.id : parseInt(user.id);
      if (!assignedById) {
        throw new Error('Cannot determine user ID for assignment');
      }

      // Get unassigned enrollments
      let query = supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', selectedCourse)
        .in('payment_status', ['success', 'completed']);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data: allEnrollments, error: enrollmentError } = await query;
      if (enrollmentError) throw enrollmentError;

      console.log('📊 Found enrollments:', allEnrollments?.length);

      // Filter out assigned enrollments
      const { data: assignments, error: assignmentError } = await supabase
        .from('lead_assignments')
        .select('enrollment_id')
        .in('enrollment_id', allEnrollments?.map(e => e.id) || []);

      if (assignmentError) throw assignmentError;

      const assignedSet = new Set(assignments?.map(a => a.enrollment_id) || []);
      const unassignedEnrollments = allEnrollments?.filter(e => !assignedSet.has(e.id)) || [];

      console.log('📈 Distribution targets:', {
        totalFound: allEnrollments?.length,
        alreadyAssigned: assignments?.length,
        availableForDistribution: unassignedEnrollments.length
      });

      if (unassignedEnrollments.length === 0) {
        toast({
          title: "اطلاع",
          description: "لیدی برای توزیع وجود ندارد",
          variant: "default"
        });
        return;
      }

      // Shuffle enrollments for fair distribution
      const shuffledEnrollments = [...unassignedEnrollments].sort(() => Math.random() - 0.5);
      
      // Create assignments array
      const newAssignments: any[] = [];
      let currentIndex = 0;

      for (const agentPercent of percentages) {
        if (agentPercent.percentage > 0) {
          const agentLeadCount = Math.round((shuffledEnrollments.length * agentPercent.percentage) / 100);
          
          for (let i = 0; i < agentLeadCount && currentIndex < shuffledEnrollments.length; i++) {
            newAssignments.push({
              enrollment_id: shuffledEnrollments[currentIndex].id,
              sales_agent_id: agentPercent.agent_id,
              assigned_by: assignedById,
              assigned_at: new Date().toISOString(),
              assignment_type: 'percentage_distribution'
            });
            currentIndex++;
          }
        }
      }

      console.log('📤 Creating assignments:', newAssignments.length);

      // Insert assignments in batches
      const batchSize = 100;
      for (let i = 0; i < newAssignments.length; i += batchSize) {
        const batch = newAssignments.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('lead_assignments')
          .insert(batch);
        
        if (insertError) throw insertError;
        console.log(`✅ Inserted batch ${i / batchSize + 1}/${Math.ceil(newAssignments.length / batchSize)}`);
      }

      // Log the distribution
      for (const agentPercent of percentages.filter(p => p.percentage > 0)) {
        const agentAssignments = newAssignments.filter(a => a.sales_agent_id === agentPercent.agent_id);
        
        await supabase.from('lead_distribution_logs').insert({
          course_id: selectedCourse,
          sales_agent_id: agentPercent.agent_id,
          admin_id: assignedById,
          count: agentAssignments.length,
          method: 'percentage_distribution',
          note: `توزیع درصدی: ${agentPercent.percentage}٪`
        });
      }

      console.log('🎉 Distribution completed successfully!');
      
      toast({
        title: "موفقیت",
        description: `${newAssignments.length} لید با موفقیت توزیع شد`,
        variant: "default"
      });

      setShowPreview(false);
      fetchEnrollments(); // Refresh data

    } catch (error) {
      console.error('❌ Distribution error:', error);
      toast({
        title: "خطا",
        description: "خطا در توزیع لیدها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const executeManualAssignment = async () => {
    console.log('🖱️ executeManualAssignment called!', { selectedEnrollments: selectedEnrollments.length, selectedAgentForBulk, note, loading });
    
    if (!selectedCourse || !user?.id) {
      toast({
        title: "خطا",
        description: "دوره انتخاب نشده یا کاربر وارد نشده",
        variant: "destructive"
      });
      return;
    }

    if (selectedEnrollments.length === 0 || !selectedAgentForBulk) {
      toast({
        title: "خطا",
        description: "لطفا ثبت‌نام‌هایی را انتخاب کرده و فروشنده را مشخص کنید",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Starting manual assignment...', { enrollmentCount: selectedEnrollments.length, agentId: selectedAgentForBulk });
      
      // Get the current user's chat_users ID for assigned_by field
      const assignedById = user.isMessengerUser && user.messengerData ? user.messengerData.id : parseInt(user.id);
      if (!assignedById) {
        throw new Error('Cannot determine user ID for assignment');
      }

      // Check if any of the selected enrollments are already assigned
      const { data: existingAssignments } = await supabase
        .from('lead_assignments')
        .select('enrollment_id')
        .in('enrollment_id', selectedEnrollments);

      const alreadyAssigned = existingAssignments?.map(a => a.enrollment_id) || [];
      const newEnrollments = selectedEnrollments.filter(id => !alreadyAssigned.includes(id));

      if (newEnrollments.length === 0) {
        toast({
          title: "اطلاع",
          description: "همه ثبت‌نام‌های انتخابی قبلاً واگذار شده‌اند",
          variant: "default"
        });
        return;
      }

      // Create assignments
      const assignments = newEnrollments.map(enrollmentId => ({
        enrollment_id: enrollmentId,
        sales_agent_id: parseInt(selectedAgentForBulk),
        assigned_by: assignedById,
        assigned_at: new Date().toISOString(),
        assignment_type: 'manual'
      }));

      console.log('📤 Creating manual assignments:', assignments.length);

      const { error: insertError } = await supabase
        .from('lead_assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      // Log the distribution
      await supabase.from('lead_distribution_logs').insert({
        course_id: selectedCourse,
        sales_agent_id: parseInt(selectedAgentForBulk),
        admin_id: assignedById,
        count: newEnrollments.length,
        method: 'manual',
        note: note || 'واگذاری دستی'
      });

      console.log('🎉 Manual assignment completed successfully!');
      
      const assignedAgent = salesAgents.find(a => a.id === parseInt(selectedAgentForBulk));
      toast({
        title: "موفقیت",
        description: `${newEnrollments.length} لید به ${assignedAgent?.name} واگذار شد`,
        variant: "default"
      });

      setSelectedEnrollments([]);
      setSelectedAgentForBulk('');
      setNote('');
      fetchEnrollments(); // Refresh data

    } catch (error) {
      console.error('❌ Manual assignment error:', error);
      toast({
        title: "خطا",
        description: "خطا در واگذاری دستی لیدها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const moveLeadToNewAgent = async () => {
    console.log('🚚 moveLeadToNewAgent called!', { selectedLeadForMove, newAgentForMove, loading });
    
    if (!selectedLeadForMove || !newAgentForMove || !user?.id) {
      toast({
        title: "خطا",
        description: "لطفا لید و فروشنده جدید را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Starting lead transfer...', { leadId: selectedLeadForMove, newAgentId: newAgentForMove });
      
      // Get the current user's chat_users ID for assigned_by field
      const assignedById = user.isMessengerUser && user.messengerData ? user.messengerData.id : parseInt(user.id);
      if (!assignedById) {
        throw new Error('Cannot determine user ID for assignment');
      }

      // Update the assignment
      const { error: updateError } = await supabase
        .from('lead_assignments')
        .update({
          sales_agent_id: parseInt(newAgentForMove),
          assigned_by: assignedById,
          assigned_at: new Date().toISOString(),
          assignment_type: 'moved'
        })
        .eq('enrollment_id', selectedLeadForMove);

      if (updateError) throw updateError;

      // Log the move
      await supabase.from('lead_distribution_logs').insert({
        course_id: selectedCourse,
        sales_agent_id: parseInt(newAgentForMove),
        admin_id: assignedById,
        count: 1,
        method: 'moved',
        note: `انتقال از ${currentAgentForMove}`
      });

      console.log('🎉 Lead transfer completed successfully!');
      
      const newAgent = salesAgents.find(a => a.id === parseInt(newAgentForMove));
      toast({
        title: "موفقیت",
        description: `لید به ${newAgent?.name} منتقل شد`,
        variant: "default"
      });

      setMoveLeadModal(false);
      setSelectedLeadForMove('');
      setNewAgentForMove('');
      setCurrentAgentForMove('');
      fetchEnrollments(); // Refresh data

    } catch (error) {
      console.error('❌ Lead transfer error:', error);
      toast({
        title: "خطا",
        description: "خطا در انتقال لید",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMove = async () => {
    console.log('🚚 handleBulkMove called!', { selectedEnrollments: selectedEnrollments.length, selectedAgentForBulk, loading });
    
    if (!selectedCourse || !user?.id) {
      toast({
        title: "خطا",
        description: "دوره انتخاب نشده یا کاربر وارد نشده",
        variant: "destructive"
      });
      return;
    }

    if (selectedEnrollments.length === 0 || !selectedAgentForBulk) {
      toast({
        title: "خطا",
        description: "لطفا ثبت‌نام‌هایی را انتخاب کرده و فروشنده را مشخص کنید",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Starting bulk move...', { enrollmentCount: selectedEnrollments.length, agentId: selectedAgentForBulk });
      
      // Get the current user's chat_users ID for assigned_by field
      const assignedById = user.isMessengerUser && user.messengerData ? user.messengerData.id : parseInt(user.id);
      if (!assignedById) {
        throw new Error('Cannot determine user ID for assignment');
      }

      // Update existing assignments
      const { error: updateError } = await supabase
        .from('lead_assignments')
        .update({
          sales_agent_id: parseInt(selectedAgentForBulk),
          assigned_by: assignedById,
          assigned_at: new Date().toISOString(),
          assignment_type: 'bulk_moved'
        })
        .in('enrollment_id', selectedEnrollments);

      if (updateError) throw updateError;

      // Log the bulk move
      await supabase.from('lead_distribution_logs').insert({
        course_id: selectedCourse,
        sales_agent_id: parseInt(selectedAgentForBulk),
        admin_id: assignedById,
        count: selectedEnrollments.length,
        method: 'bulk_moved',
        note: 'انتقال گروهی لیدها'
      });

      console.log('🎉 Bulk move completed successfully!');
      
      const assignedAgent = salesAgents.find(a => a.id === parseInt(selectedAgentForBulk));
      toast({
        title: "موفقیت",
        description: `${selectedEnrollments.length} لید به ${assignedAgent?.name} منتقل شد`,
        variant: "default"
      });

      setSelectedEnrollments([]);
      setSelectedAgentForBulk('');
      fetchEnrollments(); // Refresh data

    } catch (error) {
      console.error('❌ Bulk move error:', error);
      toast({
        title: "خطا",
        description: "خطا در انتقال گروهی لیدها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            سیستم توزیع لیدها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="percentage" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="percentage" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                توزیع درصدی
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                واگذاری دستی
              </TabsTrigger>
            </TabsList>

            <TabsContent value="percentage" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="course">دوره</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب دوره" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFrom">از تاریخ</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">تا تاریخ</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentStatus">وضعیت پرداخت</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="paid">پرداخت شده</SelectItem>
                      <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignmentStatus">وضعیت واگذاری</Label>
                  <Select value={assignmentStatus} onValueChange={setAssignmentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="assigned">واگذار شده</SelectItem>
                      <SelectItem value="unassigned">واگذار نشده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="crmFilter">فیلتر CRM</Label>
                  <Select value={crmFilter} onValueChange={setCrmFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="has_calls">دارای تماس</SelectItem>
                      <SelectItem value="has_records">دارای یادداشت</SelectItem>
                      <SelectItem value="none">بدون یادداشت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="removeDuplicates"
                  checked={removeDuplicates}
                  onCheckedChange={setRemoveDuplicates}
                />
                <Label htmlFor="removeDuplicates">حذف موارد تکراری بر اساس شماره تلفن</Label>
              </div>

              {selectedCourse && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">کل ثبت‌نام‌ها</p>
                          <p className="text-2xl font-bold">{totalCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">واگذار شده</p>
                          <p className="text-2xl font-bold">{assignedCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">واگذار نشده</p>
                          <p className="text-2xl font-bold">{unassignedCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">فروشندگان</p>
                          <p className="text-2xl font-bold">{availableAgents.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedCourse && unassignedCount > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">تنظیم درصد توزیع</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="distributionEnabled"
                        checked={isDistributionEnabled}
                        onCheckedChange={setIsDistributionEnabled}
                      />
                      <Label htmlFor="distributionEnabled">فعال‌سازی توزیع</Label>
                    </div>
                  </div>

                  {isDistributionEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {percentages.map((agent, index) => (
                        <Card key={agent.agent_id}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">{agent.agent_name}</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={agent.percentage}
                                  onChange={(e) => {
                                    const newPercentages = [...percentages];
                                    newPercentages[index].percentage = parseInt(e.target.value) || 0;
                                    setPercentages(newPercentages);
                                  }}
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                                <span className="text-xs text-muted-foreground">
                                  (~{Math.round((unassignedCount * agent.percentage) / 100)} لید)
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {isDistributionEnabled && (
                    <div className="flex items-center gap-4 pt-4">
                      <div className="text-sm">
                        مجموع: <span className="font-medium">{percentages.reduce((sum, p) => sum + p.percentage, 0)}%</span>
                      </div>
                      <Button
                        onClick={() => {
                          console.log('🎯 Preview button clicked!', { percentages, unassignedCount });
                          generatePercentagePreview();
                        }}
                        disabled={loading || percentages.reduce((sum, p) => sum + p.percentage, 0) !== 100}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        پیش‌نمایش توزیع
                      </Button>
                    </div>
                  )}

                  {/* Preview Dialog */}
                  {showPreview && (
                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>پیش‌نمایش توزیع</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {previewData.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium">{item.agent_name}</p>
                                <p className="text-sm text-muted-foreground">{item.percentage}%</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">{item.count}</p>
                                <p className="text-xs text-muted-foreground">لید</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={() => {
                                console.log('🚀 Execute Distribution button clicked!', { previewData, loading });
                                executePercentageDistribution();
                              }}
                              disabled={loading}
                              className="flex-1"
                            >
                              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              اجرای توزیع
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowPreview(false)}
                            >
                              انصراف
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="course">دوره</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب دوره" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFrom">از تاریخ</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">تا تاریخ</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentStatus">وضعیت پرداخت</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="paid">پرداخت شده</SelectItem>
                      <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignmentStatus">وضعیت واگذاری</Label>
                  <Select value={assignmentStatus} onValueChange={setAssignmentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="assigned">واگذار شده</SelectItem>
                      <SelectItem value="unassigned">واگذار نشده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salesAgentFilter">فیلتر بر اساس فروشنده</Label>
                  <Select value={selectedAgentFilter} onValueChange={setSelectedAgentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="همه فروشندگان" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه فروشندگان</SelectItem>
                      {salesAgents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="crmFilter">فیلتر CRM</Label>
                  <Select value={crmFilter} onValueChange={setCrmFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="has_calls">دارای تماس</SelectItem>
                      <SelectItem value="has_records">دارای یادداشت</SelectItem>
                      <SelectItem value="none">بدون یادداشت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="removeDuplicates"
                  checked={removeDuplicates}
                  onCheckedChange={setRemoveDuplicates}
                />
                <Label htmlFor="removeDuplicates">حذف موارد تکراری بر اساس شماره تلفن</Label>
              </div>

              {selectedCourse && enrollments.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          کل: {totalCount} | واگذار شده: {assignedCount} | واگذار نشده: {unassignedCount}
                        </span>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-end">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs sm:text-sm w-fit self-end sm:self-auto">
                          فیلتر شده
                        </Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {selectedEnrollments.length} انتخاب شده
                        </span>
                      </div>
                    </div>
                    
                    {selectedEnrollments.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-3 mt-3 justify-end" dir="rtl">
                        <Select value={selectedAgentForBulk} onValueChange={setSelectedAgentForBulk}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="انتخاب فروشنده" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAgents.map(agent => (
                              <SelectItem key={agent.id} value={agent.id.toString()}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            console.log('🖱️ Manual Assignment button clicked!', { selectedAgentForBulk, selectedEnrollments: selectedEnrollments.length, loading });
                            executeManualAssignment();
                          }}
                          disabled={!selectedAgentForBulk || loading}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                          واگذاری ({selectedEnrollments.length})
                        </Button>
                        <Button
                          onClick={handleBulkMove}
                          disabled={!selectedAgentForBulk || loading}
                          size="sm"
                          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                          انتقال ({selectedEnrollments.length})
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg overflow-x-auto">
                    <div className="min-w-[1200px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedEnrollments.length === enrollments.length}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEnrollments(enrollments.map(e => e.id));
                                  } else {
                                    setSelectedEnrollments([]);
                                  }
                                }}
                              />
                            </TableHead>
                              <TableHead className="min-w-[150px]">نام</TableHead>
                              <TableHead className="min-w-[200px]">ایمیل</TableHead>
                              <TableHead className="min-w-[120px]">تلفن</TableHead>
                              <TableHead className="min-w-[100px]">مبلغ</TableHead>
                              <TableHead className="min-w-[120px]">وضعیت پرداخت</TableHead>
                              <TableHead className="min-w-[60px] text-center">CRM</TableHead>
                              <TableHead className="min-w-[100px]">تاریخ ثبت‌نام</TableHead>
                              <TableHead className="min-w-[150px]">فروشنده واگذاری</TableHead>
                              <TableHead className="min-w-[120px]">وضعیت واگذاری</TableHead>
                              <TableHead className="min-w-[120px]">عملیات</TableHead>
                           </TableRow>
                         </TableHeader>
                       <TableBody>
                         {enrollments.map((enrollment) => (
                           <TableRow key={enrollment.id}>
                             <TableCell>
                               <Checkbox
                                 checked={selectedEnrollments.includes(enrollment.id)}
                                 onCheckedChange={(checked) => {
                                   if (checked) {
                                     setSelectedEnrollments(prev => [...prev, enrollment.id]);
                                   } else {
                                     setSelectedEnrollments(prev => prev.filter(id => id !== enrollment.id));
                                   }
                                 }}
                               />
                             </TableCell>
                               <TableCell className="font-medium">{enrollment.full_name}</TableCell>
                               <TableCell className="text-sm">{enrollment.email}</TableCell>
                               <TableCell className="text-sm">{enrollment.phone}</TableCell>
                               <TableCell className="text-sm">{enrollment.payment_amount.toLocaleString()} تومان</TableCell>
                               <TableCell>
                                 <Badge variant={
                                   enrollment.payment_status === 'success' || enrollment.payment_status === 'completed' 
                                     ? "default" 
                                     : enrollment.payment_status === 'pending' 
                                       ? "secondary" 
                                       : "destructive"
                                 } className="text-xs">
                                   {enrollment.payment_status === 'success' || enrollment.payment_status === 'completed' 
                                     ? "پرداخت شده" 
                                     : enrollment.payment_status === 'pending' 
                                       ? "در انتظار پرداخت" 
                                       : "لغو شده"}
                                 </Badge>
                               </TableCell>
                               <TableCell className="text-center text-lg">
                                 <span title={
                                   enrollment.crm_status === 'has_calls' ? 'دارای تماس تلفنی' :
                                   enrollment.crm_status === 'has_records' ? 'دارای یادداشت CRM' :
                                   'بدون یادداشت CRM'
                                 }>
                                   {getCRMStatusIcon(enrollment.crm_status)}
                                 </span>
                               </TableCell>
                               <TableCell className="text-sm">{format(new Date(enrollment.created_at), 'yyyy/MM/dd')}</TableCell>
                               <TableCell>
                                 {enrollment.assigned_agent_name ? (
                                   <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs">
                                     {enrollment.assigned_agent_name}
                                   </Badge>
                                 ) : (
                                   <Badge variant="secondary" className="text-xs">
                                     واگذار نشده
                                   </Badge>
                                 )}
                               </TableCell>
                                <TableCell>
                                  <Badge variant={enrollment.is_assigned ? "default" : "secondary"} className="text-xs">
                                    {enrollment.is_assigned ? "واگذار شده" : "واگذار نشده"}
                                  </Badge>
                                </TableCell>
                               <TableCell>
                                 <div className="flex gap-1">
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => {
                                       setSelectedLeadDetails(enrollment);
                                       setSelectedLeadUserId(enrollment.chat_user_id);
                                       setLeadDetailsModal(true);
                                       if (enrollment.chat_user_id) {
                                         fetchUserDetails(enrollment.chat_user_id);
                                       }
                                     }}
                                     className="text-xs px-2 py-1"
                                   >
                                     <Eye className="h-3 w-3 mr-1" />
                                     <span className="hidden sm:inline">جزئیات</span>
                                   </Button>
                                   {enrollment.is_assigned && (
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => {
                                         console.log('🚨 MOVE BUTTON CLICKED (in table)!', { enrollmentId: enrollment.id, enrollmentName: enrollment.full_name });
                                         setSelectedLeadForMove(enrollment.id);
                                         setCurrentAgentForMove(enrollment.assigned_agent_name || '');
                                         setMoveLeadModal(true);
                                       }}
                                       className="text-xs px-2 py-1"
                                     >
                                       <ArrowRightLeft className="h-3 w-3 mr-1" />
                                       <span className="hidden sm:inline">انتقال</span>
                                     </Button>
                                   )}
                                 </div>
                               </TableCell>
                            </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                    </div>
                  </div>

                  {selectedEnrollments.length > 0 && (
                    <div className="space-y-3">
                      <Label htmlFor="manualNote">یادداشت (اختیاری)</Label>
                      <Textarea
                        id="manualNote"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="یادداشت برای این واگذاری..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Move Lead Modal */}
      <Dialog open={moveLeadModal} onOpenChange={setMoveLeadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>انتقال لید به فروشنده جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">فروشنده فعلی:</Label>
              <p className="text-sm text-muted-foreground">{currentAgentForMove}</p>
            </div>
            
            <div>
              <Label htmlFor="newAgent">فروشنده جدید:</Label>
              <Select value={newAgentForMove} onValueChange={setNewAgentForMove}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب فروشنده جدید" />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setMoveLeadModal(false)}
                className="flex-1"
              >
                انصراف
              </Button>
              <Button
                onClick={() => {
                  console.log('🚨 MOVE BUTTON CLICKED!', { selectedLeadForMove, newAgentForMove, loading });
                  moveLeadToNewAgent();
                }}
                disabled={!newAgentForMove || loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                انتقال لید
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Details Modal */}
      <Dialog open={leadDetailsModal} onOpenChange={setLeadDetailsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              جزئیات لید - {selectedLeadDetails?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedLeadDetails && selectedLeadUserId && (
            <div className="space-y-4">
              {/* Basic Info Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">نام:</Label>
                      <p className="text-sm text-muted-foreground">{selectedLeadDetails.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">ایمیل:</Label>
                      <p className="text-sm text-muted-foreground">{selectedLeadDetails.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">تلفن:</Label>
                      <p className="text-sm text-muted-foreground">{selectedLeadDetails.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">مبلغ پرداخت:</Label>
                      <p className="text-sm text-muted-foreground">{selectedLeadDetails.payment_amount.toLocaleString()} تومان</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">وضعیت پرداخت:</Label>
                      <Badge variant={
                        selectedLeadDetails.payment_status === 'success' || selectedLeadDetails.payment_status === 'completed' 
                          ? "default" 
                          : selectedLeadDetails.payment_status === 'pending' 
                            ? "secondary" 
                            : "destructive"
                      }>
                        {selectedLeadDetails.payment_status === 'success' || selectedLeadDetails.payment_status === 'completed' 
                          ? "پرداخت شده" 
                          : selectedLeadDetails.payment_status === 'pending' 
                            ? "در انتظار پرداخت" 
                            : "لغو شده"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">تاریخ ثبت‌نام:</Label>
                      <p className="text-sm text-muted-foreground">{format(new Date(selectedLeadDetails.created_at), 'yyyy/MM/dd HH:mm')}</p>
                    </div>
                    {selectedLeadDetails.assigned_agent_name && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">فروشنده واگذاری:</Label>
                        <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 mt-1">
                          {selectedLeadDetails.assigned_agent_name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto">
                  <TabsTrigger value="overview" className="flex items-center gap-1 text-xs md:text-sm">
                    <User className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">اطلاعات کلی</span>
                    <span className="sm:hidden">کلی</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-1 text-xs md:text-sm">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">فعالیت</span>
                    <span className="sm:hidden">فعالیت</span>
                  </TabsTrigger>
                  <TabsTrigger value="enrollments" className="flex items-center gap-1 text-xs md:text-sm">
                    <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">ثبت‌نام‌ها</span>
                    <span className="sm:hidden">ثبت‌نام</span>
                  </TabsTrigger>
                  <TabsTrigger value="licenses" className="flex items-center gap-1 text-xs md:text-sm">
                    <Key className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">لایسنس‌ها</span>
                    <span className="sm:hidden">لایسنس</span>
                  </TabsTrigger>
                  <TabsTrigger value="crm" className="flex items-center gap-1 text-xs md:text-sm">
                    <Phone className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">CRM</span>
                    <span className="sm:hidden">CRM</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {loadingUserDetails ? (
                    <div className="text-center py-8">در حال بارگذاری...</div>
                  ) : selectedLeadUser ? (
                    <UserOverview user={selectedLeadUser} />
                  ) : (
                    <div className="text-center py-8">خطا در بارگذاری اطلاعات کاربر</div>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  {selectedLeadUserId && (
                    <UserActivity userId={selectedLeadUserId} />
                  )}
                </TabsContent>

                <TabsContent value="enrollments" className="space-y-4">
                  {selectedLeadUserId && (
                    <UserEnrollments userId={selectedLeadUserId} />
                  )}
                </TabsContent>

                <TabsContent value="licenses" className="space-y-4">
                  {selectedLeadUserId && selectedLeadDetails && (
                    <UserLicenses userId={selectedLeadUserId} userPhone={selectedLeadDetails.phone} />
                  )}
                </TabsContent>

                <TabsContent value="crm" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      یادداشت‌های CRM و تماس‌ها
                    </h3>
                    {/* This will be handled by CRM component, but for now show basic enrollment info */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <p><strong>ID ثبت‌نام:</strong> {selectedLeadDetails.id}</p>
                          <p><strong>ID کاربر چت:</strong> {selectedLeadUserId}</p>
                          <p><strong>وضعیت CRM:</strong> {
                            selectedLeadDetails.crm_status === 'has_calls' ? '📞 دارای تماس تلفنی' :
                            selectedLeadDetails.crm_status === 'has_records' ? '📝 دارای یادداشت CRM' :
                            '❌ بدون یادداشت CRM'
                          }</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLeadDetailsModal(false);
                    setSelectedLeadDetails(null);
                    setSelectedLeadUserId(null);
                  }}
                >
                  بستن
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadDistributionSystem;