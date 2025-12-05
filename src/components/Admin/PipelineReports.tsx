import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  TrendingUp,
  Users,
  Target,
  Clock,
  Award,
  Download,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Pipeline {
  id: string;
  title: string;
  stages: PipelineStage[];
}

interface PipelineStage {
  id: string;
  title: string;
  color: string;
  order_index: number;
}

interface StageStats {
  stage_id: string;
  stage_title: string;
  stage_color: string;
  count: number;
  value: number;
  avg_time_in_stage: number;
}

interface AgentPerformance {
  agent_id: number;
  agent_name: string;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  conversion_rate: number;
  total_value: number;
}

const PipelineReports: React.FC = () => {
  const { toast } = useToast();
  
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  const [stageStats, setStageStats] = useState<StageStats[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    activeDeals: 0,
    totalValue: 0,
    wonValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchPipelines();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedPipelineId]);

  const fetchPipelines = async () => {
    const { data, error } = await supabase
      .from('pipelines')
      .select('id, title')
      .eq('is_active', true)
      .order('title');

    if (!error && data) {
      // Fetch stages for each pipeline
      const pipelinesWithStages = await Promise.all(data.map(async (pipeline) => {
        const { data: stages } = await supabase
          .from('pipeline_stages')
          .select('*')
          .eq('pipeline_id', pipeline.id)
          .order('order_index');
        
        return { ...pipeline, stages: stages || [] };
      }));

      setPipelines(pipelinesWithStages);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from('deals')
        .select(`
          *,
          chat_users!deals_assigned_salesperson_id_fkey(id, name),
          pipeline_stages!deals_current_stage_id_fkey(id, title, color, order_index)
        `);

      if (selectedPipelineId !== 'all') {
        query = query.eq('pipeline_id', selectedPipelineId);
      }

      const { data: deals, error } = await query;

      if (error) throw error;

      // Calculate overall stats
      const wonDeals = deals?.filter(d => d.status === 'won') || [];
      const lostDeals = deals?.filter(d => d.status === 'lost') || [];
      const activeDeals = deals?.filter(d => d.status !== 'won' && d.status !== 'lost') || [];
      
      const totalValue = deals?.reduce((sum, d) => sum + (d.price || 0), 0) || 0;
      const wonValue = wonDeals.reduce((sum, d) => sum + (d.price || 0), 0);
      const closedDeals = wonDeals.length + lostDeals.length;
      const conversionRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;

      setOverallStats({
        totalDeals: deals?.length || 0,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        activeDeals: activeDeals.length,
        totalValue,
        wonValue,
        conversionRate
      });

      // Calculate stage stats
      const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
      if (selectedPipeline) {
        const stageStatsData: StageStats[] = selectedPipeline.stages.map(stage => {
          const stageDeals = activeDeals.filter(d => d.current_stage_id === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.price || 0), 0);
          
          // Calculate average time in stage
          const avgTime = stageDeals.reduce((sum, d) => {
            if (d.stage_entered_at) {
              const enteredAt = new Date(d.stage_entered_at);
              const now = new Date();
              return sum + ((now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));
            }
            return sum;
          }, 0) / (stageDeals.length || 1);

          return {
            stage_id: stage.id,
            stage_title: stage.title,
            stage_color: stage.color,
            count: stageDeals.length,
            value: stageValue,
            avg_time_in_stage: avgTime
          };
        });
        setStageStats(stageStatsData);
      } else {
        setStageStats([]);
      }

      // Calculate agent performance
      const agentMap = new Map<number, AgentPerformance>();
      
      deals?.forEach(deal => {
        const agentId = deal.assigned_salesperson_id;
        const agentName = (deal.chat_users as any)?.name || 'نامشخص';
        
        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, {
            agent_id: agentId,
            agent_name: agentName,
            total_deals: 0,
            won_deals: 0,
            lost_deals: 0,
            conversion_rate: 0,
            total_value: 0
          });
        }

        const agent = agentMap.get(agentId)!;
        agent.total_deals++;
        agent.total_value += deal.price || 0;
        
        if (deal.status === 'won') {
          agent.won_deals++;
        } else if (deal.status === 'lost') {
          agent.lost_deals++;
        }
      });

      // Calculate conversion rates
      const agentPerformanceData = Array.from(agentMap.values()).map(agent => ({
        ...agent,
        conversion_rate: (agent.won_deals + agent.lost_deals) > 0 
          ? (agent.won_deals / (agent.won_deals + agent.lost_deals)) * 100 
          : 0
      }));

      // Sort by total value
      agentPerformanceData.sort((a, b) => b.total_value - a.total_value);
      setAgentPerformance(agentPerformanceData);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({ title: "خطا", description: "خطا در بارگذاری گزارش", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString() + ' تومان';
  };

  const exportToCSV = () => {
    const headers = ['نماینده', 'تعداد معاملات', 'موفق', 'از دست رفته', 'نرخ تبدیل', 'ارزش کل'];
    const rows = agentPerformance.map(agent => [
      agent.agent_name,
      agent.total_deals,
      agent.won_deals,
      agent.lost_deals,
      `${agent.conversion_rate.toFixed(1)}%`,
      agent.total_value
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pipeline-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading && pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            گزارش پایپ‌لاین
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="انتخاب پایپ‌لاین" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه پایپ‌لاین‌ها</SelectItem>
              {pipelines.map(pipeline => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchReportData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            خروجی CSV
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">کل معاملات</span>
            </div>
            <p className="text-2xl font-bold mt-1">{overallStats.totalDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">در جریان</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-600">{overallStats.activeDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">موفق</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{overallStats.wonDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              <span className="text-sm text-muted-foreground">از دست رفته</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{overallStats.lostDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">نرخ تبدیل</span>
            </div>
            <p className="text-2xl font-bold mt-1">{overallStats.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">ارزش کل</span>
            </div>
            <p className="text-lg font-bold mt-1">{formatCurrency(overallStats.totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">ارزش فروش</span>
            </div>
            <p className="text-lg font-bold mt-1 text-green-600">{formatCurrency(overallStats.wonValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Funnel */}
      {stageStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">قیف فروش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stageStats.map((stage, index) => {
                const maxCount = Math.max(...stageStats.map(s => s.count), 1);
                const percentage = (stage.count / maxCount) * 100;
                
                return (
                  <div key={stage.stage_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.stage_color }}
                        />
                        <span className="font-medium">{stage.stage_title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{stage.count} معامله</span>
                        <span className="text-muted-foreground">
                          میانگین {stage.avg_time_in_stage.toFixed(1)} روز
                        </span>
                        <span className="font-medium">{formatCurrency(stage.value)}</span>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-3"
                      style={{ 
                        ['--progress-background' as any]: stage.stage_color 
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            عملکرد نمایندگان
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentPerformance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              داده‌ای برای نمایش وجود ندارد
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نماینده</TableHead>
                  <TableHead className="text-center">کل معاملات</TableHead>
                  <TableHead className="text-center">موفق</TableHead>
                  <TableHead className="text-center">از دست رفته</TableHead>
                  <TableHead className="text-center">نرخ تبدیل</TableHead>
                  <TableHead className="text-left">ارزش کل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentPerformance.map((agent, index) => (
                  <TableRow key={agent.agent_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                        {agent.agent_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{agent.total_deals}</TableCell>
                    <TableCell className="text-center text-green-600">{agent.won_deals}</TableCell>
                    <TableCell className="text-center text-red-600">{agent.lost_deals}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={agent.conversion_rate >= 50 ? "default" : "secondary"}>
                        {agent.conversion_rate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left font-medium">
                      {formatCurrency(agent.total_value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineReports;
