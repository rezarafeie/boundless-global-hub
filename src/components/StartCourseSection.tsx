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
      color: 'green',
      features: [
        'محتوای درس‌ها',
        'ویدیو و فایل‌ها',
        'سیستم یادگیری مدرن',
        'دسترسی کامل آنلاین'
      ]
    },
    {
      id: 'rafiei-player',
      title: 'رفیعی پلیر',
      description: 'دانلود و تماشای آفلاین',
      icon: Play,
      enabled: hasRafieiPlayer,
      status: enrollment?.spotplayer_license_key ? 'active' : 'pending',
      color: 'purple',
      features: [
        'دانلود دائمی ویدیوها',
        'تماشای آفلاین',
        'کیفیت عالی',
        'پشتیبانی از همه پلتفرم‌ها'
      ]
    },
    {
      id: 'woocommerce',
      title: 'سیستم دسترسی به دوره های آکادمی رفیعی ( قدیمی )',
      description: 'دسترسی آنلاین به دوره',
      icon: ShoppingCart,
      enabled: hasWooCommerce,
      status: 'active',
      color: 'blue',
      features: [
        'دسترسی آنلاین',
        'محتوای کامل دوره',
        'پشتیبانی مستقیم',
        'بروزرسانی‌های خودکار'
      ]
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
    <div className="space-y-4 md:space-y-6 w-full overflow-hidden">
      {/* Main Start Course Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-950/20">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-4 w-4 md:h-6 md:w-6 text-primary" />
            </div>
            <span className="break-words">🚀 شروع دوره آموزشی</span>
          </CardTitle>
          <p className="text-muted-foreground text-sm md:text-base">
            دوره شما فعال شده است. می‌توانید از طریق یکی از روش‌های زیر به آموزش‌ها دسترسی پیدا کنید
          </p>
        </CardHeader>
      </Card>

      {/* Access Types Grid */}
      <div className="space-y-4 md:space-y-6 w-full">
        {accessTypes.map((accessType) => {
          if (!accessType.enabled) return null;
          
          return (
            <div key={accessType.id} className="w-full">
              {/* Rafiei Player - Special integrated section */}
              {accessType.id === 'rafiei-player' ? (
                <RafieiPlayerSection 
                  enrollment={enrollment}
                  course={course}
                />
              ) : (
                /* Other access types - Regular cards */
                <Card 
                  className={`${getColorClasses(accessType.color, 'border')} ${getColorClasses(accessType.color, 'bg')} border-2 w-full overflow-hidden`}
                >
                  <CardHeader className="px-4 md:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 md:w-12 md:h-12 ${getColorClasses(accessType.color, 'bg')} rounded-xl flex items-center justify-center border ${getColorClasses(accessType.color, 'border')} flex-shrink-0`}>
                          <accessType.icon className={`h-5 w-5 md:h-6 md:w-6 ${getColorClasses(accessType.color, 'text')}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className={`${getColorClasses(accessType.color, 'text')} text-base md:text-lg break-words`}>
                            {accessType.title}
                          </CardTitle>
                          <p className="text-xs md:text-sm text-muted-foreground break-words">
                            {accessType.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(accessType.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 md:px-6">
                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {accessType.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs md:text-sm">
                          <CheckCircle className={`h-3 w-3 md:h-4 md:w-4 ${getColorClasses(accessType.color, 'text')} flex-shrink-0`} />
                          <span className="text-muted-foreground break-words">{feature}</span>
                        </div>
                      ))}
                    </div>

              {/* Action based on access type */}
              {accessType.id === 'woocommerce' && accessType.status === 'active' && (
                <Button 
                  onClick={onEnterCourse}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm md:text-base"
                  size="lg"
                >
                  <ExternalLink className="ml-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="break-words">ورود به دوره - سیستم قدیمی</span>
                  <ArrowRight className="mr-2 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                </Button>
              )}

              {accessType.id === 'academy' && accessType.status === 'active' && (
                <Button 
                  onClick={() => window.location.href = `/access?course=${course?.slug}`}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm md:text-base"
                  size="lg"
                >
                  <GraduationCap className="ml-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="break-words">ورود به آکادمی جدید</span>
                  <ArrowRight className="mr-2 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                </Button>
              )}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}


        {/* Course Action Links - Support, Telegram, Gifts */}
        {course && enrollment && (
          <div className="w-full">
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