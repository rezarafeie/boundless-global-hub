import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Phone, 
  TrendingUp,
  Target,
  Award,
  Loader2,
  Activity,
  BarChart3,
  Clock
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
  created_at: string;
}

const AgentActivityDashboard: React.FC = () => {
  const { toast } = useToast();
  
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('7d');
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalLeads: 0,
    totalContacted: 0,
    totalCalls: 0,
    totalSales: 0
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '24h': return subDays(now, 1).toISOString();
      case '7d': return subDays(now, 7).toISOString();
      case '30d': return subDays(now, 30).toISOString();
      default: return subDays(now, 7).toISOString();
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Fetch all sales agents
      const { data: agents } = await supabase
        .from('chat_users')
        .select('id, name')
        .or('role.in.(sales_agent,sales_manager,admin),is_messenger_admin.eq.true');

      if (!agents) {
        setAgentStats([]);
        return;
      }

      // Fetch lead assignments per agent
      const { data: assignments } = await supabase
        .from('lead_assignments')
        .select('sales_agent_id, enrollment_id')
        .not('sales_agent_id', 'is', null);

      // Create assignment count map
      const assignmentCountMap = new Map<number, number>();
      const enrollmentToAgentMap = new Map<string, number>();
      
      assignments?.forEach(a => {
        if (a.sales_agent_id) {
          assignmentCountMap.set(
            a.sales_agent_id, 
            (assignmentCountMap.get(a.sales_agent_id) || 0) + 1
          );
          if (a.enrollment_id) {
            enrollmentToAgentMap.set(a.enrollment_id, a.sales_agent_id);
          }
        }
      });

      // Fetch CRM notes with date filter - get creator info
      const { data: crmNotes } = await supabase
        .from('crm_notes')
        .select('id, type, created_by, user_id, created_at')
        .gte('created_at', dateFilter);

      // Map CRM notes to agents (via created_by name match)
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

          // Track contacted users
          if (note.user_id) {
            const contacted = contactedUsersPerAgent.get(agentId) || new Set();
            contacted.add(note.user_id);
            contactedUsersPerAgent.set(agentId, contacted);
          }
        }
      });

      // Fetch deals
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

      // Build agent stats
      const stats: AgentStats[] = agents.map(agent => {
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
      }).filter(s => s.total_leads > 0 || s.notes_count > 0);

      // Sort by total leads
      stats.sort((a, b) => b.total_leads - a.total_leads);

      setAgentStats(stats);

      // Calculate summary
      setSummary({
        totalLeads: stats.reduce((sum, s) => sum + s.total_leads, 0),
        totalContacted: stats.reduce((sum, s) => sum + s.contacted_leads, 0),
        totalCalls: stats.reduce((sum, s) => sum + s.calls_count, 0),
        totalSales: stats.reduce((sum, s) => sum + s.successful_deals, 0)
      });

      // Fetch recent activity
      const { data: recentNotes } = await supabase
        .from('crm_notes')
        .select(`
          id,
          type,
          created_by,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get user names for recent activity
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

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MM/dd HH:mm');
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

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">داشبورد عملکرد کارشناسان</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">۲۴ ساعت اخیر</SelectItem>
            <SelectItem value="7d">۷ روز اخیر</SelectItem>
            <SelectItem value="30d">۳۰ روز اخیر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل لیدها</p>
                <p className="text-2xl font-bold">{summary.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تماس گرفته شده</p>
                <p className="text-2xl font-bold">{summary.totalContacted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تماس‌ها</p>
                <p className="text-2xl font-bold">{summary.totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">فروش موفق</p>
                <p className="text-2xl font-bold">{summary.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Agent Performance Table */}
        <Card className="col-span-2">
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
        <Card>
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
                    <div key={activity.id} className="p-3 hover:bg-muted/50">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.agent_name}</span>
                            {' '}{getActivityLabel(activity.activity_type)} با{' '}
                            <span className="font-medium">{activity.lead_name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentActivityDashboard;
