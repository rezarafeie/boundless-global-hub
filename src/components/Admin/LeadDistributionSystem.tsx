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
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

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
  course_title: string;
  payment_amount: number;
  payment_status: string;
  created_at: string;
  is_assigned: boolean;
}

interface PercentageDistribution {
  agent_id: number;
  agent_name: string;
  percentage: number;
}

interface DistributionPreview {
  agent_name: string;
  count: number;
  percentage: number;
}

const LeadDistributionSystem: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [percentages, setPercentages] = useState<PercentageDistribution[]>([]);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<DistributionPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Manual assignment state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [manualLoading, setManualLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [assignmentStatus, setAssignmentStatus] = useState<string>('all');
  const [note, setNote] = useState<string>('');
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);

  // Deal creation state
  const [dealCourse, setDealCourse] = useState<string>('');
  const [dealPrice, setDealPrice] = useState<string>('');
  const [createDeals, setCreateDeals] = useState<boolean>(true);

  useEffect(() => {
    fetchCourses();
    fetchSalesAgents();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchUnassignedCount();
      // Fetch agents with access to this course and reset percentages
      fetchCourseAgents(selectedCourse);
    }
  }, [selectedCourse, dateFrom, dateTo]);

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
        description: "خطا در دریافت دوره‌ها",
        variant: "destructive"
      });
    }
  };

  const fetchSalesAgents = async () => {
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
        name: (agent as any).chat_users.name,
        user_id: agent.user_id
      })) || [];
      
      setSalesAgents(agentsData);
      
      // Initialize percentages - will be filtered by course access later
      setPercentages([]);
    } catch (error) {
      console.error('Error fetching sales agents:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت فروشندگان",
        variant: "destructive"
      });
    }
  };

  // New function to fetch agents with access to specific course
  const fetchCourseAgents = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_agent_courses')
        .select(`
          sales_agents!inner(
            id,
            user_id,
            is_active,
            chat_users!inner(name)
          )
        `)
        .eq('course_id', courseId)
        .eq('sales_agents.is_active', true);

      if (error) throw error;
      
      const courseAgents = data?.map(item => ({
        id: (item as any).sales_agents.id,
        name: (item as any).sales_agents.chat_users.name,
        user_id: (item as any).sales_agents.user_id
      })) || [];
      
      // Initialize percentages for agents with course access
      setPercentages(courseAgents.map(agent => ({
        agent_id: agent.id,
        agent_name: agent.name,
        percentage: 0
      })));
      
      return courseAgents;
    } catch (error) {
      console.error('Error fetching course agents:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت فروشندگان دوره",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchUnassignedCount = async () => {
    if (!selectedCourse) return;

    try {
      let query = supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', selectedCourse)
        .in('payment_status', ['success', 'completed']);

      // Add date filters if specified
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { count, error } = await query;
      if (error) throw error;

      // Now check which ones are not assigned
      const { data: assignedIds, error: assignedError } = await supabase
        .from('lead_assignments')
        .select('enrollment_id')
        .not('enrollment_id', 'is', null);

      if (assignedError) throw assignedError;

      const assignedSet = new Set(assignedIds?.map(a => a.enrollment_id) || []);
      
      // Get all enrollments for this course to filter out assigned ones
      let enrollmentQuery = supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', selectedCourse)
        .in('payment_status', ['success', 'completed']);

      if (dateFrom) {
        enrollmentQuery = enrollmentQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        enrollmentQuery = enrollmentQuery.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data: allEnrollments, error: enrollmentError } = await enrollmentQuery;
      if (enrollmentError) throw enrollmentError;

      const unassigned = allEnrollments?.filter(e => !assignedSet.has(e.id)) || [];
      setUnassignedCount(unassigned.length);

    } catch (error) {
      console.error('Error fetching unassigned count:', error);
      setUnassignedCount(0);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedCourse) return;

    setManualLoading(true);
    try {
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          email,
          phone,
          payment_amount,
          payment_status,
          created_at,
          courses!inner(title)
        `)
        .eq('course_id', selectedCourse);

      // Add payment status filter
      if (paymentStatus === 'all') {
        query = query.in('payment_status', ['success', 'completed', 'pending', 'cancelled_payment']);
      } else if (paymentStatus === 'paid') {
        query = query.in('payment_status', ['success', 'completed']);
      } else if (paymentStatus === 'pending') {
        query = query.in('payment_status', ['pending']);
      } else if (paymentStatus === 'cancelled') {
        query = query.in('payment_status', ['cancelled_payment']);
      }

      // Add date filters
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Conditionally remove duplicates by email and phone (keep the latest one)
      let processedData = data || [];
      
      if (removeDuplicates) {
        const uniqueEnrollments = data?.reduce((acc, enrollment) => {
          const key = `${enrollment.email}-${enrollment.phone}`;
          const existing = acc.get(key);
          
          if (!existing || new Date(enrollment.created_at) > new Date(existing.created_at)) {
            acc.set(key, enrollment);
          }
          
          return acc;
        }, new Map()) || new Map();

        processedData = Array.from(uniqueEnrollments.values());
      }

      // Check which ones are assigned
      const enrollmentIds = processedData.map(e => e.id);
      const { data: assignments, error: assignmentError } = await supabase
        .from('lead_assignments')
        .select('enrollment_id')
        .in('enrollment_id', enrollmentIds);

      if (assignmentError) throw assignmentError;

      const assignedSet = new Set(assignments?.map(a => a.enrollment_id) || []);

      const formattedEnrollments = processedData.map(enrollment => ({
        id: enrollment.id,
        full_name: enrollment.full_name,
        email: enrollment.email,
        phone: enrollment.phone,
        course_title: (enrollment as any).courses.title,
        payment_amount: enrollment.payment_amount,
        payment_status: enrollment.payment_status,
        created_at: enrollment.created_at,
        is_assigned: assignedSet.has(enrollment.id)
      }));

      // Apply assignment status filter
      let filteredEnrollments = formattedEnrollments;
      if (assignmentStatus === 'assigned') {
        filteredEnrollments = formattedEnrollments.filter(e => e.is_assigned);
      } else if (assignmentStatus === 'unassigned') {
        filteredEnrollments = formattedEnrollments.filter(e => !e.is_assigned);
      }

      setEnrollments(filteredEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت ثبت‌نام‌ها",
        variant: "destructive"
      });
    } finally {
      setManualLoading(false);
    }
  };

  const handlePercentageChange = (agentId: number, value: string) => {
    const percentage = parseFloat(value) || 0;
    setPercentages(prev => 
      prev.map(p => 
        p.agent_id === agentId 
          ? { ...p, percentage }
          : p
      )
    );
  };

  const getTotalPercentage = () => {
    return percentages.reduce((sum, p) => sum + p.percentage, 0);
  };

  const generatePreview = () => {
    console.log('🔍 generatePreview called!', { 
      totalPercentage: getTotalPercentage(), 
      unassignedCount,
      percentages: percentages.filter(p => p.percentage > 0)
    });
    
    const total = getTotalPercentage();
    if (total !== 100) {
      console.log('❌ Invalid percentage total:', total);
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

      console.log('📊 Unassigned enrollments:', unassignedEnrollments.length);

      if (unassignedEnrollments.length === 0) {
        toast({
          title: "اطلاع",
          description: "لیدی برای توزیع وجود ندارد",
          variant: "default"
        });
        return;
      }

      // Shuffle the array for random distribution
      const shuffled = [...unassignedEnrollments].sort(() => Math.random() - 0.5);

      // Distribute based on percentages
      let currentIndex = 0;
      let totalAssigned = 0;
      const errors: string[] = [];

      for (const distribution of percentages) {
        if (distribution.percentage === 0) continue;

        const count = Math.round((shuffled.length * distribution.percentage) / 100);
        const enrollmentsToAssign = shuffled.slice(currentIndex, currentIndex + count);

        console.log(`📊 Assigning ${enrollmentsToAssign.length} leads to agent ${distribution.agent_name}`);

        // Assign these enrollments to the agent
        let successCount = 0;
        for (const enrollment of enrollmentsToAssign) {
          try {
            const agentUserId = salesAgents.find(a => a.id === distribution.agent_id)?.user_id;
            if (!agentUserId) {
              console.error('❌ Agent user ID not found for agent:', distribution.agent_id);
              errors.push(`فروشنده با شناسه ${distribution.agent_id} یافت نشد`);
              continue;
            }

            console.log(`🔄 Assigning enrollment ${enrollment.id} to agent ${distribution.agent_name} (user_id: ${agentUserId})`);

            const rpcFunction = createDeals ? 'distribute_lead_and_create_deal' : 'distribute_lead_to_agent';
            const rpcParams: any = {
              p_enrollment_id: enrollment.id,
              p_agent_user_id: agentUserId,
              p_assigned_by: assignedById
            };

            // Add deal-specific parameters if creating deals
            if (createDeals) {
              rpcParams.p_deal_course_id = dealCourse || selectedCourse;
              rpcParams.p_deal_price = parseFloat(dealPrice) || 0;
            }

            const { error: assignError } = await supabase.rpc(rpcFunction, rpcParams);

            if (assignError) {
              console.error('❌ RPC Error assigning lead:', assignError);
              errors.push(`خطا در واگذاری لید ${enrollment.id}: ${assignError.message}`);
            } else {
              successCount++;
              console.log('✅ Successfully assigned lead:', enrollment.id);
            }
          } catch (err) {
            console.error('❌ Exception assigning lead:', err);
            errors.push(`خطا در واگذاری لید ${enrollment.id}: ${err}`);
          }
        }

        // Log the distribution
        if (successCount > 0) {
          try {
            console.log(`📝 Logging distribution: agent_id=${distribution.agent_id}, admin_id=${assignedById}, count=${successCount}`);
            
            const { error: logError } = await supabase
              .from('lead_distribution_logs')
              .insert({
                admin_id: assignedById,
                sales_agent_id: distribution.agent_id,
                method: 'percentage',
                course_id: selectedCourse,
                count: successCount,
                note: note || null
              });

            if (logError) {
              console.error('❌ Error logging distribution:', logError);
              errors.push(`خطا در ثبت لاگ: ${logError.message}`);
            } else {
              console.log('✅ Successfully logged distribution');
            }
          } catch (err) {
            console.error('❌ Exception logging distribution:', err);
            errors.push(`خطا در ثبت لاگ: ${err}`);
          }
        }

        totalAssigned += successCount;
        currentIndex += count;
      }

      if (errors.length > 0) {
        console.error('❌ Distribution completed with errors:', errors);
        toast({
          title: "توزیع با خطا",
          description: `${totalAssigned} لید توزیع شد، اما ${errors.length} خطا رخ داد. جزئیات در کنسول موجود است.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "موفق",
          description: `${totalAssigned} لید با موفقیت توزیع شد`,
          variant: "default"
        });
      }

      // Reset form
      setShowPreview(false);
      setNote('');
      fetchUnassignedCount();

    } catch (error) {
      console.error('❌ Error executing distribution:', error);
      toast({
        title: "خطا",
        description: `خطا در توزیع لیدها: ${error instanceof Error ? error.message : 'خطای نامشخص'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const executeManualAssignment = async () => {
    console.log('🚀 executeManualAssignment called!', { selectedAgent, selectedEnrollments, userId: user?.id });
    
    if (!selectedAgent || selectedEnrollments.length === 0 || !user?.id) {
      console.log('❌ Missing requirements for manual assignment:', { selectedAgent, enrollmentCount: selectedEnrollments.length, userId: user?.id });
      toast({
        title: "خطا", 
        description: "فروشنده انتخاب نشده، لیدی انتخاب نشده یا کاربر وارد نشده",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Starting manual assignment...', { selectedAgent, enrollmentCount: selectedEnrollments.length });
      
      // Get the current user's chat_users ID for assigned_by field
      const assignedById = user.isMessengerUser && user.messengerData ? user.messengerData.id : parseInt(user.id);
      if (!assignedById) {
        throw new Error('Cannot determine user ID for assignment');
      }

      const agentUserId = salesAgents.find(a => a.id === Number(selectedAgent))?.user_id;
      if (!agentUserId) throw new Error('Agent not found');

      console.log('📊 Assignment details:', { agentUserId, assignedById, enrollmentIds: selectedEnrollments });

      // Assign selected enrollments
      let successCount = 0;
      const errors: string[] = [];

      for (const enrollmentId of selectedEnrollments) {
        try {
          const rpcFunction = createDeals ? 'distribute_lead_and_create_deal' : 'distribute_lead_to_agent';
          const rpcParams: any = {
            p_enrollment_id: enrollmentId,
            p_agent_user_id: agentUserId,
            p_assigned_by: assignedById
          };

          // Add deal-specific parameters if creating deals
          if (createDeals) {
            rpcParams.p_deal_course_id = dealCourse || selectedCourse;
            rpcParams.p_deal_price = parseFloat(dealPrice) || 0;
          }

          const { error: assignError } = await supabase.rpc(rpcFunction, rpcParams);

          if (assignError) {
            console.error('❌ Error assigning lead:', assignError);
            errors.push(`خطا در واگذاری لید ${enrollmentId}: ${assignError.message}`);
          } else {
            successCount++;
            console.log('✅ Successfully assigned lead:', enrollmentId);
          }
        } catch (err) {
          console.error('❌ Exception assigning lead:', err);
          errors.push(`خطا در واگذاری لید ${enrollmentId}: ${err}`);
        }
      }

      // Log the assignment
      if (successCount > 0) {
        try {
          console.log(`📝 Logging manual assignment: agent_id=${selectedAgent}, admin_id=${assignedById}, count=${successCount}`);
          
          const { error: logError } = await supabase
            .from('lead_distribution_logs')
            .insert({
              admin_id: assignedById,
              sales_agent_id: Number(selectedAgent),
              method: 'manual',
              course_id: selectedCourse,
              count: successCount,
              note: note || null
            });

          if (logError) {
            console.error('❌ Error logging assignment:', logError);
            errors.push(`خطا در ثبت لاگ: ${logError.message}`);
          } else {
            console.log('✅ Successfully logged assignment');
          }
        } catch (err) {
          console.error('❌ Exception logging assignment:', err);
          errors.push(`خطا در ثبت لاگ: ${err}`);
        }
      }

      if (errors.length > 0) {
        console.error('❌ Manual assignment completed with errors:', errors);
        toast({
          title: "واگذاری با خطا",
          description: `${successCount} لید واگذار شد، اما ${errors.length} خطا رخ داد. جزئیات در کنسول موجود است.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "موفق",
          description: `${successCount} لید با موفقیت واگذار شد`,
          variant: "default"
        });
      }

      // Reset form
      setSelectedEnrollments([]);
      setSelectedAgent('');
      setNote('');
      fetchEnrollments();

    } catch (error) {
      console.error('❌ Error executing manual assignment:', error);
      toast({
        title: "خطا",
        description: `خطا در واگذاری لیدها: ${error instanceof Error ? error.message : 'خطای نامشخص'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = getTotalPercentage();
  const isPercentageValid = totalPercentage === 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            سیستم توزیع لید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="percentage" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="percentage" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                توزیع درصدی
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                واگذاری دستی
              </TabsTrigger>
            </TabsList>

            <TabsContent value="percentage" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Copy className="h-4 w-4" />
                  <Label htmlFor="removeDuplicates">حذف تکراری</Label>
                  <Switch
                    id="removeDuplicates"
                    checked={removeDuplicates}
                    onCheckedChange={setRemoveDuplicates}
                  />
                </div>
              </div>

              {/* Deal Creation Section */}
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">تنظیمات ایجاد معامله</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={createDeals}
                      onCheckedChange={setCreateDeals}
                    />
                    <Label htmlFor="createDeals">ایجاد خودکار معامله‌ها هنگام توزیع لیدها</Label>
                  </div>
                  
                  {createDeals && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dealCourse">دوره معامله</Label>
                        <Select value={dealCourse} onValueChange={setDealCourse}>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب دوره (پیش‌فرض: دوره فیلتر)" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          در صورت عدم انتخاب، دوره فیلتر شده استفاده خواهد شد
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="dealPrice">قیمت معامله (تومان)</Label>
                        <Input
                          type="number"
                          id="dealPrice"
                          value={dealPrice}
                          onChange={(e) => setDealPrice(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          قیمت قابل تنظیم برای معامله
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    console.log('🖱️ Show List button clicked for percentage distribution!', { selectedCourse, paymentStatus, assignmentStatus, removeDuplicates });
                    fetchEnrollments();
                  }}
                  disabled={!selectedCourse}
                  className="w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  نمایش لیست
                </Button>
              </div>

              {enrollments.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-right" dir="rtl">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-semibold text-green-800 dark:text-green-200 text-sm sm:text-base">
                          {enrollments.length} ثبت‌نام یافت شد
                        </span>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-end">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs sm:text-sm w-fit self-end sm:self-auto">
                          فیلتر شده
                        </Badge>
                        {removeDuplicates && (
                          <Badge variant="outline" className="text-xs sm:text-sm w-fit self-end sm:self-auto">
                            تکراری‌ها حذف شد
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {selectedCourse && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">لیدهای قابل توزیع:</span>
                    <Badge variant="secondary">{unassignedCount} لید</Badge>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">تنظیم درصد توزیع برای فروشندگان</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {percentages.map((distribution) => (
                        <div key={distribution.agent_id} className="flex items-center gap-3">
                          <span className="font-medium min-w-[120px]">
                            {distribution.agent_name}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={distribution.percentage}
                            onChange={(e) => handlePercentageChange(distribution.agent_id, e.target.value)}
                            className="w-20"
                          />
                          <span>%</span>
                          <span className="text-sm text-muted-foreground">
                            ({Math.round((unassignedCount * distribution.percentage) / 100)} لید)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded border">
                      <span className="font-medium">مجموع:</span>
                      <Badge variant={isPercentageValid ? "default" : "destructive"}>
                        {totalPercentage}%
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="note">یادداشت (اختیاری)</Label>
                      <Textarea
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="یادداشت برای این توزیع..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          console.log('🖱️ Preview button clicked!', { isPercentageValid, unassignedCount, totalPercentage: getTotalPercentage() });
                          generatePreview();
                        }}
                        disabled={!isPercentageValid || unassignedCount === 0}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        پیش‌نمایش
                      </Button>

                      {showPreview && (
                        <Dialog open={showPreview} onOpenChange={setShowPreview}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>پیش‌نمایش توزیع</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {previewData.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                                  <span>{item.agent_name}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge>{item.count} لید</Badge>
                                    <span className="text-sm text-muted-foreground">({item.percentage}%)</span>
                                  </div>
                                </div>
                              ))}
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => {
                                    console.log('🖱️ Execute Distribution button clicked!', { loading, showPreview });
                                    executePercentageDistribution();
                                  }}
                                  disabled={loading}
                                  className="flex-1"
                                >
                                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  تأیید و اجرای توزیع
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
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              </div>

              {/* Deal Creation Section for Manual Tab */}
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">تنظیمات ایجاد معامله</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={createDeals}
                      onCheckedChange={setCreateDeals}
                    />
                    <Label htmlFor="createDeals">ایجاد خودکار معامله‌ها هنگام واگذاری لیدها</Label>
                  </div>
                  
                  {createDeals && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dealCourse">دوره معامله</Label>
                        <Select value={dealCourse} onValueChange={setDealCourse}>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب دوره (پیش‌فرض: دوره فیلتر)" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          در صورت عدم انتخاب، دوره فیلتر شده استفاده خواهد شد
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="dealPrice">قیمت معامله (تومان)</Label>
                        <Input
                          type="number"
                          id="dealPrice"
                          value={dealPrice}
                          onChange={(e) => setDealPrice(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          قیمت قابل تنظیم برای معامله
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <Button
                  onClick={fetchEnrollments}
                  disabled={!selectedCourse || manualLoading}
                  variant="outline"
                >
                  {manualLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Filter className="h-4 w-4 mr-2" />
                  نمایش لیست
                </Button>
                
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="removeDuplicates" className="text-sm">حذف تکراری‌ها</Label>
                  <Switch
                    id="removeDuplicates"
                    checked={removeDuplicates}
                    onCheckedChange={setRemoveDuplicates}
                  />
                </div>
              </div>

              {enrollments.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-right" dir="rtl">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-semibold text-green-800 dark:text-green-200 text-sm sm:text-base">
                          {enrollments.length} ثبت‌نام یافت شد
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
                        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="انتخاب فروشنده" />
                          </SelectTrigger>
                          <SelectContent>
                            {percentages.map(distribution => (
                              <SelectItem key={distribution.agent_id} value={distribution.agent_id.toString()}>
                                {distribution.agent_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            console.log('🖱️ Manual Assignment button clicked!', { selectedAgent, selectedEnrollments: selectedEnrollments.length, loading });
                            executeManualAssignment();
                          }}
                          disabled={!selectedAgent || loading}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                          واگذاری
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg">
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
                           <TableHead>نام</TableHead>
                           <TableHead>ایمیل</TableHead>
                           <TableHead>تلفن</TableHead>
                           <TableHead>مبلغ</TableHead>
                           <TableHead>وضعیت پرداخت</TableHead>
                           <TableHead>تاریخ ثبت‌نام</TableHead>
                           <TableHead>وضعیت واگذاری</TableHead>
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
                             <TableCell>{enrollment.email}</TableCell>
                             <TableCell>{enrollment.phone}</TableCell>
                             <TableCell>{enrollment.payment_amount.toLocaleString()} تومان</TableCell>
                             <TableCell>
                               <Badge variant={
                                 enrollment.payment_status === 'success' || enrollment.payment_status === 'completed' 
                                   ? "default" 
                                   : enrollment.payment_status === 'pending' 
                                     ? "secondary" 
                                     : "destructive"
                               }>
                                 {enrollment.payment_status === 'success' || enrollment.payment_status === 'completed' 
                                   ? "پرداخت شده" 
                                   : enrollment.payment_status === 'pending' 
                                     ? "در انتظار پرداخت" 
                                     : "لغو شده"}
                               </Badge>
                             </TableCell>
                             <TableCell>{format(new Date(enrollment.created_at), 'yyyy/MM/dd')}</TableCell>
                             <TableCell>
                               <Badge variant={enrollment.is_assigned ? "default" : "secondary"}>
                                 {enrollment.is_assigned ? "واگذار شده" : "واگذار نشده"}
                               </Badge>
                             </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
    </div>
  );
};

export default LeadDistributionSystem;