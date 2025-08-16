import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Clock, 
  CheckCircle,
  BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AppMyCourses = () => {
  const navigate = useNavigate();

  // Mock data - replace with real data from Supabase
  const enrolledCourses = [
    {
      id: 1,
      title: "دوره کسب درآمد پسیو",
      description: "روش‌های ایجاد درآمد بدون حضور فیزیکی",
      progress: 65,
      totalLessons: 12,
      completedLessons: 8,
      duration: "4 ساعت",
      status: "در حال یادگیری",
      lastActivity: "۲ روز پیش",
      thumbnail: "/placeholder-course.jpg"
    },
    {
      id: 2,
      title: "دوره تجارت آمریکایی",
      description: "آموزش کسب و کار در بازار آمریکا",
      progress: 30,
      totalLessons: 15,
      completedLessons: 4,
      duration: "6 ساعت",
      status: "در حال یادگیری",
      lastActivity: "۱ هفته پیش",
      thumbnail: "/placeholder-course.jpg"
    },
    {
      id: 3,
      title: "دوره زندگی هوشمند",
      description: "بهبود کیفیت زندگی با تکنیک‌های نوین",
      progress: 100,
      totalLessons: 8,
      completedLessons: 8,
      duration: "3 ساعت",
      status: "تکمیل شده",
      lastActivity: "۳ هفته پیش",
      thumbnail: "/placeholder-course.jpg"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "تکمیل شده":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "در حال یادگیری":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  return (
    <AppLayout title="دوره‌های من">
      <div className="p-4 space-y-4">
        {/* Summary Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{enrolledCourses.length}</div>
                <div className="text-sm text-muted-foreground">دوره ثبت‌نام</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {enrolledCourses.filter(c => c.status === "تکمیل شده").length}
                </div>
                <div className="text-sm text-muted-foreground">تکمیل شده</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {enrolledCourses.filter(c => c.status === "در حال یادگیری").length}
                </div>
                <div className="text-sm text-muted-foreground">در حال یادگیری</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        <div className="space-y-4">
          {enrolledCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Course Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(course.status)}`}
                    >
                      {course.status}
                    </Badge>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} />
                      <span>{course.totalLessons} درس</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      <span>{course.completedLessons}/{course.totalLessons}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">پیشرفت</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-4 py-3 bg-muted/20 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      آخرین فعالیت: {course.lastActivity}
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => navigate(`/app/course/${course.id}`)}
                      disabled={course.status === "تکمیل شده"}
                      className="h-8 px-4"
                    >
                      {course.status === "تکمیل شده" ? (
                        <>
                          <CheckCircle size={14} className="ml-1" />
                          مرور
                        </>
                      ) : (
                        <>
                          <Play size={14} className="ml-1" />
                          ادامه
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {enrolledCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">هنوز دوره‌ای ندارید</h3>
            <p className="text-muted-foreground mb-4">
              در دوره‌های آکادمی رفیعی ثبت‌نام کنید و یادگیری را شروع کنید
            </p>
            <Button onClick={() => navigate('/courses')}>
              مشاهده دوره‌ها
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AppMyCourses;