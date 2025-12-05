import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Phone, 
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';

interface Deal {
  id: string;
  enrollment_id: string;
  course_id: string;
  course_title?: string;
  price: number;
  status: string;
  created_at: string;
  closed_at: string | null;
  customer_name?: string;
  customer_phone?: string;
}

const PIPELINE_STAGES = [
  { id: 'in_progress', label: 'در حال پیگیری', color: 'bg-blue-500', icon: Clock },
  { id: 'negotiating', label: 'در حال مذاکره', color: 'bg-yellow-500', icon: TrendingUp },
  { id: 'won', label: 'موفق', color: 'bg-green-500', icon: CheckCircle },
  { id: 'lost', label: 'از دست رفته', color: 'bg-red-500', icon: XCircle },
];

const SalesAgentPipeline: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
    totalValue: 0,
    wonValue: 0
  });

  useEffect(() => {
    if (user?.messengerData?.id) {
      fetchDeals();
    }
  }, [user?.messengerData?.id]);

  const fetchDeals = async () => {
    if (!user?.messengerData?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          courses!deals_course_id_fkey(id, title),
          enrollments!deals_enrollment_id_fkey(full_name, phone)
        `)
        .eq('assigned_salesperson_id', user.messengerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedDeals = (data || []).map(deal => ({
        ...deal,
        course_title: (deal.courses as any)?.title || 'نامشخص',
        customer_name: (deal.enrollments as any)?.full_name || 'نامشخص',
        customer_phone: (deal.enrollments as any)?.phone || ''
      }));

      setDeals(processedDeals);

      // Calculate stats
      const inProgress = processedDeals.filter(d => d.status === 'in_progress').length;
      const negotiating = processedDeals.filter(d => d.status === 'negotiating').length;
      const won = processedDeals.filter(d => d.status === 'won').length;
      const lost = processedDeals.filter(d => d.status === 'lost').length;
      const totalValue = processedDeals.reduce((sum, d) => sum + (d.price || 0), 0);
      const wonValue = processedDeals.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.price || 0), 0);

      setStats({
        total: processedDeals.length,
        inProgress,
        negotiating,
        won,
        lost,
        totalValue,
        wonValue
      });

    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDealStatus = async (dealId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'won' || newStatus === 'lost') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "وضعیت معامله بروزرسانی شد"
      });

      fetchDeals();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی معامله",
        variant: "destructive"
      });
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'yyyy/MM/dd');
    } catch {
      return date;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString() + ' تومان';
  };

  const getDealsForStage = (stageId: string) => {
    return deals.filter(deal => deal.status === stageId);
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل معاملات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">در حال پیگیری</p>
                <p className="text-2xl font-bold">{stats.inProgress + stats.negotiating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">موفق</p>
                <p className="text-2xl font-bold">{stats.won}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ارزش فروخته</p>
                <p className="text-lg font-bold">{formatCurrency(stats.wonValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchDeals} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          بروزرسانی
        </Button>
      </div>

      {/* Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_STAGES.map(stage => {
          const stageDeals = getDealsForStage(stage.id);
          const StageIcon = stage.icon;
          
          return (
            <Card key={stage.id} className="min-h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className={`p-1.5 rounded ${stage.color}`}>
                    <StageIcon className="h-4 w-4 text-white" />
                  </div>
                  {stage.label}
                  <Badge variant="secondary" className="mr-auto">
                    {stageDeals.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageDeals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    بدون معامله
                  </p>
                ) : (
                  stageDeals.map(deal => (
                    <Card key={deal.id} className="bg-muted/30 border-muted">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{deal.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{deal.course_title}</p>
                          </div>
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(deal.price)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {deal.customer_phone || '-'}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(deal.created_at)}
                          </span>
                          
                          {stage.id !== 'won' && stage.id !== 'lost' && (
                            <Select
                              value={deal.status}
                              onValueChange={(value) => updateDealStatus(deal.id, value)}
                            >
                              <SelectTrigger className="h-7 w-auto text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PIPELINE_STAGES.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SalesAgentPipeline;
