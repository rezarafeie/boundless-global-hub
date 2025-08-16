import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Trophy,
  Play,
  Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AppDashboard = () => {
  const navigate = useNavigate();

  // Mock data - replace with real data from Supabase
  const userProgress = {
    totalCourses: 3,
    completedCourses: 1,
    totalLessons: 25,
    completedLessons: 8,
    streakDays: 5
  };

  const activeCourses = [
    {
      id: 1,
      title: "دوره کسب درآمد پسیو",
      progress: 65,
      nextLesson: "درس ۴: ساخت محتوا",
      totalLessons: 12,
      completedLessons: 8
    },
    {
      id: 2,
      title: "دوره تجارت آمریکایی",
      progress: 30,
      nextLesson: "درس ۲: مفاهیم پایه",
      totalLessons: 15,
      completedLessons: 4
    }
  ];

  const quickActions = [
    { icon: BookOpen, label: "دوره‌های من", action: () => navigate('/app/my-courses') },
    { icon: TrendingUp, label: "مسیر یادگیری", action: () => navigate('/app/learning') },
    { icon: Clock, label: "آزمون‌ها", action: () => navigate('/app/tests') },
    { icon: Trophy, label: "پیشرفت", action: () => navigate('/app/profile') }
  ];

  return (
    <AppLayout title="داشبورد" showBackButton={false}>
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            سلام! 👋
          </h2>
          <p className="text-muted-foreground">
            آماده برای ادامه یادگیری هستید؟
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              پیشرفت کلی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{userProgress.totalCourses}</div>
                <div className="text-sm text-muted-foreground">دوره</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{userProgress.completedLessons}</div>
                <div className="text-sm text-muted-foreground">درس تکمیل شده</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{userProgress.streakDays}</div>
                <div className="text-sm text-muted-foreground">روز پیاپی</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>پیشرفت کلی</span>
                <span>{Math.round((userProgress.completedLessons / userProgress.totalLessons) * 100)}%</span>
              </div>
              <Progress value={(userProgress.completedLessons / userProgress.totalLessons) * 100} />
            </div>
          </CardContent>
        </Card>

        {/* Active Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">دوره‌های فعال</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/app/my-courses')}
            >
              مشاهده همه
            </Button>
          </div>
          <div className="space-y-3">
            {activeCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">{course.nextLesson}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {course.completedLessons}/{course.totalLessons}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{course.progress}% تکمیل شده</span>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/app/course/${course.id}`)}
                        className="h-8 px-3"
                      >
                        <Play size={14} className="ml-1" />
                        ادامه
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">دسترسی سریع</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={action.action}
              >
                <CardContent className="p-4 text-center">
                  <action.icon size={24} className="mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium">{action.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star size={20} />
              دستاوردهای اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <Trophy className="text-primary" size={20} />
                <div>
                  <p className="font-medium text-sm">اولین درس تکمیل شد!</p>
                  <p className="text-xs text-muted-foreground">۲ روز پیش</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <TrendingUp className="text-accent-foreground" size={20} />
                <div>
                  <p className="font-medium text-sm">پیشرفت ۵۰% در دوره</p>
                  <p className="text-xs text-muted-foreground">۱ هفته پیش</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AppDashboard;