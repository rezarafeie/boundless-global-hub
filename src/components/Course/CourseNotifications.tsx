import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bell, 
  BellRing, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ExternalLink,
  Megaphone
} from 'lucide-react';
import { courseNotificationService } from '@/lib/courseNotificationService';
import type { Notification } from '@/types/notifications';
import { supabase } from '@/integrations/supabase/client';

interface CourseNotificationsProps {
  courseId: string;
  className?: string;
}

const CourseNotifications: React.FC<CourseNotificationsProps> = ({ courseId, className = "" }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await courseNotificationService.getCourseNotifications(courseId);
        setNotifications(data);
      } catch (error) {
        console.error('Error loading course notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Set up real-time subscription for course notifications
    const channel = supabase
      .channel('course-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `course_id=eq.${courseId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === payload.new.id ? payload.new as Notification : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(notif => notif.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'banner':
        return <Megaphone className="h-5 w-5" />;
      case 'floating':
        return <BellRing className="h-5 w-5" />;
      case 'popup':
        return <Bell className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'banner':
        return 'default';
      case 'floating':
        return 'secondary';
      case 'popup':
        return 'outline';
      default:
        return 'default';
    }
  };

  const handleDismiss = (notificationId: number) => {
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
  };

  const visibleNotifications = notifications.filter(
    notif => !dismissedNotifications.has(notif.id)
  );

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-16 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleNotifications.map((notification) => (
        <Card 
          key={notification.id} 
          className="border-l-4 shadow-sm transition-all duration-200 hover:shadow-md"
          style={{ borderLeftColor: notification.color }}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-full flex-shrink-0 mt-1"
                style={{ 
                  backgroundColor: `${notification.color}15`,
                  color: notification.color 
                }}
              >
                {getNotificationIcon(notification.notification_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1 leading-tight">
                      {notification.title}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant={getNotificationVariant(notification.notification_type)}
                      className="text-xs"
                    >
                      {notification.notification_type === 'banner' && 'اعلان'}
                      {notification.notification_type === 'floating' && 'اطلاعیه'}
                      {notification.notification_type === 'popup' && 'پیام'}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(notification.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {notification.link && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(notification.link, '_blank')}
                      className="text-xs h-8"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      مشاهده بیشتر
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CourseNotifications;