import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Loader2,
  ArrowRight,
  User,
  Phone,
  Mail,
  Video
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';

interface ConsultationSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked?: boolean;
}

interface PendingBooking {
  id: string;
  status: string;
  consultation_link: string | null;
  confirmation_note: string | null;
  slot: ConsultationSlot;
}

const ConsultationBooking: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ConsultationSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/consultations');
      return;
    }
    if (user?.messengerData?.id) {
      checkExistingBooking();
    }
  }, [user, authLoading]);

  const checkExistingBooking = async () => {
    if (!user?.messengerData?.id) return;
    
    setLoading(true);
    try {
      // Check for pending or confirmed bookings
      const { data: existingBooking } = await supabase
        .from('consultation_bookings')
        .select(`
          id,
          status,
          consultation_link,
          confirmation_note,
          consultation_slots (
            id,
            date,
            start_time,
            end_time,
            is_available
          )
        `)
        .eq('user_id', user.messengerData.id)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existingBooking && existingBooking.consultation_slots) {
        setPendingBooking({
          id: existingBooking.id,
          status: existingBooking.status,
          consultation_link: existingBooking.consultation_link,
          confirmation_note: existingBooking.confirmation_note,
          slot: existingBooking.consultation_slots as unknown as ConsultationSlot
        });
        setLoading(false);
      } else {
        // No existing booking, fetch available slots
        fetchSlots();
      }
    } catch (error) {
      console.error('Error checking existing booking:', error);
      fetchSlots();
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      // Fetch all future slots
      const today = new Date().toISOString().split('T')[0];
      const { data: slotsData } = await supabase
        .from('consultation_slots')
        .select('*')
        .eq('is_available', true)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      // Fetch all bookings to check which slots are taken
      const { data: bookingsData } = await supabase
        .from('consultation_bookings')
        .select('slot_id')
        .neq('status', 'cancelled');
      
      const bookedSlotIds = new Set(bookingsData?.map(b => b.slot_id) || []);
      
      const availableSlots = (slotsData || []).map(slot => ({
        ...slot,
        is_booked: bookedSlotIds.has(slot.id)
      }));
      
      setSlots(availableSlots);
      
      // Auto-select first available date
      if (availableSlots.length > 0 && !selectedDate) {
        const firstAvailable = availableSlots.find(s => !s.is_booked);
        if (firstAvailable) {
          setSelectedDate(firstAvailable.date);
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({ title: 'خطا', description: 'خطا در بارگذاری زمان‌ها', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !user?.messengerData) {
      toast({ title: 'خطا', description: 'لطفا وارد شوید', variant: 'destructive' });
      return;
    }
    
    setBooking(true);
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .insert({
          user_id: user.messengerData.id,
          slot_id: selectedSlot.id,
          full_name: user.messengerData.name || user.messengerData.full_name || '',
          phone: user.messengerData.phone,
          email: user.messengerData.email || null,
          status: 'pending'
        });
      
      if (error) {
        if (error.code === '23505') {
          toast({ title: 'خطا', description: 'این زمان قبلا رزرو شده است', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }
      
      setBookingSuccess(true);
      toast({ title: 'موفق', description: 'درخواست مشاوره ثبت شد' });
    } catch (error) {
      console.error('Error booking:', error);
      toast({ title: 'خطا', description: 'خطا در ثبت درخواست', variant: 'destructive' });
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (time: string) => time.slice(0, 5);
  
  const formatDatePersian = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM');
    } catch {
      return dateStr;
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, ConsultationSlot[]>);

  const availableDates = Object.keys(slotsByDate).filter(date => 
    slotsByDate[date].some(s => !s.is_booked)
  );

  const selectedDateSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];
  const availableSlots = selectedDateSlots.filter(s => !s.is_booked);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show pending or confirmed booking
  if (pendingBooking) {
    const isConfirmed = pendingBooking.status === 'confirmed';
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-lg mx-auto py-12 px-4 pt-24">
          <Card className="text-center">
            <CardContent className="pt-10 pb-8 space-y-6">
              <div className={`w-20 h-20 ${isConfirmed ? 'bg-green-500/10' : 'bg-amber-500/10'} rounded-full flex items-center justify-center mx-auto`}>
                {isConfirmed ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : (
                  <Clock className="h-10 w-10 text-amber-600" />
                )}
              </div>
              <div className="space-y-2">
                <Badge variant={isConfirmed ? 'default' : 'secondary'} className="mb-2">
                  {isConfirmed ? 'تایید شده' : 'در انتظار تایید'}
                </Badge>
                <h2 className="text-2xl font-bold">
                  {isConfirmed ? 'مشاوره شما تایید شد' : 'درخواست مشاوره ثبت شده'}
                </h2>
                <p className="text-muted-foreground">
                  {isConfirmed 
                    ? 'جلسه مشاوره شما تایید شده است. لطفا در زمان مقرر حاضر شوید.'
                    : 'درخواست مشاوره شما ثبت شده و در انتظار تایید است.'}
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDatePersian(pendingBooking.slot.date)}</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(pendingBooking.slot.start_time)} - {formatTime(pendingBooking.slot.end_time)}</span>
                </div>
              </div>

              {isConfirmed && pendingBooking.consultation_link && (
                <div className="space-y-3">
                  <a 
                    href={pendingBooking.consultation_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full" size="lg">
                      <Video className="h-4 w-4 ml-2" />
                      ورود به جلسه
                    </Button>
                  </a>
                  {pendingBooking.confirmation_note && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-right">
                      <p className="font-medium mb-1">توضیحات:</p>
                      <p className="text-muted-foreground">{pendingBooking.confirmation_note}</p>
                    </div>
                  )}
                </div>
              )}

              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                رفتن به داشبورد
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-lg mx-auto py-12 px-4 pt-24">
          <Card className="text-center">
            <CardContent className="pt-10 pb-8 space-y-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">درخواست ثبت شد</h2>
                <p className="text-muted-foreground">
                  درخواست مشاوره شما ثبت شد و در انتظار تایید است.
                  <br />
                  پس از تایید، لینک جلسه برای شما ارسال خواهد شد.
                </p>
              </div>
              {selectedSlot && (
                <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2 justify-center">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDatePersian(selectedSlot.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</span>
                  </div>
                </div>
              )}
              <Button onClick={() => navigate('/dashboard')}>
                رفتن به داشبورد
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-2xl mx-auto py-8 px-4 pt-24">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">رزرو مشاوره</h1>
          <p className="text-muted-foreground">
            زمان مناسب خود را انتخاب کرده و درخواست مشاوره ثبت کنید
          </p>
        </div>

        {availableDates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>در حال حاضر زمانی برای مشاوره موجود نیست</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Date Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  انتخاب روز
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availableDates.map(date => (
                    <Button
                      key={date}
                      variant={selectedDate === date ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                    >
                      {formatDatePersian(date)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            {selectedDate && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    انتخاب ساعت
                  </CardTitle>
                  <CardDescription>
                    {formatDatePersian(selectedDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableSlots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">همه ساعات این روز رزرو شده‌اند</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {selectedDateSlots.map(slot => (
                        <Button
                          key={slot.id}
                          variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                          size="sm"
                          disabled={slot.is_booked}
                          onClick={() => setSelectedSlot(slot)}
                          className={slot.is_booked ? 'opacity-50 line-through' : ''}
                        >
                          {formatTime(slot.start_time)}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* User Info & Booking */}
            {selectedSlot && user?.messengerData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">اطلاعات شما</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user.messengerData.name || user.messengerData.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span dir="ltr">{user.messengerData.phone}</span>
                    </div>
                    {user.messengerData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.messengerData.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">زمان انتخاب شده:</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDatePersian(selectedSlot.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBook}
                    disabled={booking}
                  >
                    {booking && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    ثبت درخواست مشاوره
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationBooking;
