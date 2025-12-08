import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Video,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ConsultationBooking {
  id: string;
  status: string;
  confirmation_note: string | null;
  consultation_link: string | null;
  created_at: string;
  slot: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
}

interface UserConsultationsProps {
  showActiveOnly?: boolean;
}

const UserConsultations: React.FC<UserConsultationsProps> = ({ showActiveOnly = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [activeBooking, setActiveBooking] = useState<ConsultationBooking | null>(null);
  const [defaultMeetingUrl, setDefaultMeetingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.messengerData?.id) {
      fetchBookings();
      fetchSettings();
    }
  }, [user?.messengerData?.id]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('consultation_settings')
        .select('webhook_url')
        .eq('id', 1)
        .maybeSingle();
      
      // Use webhook_url as default meeting URL (can be changed later)
      if (data?.webhook_url) {
        setDefaultMeetingUrl(data.webhook_url);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('consultation_bookings')
        .select(`
          id,
          status,
          confirmation_note,
          consultation_link,
          created_at,
          slot:consultation_slots(date, start_time, end_time)
        `)
        .eq('user_id', user?.messengerData?.id)
        .order('created_at', { ascending: false });
      
      const allBookings = (data || []) as ConsultationBooking[];
      
      // Find active booking (pending or confirmed with future date)
      const now = new Date();
      const active = allBookings.find(booking => {
        if (!booking.slot) return false;
        if (!['pending', 'confirmed'].includes(booking.status)) return false;
        const slotDateTime = new Date(`${booking.slot.date}T${booking.slot.end_time}`);
        return slotDateTime > now;
      });
      
      setActiveBooking(active || null);
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => time.slice(0, 5);
  
  const formatDatePersian = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">در انتظار تایید</Badge>;
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

  const getMeetingLink = (booking: ConsultationBooking) => {
    return booking.consultation_link || defaultMeetingUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show only active booking card for dashboard overview
  if (showActiveOnly) {
    if (!activeBooking) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-3 text-sm">مشاوره فعالی ندارید</p>
            <Button size="sm" onClick={() => navigate('/consultations')}>
              رزرو مشاوره
            </Button>
          </CardContent>
        </Card>
      );
    }

    const isConfirmed = activeBooking.status === 'confirmed';
    const meetingLink = getMeetingLink(activeBooking);

    return (
      <Card className={isConfirmed ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <span className="font-medium">
                {isConfirmed ? 'مشاوره تایید شده' : 'در انتظار تایید'}
              </span>
            </div>
            {getStatusBadge(activeBooking.status)}
          </div>

          {activeBooking.slot && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDatePersian(activeBooking.slot.date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {formatTime(activeBooking.slot.start_time)} - {formatTime(activeBooking.slot.end_time)}
              </div>
            </div>
          )}

          {isConfirmed && meetingLink && (
            <a 
              href={meetingLink} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="w-full gap-2">
                <Video className="h-4 w-4" />
                ورود به جلسه
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}

          {activeBooking.status === 'pending' && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              درخواست شما در حال بررسی است
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full consultation history view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5" />
          تاریخچه مشاوره‌ها
        </h2>
        <Button size="sm" onClick={() => navigate('/consultations')} disabled={!!activeBooking}>
          {activeBooking ? 'مشاوره فعال دارید' : 'رزرو جدید'}
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">هنوز مشاوره‌ای ثبت نکرده‌اید</p>
            <Button onClick={() => navigate('/consultations')}>
              رزرو مشاوره
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => {
            const isActive = activeBooking?.id === booking.id;
            const meetingLink = getMeetingLink(booking);
            
            return (
              <Card 
                key={booking.id} 
                className={
                  isActive && booking.status === 'confirmed' 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : isActive && booking.status === 'pending'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : ''
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        {isActive && (
                          <Badge variant="outline" className="text-xs">فعال</Badge>
                        )}
                      </div>
                      
                      {booking.slot && (
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDatePersian(booking.slot.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(booking.slot.start_time)} - {formatTime(booking.slot.end_time)}
                          </div>
                        </div>
                      )}
                      
                      {booking.status === 'confirmed' && isActive && (
                        <div className="mt-3 space-y-2">
                          {booking.confirmation_note && (
                            <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                              {booking.confirmation_note}
                            </div>
                          )}
                          {meetingLink && (
                            <a 
                              href={meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" className="gap-2">
                                <Video className="h-4 w-4" />
                                ورود به جلسه
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      )}

                      {booking.status === 'pending' && isActive && (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          در انتظار تایید مشاور
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserConsultations;
