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
    <div className="space-y-6 w-full">
      {/* Main Start Course Header - Modern Stripe-style */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-blue-100/50 dark:from-primary/20 dark:to-blue-950/50 rounded-full border border-primary/20 mb-4">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-primary">🚀 شروع دوره آموزشی</span>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          دوره شما فعال شده است. می‌توانید از طریق روش‌های زیر به آموزش‌ها دسترسی پیدا کنید
        </p>
      </div>

      {/* Access Types - Clean Modern Cards */}
      <div className="space-y-4 w-full max-w-4xl mx-auto">
        {accessTypes.map((accessType, index) => {
          if (!accessType.enabled) return null;
          
          return (
            <div key={accessType.id} className="w-full">
              {/* Rafiei Player - Special integrated section */}
              {accessType.id === 'rafiei-player' ? (
                <div className="order-2">
                  <RafieiPlayerSection 
                    enrollment={enrollment}
                    course={course}
                  />
                </div>
              ) : (
                /* Other access types - Modern minimal cards */
                <div className={`${accessType.id === 'academy' ? 'order-1' : 'order-3'}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-colors ${
                            accessType.color === 'green' ? 'bg-green-50 border-green-200 text-green-600 group-hover:bg-green-100 dark:bg-green-950/50 dark:border-green-800 dark:text-green-400' :
                            accessType.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-100 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400' :
                            'bg-purple-50 border-purple-200 text-purple-600 group-hover:bg-purple-100 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-400'
                          }`}>
                            <accessType.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className={`text-lg font-semibold ${
                              accessType.color === 'green' ? 'text-green-700 dark:text-green-400' :
                              accessType.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                              'text-purple-700 dark:text-purple-400'
                            }`}>
                              {accessType.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {accessType.description}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(accessType.status)}
                      </div>

                      {/* Action Button */}
                      {accessType.id === 'academy' && accessType.status === 'active' && (
                        <Button 
                          onClick={() => window.location.href = `/access?course=${course?.slug}`}
                          className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                          size="lg"
                        >
                          <GraduationCap className="ml-2 h-5 w-5" />
                          ورود به آکادمی جدید
                          <ArrowRight className="mr-2 h-4 w-4" />
                        </Button>
                      )}

                      {accessType.id === 'woocommerce' && accessType.status === 'active' && (
                        <Button 
                          onClick={onEnterCourse}
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                          size="lg"
                        >
                          <ExternalLink className="ml-2 h-5 w-5" />
                          ورود به دوره - سیستم قدیمی
                          <ArrowRight className="mr-2 h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          );
        })}

        {/* Course Action Links - Support, Telegram, Gifts */}
        {course && enrollment && (
          <div className="w-full order-4 mt-8">
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