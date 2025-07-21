import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Gift,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CourseActionLinksProps {
  course: {
    id: string;
    title: string;
    support_link?: string | null;
    telegram_channel_link?: string | null;
    gifts_link?: string | null;
  };
  enrollment: {
    id: string;
    full_name: string;
    email?: string;
  };
  userEmail?: string;
}

const CourseActionLinks: React.FC<CourseActionLinksProps> = ({ 
  course, 
  enrollment, 
  userEmail 
}) => {
  const { toast } = useToast();
  const [clickedActions, setClickedActions] = useState<Set<string>>(new Set());

  const logClick = async (actionType: 'support' | 'telegram' | 'gifts') => {
    try {
      // Insert click log
      await supabase
        .from('course_click_logs')
        .insert({
          user_id: userEmail, // We'll use email as user identifier for now
          course_id: course.id,
          action_type: actionType
        });

      // Update clicked actions state
      setClickedActions(prev => new Set([...prev, actionType]));

      // Show success toast based on action type
      const messages = {
        support: '✅ پشتیبانی فعال شد',
        telegram: '✅ به کانال تلگرام پیوستید',
        gifts: '✅ هدایا دریافت شد'
      };

      toast({
        title: messages[actionType],
        description: "به صفحه جدید منتقل شدید",
      });

    } catch (error) {
      console.error('Error logging click:', error);
    }
  };

  const handleActionClick = (url: string, actionType: 'support' | 'telegram' | 'gifts') => {
    // Open link in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Log the click (only once per action)
    if (!clickedActions.has(actionType)) {
      logClick(actionType);
    }
  };

  const actionButtons = [
    {
      id: 'support',
      title: 'فعال‌سازی پشتیبانی',
      description: 'دریافت پشتیبانی مستقیم برای این دوره',
      icon: MessageSquare,
      url: course.support_link,
      color: 'blue'
    },
    {
      id: 'telegram',
      title: 'عضویت در کانال تلگرام',
      description: 'عضویت در کانال اختصاصی دوره',
      icon: Send,
      url: course.telegram_channel_link,
      color: 'cyan'
    },
    {
      id: 'gifts',
      title: 'دریافت هدایا',
      description: 'دانلود محتوای تکمیلی و هدایای دوره',
      icon: Gift,
      url: course.gifts_link,
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'from-blue-600 to-blue-700',
        hoverBg: 'hover:from-blue-700 hover:to-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        badgeBg: 'bg-blue-100 dark:bg-blue-900',
        border: 'border-blue-200 dark:border-blue-800'
      },
      cyan: {
        bg: 'from-cyan-600 to-cyan-700',
        hoverBg: 'hover:from-cyan-700 hover:to-cyan-800',
        text: 'text-cyan-700 dark:text-cyan-300',
        badgeBg: 'bg-cyan-100 dark:bg-cyan-900',
        border: 'border-cyan-200 dark:border-cyan-800'
      },
      pink: {
        bg: 'from-pink-600 to-pink-700',
        hoverBg: 'hover:from-pink-700 hover:to-pink-800',
        text: 'text-pink-700 dark:text-pink-300',
        badgeBg: 'bg-pink-100 dark:bg-pink-900',
        border: 'border-pink-200 dark:border-pink-800'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  // Filter out actions that don't have URLs
  const availableActions = actionButtons.filter(action => action.url);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-orange-700 dark:text-orange-300">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          ورود به نسخه قدیمی
        </CardTitle>
        <p className="text-muted-foreground">
          خدمات اختصاصی که برای این دوره در نظر گرفته شده است
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {availableActions.map((action) => {
            const colors = getColorClasses(action.color);
            const isClicked = clickedActions.has(action.id as 'support' | 'telegram' | 'gifts');
            
            return (
              <div 
                key={action.id}
                className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-orange-100 dark:border-orange-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colors.badgeBg} rounded-lg flex items-center justify-center border ${colors.border}`}>
                    <action.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      {action.title}
                      {isClicked && (
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 text-xs">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          انجام شد
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleActionClick(action.url!, action.id as 'support' | 'telegram' | 'gifts')}
                  className={`bg-gradient-to-r ${colors.bg} ${colors.hoverBg} text-white`}
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  {isClicked ? 'مراجعه مجدد' : 'فعال‌سازی'}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseActionLinks;