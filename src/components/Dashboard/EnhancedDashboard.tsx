import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen, Key, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { userCoursesService, type UserCourse, type UserLicense } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import UserDataCompletionModal from './UserDataCompletionModal';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function EnhancedDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDataCompletion, setShowDataCompletion] = useState(false);

  useEffect(() => {
    fetchUserData();
    checkUserDataCompletion();
  }, [user]);

  const checkUserDataCompletion = () => {
    if (user && (!user.username || !user.password_hash)) {
      setShowDataCompletion(true);
    }
  };

  const fetchUserData = async () => {
    if (!user?.phone) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [coursesData, licensesData] = await Promise.all([
        userCoursesService.getCoursesByPhone(user.phone),
        userCoursesService.getLicensesByPhone(user.phone)
      ]);
      
      setCourses(coursesData);
      setLicenses(licensesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('خطا در بارگیری اطلاعات کاربر');
      toast.error('خطا در بارگیری اطلاعات کاربر');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCourse = (course: UserCourse) => {
    if (course.course_redirect_url) {
      window.open(course.course_redirect_url, '_blank');
    } else {
      toast.error('لینک دسترسی به دوره موجود نیست');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge variant="default" className="bg-green-500">تکمیل شده</Badge>;
      case 'pending':
        return <Badge variant="secondary">در انتظار</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-500">فعال</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchUserData} className="mt-4">
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">
          داشبورد کاربری
        </h1>
        <p className="text-muted-foreground">
          {user?.name ? `خوش آمدید ${user.name}` : 'دوره‌ها و لایسنس‌های شما'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">دوره‌های خریداری شده</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">لایسنس‌های فعال</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع خرید</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(courses.reduce((sum, course) => sum + course.payment_amount, 0))} تومان
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          دوره‌های شما
        </h2>
        
        {courses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">هنوز دوره‌ای خریداری نکرده‌اید</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.enrollment_id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{course.course_title}</CardTitle>
                      <CardDescription className="mt-1">
                        {course.course_description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(course.payment_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">قیمت:</span>
                    <span className="font-medium">{formatPrice(course.payment_amount)} تومان</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">تاریخ خرید:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(course.enrollment_date), { 
                        addSuffix: true, 
                        locale: { formatDistance: () => 'اخیراً' } 
                      })}
                    </span>
                  </div>

                  {course.spotplayer_license_key && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">لایسنس رفیعی پلیر:</p>
                      <code className="text-xs bg-background p-1 rounded">
                        {course.spotplayer_license_key}
                      </code>
                    </div>
                  )}
                  
                  {course.course_redirect_url && (
                    <Button 
                      onClick={() => handleAccessCourse(course)}
                      className="w-full"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 ml-2" />
                      ورود به دوره
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Licenses Section */}
      {licenses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Key className="h-6 w-6" />
            لایسنس‌های شما
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {licenses.map((license) => (
              <Card key={license.license_id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{license.course_title}</CardTitle>
                      <CardDescription>
                        نوع: {license.license_data?.type || 'نامشخص'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(license.license_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {license.license_key && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">کلید لایسنس:</p>
                      <code className="text-xs bg-background p-1 rounded break-all">
                        {license.license_key}
                      </code>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">تاریخ ایجاد:</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(license.created_at), { 
                        addSuffix: true,
                        locale: { formatDistance: () => 'اخیراً' } 
                      })}
                    </span>
                  </div>
                  
                  {license.expires_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">انقضا:</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(license.expires_at), {
                          locale: { formatDistance: () => 'در آینده' } 
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No data message */}
      {courses.length === 0 && licenses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">دوره یا لایسنسی یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              با شماره تلفن {user?.phone} هیچ دوره یا لایسنسی یافت نشد.
            </p>
            <p className="text-sm text-muted-foreground">
              اگر قبلاً خریدی کرده‌اید، ممکن است با شماره تلفن متفاوتی ثبت شده باشد.
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Data Completion Modal */}
      <UserDataCompletionModal 
        isOpen={showDataCompletion}
        onClose={() => setShowDataCompletion(false)}
        user={user}
      />
    </div>
  );
}