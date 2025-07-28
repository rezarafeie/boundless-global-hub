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
  UserCheck
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
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('all');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    fetchCourses();
    fetchSalesAgents();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchUnassignedCount();
      // Reset percentages when course changes
      setPercentages(salesAgents.map(agent => ({
        agent_id: agent.id,
        agent_name: agent.name,
        percentage: 0
      })));
    }
  }, [selectedCourse, dateFrom, dateTo, salesAgents]);

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
      
      // Initialize percentages
      setPercentages(agentsData.map(agent => ({
        agent_id: agent.id,
        agent_name: agent.name,
        percentage: 0
      })));
    } catch (error) {
      console.error('Error fetching sales agents:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت فروشندگان",
        variant: "destructive"
      });
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
          created_at,
          courses!inner(title)
        `)
        .eq('course_id', selectedCourse)
        .in('payment_status', ['success', 'completed']);

      // Add date filters
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Check which ones are assigned
      const enrollmentIds = data?.map(e => e.id) || [];
      const { data: assignments, error: assignmentError } = await supabase
        .from('lead_assignments')
        .select('enrollment_id')
        .in('enrollment_id', enrollmentIds);

      if (assignmentError) throw assignmentError;

      const assignedSet = new Set(assignments?.map(a => a.enrollment_id) || []);

      const formattedEnrollments = data?.map(enrollment => ({
        id: enrollment.id,
        full_name: enrollment.full_name,
        email: enrollment.email,
        phone: enrollment.phone,
        course_title: (enrollment as any).courses.title,
        payment_amount: enrollment.payment_amount,
        created_at: enrollment.created_at,
        is_assigned: assignedSet.has(enrollment.id)
      })) || [];

      // Apply status filter
      let filteredEnrollments = formattedEnrollments;
      if (enrollmentStatus === 'assigned') {
        filteredEnrollments = formattedEnrollments.filter(e => e.is_assigned);
      } else if (enrollmentStatus === 'unassigned') {
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
    const total = getTotalPercentage();
    if (total !== 100) {
      toast({
        title: "خطا",
        description: "مجموع درصدها باید ۱۰۰٪ باشد",
        variant: "destructive"
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

    setPreviewData(preview);
    setShowPreview(true);
  };

  const executePercentageDistribution = async () => {
    if (!selectedCourse || !user?.id) return;

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
              throw new Error(`Agent user ID not found for agent ${distribution.agent_id}`);
            }

            const { error: assignError } = await supabase.rpc('assign_lead_to_agent', {
              p_enrollment_id: enrollment.id,
              p_agent_user_id: agentUserId,
              p_assigned_by: assignedById
            });

            if (assignError) {
              console.error('❌ Error assigning lead:', assignError);
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
            const { error: logError } = await supabase
              .from('lead_distribution_logs')
              .insert({
                admin_id: assignedById,
                sales_agent_id: distribution.agent_id,
                method: 'percentage',
                course_id: selectedCourse,
                count: successCount,
                note
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
    if (!selectedAgent || selectedEnrollments.length === 0 || !user?.id) return;

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
          const { error: assignError } = await supabase.rpc('assign_lead_to_agent', {
            p_enrollment_id: enrollmentId,
            p_agent_user_id: agentUserId,
            p_assigned_by: assignedById
          });

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
          const { error: logError } = await supabase
            .from('lead_distribution_logs')
            .insert({
              admin_id: assignedById,
              sales_agent_id: Number(selectedAgent),
              method: 'manual',
              course_id: selectedCourse,
              count: successCount,
              note
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>

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
                        onClick={generatePreview}
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
                                  onClick={executePercentageDistribution}
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
                  <Label htmlFor="status">وضعیت</Label>
                  <Select value={enrollmentStatus} onValueChange={setEnrollmentStatus}>
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

              <div className="flex gap-3">
                <Button
                  onClick={fetchEnrollments}
                  disabled={!selectedCourse || manualLoading}
                  variant="outline"
                >
                  {manualLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Filter className="h-4 w-4 mr-2" />
                  نمایش لیست
                </Button>
              </div>

              {enrollments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>{enrollments.length} ثبت‌نام یافت شد</span>
                    <div className="flex items-center gap-3">
                      <span>{selectedEnrollments.length} انتخاب شده</span>
                      {selectedEnrollments.length > 0 && (
                        <div className="flex items-center gap-3">
                          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="انتخاب فروشنده" />
                            </SelectTrigger>
                            <SelectContent>
                              {salesAgents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id.toString()}>
                                  {agent.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={executeManualAssignment}
                            disabled={!selectedAgent || loading}
                            size="sm"
                          >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            واگذاری
                          </Button>
                        </div>
                      )}
                    </div>
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
                          <TableHead>تاریخ ثبت‌نام</TableHead>
                          <TableHead>وضعیت</TableHead>
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