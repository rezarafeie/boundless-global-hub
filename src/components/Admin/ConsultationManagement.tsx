import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Loader2,
  Settings,
  Users,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';

interface ConsultationSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  booking?: ConsultationBooking;
}

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
  created_at: string;
  slot?: ConsultationSlot;
}

interface ConsultationSettings {
  slot_duration: number;
  webhook_url: string | null;
  default_confirmation_message: string | null;
}

const ConsultationManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [settings, setSettings] = useState<ConsultationSettings>({
    slot_duration: 20,
    webhook_url: null,
    default_confirmation_message: null
  });
  
  // Add slot dialog
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStartTime, setNewSlotStartTime] = useState('09:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(20);
  const [addingSlots, setAddingSlots] = useState(false);
  
  // Approval dialog
  const [showApproval, setShowApproval] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [approvalLink, setApprovalLink] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [approving, setApproving] = useState(false);
  
  // Settings dialog
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Filter
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSlots(), fetchBookings(), fetchSettings()]);
    setLoading(false);
  };

  const fetchSlots = async () => {
    const { data } = await supabase
      .from('consultation_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setSlots(data || []);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('consultation_bookings')
      .select(`
        *,
        slot:consultation_slots(*)
      `)
      .order('created_at', { ascending: false });
    setBookings(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('consultation_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (data) {
      setSettings({
        slot_duration: data.slot_duration,
        webhook_url: data.webhook_url,
        default_confirmation_message: data.default_confirmation_message
      });
      setSlotDuration(data.slot_duration);
    }
  };

  const generateTimeSlots = (startTime: string, endTime: string, duration: number) => {
    const slots: { start: string; end: string }[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes + duration <= endMinutes) {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const endH = Math.floor((currentMinutes + duration) / 60);
      const endM = (currentMinutes + duration) % 60;
      
      slots.push({
        start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      });
      
      currentMinutes += duration;
    }
    
    return slots;
  };

  const handleAddSlots = async () => {
    console.log('handleAddSlots called', { newSlotDate, newSlotStartTime, newSlotEndTime, slotDuration });
    
    if (!newSlotDate || !newSlotStartTime || !newSlotEndTime) {
      toast({ title: 'خطا', description: 'لطفا تمام فیلدها را پر کنید', variant: 'destructive' });
      return;
    }
    
    setAddingSlots(true);
    try {
      const timeSlots = generateTimeSlots(newSlotStartTime, newSlotEndTime, slotDuration);
      console.log('Generated time slots:', timeSlots);
      
      if (timeSlots.length === 0) {
        toast({ title: 'خطا', description: 'هیچ اسلاتی قابل ایجاد نیست. بازه زمانی را بررسی کنید.', variant: 'destructive' });
        setAddingSlots(false);
        return;
      }
      
      const slotsToInsert = timeSlots.map(slot => ({
        date: newSlotDate,
        start_time: slot.start + ':00',
        end_time: slot.end + ':00',
        is_available: true,
        created_by: user?.messengerData?.id || null
      }));
      
      console.log('Slots to insert:', slotsToInsert);
      
      const { data, error } = await supabase
        .from('consultation_slots')
        .insert(slotsToInsert)
        .select();
      
      console.log('Insert result:', { data, error });
      
      if (error) throw error;
      
      toast({ title: 'موفق', description: `${timeSlots.length} اسلات اضافه شد` });
      setShowAddSlot(false);
      setNewSlotDate('');
      fetchSlots();
    } catch (error: any) {
      console.error('Error adding slots:', error);
      toast({ title: 'خطا', description: error?.message || 'خطا در اضافه کردن اسلات‌ها', variant: 'destructive' });
    } finally {
      setAddingSlots(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('consultation_slots')
        .delete()
        .eq('id', slotId);
      
      if (error) throw error;
      
      toast({ title: 'موفق', description: 'اسلات حذف شد' });
      fetchSlots();
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در حذف اسلات', variant: 'destructive' });
    }
  };

  const openApprovalDialog = (booking: ConsultationBooking) => {
    setSelectedBooking(booking);
    setApprovalNote(settings.default_confirmation_message || '');
    setApprovalLink('');
    setShowApproval(true);
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    
    setApproving(true);
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update({
          status: 'confirmed',
          confirmed_by: user?.messengerData?.id,
          confirmed_at: new Date().toISOString(),
          confirmation_note: approvalNote,
          consultation_link: approvalLink
        })
        .eq('id', selectedBooking.id);
      
      if (error) throw error;
      
      // Trigger webhook
      if (settings.webhook_url) {
        await supabase.functions.invoke('consultation-webhook', {
          body: {
            bookingId: selectedBooking.id,
            webhookUrl: settings.webhook_url
          }
        });
      }
      
      toast({ title: 'موفق', description: 'مشاوره تایید شد' });
      setShowApproval(false);
      fetchBookings();
    } catch (error) {
      console.error('Error approving:', error);
      toast({ title: 'خطا', description: 'خطا در تایید مشاوره', variant: 'destructive' });
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast({ title: 'موفق', description: 'مشاوره لغو شد' });
      fetchBookings();
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در لغو مشاوره', variant: 'destructive' });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('consultation_settings')
        .update({
          slot_duration: settings.slot_duration,
          webhook_url: settings.webhook_url,
          default_confirmation_message: settings.default_confirmation_message
        })
        .eq('id', 1);
      
      if (error) throw error;
      
      toast({ title: 'موفق', description: 'تنظیمات ذخیره شد' });
      setShowSettings(false);
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در ذخیره تنظیمات', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy/MM/dd');
    } catch {
      return dateStr;
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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (dateFilter && b.slot?.date !== dateFilter) return false;
    return true;
  });

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, ConsultationSlot[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">مدیریت مشاوره</h2>
          {pendingCount > 0 && (
            <Badge className="bg-orange-500 text-white">{pendingCount} درخواست جدید</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 ml-1" />
            تنظیمات
          </Button>
          <Button size="sm" onClick={() => setShowAddSlot(true)}>
            <Plus className="h-4 w-4 ml-1" />
            اضافه کردن زمان
          </Button>
        </div>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList>
          <TabsTrigger value="bookings" className="gap-2">
            <Users className="h-4 w-4" />
            درخواست‌ها
            {pendingCount > 0 && <Badge variant="destructive" className="mr-1">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="slots" className="gap-2">
            <Calendar className="h-4 w-4" />
            زمان‌های موجود
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-[150px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">وضعیت</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="confirmed">تایید شده</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                      <SelectItem value="completed">انجام شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[150px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">تاریخ</Label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>ساعت</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        درخواستی یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.full_name}</TableCell>
                        <TableCell dir="ltr">{booking.phone}</TableCell>
                        <TableCell>{booking.slot ? formatDate(booking.slot.date) : '-'}</TableCell>
                        <TableCell>{booking.slot ? formatTime(booking.slot.start_time) : '-'}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                                  onClick={() => openApprovalDialog(booking)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-500/30 hover:bg-red-500/10"
                                  onClick={() => handleCancel(booking.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && booking.consultation_link && (
                              <a href={booking.consultation_link} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline">
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slots" className="space-y-4">
          {Object.keys(slotsByDate).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                زمانی تعریف نشده است
              </CardContent>
            </Card>
          ) : (
            Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <Card key={date}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(date)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map(slot => {
                      const hasBooking = bookings.some(b => b.slot_id === slot.id && b.status !== 'cancelled');
                      return (
                        <div
                          key={slot.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                            hasBooking 
                              ? 'bg-orange-500/10 border-orange-500/30' 
                              : 'bg-green-500/10 border-green-500/30'
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                          <span className="font-mono text-sm">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                          {hasBooking ? (
                            <Badge variant="outline" className="text-orange-600">رزرو شده</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>اضافه کردن زمان مشاوره</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>تاریخ</Label>
              <Input
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ساعت شروع</Label>
                <Input
                  type="time"
                  value={newSlotStartTime}
                  onChange={(e) => setNewSlotStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label>ساعت پایان</Label>
                <Input
                  type="time"
                  value={newSlotEndTime}
                  onChange={(e) => setNewSlotEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>مدت هر اسلات (دقیقه)</Label>
              <Input
                type="number"
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value) || 20)}
              />
            </div>
            {newSlotDate && newSlotStartTime && newSlotEndTime && (
              <p className="text-sm text-muted-foreground">
                {generateTimeSlots(newSlotStartTime, newSlotEndTime, slotDuration).length} اسلات ایجاد خواهد شد
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlot(false)}>انصراف</Button>
            <Button onClick={handleAddSlots} disabled={addingSlots}>
              {addingSlots && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              ایجاد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApproval} onOpenChange={setShowApproval}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تایید مشاوره</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedBooking && (
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <p><strong>نام:</strong> {selectedBooking.full_name}</p>
                <p><strong>تلفن:</strong> {selectedBooking.phone}</p>
                <p><strong>تاریخ:</strong> {selectedBooking.slot ? formatDate(selectedBooking.slot.date) : '-'}</p>
                <p><strong>ساعت:</strong> {selectedBooking.slot ? formatTime(selectedBooking.slot.start_time) : '-'}</p>
              </div>
            )}
            <div>
              <Label>لینک جلسه</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={approvalLink}
                onChange={(e) => setApprovalLink(e.target.value)}
              />
            </div>
            <div>
              <Label>پیام تایید</Label>
              <Textarea
                rows={4}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproval(false)}>انصراف</Button>
            <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
              {approving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تایید و ارسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تنظیمات مشاوره</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>مدت پیش‌فرض هر اسلات (دقیقه)</Label>
              <Input
                type="number"
                value={settings.slot_duration}
                onChange={(e) => setSettings(s => ({ ...s, slot_duration: parseInt(e.target.value) || 20 }))}
              />
            </div>
            <div>
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://..."
                value={settings.webhook_url || ''}
                onChange={(e) => setSettings(s => ({ ...s, webhook_url: e.target.value || null }))}
              />
              <p className="text-xs text-muted-foreground mt-1">در صورت تایید مشاوره، داده‌ها به این آدرس ارسال می‌شود</p>
            </div>
            <div>
              <Label>پیام تایید پیش‌فرض</Label>
              <Textarea
                rows={4}
                value={settings.default_confirmation_message || ''}
                onChange={(e) => setSettings(s => ({ ...s, default_confirmation_message: e.target.value || null }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>انصراف</Button>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationManagement;
