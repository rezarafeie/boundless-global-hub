
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, Award, MessageCircle, Settings, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { translations } = useLanguage();
  
  // Mock user data
  const user = {
    name: "کاربر آکادمی رفیعی",
    email: "user@example.com",
    joinDate: "1402/08/15",
  };
  
  // Mock courses data
  const courses = [
    {
      id: 1,
      title: "برنامه بدون مرز",
      progress: 25,
      status: "ongoing",
      lastAccessed: "2 روز قبل"
    },
    {
      id: 2,
      title: "اسباب اینستاگرام",
      progress: 80,
      status: "ongoing",
      lastAccessed: "دیروز"
    },
    {
      id: 3,
      title: "پروژه تغییر",
      progress: 100,
      status: "completed",
      lastAccessed: "1 هفته قبل"
    },
    {
      id: 4,
      title: "آشنایی با متاورس",
      progress: 10,
      status: "ongoing",
      lastAccessed: "هم اکنون"
    }
  ];
  
  // Mock assessments data
  const assessments = [
    {
      id: 1,
      title: "تست شخصیت کاری",
      completed: true,
      date: "1402/08/10"
    },
    {
      id: 2,
      title: "تست هوش هیجانی",
      completed: false,
      date: "1402/08/12"
    }
  ];

  return (
    <MainLayout>
      <div className="py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">پنل کاربری</h1>
              <p className="text-muted-foreground mt-1">مدیریت دوره‌ها، تست‌ها و اطلاعات حساب کاربری</p>
            </div>
            <img 
              src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png" 
              alt="Rafiei Academy"
              className="h-12 w-auto opacity-20"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={18} />
                  پروفایل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <User size={36} className="text-gray-400" />
                  </div>
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">تاریخ عضویت: {user.joinDate}</p>
                </div>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/profile">
                      <User size={16} className="mr-2" />
                      ویرایش پروفایل
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/settings">
                      <Settings size={16} className="mr-2" />
                      تنظیمات حساب
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Access Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink size={18} />
                  دسترسی سریع
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" onClick={() => window.open("https://ai.rafiei.co/", "_blank")}>
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                  <span>دستیار هوشمند</span>
                </Button>
                
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" asChild>
                  <Link to="/support">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <MessageCircle size={24} />
                    </div>
                    <span>پشتیبانی</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" asChild>
                  <Link to="/assessment-center">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <Award size={24} />
                    </div>
                    <span>مرکز آزمون</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Courses and Assessments Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="courses">
              <TabsList className="mb-6">
                <TabsTrigger value="courses" className="flex items-center gap-1">
                  <BookOpen size={16} />
                  <span>دوره‌های من</span>
                </TabsTrigger>
                <TabsTrigger value="assessments" className="flex items-center gap-1">
                  <Award size={16} />
                  <span>آزمون‌ها</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <Card key={course.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          {course.status === 'ongoing' && (
                            <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                              <Clock size={12} />
                              در حال انجام
                            </Badge>
                          )}
                          {course.status === 'completed' && (
                            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-800 border-green-200">
                              <CheckCircle size={12} />
                              تکمیل شده
                            </Badge>
                          )}
                        </div>
                        <CardDescription>آخرین دسترسی: {course.lastAccessed}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>پیشرفت</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-black rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link to={`/course/paid/${course.id}`}>
                            ادامه دوره
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="assessments">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assessments.map(assessment => (
                    <Card key={assessment.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{assessment.title}</CardTitle>
                          {assessment.completed ? (
                            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-800 border-green-200">
                              <CheckCircle size={12} />
                              تکمیل شده
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-800 border-blue-200">
                              <Clock size={12} />
                              در انتظار تکمیل
                            </Badge>
                          )}
                        </div>
                        <CardDescription>تاریخ: {assessment.date}</CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button asChild className="w-full" variant={assessment.completed ? "outline" : "default"}>
                          <Link to={`/assessment/${assessment.id}`}>
                            {assessment.completed ? "مشاهده نتایج" : "تکمیل آزمون"}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
