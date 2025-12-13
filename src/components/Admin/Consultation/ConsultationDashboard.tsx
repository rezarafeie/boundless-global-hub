import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Bell,
  Loader2,
  RefreshCw,
  Phone,
  FileText,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import ConsultationDetailsPanel from './ConsultationDetailsPanel';
import ConsultationCRMDialog from './ConsultationCRMDialog';
import ConsultationAnalytics from './ConsultationAnalytics';

interface ConsultationBooking {
  id: string;
  user_id: number;
  slot_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: string;
  confirmed_by: number | null;
  confirmed_at: string | null;
  confirmation_note: string | null;
  consultation_link: string | null;
  description: string | null;
  created_at: string;
  reminder_sent_at: string | null;
  deal_id: string | null;
  crm_added: boolean;
  slot?: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
  };
}

interface ConsultationSettings {
  webhook_url: string | null;
}

const ConsultationDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [settings, setSettings] = useState<ConsultationSettings>({ webhook_url: null });
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Panels
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showCRMDialog, setShowCRMDialog] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  
  // Time tracking for countdown
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchBookings(), fetchSettings()]);
    setLoading(false);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('consultation_bookings')
      .select(`
        *,
        slot:consultation_slots(id, date, start_time, end_time)
      `)
      .order('created_at', { ascending: false });
    setBookings((data || []) as ConsultationBooking[]);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('consultation_settings')
      .select('webhook_url')
      .eq('id', 1)
      .single();
    if (data) setSettings({ webhook_url: data.webhook_url });
  };

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const todayBookings = bookings.filter(b => b.slot?.date === today);
    const weekBookings = bookings.filter(b => b.slot?.date && b.slot.date >= weekAgo);
    
    return {
      todayTotal: todayBookings.length,
      weekTotal: weekBookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      noShow: bookings.filter(b => b.status === 'no_show').length,
      avgDaily: Math.round(weekBookings.length / 7 * 10) / 10
    };
  }, [bookings]);

  // Queue - confirmed consultations ordered by time
  const consultationQueue = useMemo(() => {
    return bookings
      .filter(b => b.status === 'confirmed' && b.slot)
      .sort((a, b) => {
        const dateA = new Date(`${a.slot!.date}T${a.slot!.start_time}`);
        const dateB = new Date(`${b.slot!.date}T${b.slot!.start_time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 20);
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (dateFilter && b.slot?.date !== dateFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!b.full_name.toLowerCase().includes(search) && 
            !b.phone.includes(search)) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, dateFilter, searchTerm]);

  const getTimeRemaining = (date: string, time: string) => {
    const sessionTime = new Date(`${date}T${time}`);
    const diff = sessionTime.getTime() - now.getTime();
    
    if (diff < 0) return { text: 'گذشته', isUpcoming: false, isPast: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days} روز دیگر`, isUpcoming: false, isPast: false };
    }
    if (hours > 0) {
      return { text: `${hours} ساعت و ${minutes} دقیقه`, isUpcoming: hours <= 2, isPast: false };
    }
    return { text: `${minutes} دقیقه`, isUpcoming: true, isPast: false };
  };

  const handleSendReminder = async (booking: ConsultationBooking) => {
    if (!settings.webhook_url || !booking.slot) return;
    
    setSendingReminder(booking.id);
    try {
      const response = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'consultation_reminder',
          name: booking.full_name,
          phone: booking.phone,
          date: booking.slot.date,
          time: booking.slot.start_time.slice(0, 5),
          consultation_link: booking.consultation_link
        })
      });

      if (!response.ok) throw new Error('Webhook failed');

      await supabase
        .from('consultation_bookings')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', booking.id);

      toast({ title: 'یادآوری ارسال شد' });
      fetchBookings();
    } catch (error) {
      toast({ title: 'خطا در ارسال یادآوری', variant: 'destructive' });
    } finally {
      setSendingReminder(null);
    }
  };

  const handleMarkNoShow = async (bookingId: string) => {
    try {
      await supabase
        .from('consultation_bookings')
        .update({ status: 'no_show' })
        .eq('id', bookingId);
      toast({ title: 'وضعیت به عدم حضور تغییر یافت' });
      fetchBookings();
    } catch {
      toast({ title: 'خطا', variant: 'destructive' });
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    try {
      await supabase
        .from('consultation_bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
      toast({ title: 'وضعیت به انجام شده تغییر یافت' });
      fetchBookings();
    } catch {
      toast({ title: 'خطا', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">در انتظار</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">تایید شده</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">لغو شده</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">انجام شده</Badge>;
      case 'no_show':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">عدم حضور</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy/MM/dd');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (time: string) => time.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">امروز</p>
                <p className="text-lg font-bold">{stats.todayTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">هفته</p>
                <p className="text-lg font-bold">{stats.weekTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">در انتظار</p>
                <p className="text-lg font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تایید شده</p>
                <p className="text-lg font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">انجام شده</p>
                <p className="text-lg font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-500/10 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عدم حضور</p>
                <p className="text-lg font-bold">{stats.noShow}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">میانگین روزانه</p>
                <p className="text-lg font-bold">{stats.avgDaily}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                صف مشاوره
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {consultationQueue.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  مشاوره‌ای در صف نیست
                </div>
              ) : (
                <div className="space-y-3">
                  {consultationQueue.map(booking => {
                    const timeInfo = getTimeRemaining(booking.slot!.date, booking.slot!.start_time);
                    return (
                      <div
                        key={booking.id}
                        className={`p-3 rounded-lg border ${
                          timeInfo.isUpcoming 
                            ? 'border-orange-500/50 bg-orange-500/5' 
                            : timeInfo.isPast 
                              ? 'border-muted bg-muted/30'
                              : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{booking.full_name}</span>
                              {booking.crm_added && (
                                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">CRM</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span dir="ltr">{booking.phone}</span>
                              <span>{formatDate(booking.slot!.date)}</span>
                              <span className="font-mono">{formatTime(booking.slot!.start_time)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge 
                              variant={timeInfo.isUpcoming ? 'default' : 'secondary'}
                              className={timeInfo.isUpcoming ? 'bg-orange-500 text-white' : ''}
                            >
                              {timeInfo.text}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowDetailsPanel(true);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleSendReminder(booking)}
                                disabled={sendingReminder === booking.id || !settings.webhook_url}
                              >
                                {sendingReminder === booking.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Bell className={`h-3.5 w-3.5 ${booking.reminder_sent_at ? 'text-green-600' : ''}`} />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-blue-600"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCRMDialog(true);
                                }}
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                              {timeInfo.isPast && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-green-600"
                                    onClick={() => handleMarkCompleted(booking.id)}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-red-600"
                                    onClick={() => handleMarkNoShow(booking.id)}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {booking.reminder_sent_at && (
                          <p className="text-xs text-green-600 mt-2">
                            یادآوری ارسال شده: {format(new Date(booking.reminder_sent_at), 'HH:mm - yyyy/MM/dd')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions & Filters */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">فیلترها</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">جستجو</Label>
                <Input
                  placeholder="نام یا تلفن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">وضعیت</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="confirmed">تایید شده</SelectItem>
                    <SelectItem value="completed">انجام شده</SelectItem>
                    <SelectItem value="no_show">عدم حضور</SelectItem>
                    <SelectItem value="cancelled">لغو شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">تاریخ</Label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <Button variant="outline" className="w-full" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
              }}>
                پاک کردن فیلترها
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">نتایج ({filteredBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {filteredBookings.slice(0, 20).map(booking => (
                    <div
                      key={booking.id}
                      className="p-2 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsPanel(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{booking.full_name}</span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {booking.slot ? `${formatDate(booking.slot.date)} - ${formatTime(booking.slot.start_time)}` : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Section */}
      <ConsultationAnalytics bookings={bookings} />

      {/* Details Panel */}
      <ConsultationDetailsPanel
        booking={selectedBooking}
        open={showDetailsPanel}
        onClose={() => setShowDetailsPanel(false)}
        onOpenCRM={() => {
          setShowDetailsPanel(false);
          setShowCRMDialog(true);
        }}
        onRefresh={fetchBookings}
      />

      {/* CRM Dialog */}
      <ConsultationCRMDialog
        booking={selectedBooking}
        open={showCRMDialog}
        onClose={() => setShowCRMDialog(false)}
        onSuccess={() => {
          setShowCRMDialog(false);
          fetchBookings();
        }}
      />
    </div>
  );
};

export default ConsultationDashboard;
