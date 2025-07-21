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
      title: 'ورود به نسخه قدیمی',
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
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Modern Header - Mobile First */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/20 rounded-full border border-primary/20 mb-6 shadow-lg backdrop-blur-sm">
            <GraduationCap className="h-6 w-6 text-primary flex-shrink-0" />
            <span className="text-lg font-bold text-primary">🎯 دوره شما آماده است!</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            شروع یادگیری از همین الان
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            دوره شما با موفقیت فعال شد. از طریق روش‌های زیر می‌توانید به آموزش‌ها دسترسی پیدا کنید
          </p>
        </div>

        {/* Access Types - Responsive Grid */}
        <div className="grid gap-6 lg:gap-8 max-w-5xl mx-auto">
          {accessTypes.map((accessType, index) => {
            if (!accessType.enabled) return null;
            
            return (
              <div key={accessType.id} className={`w-full transform transition-all duration-500 ${
                accessType.id === 'academy' ? 'order-1' : 
                accessType.id === 'rafiei-player' ? 'order-2' : 'order-3'
              }`}>
                {/* Rafiei Player - Special integrated section */}
                {accessType.id === 'rafiei-player' ? (
                  <div className="group hover:scale-[1.01] transition-all duration-300">
                    <RafieiPlayerSection 
                      enrollment={enrollment}
                      course={course}
                    />
                  </div>
                ) : (
                  /* Modern Clean Cards - Fully Responsive */
                  <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-card/80 backdrop-blur-sm hover:bg-card/90">
                    {/* Gradient Border Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${
                      accessType.color === 'green' ? 'from-green-500/20 to-emerald-500/20' :
                      accessType.color === 'blue' ? 'from-blue-500/20 to-cyan-500/20' :
                      'from-purple-500/20 to-pink-500/20'
                    } opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    <CardContent className="relative p-6 md:p-8">
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
                      {accessType.id === 'academy' && accessType.status === 'active' && (
                        <Button 
                          onClick={() => window.location.href = `/access?course=${course?.slug}`}
                          className="w-full h-14 bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 hover:from-green-700 hover:via-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-500 border-0 text-base font-semibold group-hover:scale-[1.02]"
                          size="lg"
                        >
                          <GraduationCap className="ml-3 h-5 w-5 flex-shrink-0" />
                          <span className="flex-1 text-center">🚀 ورود به سیستم آموزشی آنلاین</span>
                          <ArrowRight className="mr-3 h-4 w-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}

                      {accessType.id === 'woocommerce' && accessType.status === 'active' && (
                        <Button 
                          onClick={onEnterCourse}
                          className="w-full h-14 bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 hover:from-blue-700 hover:via-blue-700 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-500 border-0 text-base font-semibold group-hover:scale-[1.02]"
                          size="lg"
                        >
                          <ExternalLink className="ml-3 h-5 w-5 flex-shrink-0" />
                          <span className="flex-1 text-center">⚡ ورود به دوره - سیستم قدیمی</span>
                          <ArrowRight className="mr-3 h-4 w-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
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
          <div className="w-full mt-12">
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