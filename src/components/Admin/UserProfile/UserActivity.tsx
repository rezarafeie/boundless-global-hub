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
        return <MessageSquare className="w-4 h-4" />;
      case 'joined_telegram':
        return <CheckCircle className="w-4 h-4" />;
      case 'license_issued':
        return <Key className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityBadge = (eventType: string) => {
    const types: Record<string, { variant: any; label: string }> = {
      support_activated: { variant: 'default', label: 'Support Activated' },
      joined_telegram: { variant: 'secondary', label: 'Telegram Joined' },
      license_issued: { variant: 'outline', label: 'License Issued' },
      enrollment_completed: { variant: 'default', label: 'Enrollment Completed' },
      payment_completed: { variant: 'default', label: 'Payment Completed' }
    };

    const config = types[eventType] || { variant: 'outline', label: eventType.replace('_', ' ') };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
        return 'User activated support access';
      case 'joined_telegram':
        return `Joined Telegram channel: ${activity.reference || 'Unknown'}`;
      case 'license_issued':
        return `License issued: ${activity.reference || 'Unknown'}`;
      case 'enrollment_completed':
        return `Completed enrollment: ${activity.reference || 'Unknown course'}`;
      case 'payment_completed':
        return `Payment completed: ${activity.reference || 'Unknown amount'}`;
      default:
        return activity.reference || 'Activity completed';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          User Activity Timeline ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity logs found for this user.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {getActivityIcon(activity.event_type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityBadge(activity.event_type)}
                    <span className="text-sm text-muted-foreground">
                      #{activities.length - index}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-2">
                    {formatEventDescription(activity)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
  );
}