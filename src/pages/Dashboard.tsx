import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, Brain, MessageCircle, Settings, Calendar, Award, LogOut } from "lucide-react";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface UserCourse {
  id: string;
  course_slug: string;
  course_type: string;
  status: string;
  activated_at: string;
  progress: any;
}

interface UserTest {
  id: string;
  test_slug: string;
  status: string;
  score: number;
  activated_at: string;
}

const Dashboard = () => {
  const { user, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [tests, setTests] = useState<UserTest[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditForm({
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
        });
      }

      // Fetch user courses
      const { data: coursesData } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id)
        .order('activated_at', { ascending: false });

      setCourses(coursesData || []);

      // Fetch user tests
      const { data: testsData } = await supabase
        .from('user_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('activated_at', { ascending: false });

      setTests(testsData || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات کاربر",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const result = await updateProfile(editForm);
    
    if (result.error) {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی پروفایل",
        variant: "destructive",
      });
    } else {
      toast({
        title: "موفق",
        description: "پروفایل با موفقیت بروزرسانی شد",
      });
      setIsEditing(false);
      fetchUserData();
    }
    setLoading(false);
  };

  const getCourseTitle = (slug: string) => {
    const titles: Record<string, string> = {
      'boundless': 'دوره بدون مرز',
      'instagram': 'دوره اسباب اینستاگرام',
      'metaverse': 'دوره امپراطور متاورس',
      'boundless-taste': 'دوره مزه بدون مرز',
      'passive-income': 'دوره درآمد غیرفعال',
      'change-project': 'دوره پروژه تغییر',
    };
    return titles[slug] || slug;
  };

  const getTestTitle = (slug: string) => {
    const titles: Record<string, string> = {
      'personality': 'تست شخصیت‌شناسی',
      'intelligence': 'تست هوش',
      'career': 'تست شغلی',
      'emotional': 'تست هوش هیجانی',
    };
    return titles[slug] || slug;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <User size={48} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4">برای دسترسی به داشبورد وارد شوید</h1>
            <Button onClick={() => window.location.href = '/'} className="rounded-full">
              بازگشت به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                داشبورد کاربری
              </h1>
              <p className="text-gray-600 mt-2">مدیریت حساب کاربری و دوره‌های شما</p>
            </div>
            <Button variant="outline" onClick={signOut} className="rounded-full">
              <LogOut size={16} className="mr-2" />
              خروج
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User size={16} />
              پروفایل
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BookOpen size={16} />
              دوره‌ها
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Brain size={16} />
              تست‌ها
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings size={16} />
              تنظیمات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  اطلاعات شخصی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">نام کامل</Label>
                        <Input
                          id="fullName"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">ایمیل</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">شماره موبایل</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleUpdateProfile} disabled={loading} className="rounded-full">
                        ذخیره تغییرات
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">
                        انصراف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">نام کامل</p>
                        <p className="font-semibold text-gray-900">{profile?.full_name || 'نامشخص'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">ایمیل</p>
                        <p className="font-semibold text-gray-900">{profile?.email || user.email}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">شماره موبایل</p>
                        <p className="font-semibold text-gray-900">{profile?.phone || 'ثبت نشده'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">تاریخ عضویت</p>
                        <p className="font-semibold text-gray-900">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fa-IR') : 'نامشخص'}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setIsEditing(true)} className="rounded-full">
                      ویرایش پروفایل
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <BookOpen size={20} className="text-emerald-600" />
                  </div>
                  دوره‌های من ({courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">شما هنوز در هیچ دوره‌ای ثبت نام نکرده‌اید</p>
                    <Button onClick={() => window.location.href = '/courses/free'} className="rounded-full">
                      مشاهده دوره‌ها
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courses.map((course) => (
                      <Card key={course.id} className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-white">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900">{getCourseTitle(course.course_slug)}</h3>
                            <Badge variant={course.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {course.status === 'completed' ? 'تکمیل شده' : 'در حال مطالعه'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar size={14} />
                            <span>فعال‌سازی: {new Date(course.activated_at).toLocaleDateString('fa-IR')}</span>
                          </div>
                          <Button size="sm" className="w-full rounded-full">
                            ادامه مطالعه
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain size={20} className="text-purple-600" />
                  </div>
                  تست‌های من ({tests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {tests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">شما هنوز هیچ تستی انجام نداده‌اید</p>
                    <Button onClick={() => window.location.href = '/assessment'} className="rounded-full">
                      مرکز ارزیابی
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tests.map((test) => (
                      <Card key={test.id} className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-white">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900">{getTestTitle(test.test_slug)}</h3>
                            <Badge variant={test.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {test.status === 'completed' ? 'تکمیل شده' : 'در حال انجام'}
                            </Badge>
                          </div>
                          {test.score && (
                            <div className="flex items-center gap-2 mb-2">
                              <Award size={14} className="text-yellow-500" />
                              <span className="text-sm font-medium">امتیاز: {test.score}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar size={14} />
                            <span>انجام: {new Date(test.activated_at).toLocaleDateString('fa-IR')}</span>
                          </div>
                          <Button size="sm" variant="outline" className="w-full rounded-full">
                            مشاهده نتایج
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Settings size={20} className="text-orange-600" />
                  </div>
                  تنظیمات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-blue-50/50 to-white hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-semibold text-gray-900">دستیار هوشمند</h3>
                    <p className="text-sm text-gray-600">دسترسی به دستیار هوشمند رفیعی</p>
                  </div>
                  <Button size="sm" onClick={() => window.open('https://ai.rafiei.co', '_blank')} className="rounded-full">
                    <MessageCircle size={16} className="mr-2" />
                    فعال‌سازی
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-emerald-50/50 to-white hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-semibold text-gray-900">پشتیبانی دوره</h3>
                    <p className="text-sm text-gray-600">دسترسی به پشتیبانی تخصصی</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full">
                    فعال
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-purple-50/50 to-white hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-semibold text-gray-900">کانال تلگرام</h3>
                    <p className="text-sm text-gray-600">عضویت در کانال اختصاصی</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full">
                    عضویت
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
