
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyAuth } from '@/contexts/AcademyAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  Settings, 
  Plus,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Save
} from 'lucide-react';

const AcademyAdmin: React.FC = () => {
  const { user, loading, isAdmin } = useAcademyAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState({ use_old_auth_system: true, enrollment_enabled: true });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth?redirect=/academy/admin');
      return;
    }
    
    if (isAdmin) {
      loadData();
    }
  }, [user, loading, isAdmin, navigate]);

  const loadData = async () => {
    try {
      // Load courses
      const { data: coursesData } = await supabase
        .from('academy_courses')
        .select('*')
        .order('created_at', { ascending: false });
      setCourses(coursesData || []);

      // Load users
      const { data: usersData } = await supabase
        .from('academy_users')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(usersData || []);

      // Load enrollments with course and user info
      const { data: enrollmentsData } = await supabase
        .from('academy_enrollments')
        .select(`
          *,
          academy_users(first_name, last_name, email),
          academy_courses(title, slug)
        `)
        .order('enrolled_at', { ascending: false });
      setEnrollments(enrollmentsData || []);

      // Load transactions
      const { data: transactionsData } = await supabase
        .from('academy_transactions')
        .select(`
          *,
          academy_users(first_name, last_name, email),
          academy_courses(title, slug)
        `)
        .order('created_at', { ascending: false });
      setTransactions(transactionsData || []);

      // Load settings
      const { data: settingsData } = await supabase
        .from('academy_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (settingsData) {
        setSettings(settingsData);
      }

      // Calculate stats
      const totalRevenue = transactionsData
        ?.filter(t => t.status === 'success')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalCourses: coursesData?.length || 0,
        totalEnrollments: enrollmentsData?.length || 0,
        totalRevenue
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    }
  };

  const updateSettings = async (newSettings: any) => {
    try {
      const { error } = await supabase
        .from('academy_settings')
        .update(newSettings)
        .eq('id', 1);

      if (error) throw error;

      setSettings({ ...settings, ...newSettings });
      toast({
        title: 'موفقیت',
        description: 'تنظیمات به‌روزرسانی شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">پنل مدیریت آکادمی</h1>
          <p className="text-gray-600 mt-2">مدیریت دوره‌ها، کاربران و تنظیمات</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">کل کاربران</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">کل دوره‌ها</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">کل ثبت‌نام‌ها</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">کل درآمد</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalRevenue.toLocaleString()} تومان
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
            <TabsTrigger value="courses">دوره‌ها</TabsTrigger>
            <TabsTrigger value="users">کاربران</TabsTrigger>
            <TabsTrigger value="enrollments">ثبت‌نام‌ها</TabsTrigger>
            <TabsTrigger value="transactions">تراکنش‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  تنظیمات سیستم
                </CardTitle>
                <CardDescription>
                  مدیریت تنظیمات عمومی سیستم ثبت‌نام
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="old-auth-system" className="text-base font-medium">
                      استفاده از سیستم قدیمی ثبت‌نام
                    </Label>
                    <p className="text-sm text-gray-500">
                      {settings.use_old_auth_system 
                        ? 'کاربران به auth.rafiei.co هدایت می‌شوند' 
                        : 'از سیستم جدید آکادمی استفاده می‌شود'
                      }
                    </p>
                  </div>
                  <Switch
                    id="old-auth-system"
                    checked={settings.use_old_auth_system}
                    onCheckedChange={(checked) => 
                      updateSettings({ use_old_auth_system: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="enrollment-enabled" className="text-base font-medium">
                      فعال‌سازی ثبت‌نام
                    </Label>
                    <p className="text-sm text-gray-500">
                      {settings.enrollment_enabled 
                        ? 'کاربران می‌توانند در دوره‌ها ثبت‌نام کنند' 
                        : 'ثبت‌نام در دوره‌ها غیرفعال است'
                      }
                    </p>
                  </div>
                  <Switch
                    id="enrollment-enabled"
                    checked={settings.enrollment_enabled}
                    onCheckedChange={(checked) => 
                      updateSettings({ enrollment_enabled: checked })
                    }
                  />
                </div>

                {settings.use_old_auth_system && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">سیستم قدیمی فعال است</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      دکمه‌های ثبت‌نام کاربران را به سایت auth.rafiei.co هدایت می‌کنند
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      مدیریت دوره‌ها
                    </CardTitle>
                    <CardDescription>
                      مشاهده و مدیریت تمام دوره‌ها
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    دوره جدید
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">{course.title}</h3>
                            <p className="text-sm text-gray-500">/{course.slug}</p>
                          </div>
                          <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                            {course.status === 'active' ? 'فعال' : 
                             course.status === 'closed' ? 'بسته' : 'پر'}
                          </Badge>
                          <Badge variant={course.type === 'free' ? 'outline' : 'default'}>
                            {course.type === 'free' ? 'رایگان' : `${course.price?.toLocaleString()} تومان`}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  مدیریت کاربران
                </CardTitle>
                <CardDescription>
                  مشاهده اطلاعات کاربران ثبت‌نام شده
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' ? 'مدیر' : 'دانشجو'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  مدیریت ثبت‌نام‌ها
                </CardTitle>
                <CardDescription>
                  مشاهده تمام ثبت‌نام‌های انجام شده
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">
                            {enrollment.academy_users?.first_name} {enrollment.academy_users?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{enrollment.academy_courses?.title}</p>
                        </div>
                        <Badge variant={enrollment.status === 'completed' ? 'default' : 'outline'}>
                          {enrollment.status === 'completed' ? 'تکمیل شده' : 'در حال مطالعه'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(enrollment.enrolled_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  مدیریت تراکنش‌ها
                </CardTitle>
                <CardDescription>
                  مشاهده تاریخچه پرداخت‌ها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">
                            {transaction.academy_users?.first_name} {transaction.academy_users?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{transaction.academy_courses?.title}</p>
                          <p className="text-sm text-gray-500">
                            {transaction.amount?.toLocaleString()} تومان - {transaction.gateway}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            transaction.status === 'success' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {transaction.status === 'success' ? 'موفق' :
                           transaction.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AcademyAdmin;
