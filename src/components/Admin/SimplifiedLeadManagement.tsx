import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
  Filter
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
}

interface Agent {
  id: number;
  name: string;
  phone: string;
}

interface Course {
  id: string;
  title: string;
}

interface PercentageAllocation {
  agent_id: number;
  agent_name: string;
  percentage: number;
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
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, assigned, unassigned
  const [paymentFilter, setPaymentFilter] = useState<string>('all'); // all, success, pending, failed
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [showPercentageAssign, setShowPercentageAssign] = useState(false);
  const [selectedAgentForManual, setSelectedAgentForManual] = useState<string>('');
  const [percentageAllocations, setPercentageAllocations] = useState<PercentageAllocation[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0
  });

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setInitialLoading(true);
    await Promise.all([fetchCourses(), fetchAgents()]);
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

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('chat_users')
      .select('id, name, phone')
      .or('role.in.(sales_agent,sales_manager,admin),is_messenger_admin.eq.true')
      .order('name');
    setAgents(data || []);
    
    // Initialize percentage allocations
    if (data) {
      setPercentageAllocations(data.map(agent => ({
        agent_id: agent.id,
        agent_name: agent.name,
        percentage: 0
      })));
    }
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
        .order('created_at', { ascending: false })
        .limit(500);

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
        is_assigned: !!assignmentMap.get(e.id)
      }));
      const totalAssigned = allLeads.filter(l => l.is_assigned).length;
      setStats({
        total: allLeads.length,
        assigned: totalAssigned,
        unassigned: allLeads.length - totalAssigned
      });

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

    setActionLoading(true);
    try {
      const agentId = parseInt(selectedAgentForManual);
      
      // First remove existing assignments for selected leads
      await supabase
        .from('lead_assignments')
        .delete()
        .in('enrollment_id', selectedLeads);

      // Create new assignments
      const assignments = selectedLeads.map(enrollmentId => ({
        enrollment_id: enrollmentId,
        sales_agent_id: agentId,
        assigned_by: agentId, // This should be current user ID
        status: 'assigned'
      }));

      const { error } = await supabase
        .from('lead_assignments')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "موفق",
        description: `${selectedLeads.length} لید به ${agents.find(a => a.id === agentId)?.name} واگذار شد`
      });

      setShowManualAssign(false);
      setSelectedLeads([]);
      setSelectAll(false);
      setSelectedAgentForManual('');
      handleLoadLeads();
    } catch (error) {
      console.error('Error assigning leads:', error);
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
    try {
      // Shuffle leads for random distribution
      const shuffled = [...unassignedLeads].sort(() => Math.random() - 0.5);
      
      const assignments: { enrollment_id: string; sales_agent_id: number; assigned_by: number; status: string }[] = [];
      let currentIndex = 0;

      for (const allocation of percentageAllocations) {
        if (allocation.percentage === 0) continue;
        
        const count = Math.round((allocation.percentage / 100) * shuffled.length);
        for (let i = 0; i < count && currentIndex < shuffled.length; i++) {
          assignments.push({
            enrollment_id: shuffled[currentIndex].id,
            sales_agent_id: allocation.agent_id,
            assigned_by: allocation.agent_id,
            status: 'assigned'
          });
          currentIndex++;
        }
      }

      // Assign remaining leads to first agent with percentage > 0
      const firstAgent = percentageAllocations.find(a => a.percentage > 0);
      while (currentIndex < shuffled.length && firstAgent) {
        assignments.push({
          enrollment_id: shuffled[currentIndex].id,
          sales_agent_id: firstAgent.agent_id,
          assigned_by: firstAgent.agent_id,
          status: 'assigned'
        });
        currentIndex++;
      }

      if (assignments.length > 0) {
        const { error } = await supabase
          .from('lead_assignments')
          .insert(assignments);

        if (error) throw error;
      }

      toast({
        title: "موفق",
        description: `${assignments.length} لید توزیع شد`
      });

      setShowPercentageAssign(false);
      setSelectedLeads([]);
      setSelectAll(false);
      handleLoadLeads();
    } catch (error) {
      console.error('Error distributing leads:', error);
      toast({
        title: "خطا",
        description: "خطا در توزیع لیدها",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
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
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">واگذار شده</p>
                <p className="text-lg md:text-2xl font-bold">{stats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">واگذار نشده</p>
                <p className="text-lg md:text-2xl font-bold">{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <SelectContent>
                  <SelectItem value="all">همه کارشناسان</SelectItem>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
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
            {hasLoaded && (
              <span className="text-xs md:text-sm text-muted-foreground mr-auto">
                نمایش {leads.length} لید
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
                  <TableHead>دوره</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>وضعیت پرداخت</TableHead>
                  <TableHead>کارشناس</TableHead>
                  <TableHead>تاریخ</TableHead>
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
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>
                        <a href={`tel:${formatPhone(lead.phone)}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3 w-3" />
                          {formatPhone(lead.phone)}
                        </a>
                      </TableCell>
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
      <Dialog open={showManualAssign} onOpenChange={setShowManualAssign}>
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
            <Button
              className="w-full"
              onClick={handleManualAssign}
              disabled={actionLoading || !selectedAgentForManual}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              واگذاری
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Percentage Distribution Modal */}
      <Dialog open={showPercentageAssign} onOpenChange={setShowPercentageAssign}>
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
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
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

            <Button
              className="w-full"
              onClick={handlePercentageAssign}
              disabled={actionLoading || percentageAllocations.reduce((sum, a) => sum + a.percentage, 0) !== 100}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              توزیع لیدها
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimplifiedLeadManagement;
