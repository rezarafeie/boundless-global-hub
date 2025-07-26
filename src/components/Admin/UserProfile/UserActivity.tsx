
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, MessageSquare, Key, Calendar, UserPlus, LogIn, BookOpen, Play, Clock, Download, CreditCard, Users, ExternalLink, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityRecord {
  id: string;
  event_type: string;
  description: string;
  reference?: string;
  created_at: string;
  metadata?: any;
}

interface UserActivityProps {
  userId: number;
}

export function UserActivity({ userId }: UserActivityProps) {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUserActivities();
  }, [userId]);

  const fetchAllUserActivities = async () => {
    try {
      const allActivities: ActivityRecord[] = [];

      // 1. User registration from chat_users
      const { data: userData } = await supabase
        .from('chat_users')
        .select('created_at, name')
        .eq('id', userId)
        .single();

      if (userData) {
        allActivities.push({
          id: `reg-${userId}`,
          event_type: 'user_registered',
          description: `کاربر در وب‌سایت ثبت‌نام کرد`,
          created_at: userData.created_at,
          reference: userData.name
        });
      }

      // 2. Course enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id, created_at, course_id, payment_status, payment_amount,
          courses (title)
        `)
        .eq('chat_user_id', userId);

      enrollments?.forEach((enrollment: any) => {
        allActivities.push({
          id: `enroll-${enrollment.id}`,
          event_type: 'course_enrolled',
          description: `ثبت‌نام در دوره: ${enrollment.courses?.title || 'نامشخص'}`,
          created_at: enrollment.created_at,
          reference: enrollment.course_id,
          metadata: { status: enrollment.payment_status, amount: enrollment.payment_amount }
        });
      });

      // 3. Activity logs (support, telegram, course visits, etc.)
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId);

      activityLogs?.forEach((log: any) => {
        let description = '';
        
        // Check if event_description exists in metadata (for lesson activities with Persian text)
        if (log.metadata?.event_description) {
          description = log.metadata.event_description;
        } else {
          // Fallback to default descriptions
          switch (log.event_type) {
            case 'user_logged_in':
              description = 'کاربر وارد وب‌سایت شد';
              break;
            case 'support_activated':
              description = 'پشتیبانی فعال شد';
              break;
            case 'telegram_joined':
              description = `عضو کانال تلگرام شد`;
              break;
            case 'smart_activation_clicked':
              description = 'لینک فعال‌سازی هوشمند کلیک شد';
              break;
            case 'support_link_clicked':
              description = 'لینک پشتیبانی کلیک شد';
              break;
            case 'telegram_link_clicked':
              description = 'لینک تلگرام کلیک شد';
              break;
            case 'gifts_link_clicked':
              description = 'لینک هدایا کلیک شد';
              break;
            case 'course_page_visited':
              const courseTitle = log.metadata?.course_title || 'دوره';
              description = `بازدید صفحه دوره: ${courseTitle}`;
              break;
            case 'lesson_opened':
              const lessonTitleOpen = log.metadata?.lesson_title || 'نامشخص';
              description = `درس ${lessonTitleOpen} باز شد`;
              break;
            case 'lesson_completed':
              const lessonTitleComplete = log.metadata?.lesson_title || 'نامشخص';
              description = `درس ${lessonTitleComplete} تکمیل شد`;
              break;
            case 'lesson_time_spent':
              const lessonTitleTime = log.metadata?.lesson_title || 'نامشخص';
              description = `زمان صرف شده در درس ${lessonTitleTime}`;
              break;
            case 'material_downloaded':
              description = `فایل دانلود شد`;
              break;
            default:
              description = log.event_type.replace(/_/g, ' ');
          }
        }

        allActivities.push({
          id: log.id,
          event_type: log.event_type,
          description,
          created_at: log.created_at,
          reference: log.reference,
          metadata: log.metadata
        });
      });

      // 4. Lesson progress
      const { data: lessonProgress, error: lessonError } = await supabase
        .from('user_lesson_progress')
        .select(`
          *, 
          course_lessons (
            title, 
            course_id,
            courses (title)
          )
        `)
        .eq('user_id', userId);

      console.log('Lesson progress data for user', userId, ':', lessonProgress);
      console.log('Lesson progress error:', lessonError);

      lessonProgress?.forEach((progress: any) => {
        console.log('Processing lesson progress:', progress);
        
        if (progress.first_opened_at) {
          console.log('Adding lesson opened activity');
          allActivities.push({
            id: `lesson-open-${progress.id}`,
            event_type: 'lesson_opened',
            description: `درس باز شد: ${progress.course_lessons?.title || 'نامشخص'}`,
            created_at: progress.first_opened_at,
            reference: progress.lesson_id
          });
        }

        if (progress.is_completed && progress.completed_at) {
          console.log('Adding lesson completed activity for:', progress.course_lessons?.title);
          allActivities.push({
            id: `lesson-complete-${progress.id}`,
            event_type: 'lesson_completed',
            description: `درس تکمیل شد: ${progress.course_lessons?.title || 'نامشخص'}`,
            created_at: progress.completed_at,
            reference: progress.lesson_id
          });
        }

        if (progress.total_time_spent > 0) {
          console.log('Adding time spent activity');
          allActivities.push({
            id: `lesson-time-${progress.id}`,
            event_type: 'lesson_time_spent',
            description: `${Math.round(progress.total_time_spent / 60)} دقیقه در درس صرف شد: ${progress.course_lessons?.title || 'نامشخص'}`,
            created_at: progress.last_accessed_at || progress.updated_at,
            reference: progress.lesson_id,
            metadata: { time_spent: progress.total_time_spent }
          });
        }
      });

      // Sort all activities by date (newest first)
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'user_registered':
        return <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'user_logged_in':
        return <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'course_enrolled':
        return <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'support_activated':
        return <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'telegram_joined':
        return <Users className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'smart_activation_clicked':
        return <Zap className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'support_link_clicked':
        return <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'telegram_link_clicked':
        return <Users className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'gifts_link_clicked':
        return <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'course_page_visited':
        return <Activity className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'lesson_opened':
        return <Play className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'lesson_completed':
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'lesson_time_spent':
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'material_downloaded':
        return <Download className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'payment_completed':
        return <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Activity className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getActivityBadge = (eventType: string) => {
    const types: Record<string, { variant: any; label: string }> = {
      user_registered: { variant: 'default', label: 'ثبت‌نام در سایت' },
      user_logged_in: { variant: 'secondary', label: 'ورود به سایت' },
      course_enrolled: { variant: 'default', label: 'ثبت‌نام در دوره' },
      support_activated: { variant: 'outline', label: 'فعالسازی پشتیبانی' },
      telegram_joined: { variant: 'secondary', label: 'عضویت در تلگرام' },
      smart_activation_clicked: { variant: 'default', label: 'فعال‌سازی هوشمند' },
      support_link_clicked: { variant: 'outline', label: 'کلیک لینک پشتیبانی' },
      telegram_link_clicked: { variant: 'secondary', label: 'کلیک لینک تلگرام' },
      gifts_link_clicked: { variant: 'outline', label: 'کلیک لینک هدایا' },
      course_page_visited: { variant: 'outline', label: 'بازدید صفحه دوره' },
      lesson_opened: { variant: 'secondary', label: 'باز کردن درس' },
      lesson_completed: { variant: 'default', label: 'تکمیل درس' },
      lesson_time_spent: { variant: 'outline', label: 'زمان صرف شده' },
      material_downloaded: { variant: 'secondary', label: 'دانلود مطالب' },
      payment_completed: { variant: 'default', label: 'پرداخت تکمیل شده' }
    };

    const config = types[eventType] || { variant: 'outline', label: eventType.replace(/_/g, ' ') };
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
                      {activity.description}
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
