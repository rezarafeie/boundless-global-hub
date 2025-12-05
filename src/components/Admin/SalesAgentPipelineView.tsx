import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Phone, 
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Tag,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';

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

interface Deal {
  id: string;
  enrollment_id: string;
  course_id: string;
  pipeline_id: string | null;
  current_stage_id: string | null;
  course_title?: string;
  price: number;
  status: string;
  tags: string[];
  notes: string | null;
  stage_entered_at: string | null;
  created_at: string;
  closed_at: string | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

interface DealStats {
  total: number;
  byStage: Record<string, number>;
  totalValue: number;
  wonValue: number;
}

const AVAILABLE_TAGS = ['فوری', 'گرم', 'سرد', 'پیگیری', 'VIP', 'تخفیف'];

const SalesAgentPipelineView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DealStats>({ total: 0, byStage: {}, totalValue: 0, wonValue: 0 });
  
  // Deal detail dialog
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealNotes, setDealNotes] = useState('');
  const [dealTags, setDealTags] = useState<string[]>([]);
  const [savingDeal, setSavingDeal] = useState(false);

  useEffect(() => {
    if (user?.messengerData?.id) {
      fetchPipelines();
    }
  }, [user?.messengerData?.id]);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchDeals();
    }
  }, [selectedPipelineId]);

  const fetchPipelines = async () => {
    if (!user?.messengerData?.id) return;
    
    setLoading(true);
    try {
      // Fetch pipelines assigned to this agent
      const { data: pipelinesData, error } = await supabase
        .from('pipelines')
        .select('id, title')
        .eq('is_active', true)
        .contains('assigned_sales_agent_ids', [user.messengerData.id]);

      if (error) throw error;

      // Fetch stages for each pipeline
      const pipelinesWithStages = await Promise.all((pipelinesData || []).map(async (pipeline) => {
        const { data: stages } = await supabase
          .from('pipeline_stages')
          .select('*')
          .eq('pipeline_id', pipeline.id)
          .order('order_index');
        
        return { ...pipeline, stages: stages || [] };
      }));

      setPipelines(pipelinesWithStages);
      
      // Auto-select first pipeline
      if (pipelinesWithStages.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(pipelinesWithStages[0].id);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast({ title: "خطا", description: "خطا در بارگذاری پایپ‌لاین‌ها", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    if (!user?.messengerData?.id || !selectedPipelineId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          courses!deals_course_id_fkey(id, title),
          enrollments!deals_enrollment_id_fkey(full_name, phone, email)
        `)
        .eq('assigned_salesperson_id', user.messengerData.id)
        .eq('pipeline_id', selectedPipelineId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedDeals = (data || []).map(deal => ({
        ...deal,
        course_title: (deal.courses as any)?.title || 'نامشخص',
        customer_name: (deal.enrollments as any)?.full_name || 'نامشخص',
        customer_phone: (deal.enrollments as any)?.phone || '',
        customer_email: (deal.enrollments as any)?.email || '',
        tags: deal.tags || []
      }));

      setDeals(processedDeals);
      calculateStats(processedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({ title: "خطا", description: "خطا در بارگذاری معاملات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (dealsData: Deal[]) => {
    const pipeline = pipelines.find(p => p.id === selectedPipelineId);
    const byStage: Record<string, number> = {};
    
    if (pipeline) {
      pipeline.stages.forEach(stage => {
        byStage[stage.id] = dealsData.filter(d => d.current_stage_id === stage.id).length;
      });
    }

    const wonDeals = dealsData.filter(d => d.status === 'won');
    
    setStats({
      total: dealsData.length,
      byStage,
      totalValue: dealsData.reduce((sum, d) => sum + (d.price || 0), 0),
      wonValue: wonDeals.reduce((sum, d) => sum + (d.price || 0), 0)
    });
  };

  const moveDealToStage = async (dealId: string, newStageId: string) => {
    try {
      const deal = deals.find(d => d.id === dealId);
      const oldStageId = deal?.current_stage_id;

      const { error } = await supabase
        .from('deals')
        .update({ 
          current_stage_id: newStageId,
          stage_entered_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;

      // Log stage change
      await supabase.from('deal_stage_history').insert({
        deal_id: dealId,
        from_stage_id: oldStageId,
        to_stage_id: newStageId,
        changed_by: user?.messengerData?.id
      });

      toast({ title: "موفق", description: "مرحله معامله بروزرسانی شد" });
      fetchDeals();
    } catch (error) {
      console.error('Error moving deal:', error);
      toast({ title: "خطا", description: "خطا در بروزرسانی مرحله", variant: "destructive" });
    }
  };

  const updateDealStatus = async (dealId: string, newStatus: 'won' | 'lost') => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ 
          status: newStatus,
          closed_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;

      toast({ title: "موفق", description: newStatus === 'won' ? "معامله موفق ثبت شد" : "معامله از دست رفته ثبت شد" });
      fetchDeals();
    } catch (error) {
      console.error('Error updating deal status:', error);
      toast({ title: "خطا", description: "خطا در بروزرسانی وضعیت", variant: "destructive" });
    }
  };

  const openDealDialog = (deal: Deal) => {
    setSelectedDeal(deal);
    setDealNotes(deal.notes || '');
    setDealTags(deal.tags || []);
    setShowDealDialog(true);
  };

  const saveDealDetails = async () => {
    if (!selectedDeal) return;

    setSavingDeal(true);
    try {
      const { error } = await supabase
        .from('deals')
        .update({ 
          notes: dealNotes,
          tags: dealTags
        })
        .eq('id', selectedDeal.id);

      if (error) throw error;

      toast({ title: "موفق", description: "اطلاعات معامله ذخیره شد" });
      setShowDealDialog(false);
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
      toast({ title: "خطا", description: "خطا در ذخیره اطلاعات", variant: "destructive" });
    } finally {
      setSavingDeal(false);
    }
  };

  const toggleTag = (tag: string) => {
    setDealTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
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
    return deals.filter(deal => deal.current_stage_id === stageId && deal.status !== 'won' && deal.status !== 'lost');
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  if (loading && pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          هیچ پایپ‌لاینی به شما اختصاص داده نشده است.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Selector */}
      <div className="flex items-center gap-4">
        <Label>پایپ‌لاین:</Label>
        <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
          <SelectTrigger className="w-64">
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
        <Button variant="outline" onClick={fetchDeals} className="gap-2 mr-auto">
          <RefreshCw className="h-4 w-4" />
          بروزرسانی
        </Button>
      </div>

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
                <p className="text-sm text-muted-foreground">در جریان</p>
                <p className="text-2xl font-bold">{deals.filter(d => d.status !== 'won' && d.status !== 'lost').length}</p>
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
                <p className="text-2xl font-bold">{deals.filter(d => d.status === 'won').length}</p>
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
                <p className="text-sm text-muted-foreground">ارزش فروش</p>
                <p className="text-lg font-bold">{formatCurrency(stats.wonValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      {selectedPipeline && (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: `${selectedPipeline.stages.length * 300}px` }}>
            {selectedPipeline.stages.map(stage => {
              const stageDeals = getDealsForStage(stage.id);
              
              return (
                <Card key={stage.id} className="min-w-[280px] max-w-[300px] flex-shrink-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.title}
                      <Badge variant="secondary" className="mr-auto">
                        {stageDeals.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[300px]">
                    {stageDeals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        بدون معامله
                      </p>
                    ) : (
                      stageDeals.map(deal => (
                        <Card 
                          key={deal.id} 
                          className="bg-muted/30 border-muted cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openDealDialog(deal)}
                        >
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
                            
                            {deal.tags && deal.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {deal.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {deal.customer_phone || '-'}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(deal.created_at)}
                              </span>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateDealStatus(deal.id, 'won');
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateDealStatus(deal.id, 'lost');
                                  }}
                                >
                                  <XCircle className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            </div>

                            {/* Stage Navigation */}
                            <div className="flex items-center justify-between pt-2">
                              {stage.order_index > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const prevStage = selectedPipeline.stages.find(s => s.order_index === stage.order_index - 1);
                                    if (prevStage) moveDealToStage(deal.id, prevStage.id);
                                  }}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              )}
                              <div className="flex-1" />
                              {stage.order_index < selectedPipeline.stages.length - 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStage = selectedPipeline.stages.find(s => s.order_index === stage.order_index + 1);
                                    if (nextStage) moveDealToStage(deal.id, nextStage.id);
                                  }}
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>
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

            {/* Won/Lost Columns */}
            <Card className="min-w-[280px] max-w-[300px] flex-shrink-0 border-green-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  موفق
                  <Badge variant="secondary" className="mr-auto bg-green-100">
                    {deals.filter(d => d.status === 'won').length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[300px]">
                {deals.filter(d => d.status === 'won').slice(0, 5).map(deal => (
                  <Card key={deal.id} className="bg-green-50 border-green-200">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{deal.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{deal.course_title}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">{formatCurrency(deal.price)}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card className="min-w-[280px] max-w-[300px] flex-shrink-0 border-red-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-red-600">
                  <XCircle className="h-4 w-4" />
                  از دست رفته
                  <Badge variant="secondary" className="mr-auto bg-red-100">
                    {deals.filter(d => d.status === 'lost').length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[300px]">
                {deals.filter(d => d.status === 'lost').slice(0, 5).map(deal => (
                  <Card key={deal.id} className="bg-red-50 border-red-200">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{deal.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{deal.course_title}</p>
                      <p className="text-sm font-bold text-red-600 mt-1">{formatCurrency(deal.price)}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      )}

      {/* Deal Detail Dialog */}
      <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>جزئیات معامله</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4 py-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">نام مشتری</Label>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedDeal.customer_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تلفن</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedDeal.customer_phone}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ایمیل</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedDeal.customer_email || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاریخ ایجاد</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedDeal.created_at)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">دوره</Label>
                    <p className="font-medium">{selectedDeal.course_title}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">مبلغ</Label>
                    <p className="font-bold text-primary">{formatCurrency(selectedDeal.price)}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="border-t pt-4">
                <Label className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4" />
                  برچسب‌ها
                </Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={dealTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="border-t pt-4">
                <Label className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  یادداشت
                </Label>
                <Textarea
                  value={dealNotes}
                  onChange={(e) => setDealNotes(e.target.value)}
                  placeholder="یادداشت برای این معامله..."
                  rows={3}
                />
              </div>

              {/* Move Stage */}
              <div className="border-t pt-4">
                <Label className="mb-2 block">انتقال به مرحله</Label>
                <Select
                  value={selectedDeal.current_stage_id || ''}
                  onValueChange={(value) => moveDealToStage(selectedDeal.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مرحله" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPipeline?.stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => updateDealStatus(selectedDeal!.id, 'lost')}>
              <XCircle className="h-4 w-4 ml-2 text-red-600" />
              رد شده
            </Button>
            <Button variant="outline" onClick={() => updateDealStatus(selectedDeal!.id, 'won')}>
              <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
              موفق
            </Button>
            <Button onClick={saveDealDetails} disabled={savingDeal}>
              {savingDeal && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesAgentPipelineView;
