import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Phone, 
  Award,
  Loader2,
  Activity,
  BarChart3,
  Clock,
  Mail,
  Calendar,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns-jalali';

interface AgentStats {
  agent_id: number;
  agent_name: string;
  total_leads: number;
  contacted_leads: number;
  calls_count: number;
  notes_count: number;
  successful_deals: number;
  total_sales_amount: number;
  conversion_rate: number;
}

interface RecentActivity {
  id: string;
  agent_name: string;
  activity_type: string;
  lead_name: string;
  lead_id: number;
  created_at: string;
}

interface UserDetails {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  country: string | null;
  province: string | null;
}

const AgentActivityDashboard: React.FC = () => {
  const { toast } = useToast();
  
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<string>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // User details dialog
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalLeads: 0,
    totalContacted: 0,
    totalCalls: 0,
    totalSales: 0
  });

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '24h': return subDays(now, 1).toISOString();
      case '7d': return subDays(now, 7).toISOString();
      case '30d': return subDays(now, 30).toISOString();
      case 'custom': 
        return customStartDate ? new Date(customStartDate).toISOString() : subDays(now, 7).toISOString();
      case 'all': return '2020-01-01T00:00:00Z';
      default: return subDays(now, 7).toISOString();
    }
  };

  const getEndDateFilter = () => {
    if (dateRange === 'custom' && customEndDate) {
      return new Date(customEndDate + 'T23:59:59').toISOString();
    }
    return new Date().toISOString();
  };

  const fetchData = async () => {
    setLoading(true);
    setHasLoaded(true);
    try {
      const dateFilter = getDateFilter();

      // Get all unique creators from CRM notes (includes all agents who have worked)
      const { data: crmCreators } = await supabase
        .from('crm_notes')
        .select('created_by')
        .gte('created_at', dateFilter);

      const uniqueCreators = [...new Set((crmCreators || []).map(c => c.created_by))];

      // Get chat_users who match these creators OR are sales agents
      const { data: chatUsers } = await supabase
        .from('chat_users')
        .select('id, name')
        .or('role.in.(sales_agent,sales_manager,admin),is_messenger_admin.eq.true');

      // Build agents list from chat_users
      const agents = (chatUsers || []).map(u => ({
        id: u.id,
        user_id: u.id,
        name: u.name
      }));

      // Also get sales_agents for lead assignment mapping
      const { data: salesAgentsData } = await supabase
        .from('sales_agents')
        .select('id, user_id')
        .eq('is_active', true);

      const salesAgentUserIds = new Map<number, number>();
      salesAgentsData?.forEach(sa => {
        salesAgentUserIds.set(sa.user_id, sa.id);
      });

      // Fetch lead assignments per sales agent
      const { data: assignments } = await supabase
        .from('lead_assignments')
        .select('sales_agent_id, enrollment_id')
        .not('sales_agent_id', 'is', null);

      // Create assignment count map
      const assignmentCountMap = new Map<number, number>();
      assignments?.forEach(a => {
        if (a.sales_agent_id) {
          // Map back to user_id
          const userId = [...salesAgentUserIds.entries()].find(([uid, said]) => said === a.sales_agent_id)?.[0];
          if (userId) {
            assignmentCountMap.set(userId, (assignmentCountMap.get(userId) || 0) + 1);
          }
        }
      });

      // Fetch CRM notes with date filter
      const { data: crmNotes } = await supabase
        .from('crm_notes')
        .select('id, type, created_by, user_id, created_at')
        .gte('created_at', dateFilter);

      // Map CRM notes to agents via name matching
      const agentNameToId = new Map<string, number>();
      agents.forEach(a => agentNameToId.set(a.name, a.id));

      const notesPerAgent = new Map<number, { total: number; calls: number }>();
      const contactedUsersPerAgent = new Map<number, Set<number>>();

      crmNotes?.forEach(note => {
        const agentId = agentNameToId.get(note.created_by);
        if (agentId) {
          const current = notesPerAgent.get(agentId) || { total: 0, calls: 0 };
          current.total++;
          if (note.type === 'call') current.calls++;
          notesPerAgent.set(agentId, current);

          if (note.user_id) {
            const contacted = contactedUsersPerAgent.get(agentId) || new Set();
            contacted.add(note.user_id);
            contactedUsersPerAgent.set(agentId, contacted);
          }
        }
      });

      // Fetch deals - assigned_salesperson_id references chat_users.id
      const { data: deals } = await supabase
        .from('deals')
        .select('assigned_salesperson_id, price, status')
        .eq('status', 'won')
        .gte('created_at', dateFilter);

      const dealsPerAgent = new Map<number, { count: number; amount: number }>();
      deals?.forEach(deal => {
        const current = dealsPerAgent.get(deal.assigned_salesperson_id) || { count: 0, amount: 0 };
        current.count++;
        current.amount += deal.price || 0;
        dealsPerAgent.set(deal.assigned_salesperson_id, current);
      });

      // Build agent stats - only include agents with activity
      const stats: AgentStats[] = agents
        .map(agent => {
          const totalLeads = assignmentCountMap.get(agent.id) || 0;
          const notes = notesPerAgent.get(agent.id) || { total: 0, calls: 0 };
          const dealInfo = dealsPerAgent.get(agent.id) || { count: 0, amount: 0 };
          const contactedCount = contactedUsersPerAgent.get(agent.id)?.size || 0;

          return {
            agent_id: agent.id,
            agent_name: agent.name,
            total_leads: totalLeads,
            contacted_leads: contactedCount,
            calls_count: notes.calls,
            notes_count: notes.total,
            successful_deals: dealInfo.count,
            total_sales_amount: dealInfo.amount,
            conversion_rate: totalLeads > 0 ? Math.round((dealInfo.count / totalLeads) * 100) : 0
          };
        })
        .filter(s => s.total_leads > 0 || s.calls_count > 0 || s.notes_count > 0 || s.successful_deals > 0);

      // Sort by calls count
      stats.sort((a, b) => b.calls_count - a.calls_count);

      setAgentStats(stats);

      // Calculate summary from all CRM data
      const totalCalls = crmNotes?.filter(n => n.type === 'call').length || 0;
      const totalNotes = crmNotes?.length || 0;
      const uniqueContacted = new Set(crmNotes?.filter(n => n.user_id).map(n => n.user_id) || []).size;

      setSummary({
        totalLeads: stats.reduce((sum, s) => sum + s.total_leads, 0),
        totalContacted: uniqueContacted,
        totalCalls: totalCalls,
        totalSales: stats.reduce((sum, s) => sum + s.successful_deals, 0)
      });

      // Fetch recent activity
      const { data: recentNotes } = await supabase
        .from('crm_notes')
        .select('id, type, created_by, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(20);

      const userIds = recentNotes?.map(n => n.user_id).filter(Boolean) || [];
      const { data: users } = await supabase
        .from('chat_users')
        .select('id, name')
        .in('id', userIds);

      const userNameMap = new Map<number, string>();
      users?.forEach(u => userNameMap.set(u.id, u.name));

      const activities: RecentActivity[] = (recentNotes || []).map(note => ({
        id: note.id,
        agent_name: note.created_by,
        activity_type: note.type,
        lead_name: note.user_id ? userNameMap.get(note.user_id) || 'نامشخص' : 'نامشخص',
        lead_id: note.user_id || 0,
        created_at: note.created_at
      }));

      setRecentActivity(activities);

    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserDetails = async (userId: number) => {
    if (!userId) return;
    
    setUserDetailsLoading(true);
    setShowUserDialog(true);
    
    try {
      const { data } = await supabase
        .from('chat_users')
        .select('id, name, phone, email, created_at, country, province')
        .eq('id', userId)
        .single();
      
      if (data) {
        setSelectedUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MM/dd HH:mm');
    } catch {
      return date;
    }
  };

  const formatFullDate = (date: string) => {
    try {
      return format(new Date(date), 'yyyy/MM/dd HH:mm');
    } catch {
      return date;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'message': return '💬';
      case 'note': return '📝';
      case 'follow_up': return '🔄';
      default: return '📋';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'call': return 'تماس';
      case 'message': return 'پیام';
      case 'note': return 'یادداشت';
      case 'follow_up': return 'پیگیری';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-semibold">داشبورد عملکرد کارشناسان</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">۲۴ ساعت اخیر</SelectItem>
                <SelectItem value="7d">۷ روز اخیر</SelectItem>
                <SelectItem value="30d">۳۰ روز اخیر</SelectItem>
                <SelectItem value="custom">سفارشی</SelectItem>
                <SelectItem value="all">همه زمان‌ها</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[140px]"
                  placeholder="از تاریخ"
                />
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[140px]"
                  placeholder="تا تاریخ"
                />
              </>
            )}
            <Button onClick={fetchData} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              مشاهده گزارش
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="py-20">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">بازه زمانی را انتخاب کنید</p>
              <p className="text-sm">سپس روی "مشاهده گزارش" کلیک کنید</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold">داشبورد عملکرد کارشناسان</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">۲۴ ساعت اخیر</SelectItem>
              <SelectItem value="7d">۷ روز اخیر</SelectItem>
              <SelectItem value="30d">۳۰ روز اخیر</SelectItem>
              <SelectItem value="custom">سفارشی</SelectItem>
              <SelectItem value="all">همه زمان‌ها</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === 'custom' && (
            <>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-[140px]"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-[140px]"
              />
            </>
          )}
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">کل لیدها</p>
                <p className="text-xl md:text-2xl font-bold">{summary.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">تماس گرفته</p>
                <p className="text-xl md:text-2xl font-bold">{summary.totalContacted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg">
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">تماس‌ها</p>
                <p className="text-xl md:text-2xl font-bold">{summary.totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-amber-500/10 rounded-lg">
                <Award className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">فروش موفق</p>
                <p className="text-xl md:text-2xl font-bold">{summary.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Performance Table */}
        <Card className="lg:col-span-2 order-2 lg:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              عملکرد کارشناسان
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کارشناس</TableHead>
                  <TableHead className="text-center">لیدها</TableHead>
                  <TableHead className="text-center">تماس گرفته</TableHead>
                  <TableHead className="text-center">تماس‌ها</TableHead>
                  <TableHead className="text-center">فروش</TableHead>
                  <TableHead className="text-center">نرخ تبدیل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      داده‌ای برای نمایش وجود ندارد
                    </TableCell>
                  </TableRow>
                ) : (
                  agentStats.map(agent => (
                    <TableRow key={agent.agent_id}>
                      <TableCell className="font-medium">{agent.agent_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{agent.total_leads}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={agent.contacted_leads > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                          {agent.contacted_leads}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={agent.calls_count > 0 ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                          {agent.calls_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={agent.successful_deals > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                          {agent.successful_deals}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={agent.conversion_rate >= 20 ? 'default' : 'secondary'}
                          className={agent.conversion_rate >= 20 ? 'bg-green-500' : ''}
                        >
                          {agent.conversion_rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="order-1 lg:order-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  فعالیتی ثبت نشده
                </p>
              ) : (
                <div className="divide-y">
                  {recentActivity.map(activity => (
                    <div 
                      key={activity.id} 
                      className="p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => activity.lead_id && handleOpenUserDetails(activity.lead_id)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.agent_name}</span>
                            {' '}{getActivityLabel(activity.activity_type)} با{' '}
                            <span className="font-medium text-primary hover:underline">
                              {activity.lead_name}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                        {activity.lead_id > 0 && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>اطلاعات کاربر</DialogTitle>
          </DialogHeader>
          {userDetailsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedUser.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${selectedUser.phone}`} className="text-primary hover:underline">
                    {selectedUser.phone?.startsWith('0') ? selectedUser.phone : `0${selectedUser.phone}`}
                  </a>
                </div>
                
                {selectedUser.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                )}
                
                {(selectedUser.country || selectedUser.province) && (
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{[selectedUser.province, selectedUser.country].filter(Boolean).join(' - ')}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>عضویت: {formatFullDate(selectedUser.created_at)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">کاربر یافت نشد</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentActivityDashboard;
