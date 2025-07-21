import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, MessageSquare, Key, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog {
  id: string;
  event_type: string;
  reference: string;
  created_at: string;
}

interface UserActivityProps {
  userId: number;
}

export function UserActivity({ userId }: UserActivityProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'support_activated':
        return <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'joined_telegram':
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'license_issued':
        return <Key className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Activity className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getActivityBadge = (eventType: string) => {
    const types: Record<string, { variant: any; label: string }> = {
      support_activated: { variant: 'default', label: 'پشتیبانی فعال شد' },
      joined_telegram: { variant: 'secondary', label: 'عضویت در تلگرام' },
      license_issued: { variant: 'outline', label: 'صدور لایسنس' },
      enrollment_completed: { variant: 'default', label: 'ثبت‌نام تکمیل شد' },
      payment_completed: { variant: 'default', label: 'پرداخت تکمیل شد' }
    };

    const config = types[eventType] || { variant: 'outline', label: eventType.replace('_', ' ') };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
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

  const formatEventDescription = (activity: ActivityLog) => {
    switch (activity.event_type) {
      case 'support_activated':
        return 'کاربر دسترسی پشتیبانی را فعال کرد';
      case 'joined_telegram':
        return `عضو کانال تلگرام شد: ${activity.reference || 'نامشخص'}`;
      case 'license_issued':
        return `لایسنس صادر شد: ${activity.reference || 'نامشخص'}`;
      case 'enrollment_completed':
        return `ثبت‌نام تکمیل شد: ${activity.reference || 'دوره نامشخص'}`;
      case 'payment_completed':
        return `پرداخت تکمیل شد: ${activity.reference || 'مبلغ نامشخص'}`;
      default:
        return activity.reference || 'فعالیت تکمیل شد';
    }
  };

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
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            تاریخچه فعالیت‌های کاربر ({activities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ گزارش فعالیتی برای این کاربر یافت نشد.
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {getActivityIcon(activity.event_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      {getActivityBadge(activity.event_type)}
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        #{activities.length - index}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed mb-2">
                      {formatEventDescription(activity)}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}