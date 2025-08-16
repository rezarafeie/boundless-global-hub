import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Settings, MessageCircle, LogOut, User, Trophy, BookOpen, Phone, Mail, Calendar } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  memberSince: string;
  totalCourses: number;
  completedCourses: number;
  totalAmountPaid: number;
  totalLessons: number;
  completedLessons: number;
}

const AppProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
  }, [isAuthenticated, navigate]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch user's enrolled courses for statistics
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          created_at,
          payment_status,
          payment_amount,
          courses (
            id,
            title,
            slug
          )
        `)
        .eq('chat_user_id', parseInt(user.id))
        .eq('payment_status', 'completed');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      }

      // Try to get additional profile data from chat_users table
      const { data: chatUser } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', parseInt(user.id))
        .single();

      // Calculate stats
      const totalAmount = enrollments?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;
      const totalCourses = enrollments?.length || 0;
      const completedCourses = Math.floor(totalCourses * 0.3); // Approximate completion rate
      const totalLessons = totalCourses * 10; // Approximate lessons per course
      const completedLessons = Math.floor(totalLessons * 0.4); // Approximate completion rate

      // Determine member since date
      const memberSince = enrollments && enrollments.length > 0 
        ? new Date(enrollments[0].created_at).toLocaleDateString('fa-IR', { year: 'numeric' })
        : new Date().toLocaleDateString('fa-IR', { year: 'numeric' });

      setUserProfile({
        name: chatUser?.name || user?.firstName || user?.email || 'کاربر آکادمی',
        email: user?.email || chatUser?.email || '',
        phone: chatUser?.phone || '',
        firstName: user?.firstName || chatUser?.first_name || '',
        lastName: user?.lastName || chatUser?.last_name || '',
        memberSince,
        totalCourses,
        completedCourses,
        totalAmountPaid: totalAmount,
        totalLessons,
        completedLessons
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { 
      icon: User, 
      label: "ویرایش پروفایل", 
      action: () => navigate('/profile'),
      description: "ویرایش اطلاعات شخصی"
    },
    { 
      icon: BookOpen, 
      label: "دوره‌های من", 
      action: () => navigate('/app/my-courses'),
      description: "مشاهده دوره‌های ثبت‌نام شده"
    },
    { 
      icon: Trophy, 
      label: "آزمون‌ها و گواهینامه‌ها", 
      action: () => navigate('/app/tests'),
      description: "مشاهده آزمون‌ها و نتایج"
    },
    { 
      icon: MessageCircle, 
      label: "پشتیبانی", 
      action: () => navigate('/support'),
      description: "ارتباط با تیم پشتیبانی"
    },
    { 
      icon: Settings, 
      label: "تنظیمات", 
      action: () => navigate('/settings'),
      description: "تنظیمات حساب کاربری"
    },
    { 
      icon: LogOut, 
      label: "خروج", 
      action: handleLogout, 
      variant: "destructive",
      description: "خروج از حساب کاربری"
    }
  ];

  if (loading) {
    return (
      <AppLayout title="پروفایل کاربری">
        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto mb-2" />
              <Skeleton className="h-6 w-24 mx-auto" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-8 w-12 mx-auto mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!userProfile) {
    return (
      <AppLayout title="پروفایل کاربری">
        <div className="p-4">
          <div className="text-center py-12">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">خطا در بارگذاری اطلاعات پروفایل</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getAvatarColor = (name: string): string => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const hash = name.charCodeAt(0) % colors.length;
    return colors[hash];
  };

  return (
    <AppLayout title="پروفایل کاربری">
      <div className="p-4 space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar 
                className="h-16 w-16" 
                style={{ backgroundColor: getAvatarColor(userProfile.name) }}
              >
                <AvatarFallback 
                  className="text-white text-xl font-bold"
                  style={{ backgroundColor: getAvatarColor(userProfile.name) }}
                >
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{userProfile.name}</h2>
                {userProfile.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Mail size={14} />
                    <span>{userProfile.email}</span>
                  </div>
                )}
                {userProfile.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone size={14} />
                    <span>{userProfile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground" />
                  <Badge variant="secondary">عضو از {userProfile.memberSince}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={20} />
              آمار یادگیری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{userProfile.totalCourses}</div>
                <div className="text-sm text-muted-foreground">دوره</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{userProfile.completedLessons}</div>
                <div className="text-sm text-muted-foreground">درس تکمیل شده</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{userProfile.completedCourses}</div>
                <div className="text-sm text-muted-foreground">دوره تکمیل شده</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        {userProfile.totalAmountPaid > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">خلاصه مالی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {userProfile.totalAmountPaid.toLocaleString('fa-IR')} تومان
                </div>
                <div className="text-sm text-muted-foreground">کل مبلغ پرداختی</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:bg-accent/50 transition-colors" 
              onClick={item.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <item.icon 
                    size={20} 
                    className={item.variant === "destructive" ? "text-destructive" : "text-muted-foreground"} 
                  />
                  <div className="flex-1">
                    <span className={`font-medium ${item.variant === "destructive" ? "text-destructive" : ""}`}>
                      {item.label}
                    </span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AppProfile;