import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  User,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Plus,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Deal {
  id: string;
  status: 'in_progress' | 'won' | 'lost';
  price: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  enrollment: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    payment_amount: number;
    created_at: string;
    course_id: string;
    original_course: {
      title: string;
    };
  };
  course: {
    id: string;
    title: string;
  };
  assigned_salesperson: {
    id: number;
    name: string;
    phone: string;
  };
  activities: DealActivity[];
}

interface DealActivity {
  id: string;
  type: string;
  description: string;
  result: string | null;
  created_at: string;
  admin: {
    id: number;
    name: string;
  };
}

const SalesAgentDealsPipeline: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'call',
    result: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, [user]);

  const fetchDeals = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get deals assigned to current sales agent
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          status,
          price,
          created_at,
          updated_at,
          closed_at,
          enrollment_id,
          course_id,
          assigned_salesperson_id,
          enrollments!inner(
            id,
            full_name,
            email,
            phone,
            payment_amount,
            created_at,
            course_id,
            original_course:courses(title)
          ),
          courses!inner(
            id,
            title
          ),
          deal_activities(
            id,
            type,
            description,
            result,
            created_at,
            chat_users!deal_activities_admin_id_fkey(
              id,
              name
            )
          )
        `)
        .eq('assigned_salesperson_id', Number(user.id))
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data for easier use
      const formattedDeals: Deal[] = (data || []).map(deal => ({
        id: deal.id,
        status: deal.status as 'in_progress' | 'won' | 'lost',
        price: deal.price,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
        closed_at: deal.closed_at,
        enrollment: {
          id: deal.enrollments.id,
          full_name: deal.enrollments.full_name,
          email: deal.enrollments.email,
          phone: deal.enrollments.phone,
          payment_amount: deal.enrollments.payment_amount,
          created_at: deal.enrollments.created_at,
          course_id: deal.enrollments.course_id,
          original_course: deal.enrollments.original_course
        },
        course: {
          id: deal.courses.id,
          title: deal.courses.title
        },
        assigned_salesperson: {
          id: Number(user.id),
          name: user.name || 'نامشخص',
          phone: user.phone || ''
        },
        activities: (deal.deal_activities || []).map(activity => ({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          result: activity.result,
          created_at: activity.created_at,
          admin: {
            id: activity.chat_users?.id || 0,
            name: activity.chat_users?.name || 'نامشخص'
          }
        }))
      }));

      setDeals(formattedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت معاملات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDealStatus = async (dealId: string, status: 'in_progress' | 'won' | 'lost') => {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (status === 'won' || status === 'lost') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "وضعیت معامله بروزرسانی شد",
      });

      fetchDeals(); // Refresh deals
    } catch (error) {
      console.error('Error updating deal status:', error);
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی وضعیت معامله",
        variant: "destructive"
      });
    }
  };

  const addActivity = async () => {
    if (!selectedDeal || !user?.id) return;
    
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('deal_activities')
        .insert([{
          deal_id: selectedDeal.id,
          type: newActivity.type,
          result: newActivity.result || null,
          description: newActivity.description,
          admin_id: Number(user.id)
        }]);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "فعالیت اضافه شد",
      });

      setNewActivity({ type: 'call', result: '', description: '' });
      setIsActivityModalOpen(false);
      fetchDeals(); // Refresh to get updated activities
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن فعالیت",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'message': return <MessageCircle className="h-4 w-4" />;
      case 'note': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      call: 'تماس',
      meeting: 'جلسه',
      message: 'پیام',
      note: 'یادداشت'
    };
    return types[type] || type;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    const variants: Record<string, any> = {
      'successful': 'default',
      'no_answer': 'secondary',
      'interested': 'default',
      'not_interested': 'destructive',
      'follow_up': 'outline'
    };

    const labels: Record<string, string> = {
      'successful': 'موفق',
      'no_answer': 'پاسخ نداد',
      'interested': 'علاقه‌مند',
      'not_interested': 'علاقه‌مند نیست',
      'follow_up': 'پیگیری'
    };

    return <Badge variant={variants[result] || 'default'} className="text-xs">{labels[result] || result}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'in_progress': 'secondary',
      'won': 'default',
      'lost': 'destructive'
    };
    
    const labels: Record<string, string> = {
      'in_progress': 'در حال پیگیری',
      'won': 'موفق',
      'lost': 'ناموفق'
    };

    return <Badge variant={variants[status]} className="text-xs">{labels[status]}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'won': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'lost': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const groupedDeals = {
    in_progress: deals.filter(deal => deal.status === 'in_progress'),
    won: deals.filter(deal => deal.status === 'won'),
    lost: deals.filter(deal => deal.status === 'lost')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin ml-2" />
        <span>در حال بارگذاری...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">در حال پیگیری</p>
                <p className="text-2xl font-bold">{groupedDeals.in_progress.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">موفق</p>
                <p className="text-2xl font-bold">{groupedDeals.won.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ناموفق</p>
                <p className="text-2xl font-bold">{groupedDeals.lost.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(groupedDeals).map(([status, statusDeals]) => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <CardTitle className="text-lg">
                  {status === 'in_progress' ? 'در حال پیگیری' : 
                   status === 'won' ? 'موفق' : 'ناموفق'}
                </CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {statusDeals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">هیچ معامله‌ای در این مرحله وجود ندارد</p>
                </div>
              ) : (
                statusDeals.map((deal) => (
                  <Card key={deal.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <h4 className="font-medium text-sm">{deal.enrollment.full_name}</h4>
                             <p className="text-xs text-muted-foreground">{deal.course.title}</p>
                             {deal.enrollment.original_course && (
                               <p className="text-xs text-muted-foreground">
                                 لید از: {deal.enrollment.original_course.title}
                               </p>
                             )}
                           </div>
                          {getStatusBadge(deal.status)}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{deal.enrollment.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatPrice(deal.price)}</span>
                          </div>
                        </div>

                        {deal.activities.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            آخرین فعالیت: {getActivityTypeLabel(deal.activities[0].type)} - 
                            {formatDate(deal.activities[0].created_at)}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs flex-1"
                                onClick={() => setSelectedDeal(deal)}
                              >
                                مشاهده جزئیات
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>جزئیات معامله - {deal.enrollment.full_name}</DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">نام مشتری</Label>
                                    <p className="text-sm">{deal.enrollment.full_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">دوره</Label>
                                    <p className="text-sm">{deal.course.title}</p>
                                  </div>
                                  {deal.enrollment.original_course && (
                                    <div>
                                      <Label className="text-sm font-medium">لید از دوره</Label>
                                      <p className="text-sm">{deal.enrollment.original_course.title}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-sm font-medium">مبلغ معامله</Label>
                                    <p className="text-sm">{formatPrice(deal.price)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">وضعیت</Label>
                                    <div>{getStatusBadge(deal.status)}</div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">فعالیت‌ها</Label>
                                    <Button
                                      size="sm"
                                      onClick={() => setIsActivityModalOpen(true)}
                                      className="text-xs"
                                    >
                                      <Plus className="h-3 w-3 ml-1" />
                                      افزودن فعالیت
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {deal.activities.length === 0 ? (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        هیچ فعالیتی ثبت نشده است
                                      </p>
                                    ) : (
                                      deal.activities.map((activity) => (
                                        <Card key={activity.id} className="p-3">
                                          <div className="flex items-start gap-2">
                                            {getActivityIcon(activity.type)}
                                            <div className="flex-1 space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                  {getActivityTypeLabel(activity.type)}
                                                </span>
                                                {getResultBadge(activity.result)}
                                                <span className="text-xs text-muted-foreground mr-auto">
                                                  {formatDate(activity.created_at)}
                                                </span>
                                              </div>
                                              <p className="text-sm text-muted-foreground">
                                                {activity.description}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                توسط: {activity.admin.name}
                                              </p>
                                            </div>
                                          </div>
                                        </Card>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {deal.status === 'in_progress' && (
                                  <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                      size="sm"
                                      onClick={() => updateDealStatus(deal.id, 'won')}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="h-4 w-4 ml-1" />
                                      علامت‌گذاری موفق
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updateDealStatus(deal.id, 'lost')}
                                      className="flex-1"
                                    >
                                      <XCircle className="h-4 w-4 ml-1" />
                                      علامت‌گذاری ناموفق
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {deal.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDeal(deal);
                                setIsActivityModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Activity Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن فعالیت جدید</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity-type">نوع فعالیت</Label>
              <Select value={newActivity.type} onValueChange={(value) => setNewActivity({...newActivity, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">تماس</SelectItem>
                  <SelectItem value="meeting">جلسه</SelectItem>
                  <SelectItem value="message">پیام</SelectItem>
                  <SelectItem value="note">یادداشت</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(newActivity.type === 'call' || newActivity.type === 'meeting') && (
              <div>
                <Label htmlFor="activity-result">نتیجه</Label>
                <Select value={newActivity.result} onValueChange={(value) => setNewActivity({...newActivity, result: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نتیجه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="successful">موفق</SelectItem>
                    <SelectItem value="no_answer">پاسخ نداد</SelectItem>
                    <SelectItem value="interested">علاقه‌مند</SelectItem>
                    <SelectItem value="not_interested">علاقه‌مند نیست</SelectItem>
                    <SelectItem value="follow_up">پیگیری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="activity-description">توضیحات</Label>
              <Textarea
                id="activity-description"
                value={newActivity.description}
                onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                placeholder="توضیحات فعالیت را وارد کنید..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addActivity} disabled={submitting || !newActivity.description.trim()} className="flex-1">
                {submitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                افزودن فعالیت
              </Button>
              <Button variant="outline" onClick={() => setIsActivityModalOpen(false)}>
                لغو
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesAgentDealsPipeline;