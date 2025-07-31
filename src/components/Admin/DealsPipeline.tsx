import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Plus, Eye, Phone, MessageSquare, Calendar, FileText } from "lucide-react";
import { useUserRole } from '@/hooks/useUserRole';

interface Deal {
  id: string;
  enrollment_id: string;
  course_id: string;
  price: number;
  status: 'in_progress' | 'won' | 'lost';
  assigned_salesperson_id: number;
  assigned_by_id: number;
  created_at: string;
  closed_at?: string;
  crm_status?: 'none' | 'has_records' | 'has_calls';
  
  // Related data
  enrollment?: {
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    course_id: string;
    chat_user_id?: number;
    original_course: {
      title: string;
    };
  };
  course?: {
    title: string;
  };
  salesperson?: {
    name: string;
  };
  activities?: DealActivity[];
}

interface DealActivity {
  id: string;
  type: 'call' | 'meeting' | 'message' | 'note';
  result?: 'success' | 'no_answer' | 'failed' | 'canceled' | 'follow_up';
  description: string;
  created_at: string;
  admin?: {
    name: string;
  };
}

const DealsPipeline: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note' as const,
    result: undefined as string | undefined,
    description: ''
  });
  const { toast } = useToast();
  const { canViewSales, isAdmin, isSalesManager } = useUserRole();

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

  useEffect(() => {
    if (canViewSales) {
      fetchDeals();
    }
  }, [canViewSales]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('deals')
        .select(`
          *,
          enrollment:enrollments(
            full_name, email, phone, created_at, course_id, chat_user_id,
            original_course:courses(title)
          ),
          course:courses(title),
          salesperson:chat_users!deals_assigned_salesperson_id_fkey(name),
          activities:deal_activities(
            id, type, result, description, created_at,
            admin:chat_users!deal_activities_admin_id_fkey(name)
          )
        `);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch CRM status for each deal
      const userIds = (data || [])
        .map((deal: any) => deal.enrollment?.chat_user_id)
        .filter(id => id !== null && id !== undefined);
      
      let crmStatusMap: Record<number, string> = {};
      
      if (userIds.length > 0) {
        const { data: crmData } = await supabase
          .from('crm_notes')
          .select('user_id, type')
          .in('user_id', userIds);

        // Build CRM status map
        crmStatusMap = (crmData || []).reduce((acc, note) => {
          if (!acc[note.user_id]) {
            acc[note.user_id] = 'has_records';
          }
          if (note.type === 'call') {
            acc[note.user_id] = 'has_calls';
          }
          return acc;
        }, {} as Record<number, string>);
      }

      // Add CRM status to deals
      const dealsWithCRM = (data || []).map((deal: any) => ({
        ...deal,
        crm_status: deal.enrollment?.chat_user_id ? 
          (crmStatusMap[deal.enrollment.chat_user_id] as 'none' | 'has_records' | 'has_calls' || 'none') : 
          'none'
      }));

      setDeals(dealsWithCRM as Deal[]);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری معاملات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDealStatus = async (dealId: string, status: 'in_progress' | 'won' | 'lost') => {
    try {
      const updateData: any = { status };
      if (status !== 'in_progress') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId);

      if (error) throw error;

      await fetchDeals();
      toast({
        title: "موفق",
        description: "وضعیت معامله بروزرسانی شد"
      });
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
    if (!selectedDeal || !newActivity.description.trim()) return;

    try {
      // Get current user session to identify admin_id
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        throw new Error('No session token found');
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Invalid session');
      }

      const { error } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: selectedDeal.id,
          admin_id: sessionData.user_id,
          type: newActivity.type,
          result: newActivity.result || null,
          description: newActivity.description
        });

      if (error) throw error;

      await fetchDeals();
      setNewActivity({ type: 'note', result: undefined, description: '' });
      setIsActivityModalOpen(false);
      
      toast({
        title: "موفق",
        description: "فعالیت جدید اضافه شد"
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن فعالیت",
        variant: "destructive"
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'call': return 'تماس';
      case 'meeting': return 'جلسه';
      case 'message': return 'پیام';
      default: return 'یادداشت';
    }
  };

  const getResultBadge = (result?: string) => {
    if (!result) return null;
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      success: 'default',
      no_answer: 'secondary',
      failed: 'destructive',
      canceled: 'destructive',
      follow_up: 'secondary'
    };

    const labels: Record<string, string> = {
      success: 'موفق',
      no_answer: 'پاسخ ندادن',
      failed: 'ناموفق',
      canceled: 'لغو شده',
      follow_up: 'پیگیری'
    };

    return (
      <Badge variant={variants[result] || 'secondary'} className="text-xs">
        {labels[result] || result}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!canViewSales) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">شما دسترسی به این بخش را ندارید</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  const dealsInProgress = deals.filter(d => d.status === 'in_progress');
  const dealsWon = deals.filter(d => d.status === 'won');
  const dealsLost = deals.filter(d => d.status === 'lost');

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">پایپ‌لاین فروش</h2>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>در حال پیگیری: {dealsInProgress.length}</span>
          <span>موفق: {dealsWon.length}</span>
          <span>ناموفق: {dealsLost.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* In Progress Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="font-semibold">در حال پیگیری ({dealsInProgress.length})</h3>
          </div>
          <div className="space-y-3">
            {dealsInProgress.map((deal) => (
              <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2">
                           <h4 className="font-medium">{deal.enrollment?.full_name}</h4>
                           <span 
                             className="text-lg"
                             title={
                               deal.crm_status === 'has_calls' ? 'دارای تماس تلفنی' :
                               deal.crm_status === 'has_records' ? 'دارای یادداشت CRM' :
                               'بدون یادداشت CRM'
                             }
                           >
                             {getCRMStatusIcon(deal.crm_status)}
                           </span>
                         </div>
                         <p className="text-sm text-muted-foreground">{deal.course?.title}</p>
                         {deal.enrollment?.original_course && (
                           <p className="text-xs text-muted-foreground">
                             لید از: {deal.enrollment.original_course.title}
                           </p>
                         )}
                       </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-600">
                        {formatPrice(deal.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(deal.created_at)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      فروشنده: {deal.salesperson?.name}
                    </div>
                    
                    {deal.activities && deal.activities.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getActivityIcon(deal.activities[0].type)}
                        <span>آخرین فعالیت: {getActivityTypeLabel(deal.activities[0].type)}</span>
                      </div>
                    )}

                    {(isAdmin || isSalesManager) && (
                      <div className="flex gap-1 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => updateDealStatus(deal.id, 'won')}
                        >
                          موفق
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => updateDealStatus(deal.id, 'lost')}
                        >
                          ناموفق
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Won Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold">موفق ({dealsWon.length})</h3>
          </div>
          <div className="space-y-3">
            {dealsWon.map((deal) => (
              <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2">
                           <h4 className="font-medium">{deal.enrollment?.full_name}</h4>
                           <span 
                             className="text-lg"
                             title={
                               deal.crm_status === 'has_calls' ? 'دارای تماس تلفنی' :
                               deal.crm_status === 'has_records' ? 'دارای یادداشت CRM' :
                               'بدون یادداشت CRM'
                             }
                           >
                             {getCRMStatusIcon(deal.crm_status)}
                           </span>
                         </div>
                         <p className="text-sm text-muted-foreground">{deal.course?.title}</p>
                         {deal.enrollment?.original_course && (
                           <p className="text-xs text-muted-foreground">
                             لید از: {deal.enrollment.original_course.title}
                           </p>
                         )}
                       </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-600">
                        {formatPrice(deal.price)}
                      </span>
                      <Badge variant="default" className="text-xs">
                        بسته شده
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      فروشنده: {deal.salesperson?.name}
                    </div>
                    
                    {deal.closed_at && (
                      <div className="text-xs text-muted-foreground">
                        تاریخ بسته شدن: {formatDate(deal.closed_at)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Lost Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="font-semibold">ناموفق ({dealsLost.length})</h3>
          </div>
          <div className="space-y-3">
            {dealsLost.map((deal) => (
              <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2">
                           <h4 className="font-medium">{deal.enrollment?.full_name}</h4>
                           <span 
                             className="text-lg"
                             title={
                               deal.crm_status === 'has_calls' ? 'دارای تماس تلفنی' :
                               deal.crm_status === 'has_records' ? 'دارای یادداشت CRM' :
                               'بدون یادداشت CRM'
                             }
                           >
                             {getCRMStatusIcon(deal.crm_status)}
                           </span>
                         </div>
                         <p className="text-sm text-muted-foreground">{deal.course?.title}</p>
                         {deal.enrollment?.original_course && (
                           <p className="text-xs text-muted-foreground">
                             لید از: {deal.enrollment.original_course.title}
                           </p>
                         )}
                       </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">
                        {formatPrice(deal.price)}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        بسته شده
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      فروشنده: {deal.salesperson?.name}
                    </div>
                    
                    {deal.closed_at && (
                      <div className="text-xs text-muted-foreground">
                        تاریخ بسته شدن: {formatDate(deal.closed_at)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>جزئیات معامله - {selectedDeal.enrollment?.full_name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Deal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">نام مشتری</label>
                  <p className="text-sm text-muted-foreground">{selectedDeal.enrollment?.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">دوره</label>
                  <p className="text-sm text-muted-foreground">{selectedDeal.course?.title}</p>
                </div>
                {selectedDeal.enrollment?.original_course && (
                  <div>
                    <label className="text-sm font-medium">لید از دوره</label>
                    <p className="text-sm text-muted-foreground">{selectedDeal.enrollment.original_course.title}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">قیمت</label>
                  <p className="text-sm text-muted-foreground">{formatPrice(selectedDeal.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">فروشنده</label>
                  <p className="text-sm text-muted-foreground">{selectedDeal.salesperson?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">وضعیت</label>
                  <Badge 
                    variant={
                      selectedDeal.status === 'won' ? 'default' : 
                      selectedDeal.status === 'lost' ? 'destructive' : 'secondary'
                    }
                  >
                    {selectedDeal.status === 'won' ? 'موفق' : 
                     selectedDeal.status === 'lost' ? 'ناموفق' : 'در حال پیگیری'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">تاریخ ایجاد</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedDeal.created_at)}</p>
                </div>
              </div>

              {/* Activities Timeline */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">تاریخچه فعالیت‌ها</h3>
                  <Button
                    size="sm"
                    onClick={() => setIsActivityModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    افزودن فعالیت
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedDeal.activities?.map((activity) => (
                    <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {getActivityTypeLabel(activity.type)}
                          </span>
                          {getResultBadge(activity.result)}
                        </div>
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{activity.admin?.name}</span>
                          <span>{formatDate(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!selectedDeal.activities || selectedDeal.activities.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      هنوز فعالیتی ثبت نشده است
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedDeal.status === 'in_progress' && (isAdmin || isSalesManager) && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateDealStatus(selectedDeal.id, 'won');
                      setSelectedDeal(null);
                    }}
                    className="flex-1"
                  >
                    علامت‌گذاری به عنوان موفق
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateDealStatus(selectedDeal.id, 'lost');
                      setSelectedDeal(null);
                    }}
                    className="flex-1"
                  >
                    علامت‌گذاری به عنوان ناموفق
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Activity Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن فعالیت جدید</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">نوع فعالیت</label>
              <Select value={newActivity.type} onValueChange={(value: any) => setNewActivity({...newActivity, type: value})}>
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

            {newActivity.type !== 'note' && (
              <div>
                <label className="text-sm font-medium">نتیجه</label>
                <Select value={newActivity.result} onValueChange={(value) => setNewActivity({...newActivity, result: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نتیجه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">موفق</SelectItem>
                    <SelectItem value="no_answer">پاسخ ندادن</SelectItem>
                    <SelectItem value="failed">ناموفق</SelectItem>
                    <SelectItem value="canceled">لغو شده</SelectItem>
                    <SelectItem value="follow_up">پیگیری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                placeholder="توضیحات فعالیت را وارد کنید..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={addActivity} disabled={!newActivity.description.trim()}>
                افزودن
              </Button>
              <Button variant="outline" onClick={() => setIsActivityModalOpen(false)}>
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealsPipeline;