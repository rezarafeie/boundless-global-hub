
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  BookOpen, 
  Brain, 
  User, 
  Bot, 
  Trophy, 
  Clock,
  CheckCircle,
  Edit
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
}

interface UserCourse {
  course_slug: string;
  course_type: string;
  status: string;
  activated_at: string;
  progress: any;
}

interface UserTest {
  test_slug: string;
  status: string;
  score: number | null;
  activated_at: string;
}

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', email: '', phone: '' });
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [tests, setTests] = useState<UserTest[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || ''
        });
      }

      // Fetch courses
      const { data: coursesData } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id)
        .order('activated_at', { ascending: false });

      setCourses(coursesData || []);

      // Fetch tests
      const { data: testsData } = await supabase
        .from('user_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('activated_at', { ascending: false });

      setTests(testsData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await updateProfile(profile);
      if (error) throw error;

      toast({
        title: "موفق",
        description: "اطلاعات شما با موفقیت ذخیره شد",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ذخیره اطلاعات",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const courseTranslations: { [key: string]: string } = {
    'boundless': 'برنامه بدون مرز',
    'boundless-taste': 'طعم بدون مرز',
    'instagram': 'اینستاگرام اسنشیالز',
    'wealth': 'دوره ثروت',
    'metaverse': 'امپراطوری متاورس',
    'passive-income-ai': 'درآمد غیرفعال با AI'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            داشبورد شخصی
          </h1>
          <p className="text-gray-600">
            خوش آمدید، {profile.full_name || 'کاربر عزیز'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اطلاعات شخصی
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">نام و نام خانوادگی</Label>
                      <Input
                        id="fullName"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">ایمیل</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">شماره تلفن</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleSaveProfile} className="w-full">
                      ذخیره تغییرات
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">نام</p>
                      <p className="font-medium">{profile.full_name || 'تعیین نشده'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ایمیل</p>
                      <p className="font-medium">{profile.email || 'تعیین نشده'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">تلفن</p>
                      <p className="font-medium">{profile.phone || 'تعیین نشده'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  دسترسی سریع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/ai-assistant">
                    <Bot className="w-4 h-4 mr-2" />
                    دستیار هوشمند
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/courses">
                    <BookOpen className="w-4 h-4 mr-2" />
                    همه دوره‌ها
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/assessment">
                    <Brain className="w-4 h-4 mr-2" />
                    مرکز سنجش
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  دوره‌های من
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {courses.map((course, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">
                            {courseTranslations[course.course_slug] || course.course_slug}
                          </h3>
                          <Badge variant={course.course_type === 'paid' ? 'default' : 'secondary'}>
                            {course.course_type === 'paid' ? 'ویژه' : 'رایگان'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Clock className="w-4 h-4" />
                          {new Date(course.activated_at).toLocaleDateString('fa-IR')}
                        </div>
                        <Button asChild size="sm" className="w-full">
                          <Link to={`/course/${course.course_type}/view/${course.course_slug}`}>
                            ادامه دوره
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید</p>
                    <Button asChild>
                      <Link to="/courses">مشاهده دوره‌ها</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  آزمون‌های من
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tests.length > 0 ? (
                  <div className="space-y-4">
                    {tests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{test.test_slug}</h3>
                          <p className="text-sm text-gray-600">
                            انجام شده در: {new Date(test.activated_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.score !== null && (
                            <Badge variant="outline">
                              <Trophy className="w-4 h-4 mr-1" />
                              {test.score}%
                            </Badge>
                          )}
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">هنوز آزمونی شرکت نکرده‌اید</p>
                    <Button asChild>
                      <Link to="/assessment">شرکت در آزمون</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
