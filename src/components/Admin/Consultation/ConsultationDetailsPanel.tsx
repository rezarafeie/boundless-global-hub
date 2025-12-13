import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Link as LinkIcon,
  FileText,
  Bell,
  CheckCircle,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns-jalali';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConsultationBooking {
  id: string;
  user_id: number;
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
  consultation_type: string | null;
  slot?: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
  };
}

interface Props {
  booking: ConsultationBooking | null;
  open: boolean;
  onClose: () => void;
  onOpenCRM: () => void;
  onRefresh: () => void;
}

const ConsultationDetailsPanel: React.FC<Props> = ({ booking, open, onClose, onOpenCRM, onRefresh }) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('وضعیت با موفقیت تغییر کرد');
      setIsEditingStatus(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('خطا در تغییر وضعیت');
    } finally {
      setUpdatingStatus(false);
    }
  };
  if (!booking) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy/MM/dd');
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'HH:mm - yyyy/MM/dd');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (time: string) => time.slice(0, 5);

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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>جزئیات مشاوره</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              اطلاعات کاربر
            </h3>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{booking.phone}</span>
              </div>
              {booking.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.email}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                شناسه کاربر: {booking.user_id}
              </div>
            </div>
          </div>

          <Separator />

          {/* Consultation Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              اطلاعات مشاوره
            </h3>
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">وضعیت:</span>
                <div className="flex items-center gap-2">
                  {isEditingStatus ? (
                    <Select
                      value={booking.status}
                      onValueChange={handleStatusChange}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">در انتظار</SelectItem>
                        <SelectItem value="confirmed">تایید شده</SelectItem>
                        <SelectItem value="completed">انجام شده</SelectItem>
                        <SelectItem value="no_show">عدم حضور</SelectItem>
                        <SelectItem value="cancelled">لغو شده</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      {getStatusBadge(booking.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsEditingStatus(true)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {booking.slot && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاریخ:</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(booking.slot.date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ساعت:</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(booking.slot.start_time)} - {formatTime(booking.slot.end_time)}
                    </span>
                  </div>
                </>
              )}
              {booking.consultation_link && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">لینک جلسه:</span>
                  <a 
                    href={booking.consultation_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    باز کردن
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">CRM:</span>
                {booking.crm_added ? (
                  <Badge className="bg-green-500/10 text-green-600">ثبت شده</Badge>
                ) : (
                  <Badge variant="outline">ثبت نشده</Badge>
                )}
              </div>
              {booking.deal_id && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">شناسه معامله:</span>
                  <span className="text-xs font-mono">{booking.deal_id.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {booking.description && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  توضیحات کاربر
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  {booking.description}
                </div>
              </div>
            </>
          )}

          {/* Confirmation Info */}
          {booking.confirmed_at && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  اطلاعات تایید
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاریخ تایید:</span>
                    <span>{formatDateTime(booking.confirmed_at)}</span>
                  </div>
                  {booking.confirmation_note && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-muted-foreground mb-1">پیام تایید:</p>
                      <p>{booking.confirmation_note}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Reminder History */}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              سابقه یادآوری
            </h3>
            <div className="p-4 bg-muted/50 rounded-lg">
              {booking.reminder_sent_at ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>ارسال شده: {formatDateTime(booking.reminder_sent_at)}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">یادآوری ارسال نشده</span>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>تاریخ ثبت: {formatDateTime(booking.created_at)}</p>
            <p>شناسه رزرو: {booking.id}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button className="flex-1" onClick={onOpenCRM}>
              <FileText className="h-4 w-4 ml-2" />
              ثبت CRM
            </Button>
            <Button variant="outline" onClick={onClose}>
              بستن
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConsultationDetailsPanel;
