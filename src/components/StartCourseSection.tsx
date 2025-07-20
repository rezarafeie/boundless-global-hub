import React from 'react';
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
  Clock
} from 'lucide-react';
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
  } | undefined;
  onEnterCourse: () => void;
  userEmail?: string;
}

const StartCourseSection: React.FC<StartCourseSectionProps> = ({ 
  enrollment, 
  course, 
  onEnterCourse,
  userEmail 
}) => {
  // Determine available access types
  const hasRafieiPlayer = course?.is_spotplayer_enabled;
  const hasWooCommerce = course?.woocommerce_create_access !== false;
  const hasAcademyAccess = course?.enable_course_access; // Now enabled based on course setting
  
  const accessTypes = [
    {
      id: 'academy',
      title: 'دسترسی فوری به دروس',
      description: 'پلتفرم جامع آموزش آنلاین',
      icon: GraduationCap,
      enabled: hasAcademyAccess,
      status: hasAcademyAccess ? 'active' : 'coming-soon',
      color: 'green'
    },
    {
      id: 'rafiei-player',
      title: 'رفیعی پلیر',
      description: 'دانلود و تماشای آفلاین',
      icon: Play,
      enabled: hasRafieiPlayer,
      status: enrollment?.spotplayer_license_key ? 'active' : 'pending',
      color: 'purple'
    },
    {
      id: 'woocommerce',
      title: 'فعال سازی های مهم',
      description: 'دسترسی آنلاین به دوره',
      icon: ShoppingCart,
      enabled: hasWooCommerce,
      status: 'active',
      color: 'blue'
    }
  ];

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

  return (
    <div className="w-full space-y-6">
      {/* Modern Header - Mobile First */}
      <div className="text-center px-4 py-6 sm:py-8">
        <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary/10 to-blue-100/50 dark:from-primary/20 dark:to-blue-950/50 rounded-full border border-primary/20 mb-3 sm:mb-4">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="text-base sm:text-lg font-semibold text-primary whitespace-nowrap">🚀 شروع دوره آموزشی</span>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg sm:max-w-2xl mx-auto px-2">
          دوره شما فعال شده است. می‌توانید از طریق روش‌های زیر به آموزش‌ها دسترسی پیدا کنید
        </p>
      </div>

      {/* Access Types - Responsive Grid */}
      <div className="w-full px-4 sm:px-6 lg:px-0 max-w-4xl mx-auto">
        <div className="grid gap-4 sm:gap-6">
          {accessTypes.map((accessType, index) => {
            if (!accessType.enabled) return null;
            
            return (
              <div key={accessType.id} className={`w-full ${
                accessType.id === 'academy' ? 'order-1' : 
                accessType.id === 'rafiei-player' ? 'order-2' : 'order-3'
              }`}>
                {/* Rafiei Player - Special integrated section */}
                {accessType.id === 'rafiei-player' ? (
                  <RafieiPlayerSection 
                    enrollment={enrollment}
                    course={course}
                  />
                ) : (
                  /* Modern Minimal Cards - Mobile Optimized */
                  <Card className="group hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      {/* Header Section - Responsive Layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 ${
                            accessType.color === 'green' ? 'bg-green-50 border-green-200 text-green-600 group-hover:bg-green-100 group-hover:scale-110 dark:bg-green-950/50 dark:border-green-800 dark:text-green-400' :
                            accessType.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400' :
                            'bg-purple-50 border-purple-200 text-purple-600 group-hover:bg-purple-100 group-hover:scale-110 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-400'
                          }`}>
                            <accessType.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className={`text-base sm:text-lg font-semibold ${
                              accessType.color === 'green' ? 'text-green-700 dark:text-green-400' :
                              accessType.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                              'text-purple-700 dark:text-purple-400'
                            } leading-tight`}>
                              {accessType.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                              {accessType.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 self-start sm:self-center">
                          {getStatusBadge(accessType.status)}
                        </div>
                      </div>

                      {/* Action Button - Full Width on Mobile */}
                      {accessType.id === 'academy' && accessType.status === 'active' && (
                        <Button 
                          onClick={() => window.location.href = `/access?course=${course?.slug}`}
                          className="w-full h-11 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-sm sm:text-base font-medium"
                          size="lg"
                        >
                          <GraduationCap className="ml-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          <span className="truncate">ورود به آکادمی جدید</span>
                          <ArrowRight className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        </Button>
                      )}

                      {accessType.id === 'woocommerce' && accessType.status === 'active' && (
                        <Button 
                          onClick={onEnterCourse}
                          className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-sm sm:text-base font-medium"
                          size="lg"
                        >
                          <ExternalLink className="ml-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          <span className="truncate">ورود به دوره - سیستم قدیمی</span>
                          <ArrowRight className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>

        {/* Course Action Links - Support, Telegram, Gifts */}
        {course && enrollment && (
          <div className="w-full mt-6 sm:mt-8">
            <CourseActionLinks 
              course={course}
              enrollment={enrollment}
              userEmail={userEmail || enrollment?.email}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StartCourseSection;