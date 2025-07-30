import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Plus,
  Filter,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

interface FollowUp {
  id: string;
  user_id: number;
  crm_activity_id: string;
  title: string;
  assigned_to: number;
  due_at: string;
  completed_at: string | null;
  status: 'open' | 'done';
  deal_id: string | null;
  created_at: string;
  // Related data
  user_name?: string;
  user_phone?: string;
  assigned_to_name?: string;
  deal_course_title?: string;
}

interface NewFollowUp {
  title: string;
  followup_date_option: string;
  followup_custom_date: string;
  followup_time: string;
  schedule_followup: boolean;
}

interface DealStatusUpdate {
  status: 'won' | 'lost' | null;
}

export function FollowUpsManagement() {
  const { user } = useAuth();
  const { isAdmin, isSalesManager, isSalesAgent } = useUserRole();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'done' | 'overdue'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'this_week' | 'overdue'>('all');
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [isCompletingFollowUp, setIsCompletingFollowUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextFollowUp, setNextFollowUp] = useState<NewFollowUp>({
    title: '',
    followup_date_option: 'tomorrow',
    followup_custom_date: '',
    followup_time: new Date().getHours() + ':00',
    schedule_followup: false
  });
  const [dealStatus, setDealStatus] = useState<DealStatusUpdate>({
    status: null
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      let query = supabase
        .from('crm_followups')
        .select(`
          *,
          user:chat_users!crm_followups_user_id_fkey(name, phone),
          assignee:chat_users!crm_followups_assigned_to_fkey(name),
          deals(courses(title))
        `);

      // For sales agents, only show follow-ups assigned to them
      if (isSalesAgent && user?.id) {
        query = query.eq('assigned_to', parseInt(user.id));
      }

      const { data, error } = await query.order('due_at', { ascending: true });

      if (error) throw error;

      const enrichedFollowUps: FollowUp[] = (data || []).map(followUp => ({
        ...followUp,
        status: followUp.status as 'open' | 'done',
        user_name: (followUp as any).user?.name || 'نامشخص',
        user_phone: (followUp as any).user?.phone || '',
        assigned_to_name: (followUp as any).assignee?.name || 'نامشخص',
        deal_course_title: (followUp as any).deals?.courses?.title || null
      }));

      setFollowUps(enrichedFollowUps);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری پیگیری‌ها.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFollowUpDate = (option: string, customDate?: string, time?: string) => {
    const now = new Date();
    let targetDate = new Date();
    
    switch (option) {
      case 'tomorrow':
        targetDate.setDate(now.getDate() + 1);
        break;
      case 'day_after_tomorrow':
        targetDate.setDate(now.getDate() + 2);
        break;
      case 'next_week':
        targetDate.setDate(now.getDate() + 7);
        break;
      case 'custom':
        if (customDate) {
          targetDate = new Date(customDate);
        }
        break;
      default:
        targetDate.setDate(now.getDate() + 1);
    }
    
    if (time) {
      const [hours, minutes] = time.split(':');
      targetDate.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
    } else {
      targetDate.setHours(now.getHours(), 0, 0, 0);
    }
    
    return targetDate.toISOString();
  };

  const markAsCompleted = async (followUpId: string, scheduleNext: boolean = false) => {
    setIsSubmitting(true);
    try {
      const currentFollowUp = followUps.find(f => f.id === followUpId);
      
      // Mark current follow-up as completed
      const { error: updateError } = await supabase
        .from('crm_followups')
        .update({
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', followUpId);

      if (updateError) throw updateError;

      // If NOT scheduling next follow-up and deal status is selected, update deal status
      if (!scheduleNext && !nextFollowUp.schedule_followup && dealStatus.status) {
        // Update deal status if deal_id exists
        if (currentFollowUp?.deal_id) {
          const { error: dealUpdateError } = await supabase
            .from('deals')
            .update({
              status: dealStatus.status,
              closed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', currentFollowUp.deal_id);

          if (dealUpdateError) throw dealUpdateError;
        } else {
          // Log that no deal was found for this follow-up
          console.log('No deal_id found for follow-up:', followUpId, 'but deal status was selected:', dealStatus.status);
        }
      }

      // If scheduling next follow-up
      if (scheduleNext && nextFollowUp.schedule_followup && nextFollowUp.title.trim()) {
        if (currentFollowUp) {
          const followUpDateTime = calculateFollowUpDate(
            nextFollowUp.followup_date_option,
            nextFollowUp.followup_custom_date,
            nextFollowUp.followup_time
          );

          const { error: insertError } = await supabase
            .from('crm_followups')
            .insert({
              user_id: currentFollowUp.user_id,
              crm_activity_id: currentFollowUp.crm_activity_id,
              title: nextFollowUp.title,
              assigned_to: currentFollowUp.assigned_to,
              due_at: followUpDateTime,
              status: 'open',
              deal_id: currentFollowUp.deal_id
            });

          if (insertError) throw insertError;
        }
      }

      let description = "پیگیری با موفقیت تکمیل شد.";
      if (scheduleNext && nextFollowUp.schedule_followup) {
        description = "پیگیری تکمیل شد و پیگیری بعدی ایجاد شد.";
      } else if (dealStatus.status) {
        const statusText = dealStatus.status === 'won' ? 'موفق' : 'لغو شده';
        description = `پیگیری تکمیل شد و وضعیت معامله به "${statusText}" تغییر یافت.`;
      }

      toast({
        title: "موفق",
        description
      });

      // Reset form and close dialog
      setNextFollowUp({
        title: '',
        followup_date_option: 'tomorrow',
        followup_custom_date: '',
        followup_time: new Date().getHours() + ':00',
        schedule_followup: false
      });
      setDealStatus({ status: null });
      setIsCompletingFollowUp(false);
      setSelectedFollowUp(null);

      // Refresh data
      await fetchFollowUps();
    } catch (error) {
      console.error('Error completing follow-up:', error);
      toast({
        title: "خطا",
        description: "خطا در تکمیل پیگیری.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (followUp: FollowUp) => {
    if (followUp.status === 'done') {
      return <Badge variant="default" className="text-xs">تکمیل شده</Badge>;
    }
    
    if (isOverdue(followUp.due_at)) {
      return <Badge variant="destructive" className="text-xs">عقب‌افتاده</Badge>;
    }
    
    return <Badge variant="secondary" className="text-xs">باز</Badge>;
  };

  const getStatusIcon = (followUp: FollowUp) => {
    if (followUp.status === 'done') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    
    if (isOverdue(followUp.due_at)) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    
    return <Clock className="w-4 h-4 text-blue-600" />;
  };

  // Apply filters
  const filteredFollowUps = followUps.filter(followUp => {
    // Status filter
    if (filterStatus === 'open' && followUp.status !== 'open') return false;
    if (filterStatus === 'done' && followUp.status !== 'done') return false;
    if (filterStatus === 'overdue' && (followUp.status === 'done' || !isOverdue(followUp.due_at))) return false;

    // Date range filter
    const dueDate = new Date(followUp.due_at);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    if (filterDateRange === 'today') {
      return dueDate.toDateString() === today.toDateString();
    }
    if (filterDateRange === 'this_week') {
      return dueDate >= weekStart && dueDate <= new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    if (filterDateRange === 'overdue') {
      return isOverdue(followUp.due_at) && followUp.status === 'open';
    }

    return true;
  });

  const openFollowUpsCount = followUps.filter(f => f.status === 'open').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                پیگیری‌ها ({openFollowUpsCount} باز)
              </CardTitle>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">فیلتر:</span>
              </div>
              
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="open">باز</SelectItem>
                  <SelectItem value="done">تکمیل شده</SelectItem>
                  <SelectItem value="overdue">عقب‌افتاده</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterDateRange} onValueChange={(value: any) => setFilterDateRange(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="زمان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="today">امروز</SelectItem>
                  <SelectItem value="this_week">این هفته</SelectItem>
                  <SelectItem value="overdue">عقب‌افتاده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredFollowUps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ پیگیری یافت نشد.
            </div>
          ) : (
            <>
              {/* Mobile cards view */}
              <div className="block md:hidden space-y-4">
                {filteredFollowUps.map((followUp) => (
                  <div key={followUp.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(followUp)}
                      {getStatusBadge(followUp)}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-muted-foreground">عنوان</div>
                        <div className="font-medium">{followUp.title}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">کاربر</div>
                        <div className="font-medium">{followUp.user_name}</div>
                        <div className="text-sm text-muted-foreground">{followUp.user_phone}</div>
                      </div>
                      
                      {followUp.deal_course_title && (
                        <div>
                          <div className="text-xs text-muted-foreground">محصول معامله</div>
                          <div className="text-sm">{followUp.deal_course_title}</div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(followUp.due_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {followUp.assigned_to_name}
                        </div>
                      </div>
                      
                      {followUp.status === 'open' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedFollowUp(followUp);
                            setIsCompletingFollowUp(true);
                          }}
                          className="w-full"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          تکمیل شده
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">کاربر</TableHead>
                      <TableHead className="text-right">مسئول</TableHead>
                      <TableHead className="text-right">عنوان</TableHead>
                      <TableHead className="text-right">محصول معامله</TableHead>
                      <TableHead className="text-right">زمان سررسید</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFollowUps.map((followUp) => (
                      <TableRow key={followUp.id} className={isOverdue(followUp.due_at) && followUp.status === 'open' ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(followUp)}
                            {getStatusBadge(followUp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{followUp.user_name}</span>
                            <span className="text-sm text-muted-foreground">{followUp.user_phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{followUp.assigned_to_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{followUp.title}</span>
                        </TableCell>
                        <TableCell>
                          {followUp.deal_course_title ? (
                            <span className="text-sm">{followUp.deal_course_title}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className={`text-sm ${isOverdue(followUp.due_at) && followUp.status === 'open' ? 'text-red-600 font-medium' : ''}`}>
                              {formatDate(followUp.due_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {followUp.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFollowUp(followUp);
                                setIsCompletingFollowUp(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              تکمیل شده
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Complete Follow-up Dialog */}
      <Dialog open={isCompletingFollowUp} onOpenChange={setIsCompletingFollowUp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تکمیل پیگیری</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            {selectedFollowUp && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedFollowUp.title}</div>
                <div className="text-sm text-muted-foreground">{selectedFollowUp.user_name}</div>
                <div className="text-sm text-muted-foreground">{formatDate(selectedFollowUp.due_at)}</div>
              </div>
            )}

            {/* Deal Status Selection - Always show when NOT scheduling next follow-up */}
            {!nextFollowUp.schedule_followup && (
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">وضعیت نهایی معامله *</Label>
                <Select 
                  value={dealStatus.status || ''} 
                  onValueChange={(value) => setDealStatus({status: value as 'won' | 'lost'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب وضعیت معامله" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">موفق</SelectItem>
                    <SelectItem value="lost">لغو شده</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  در صورت عدم زمان‌بندی پیگیری بعدی، باید وضعیت نهایی معامله را مشخص کنید.
                </p>
              </div>
            )}

            {/* Next Follow-up Scheduling */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule_next_followup"
                  checked={nextFollowUp.schedule_followup}
                  onCheckedChange={(checked) => {
                    setNextFollowUp({...nextFollowUp, schedule_followup: checked as boolean});
                    // Reset deal status when scheduling next follow-up
                    if (checked) {
                      setDealStatus({status: null});
                    }
                  }}
                />
                <Label htmlFor="schedule_next_followup" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  زمان‌بندی پیگیری بعدی
                </Label>
              </div>

              {nextFollowUp.schedule_followup && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="next_followup_title">عنوان پیگیری بعدی</Label>
                    <Input
                      id="next_followup_title"
                      placeholder="مثال: پیگیری نهایی"
                      value={nextFollowUp.title}
                      onChange={(e) => setNextFollowUp({...nextFollowUp, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="next_followup_date">زمان پیگیری</Label>
                      <Select
                        value={nextFollowUp.followup_date_option}
                        onValueChange={(value) => setNextFollowUp({...nextFollowUp, followup_date_option: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب زمان" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tomorrow">فردا</SelectItem>
                          <SelectItem value="day_after_tomorrow">پس‌فردا</SelectItem>
                          <SelectItem value="next_week">هفته آینده</SelectItem>
                          <SelectItem value="custom">تاریخ دلخواه</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="next_followup_time">ساعت</Label>
                      <Input
                        id="next_followup_time"
                        type="time"
                        value={nextFollowUp.followup_time}
                        onChange={(e) => setNextFollowUp({...nextFollowUp, followup_time: e.target.value})}
                      />
                    </div>
                  </div>

                  {nextFollowUp.followup_date_option === 'custom' && (
                    <div>
                      <Label htmlFor="next_followup_custom_date">تاریخ دلخواه</Label>
                      <Input
                        id="next_followup_custom_date"
                        type="date"
                        value={nextFollowUp.followup_custom_date}
                        onChange={(e) => setNextFollowUp({...nextFollowUp, followup_custom_date: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCompletingFollowUp(false)}>
                لغو
              </Button>
              <Button 
                onClick={() => {
                  // Validation for scheduling next follow-up
                  if (nextFollowUp.schedule_followup && !nextFollowUp.title.trim()) {
                    toast({
                      title: "خطا",
                      description: "لطفاً عنوان پیگیری بعدی را وارد کنید.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Validation for deal status when NOT scheduling next follow-up
                  if (!nextFollowUp.schedule_followup && !dealStatus.status) {
                    toast({
                      title: "خطا", 
                      description: "لطفاً وضعیت نهایی معامله را انتخاب کنید.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markAsCompleted(selectedFollowUp?.id || '', nextFollowUp.schedule_followup);
                }} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'در حال تکمیل...' : 'تکمیل پیگیری'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}