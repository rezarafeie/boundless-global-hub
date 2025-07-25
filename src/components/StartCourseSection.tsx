import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  ExternalLink, 
  ShoppingCart, 
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Clock,
  Key,
  Loader2,
  MessageSquare,
  Send,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CourseActionLinks from './CourseActionLinks';
import RafieiPlayerSection from './RafieiPlayerSection';

interface StartCourseSectionProps {
  enrollment: {
    id: string;
    course_id: string;
    payment_amount: number;
    created_at: string;
    full_name: string;
    phone: string;
    email?: string;
    spotplayer_license_id?: string;
    spotplayer_license_key?: string;
    spotplayer_license_url?: string;
  } | undefined;
  course: {
    id: string;
    title: string;
    description?: string;
    redirect_url?: string;
    is_spotplayer_enabled?: boolean;
    spotplayer_course_id?: string;
    woocommerce_create_access?: boolean;
    support_link?: string | null;
    telegram_channel_link?: string | null;
    gifts_link?: string | null;
    enable_course_access?: boolean;
    slug?: string;
    support_activation_required?: boolean;
    telegram_activation_required?: boolean;
    smart_activation_enabled?: boolean;
  } | undefined;
  onEnterCourse: () => void;
  userEmail?: string;
}

interface SSOToken {
  type: string;
  token: string;
  url: string;
}

const StartCourseSection: React.FC<StartCourseSectionProps> = ({ 
  enrollment, 
  course, 
  onEnterCourse,
  userEmail 
}) => {
  const { toast } = useToast();
  const [ssoTokens, setSsoTokens] = useState<SSOToken[]>([]);
  const [loadingSSO, setLoadingSSO] = useState(false);
  const [supportActivated, setSupportActivated] = useState(false);
  const [telegramActivated, setTelegramActivated] = useState(false);
  const [smartActivated, setSmartActivated] = useState(false);

  // Load activation status from localStorage on component mount
  useEffect(() => {
    if (!enrollment?.id) return;
    
    const activationKey = `activations_${enrollment.id}`;
    const savedActivations = localStorage.getItem(activationKey);
    
    if (savedActivations) {
      try {
        const { support, telegram, smart } = JSON.parse(savedActivations);
        setSupportActivated(support || false);
        setTelegramActivated(telegram || false);
        setSmartActivated(smart || false);
      } catch (error) {
        console.error('Error parsing saved activations:', error);
      }
    }
  }, [enrollment?.id]);

  // Save activation status to localStorage whenever it changes
  useEffect(() => {
    if (!enrollment?.id) return;
    
    const activationKey = `activations_${enrollment.id}`;
    const activations = {
      support: supportActivated,
      telegram: telegramActivated,
      smart: smartActivated
    };
    
    localStorage.setItem(activationKey, JSON.stringify(activations));
  }, [supportActivated, telegramActivated, smartActivated, enrollment?.id]);

  // Check if all required activations are completed
  const isRequiredActivationsCompleted = () => {
    if (!course) return false;
    
    // If smart activation is enabled, check if user has clicked it
    if (course.smart_activation_enabled && !smartActivated) {
      return false;
    }
    
    // Check if support activation is required and completed (only if smart activation is not enabled)
    if (course.support_activation_required && !course.smart_activation_enabled && !supportActivated) {
      return false;
    }
    
    // Check if telegram activation is required and completed
    if (course.telegram_activation_required && !telegramActivated) {
      return false;
    }
    
    return true;
  };

  // Determine available access types
  const hasRafieiPlayer = course?.is_spotplayer_enabled;
  const hasWooCommerce = course?.woocommerce_create_access !== false;
  const hasAcademyAccess = course?.enable_course_access;
  
  const accessTypes = [
    {
      id: 'academy',
      title: 'دسترسی فوری به دروس',
      description: 'پلتفرم جامع آموزش آنلاین',
      icon: GraduationCap,
      enabled: hasAcademyAccess,
      status: hasAcademyAccess ? (isRequiredActivationsCompleted() ? 'active' : 'blocked') : 'coming-soon',
      color: 'green',
      requiresActivation: course?.smart_activation_enabled || course?.support_activation_required || course?.telegram_activation_required
    },
    {
      id: 'rafiei-player',
      title: 'رفیعی پلیر',
      description: 'دانلود و تماشای آفلاین',
      icon: Play,
      enabled: hasRafieiPlayer,
      status: enrollment?.spotplayer_license_key ? 
        (isRequiredActivationsCompleted() ? 'active' : 'blocked') : 'pending',
      color: 'purple',
      requiresActivation: course?.smart_activation_enabled || course?.support_activation_required || course?.telegram_activation_required
    },
    {
      id: 'woocommerce',
      title: 'ورود به نسخه قدیمی',
      description: 'دسترسی آنلاین به دوره',
      icon: ShoppingCart,
      enabled: hasWooCommerce,
      status: hasWooCommerce ? (isRequiredActivationsCompleted() ? 'active' : 'blocked') : 'coming-soon',
      color: 'blue',
      requiresActivation: course?.smart_activation_enabled || course?.support_activation_required || course?.telegram_activation_required
    }
  ];

  // Generate SSO tokens when component mounts
  useEffect(() => {
    if (enrollment && course && userEmail && (hasAcademyAccess || hasWooCommerce)) {
      generateSSOTokens();
    }
  }, [enrollment?.id, course?.slug, userEmail, hasAcademyAccess, hasWooCommerce]);

  const generateSSOTokens = async () => {
    if (!enrollment || !userEmail) return;

    try {
      setLoadingSSO(true);
      console.log('Generating SSO tokens for enrollment:', enrollment.id);

      const response = await supabase.functions.invoke('generate-sso-tokens', {
        body: {
          enrollmentId: enrollment.id,
          userEmail: userEmail
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { data } = response;
      if (data.success && data.tokens) {
        setSsoTokens(data.tokens);
        console.log('SSO tokens generated successfully:', data.tokens);
      } else {
        throw new Error(data.error || 'Failed to generate SSO tokens');
      }
    } catch (error) {
      console.error('Error generating SSO tokens:', error);
      toast({
        title: "خطا در تولید لینک‌های ورود خودکار",
        description: "از لینک‌های معمولی استفاده خواهد شد",
        variant: "destructive"
      });
    } finally {
      setLoadingSSO(false);
    }
  };

  const getSSOUrl = (type: string) => {
    const token = ssoTokens.find(t => t.type === type);
    return token?.url;
  };

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border') => {
    const colorMap = {
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-950/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-950/20',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800'
      }
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
            <CheckCircle className="h-3 w-3 ml-1" />
            فعال
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
            <Clock className="h-3 w-3 ml-1" />
            نیاز به فعال‌سازی
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700">
            <AlertTriangle className="h-3 w-3 ml-1" />
            نیاز به فعال‌سازی
          </Badge>
        );
      case 'coming-soon':
        return (
          <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            به‌زودی
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleActivateSupport = () => {
    setSupportActivated(true);
    toast({
      title: "فعال‌سازی پشتیبانی",
      description: "پشتیبانی با موفقیت فعال شد! حالا می‌توانید به دوره‌ها دسترسی پیدا کنید.",
    });
  };

  const handleActivateTelegram = () => {
    setTelegramActivated(true);
    toast({
      title: "فعال‌سازی تلگرام",
      description: "کانال تلگرام با موفقیت فعال شد! حالا می‌توانید به دوره‌ها دسترسی پیدا کنید.",
    });
  };

  const handleSmartActivation = () => {
    setSmartActivated(true);
    toast({
      title: "فعال‌سازی هوشمند",
      description: "فعال‌سازی هوشمند با موفقیت انجام شد! حالا می‌توانید به دوره‌ها دسترسی پیدا کنید.",
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-background via-background/95 to-primary/5 overflow-hidden">
      <div className="container mx-auto px-1 sm:px-2 py-6 sm:py-8 max-w-6xl min-w-0">
        {/* Modern Header - Mobile First */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary/10 to-primary/20 rounded-full border border-primary/20 mb-4 sm:mb-6 shadow-lg backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="text-sm sm:text-lg font-bold text-primary">🎯 دوره شما آماده است!</span>
          </div>
        </div>

        {/* Access Types - Responsive Grid */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-4xl mx-auto px-1">
          {accessTypes.filter(type => type.enabled).map((accessType, index) => {
            const stepNumber = index + 1;
            
            return (
              <div key={accessType.id} className={`w-full transform transition-all duration-500 ${
                accessType.id === 'academy' ? 'order-1' : 
                accessType.id === 'rafiei-player' ? 'order-2' : 'order-3'
              }`}>
                {/* Rafiei Player - Special integrated section */}
                {accessType.id === 'rafiei-player' ? (
                  <div className="group hover:scale-[1.01] transition-all duration-300 relative">
                    <RafieiPlayerSection 
                      enrollment={enrollment}
                      course={course}
                      isRequiredActivationsCompleted={isRequiredActivationsCompleted()}
                    />
                  </div>
                ) : (
                  /* Modern Clean Cards - Fully Responsive */
                  <Card className={`group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-500 bg-card/80 backdrop-blur-sm hover:bg-card/90 w-full min-w-0 ${
                    accessType.requiresActivation && accessType.status === 'blocked' 
                      ? 'opacity-50 pointer-events-none grayscale' 
                      : ''
                  }`}>
                    
                    {/* Gradient Border Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${
                      accessType.color === 'green' ? 'from-green-500/20 to-emerald-500/20' :
                      accessType.color === 'blue' ? 'from-blue-500/20 to-cyan-500/20' :
                      'from-purple-500/20 to-pink-500/20'
                    } ${
                      accessType.requiresActivation && accessType.status === 'blocked' 
                        ? 'opacity-0' 
                        : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity duration-500`} />
                    
                    <CardContent className="relative p-4 sm:p-6 md:p-8 min-w-0">
                      {/* Disabled Overlay for blocked sections */}
                      {accessType.requiresActivation && accessType.status === 'blocked' && (
                        <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center p-4">
                            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              نیاز به فعال‌سازی هوشمند
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ابتدا روی لینک فعال‌سازی هوشمند کلیک کنید
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Header Section */}
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 flex-shrink-0 group-hover:scale-110 ${
                            accessType.color === 'green' ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 text-green-600 group-hover:from-green-200 group-hover:to-emerald-200 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-700 dark:text-green-400' :
                            accessType.color === 'blue' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300 text-blue-600 group-hover:from-blue-200 group-hover:to-cyan-200 dark:from-blue-950/50 dark:to-cyan-950/50 dark:border-blue-700 dark:text-blue-400' :
                            'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 text-purple-600 group-hover:from-purple-200 group-hover:to-pink-200 dark:from-purple-950/50 dark:to-pink-950/50 dark:border-purple-700 dark:text-purple-400'
                          }`}>
                            <accessType.icon className="h-7 w-7 md:h-8 md:w-8" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className={`text-xl md:text-2xl font-bold mb-2 ${
                              accessType.color === 'green' ? 'text-green-700 dark:text-green-400' :
                              accessType.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                              'text-purple-700 dark:text-purple-400'
                            }`}>
                              {accessType.title}
                            </h3>
                            <p className="text-muted-foreground text-base leading-relaxed">
                              {accessType.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 self-start md:self-center">
                          {getStatusBadge(accessType.status)}
                        </div>
                      </div>

                      {/* Action Button */}
                      {accessType.id === 'academy' && (
                        <Button 
                          onClick={() => {
                            if (accessType.status === 'active') {
                              const ssoUrl = getSSOUrl('academy');
                              if (ssoUrl) {
                                window.open(ssoUrl, '_blank');
                              } else {
                                window.location.href = `/access?course=${course?.slug}`;
                              }
                            }
                          }}
                          disabled={loadingSSO || accessType.status !== 'active'}
                          className="w-full h-12 sm:h-14 shadow-sm hover:shadow-md transition-all duration-500 border-0 text-sm sm:text-base font-semibold group-hover:scale-[1.02] bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 hover:from-green-700 hover:via-green-700 hover:to-emerald-700 text-white"
                          size="lg"
                        >
                          {loadingSSO ? (
                            <Loader2 className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                          ) : getSSOUrl('academy') ? (
                            <Key className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          ) : (
                            <GraduationCap className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          )}
                          <span className="flex-1 text-center">
                            {loadingSSO ? (
                              <span>در حال تولید لینک ورود...</span>
                            ) : getSSOUrl('academy') ? (
                              <>
                                <span className="hidden sm:inline">🔐 ورود به {course?.title || 'دوره'}</span>
                                <span className="sm:hidden">🔐 ورود به {course?.title || 'دوره'}</span>
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:inline">🚀 ورود به {course?.title || 'دوره'}</span>
                                <span className="sm:hidden">🚀 ورود به {course?.title || 'دوره'}</span>
                              </>
                            )}
                          </span>
                          <ArrowRight className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}


                      {accessType.id === 'woocommerce' && (
                        <Button 
                          onClick={() => {
                            if (accessType.status === 'active') {
                              const ssoUrl = getSSOUrl('woocommerce');
                              if (ssoUrl) {
                                window.open(ssoUrl, '_blank');
                              } else {
                                onEnterCourse();
                              }
                            }
                          }}
                          disabled={loadingSSO || accessType.status !== 'active'}
                          className="w-full h-12 sm:h-14 shadow-sm hover:shadow-md transition-all duration-500 border-0 text-sm sm:text-base font-semibold group-hover:scale-[1.02] bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 hover:from-blue-700 hover:via-blue-700 hover:to-cyan-700 text-white"
                          size="lg"
                        >
                          {loadingSSO ? (
                            <Loader2 className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                          ) : getSSOUrl('woocommerce') ? (
                            <Key className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          ) : (
                            <ExternalLink className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          )}
                          <span className="flex-1 text-center">
                            {loadingSSO ? (
                              <span>در حال تولید لینک ورود...</span>
                            ) : getSSOUrl('woocommerce') ? (
                              <>
                                <span className="hidden sm:inline">🔐 ورود خودکار - سیستم قدیمی</span>
                                <span className="sm:hidden">🔐 ورود خودکار</span>
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:inline">⚡ ورود به دوره - سیستم قدیمی</span>
                                <span className="sm:hidden">⚡ سیستم قدیمی</span>
                              </>
                            )}
                          </span>
                          <ArrowRight className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>

        {/* Course Action Links - Support, Telegram, Gifts - Show always but exclude actions already shown at top */}
        {course && enrollment && (() => {
          const modifiedCourse = {
            ...course,
            // Hide support link if it's required (shown at top)
            support_link: course.support_activation_required && !course.smart_activation_enabled ? null : course.support_link,
            // Hide telegram link if it's required (shown at top)  
            telegram_channel_link: course.telegram_activation_required ? null : course.telegram_channel_link
          };
          
          // Check if there are any available actions
          const hasAvailableActions = modifiedCourse.support_link || modifiedCourse.telegram_channel_link || modifiedCourse.gifts_link;
          
          // Calculate starting step number for action links
          const enabledAccessTypesCount = accessTypes.filter(type => type.enabled).length;
          
          return hasAvailableActions ? (
            <div className="w-full mt-12">
              <CourseActionLinks 
                course={course}
                enrollment={enrollment}
                userEmail={userEmail || enrollment?.email}
                onSupportActivated={handleActivateSupport}
                onTelegramActivated={handleActivateTelegram}
                supportActivated={supportActivated}
                telegramActivated={telegramActivated}
                startingStepNumber={enabledAccessTypesCount + 1}
              />
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
};

export default StartCourseSection;