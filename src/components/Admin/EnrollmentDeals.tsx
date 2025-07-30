import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Plus, Eye, Phone, MessageSquare, Calendar, FileText, DollarSign } from "lucide-react";
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
  
  // Related data
  enrollment?: {
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
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

interface EnrollmentDealsProps {
  enrollmentId: string;
  customerName: string;
}

const EnrollmentDeals: React.FC<EnrollmentDealsProps> = ({ enrollmentId, customerName }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState<{
    type: 'call' | 'meeting' | 'message' | 'note';
    result: string | undefined;
    description: string;
  }>({
    type: 'note',
    result: undefined,
    description: ''
  });
  const { toast } = useToast();
  const { canViewSales, isAdmin, isSalesManager } = useUserRole();

  useEffect(() => {
    fetchDeals();
  }, [enrollmentId]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('deals')
        .select(`
          *,
          enrollment:enrollments(full_name, email, phone, created_at),
          course:courses(title),
          salesperson:chat_users!deals_assigned_salesperson_id_fkey(name),
          activities:deal_activities(
            id, type, result, description, created_at,
            admin:chat_users!deal_activities_admin_id_fkey(name)
          )
        `)
        .eq('enrollment_id', enrollmentId);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setDeals((data || []) as Deal[]);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge variant="default" className="bg-green-600">موفق</Badge>;
      case 'lost':
        return <Badge variant="destructive">ناموفق</Badge>;
      default:
        return <Badge variant="secondary">در حال پیگیری</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            معاملات فروش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canViewSales) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          معاملات فروش
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">هنوز معامله‌ای برای این ثبت‌نام ایجاد نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{deal.course?.title}</h4>
                      {getStatusBadge(deal.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      فروشنده: {deal.salesperson?.name}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-green-600">{formatPrice(deal.price)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(deal.created_at)}</p>
                  </div>
                </div>

                {deal.activities && deal.activities.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    {getActivityIcon(deal.activities[0].type)}
                    <span>آخرین فعالیت: {getActivityTypeLabel(deal.activities[0].type)}</span>
                    {deal.activities[0].result && getResultBadge(deal.activities[0].result)}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    جزئیات
                  </Button>

                  {(isAdmin || isSalesManager) && deal.status === 'in_progress' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => updateDealStatus(deal.id, 'won')}
                      >
                        موفق
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => updateDealStatus(deal.id, 'lost')}
                      >
                        ناموفق
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deal Detail Modal */}
        {selectedDeal && (
          <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>جزئیات معامله - {customerName}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Deal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">دوره</label>
                    <p className="text-sm text-muted-foreground">{selectedDeal.course?.title}</p>
                  </div>
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
                    {getStatusBadge(selectedDeal.status)}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">فعالیت‌های انجام شده</h3>
                    <Button
                      size="sm"
                      onClick={() => setIsActivityModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      افزودن فعالیت
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedDeal.activities && selectedDeal.activities.length > 0 ? (
                      selectedDeal.activities.map((activity) => (
                        <div key={activity.id} className="border rounded p-3">
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-primary/10 rounded">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {getActivityTypeLabel(activity.type)}
                                  </span>
                                  {getResultBadge(activity.result)}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(activity.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                              {activity.admin && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  توسط: {activity.admin.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        هنوز فعالیتی ثبت نشده است
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Activity Modal */}
        <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>افزودن فعالیت جدید</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">نوع فعالیت</label>
                <Select 
                  value={newActivity.type} 
                  onValueChange={(value: any) => setNewActivity(prev => ({ ...prev, type: value }))}
                >
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
                  <label className="text-sm font-medium">نتیجه تماس</label>
                  <Select 
                    value={newActivity.result || ''} 
                    onValueChange={(value) => setNewActivity(prev => ({ ...prev, result: value || undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">موفق</SelectItem>
                      <SelectItem value="no_answer">پاسخ ندادن</SelectItem>
                      <SelectItem value="failed">ناموفق</SelectItem>
                      <SelectItem value="follow_up">پیگیری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">توضیحات</label>
                <Textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات فعالیت را وارد کنید"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={addActivity} className="flex-1">
                  ثبت فعالیت
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsActivityModalOpen(false)}
                  className="flex-1"
                >
                  لغو
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EnrollmentDeals;