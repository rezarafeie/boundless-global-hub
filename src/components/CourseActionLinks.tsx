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
    support_activation_required?: boolean;
    telegram_activation_required?: boolean;
    smart_activation_enabled?: boolean;
  };
  enrollment: {
    id: string;
    full_name: string;
    email?: string;
  };
  userEmail?: string;
  onSupportActivated?: () => void;
  onTelegramActivated?: () => void;
  supportActivated?: boolean;
  telegramActivated?: boolean;
  startingStepNumber?: number;
}

const CourseActionLinks: React.FC<CourseActionLinksProps> = ({ 
  course, 
  enrollment, 
  userEmail,
  onSupportActivated,
  onTelegramActivated,
  supportActivated = false,
  telegramActivated = false,
  startingStepNumber = 1
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

    // Trigger activation callbacks for required activations
    if (actionType === 'support' && course.support_activation_required && onSupportActivated) {
      onSupportActivated();
    }
    
    if (actionType === 'telegram' && course.telegram_activation_required && onTelegramActivated) {
      onTelegramActivated();
    }
  };

  const actionButtons = [
    {
      id: 'support',
      title: course.support_activation_required ? 'فعال‌سازی پشتیبانی (اجباری)' : 'فعال‌سازی پشتیبانی',
      description: course.support_activation_required ? 'برای دسترسی به دوره‌ها باید پشتیبانی را فعال کنید' : 'دریافت پشتیبانی مستقیم برای این دوره',
      icon: MessageSquare,
      url: course.support_link,
      color: 'blue',
      required: course.support_activation_required,
      activated: supportActivated
    },
    {
      id: 'telegram',
      title: course.telegram_activation_required ? 'عضویت در کانال تلگرام (اجباری)' : 'عضویت در کانال تلگرام',
      description: course.telegram_activation_required ? 'برای دسترسی به دوره‌ها باید در کانال تلگرام عضو شوید' : 'عضویت در کانال اختصاصی دوره',
      icon: Send,
      url: course.telegram_channel_link,
      color: 'cyan',
      required: course.telegram_activation_required,
      activated: telegramActivated
    },
    {
      id: 'gifts',
      title: 'دریافت هدایا',
      description: 'دانلود محتوای تکمیلی و هدایای دوره',
      icon: Gift,
      url: course.gifts_link,
      color: 'pink',
      required: false,
      activated: false
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
    <Card className="border border-border bg-card">
      <CardContent className="space-y-3 p-4">
        <div className="space-y-3">
          {availableActions.map((action, index) => {
            const colors = getColorClasses(action.color);
            const isClicked = clickedActions.has(action.id as 'support' | 'telegram' | 'gifts');
            const stepNumber = startingStepNumber + index;
            
            return (
              <div 
                key={action.id}
                className="flex flex-col gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-orange-100 dark:border-orange-800 w-full overflow-hidden relative"
              >
                
                <div className="flex items-start gap-3 w-full">
                  <div className={`w-10 h-10 ${colors.badgeBg} rounded-lg flex items-center justify-center border ${colors.border} flex-shrink-0`}>
                    <action.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-semibold text-orange-700 dark:text-orange-300 text-sm sm:text-base break-words">
                        {action.title}
                      </h4>
                      {(action.activated || isClicked) && (
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 text-xs w-fit">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          {action.required ? 'فعال شد' : 'انجام شد'}
                        </Badge>
                      )}
                      {action.required && !action.activated && (
                        <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 text-xs w-fit">
                          اجباری
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      {action.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleActionClick(action.url!, action.id as 'support' | 'telegram' | 'gifts')}
                  className={`bg-gradient-to-r ${colors.bg} ${colors.hoverBg} text-white w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm mt-2 sm:mt-0`}
                  size="sm"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                  <span className="hidden sm:inline">{isClicked ? 'مراجعه مجدد' : 'فعال‌سازی'}</span>
                  <span className="sm:hidden">{isClicked ? 'مراجعه' : 'فعال'}</span>
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