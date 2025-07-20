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
import RafieiPlayerSection from './RafieiPlayerSection';

interface StartCourseSectionProps {
  enrollment: {
    id: string;
    course_id: string;
    payment_amount: number;
    created_at: string;
    full_name: string;
    phone: string;
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
  } | undefined;
  onEnterCourse: () => void;
}

const StartCourseSection: React.FC<StartCourseSectionProps> = ({ 
  enrollment, 
  course, 
  onEnterCourse 
}) => {
  // Determine available access types
  const hasRafieiPlayer = course?.is_spotplayer_enabled;
  const hasWooCommerce = course?.woocommerce_create_access !== false;
  const hasAcademyAccess = false; // This will be enabled later
  
  const accessTypes = [
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
    },
    {
      id: 'academy',
      title: 'آکادمی رفیعی',
      description: 'پلتفرم جامع آموزش',
      icon: GraduationCap,
      enabled: hasAcademyAccess,
      status: 'coming-soon',
      color: 'green',
      features: [
        'پلتفرم یکپارچه',
        'تست و ارزیابی',
        'گواهینامه معتبر',
        'کمیونیتی دانشجویان'
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
    <div className="space-y-6">
      {/* Main Start Course Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            🚀 شروع دوره آموزشی
          </CardTitle>
          <p className="text-muted-foreground">
            دوره شما فعال شده است. می‌توانید از طریق یکی از روش‌های زیر به آموزش‌ها دسترسی پیدا کنید
          </p>
        </CardHeader>
      </Card>

      {/* Access Types Grid */}
      <div className="grid gap-4 md:gap-6">
        {accessTypes.map((accessType) => {
          if (!accessType.enabled) return null;
          
          return (
            <div key={accessType.id}>
              {/* Rafiei Player - Special integrated section */}
              {accessType.id === 'rafiei-player' ? (
                <RafieiPlayerSection 
                  enrollment={enrollment}
                  course={course}
                />
              ) : (
                /* Other access types - Regular cards */
                <Card 
                  className={`${getColorClasses(accessType.color, 'border')} ${getColorClasses(accessType.color, 'bg')} border-2`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${getColorClasses(accessType.color, 'bg')} rounded-xl flex items-center justify-center border ${getColorClasses(accessType.color, 'border')}`}>
                          <accessType.icon className={`h-6 w-6 ${getColorClasses(accessType.color, 'text')}`} />
                        </div>
                        <div>
                          <CardTitle className={`${getColorClasses(accessType.color, 'text')} text-lg`}>
                            {accessType.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {accessType.description}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(accessType.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Features List */}
                    <div className="grid grid-cols-2 gap-2">
                      {accessType.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className={`h-4 w-4 ${getColorClasses(accessType.color, 'text')}`} />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action based on access type */}
                    {accessType.id === 'woocommerce' && accessType.status === 'active' && (
                      <Button 
                        onClick={onEnterCourse}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        size="lg"
                      >
                        <ExternalLink className="ml-2 h-5 w-5" />
                        ورود به دوره - سیستم قدیمی
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}

        {/* Academy Access - Coming Soon */}
        {!hasAcademyAccess && (
          <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <GraduationCap className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-700 dark:text-gray-300 text-lg">
                      آکادمی رفیعی
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      پلتفرم جامع آموزش آنلاین
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                  به‌زودی
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  'پلتفرم یکپارچه',
                  'تست و ارزیابی',
                  'گواهینامه معتبر',
                  'کمیونیتی دانشجویان'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  این بخش به‌زودی راه‌اندازی خواهد شد و امکانات جدیدی برای شما فراهم می‌کند
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StartCourseSection;