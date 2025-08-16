import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  CheckCircle,
  Lock,
  Clock,
  BookOpen,
  FileText,
  Share
} from "lucide-react";

const AppCourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lessons");

  // Mock data - replace with real data from Supabase
  const course = {
    id: 1,
    title: "دوره کسب درآمد پسیو",
    description: "در این دوره با روش‌های مختلف ایجاد درآمد بدون حضور فیزیکی آشنا خواهید شد و می‌توانید کسب و کارهای خودکار ایجاد کنید.",
    progress: 65,
    totalLessons: 12,
    completedLessons: 8,
    duration: "4 ساعت",
    instructor: "رضا رفیعی",
    level: "مقدماتی تا پیشرفته"
  };

  const sections = [
    {
      id: 1,
      title: "مقدمات درآمد پسیو",
      lessons: [
        { id: 1, title: "آشنایی با مفهوم درآمد پسیو", duration: "15 دقیقه", completed: true, locked: false },
        { id: 2, title: "انواع مختلف درآمد پسیو", duration: "20 دقیقه", completed: true, locked: false },
        { id: 3, title: "ابزارهای مورد نیاز", duration: "18 دقیقه", completed: true, locked: false }
      ]
    },
    {
      id: 2,
      title: "ایجاد محتوا",
      lessons: [
        { id: 4, title: "تولید محتوای دیجیتال", duration: "25 دقیقه", completed: true, locked: false },
        { id: 5, title: "بازاریابی محتوا", duration: "22 دقیقه", completed: true, locked: false },
        { id: 6, title: "فروش محصولات دیجیتال", duration: "30 دقیقه", completed: false, locked: false }
      ]
    },
    {
      id: 3,
      title: "سرمایه‌گذاری و بازارها",
      lessons: [
        { id: 7, title: "بازارهای مالی", duration: "28 دقیقه", completed: false, locked: false },
        { id: 8, title: "املاک و مستغلات", duration: "35 دقیقه", completed: false, locked: false },
        { id: 9, title: "ارزهای دیجیتال", duration: "40 دقیقه", completed: false, locked: true }
      ]
    }
  ];

  const homework = [
    { id: 1, title: "تحلیل بازار هدف", dueDate: "۱ هفته", completed: false },
    { id: 2, title: "طرح کسب و کار", dueDate: "۲ هفته", completed: true },
  ];

  const notes = [
    { id: 1, title: "نکات مهم درس ۱", content: "نکات کلیدی در مورد درآمد پسیو...", date: "۲ روز پیش" },
    { id: 2, title: "ایده‌های کسب و کار", content: "لیست ایده‌هایی که در کلاس مطرح شد...", date: "۱ هفته پیش" }
  ];

  const rightAction = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Share size={18} />
    </Button>
  );

  const handleLessonClick = (lesson: any) => {
    if (!lesson.locked) {
      navigate(`/app/lesson/${lesson.id}`);
    }
  };

  return (
    <AppLayout title={course.title} rightAction={rightAction}>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="p-4 pb-0">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                  <p className="text-muted-foreground text-sm">{course.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>{course.totalLessons} درس</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{course.completedLessons}/{course.totalLessons} تکمیل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>پیشرفت دوره</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="lessons">درس‌ها</TabsTrigger>
              <TabsTrigger value="homework">تکالیف</TabsTrigger>
              <TabsTrigger value="notes">یادداشت‌ها</TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="mt-4 space-y-4">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {section.lessons.map((lesson) => (
                        <div 
                          key={lesson.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            lesson.locked 
                              ? 'bg-muted/50 cursor-not-allowed opacity-60' 
                              : lesson.completed 
                                ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                : 'hover:bg-accent/50'
                          }`}
                          onClick={() => handleLessonClick(lesson)}
                        >
                          <div className="flex items-center gap-3">
                            {lesson.locked ? (
                              <Lock size={16} className="text-muted-foreground" />
                            ) : lesson.completed ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <Play size={16} className="text-primary" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                            </div>
                          </div>
                          {lesson.completed && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                              تکمیل
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="homework" className="mt-4 space-y-3">
              {homework.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {task.completed ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <FileText size={16} className="text-primary" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-muted-foreground">مهلت: {task.dueDate}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={task.completed ? "outline" : "default"}
                        className={task.completed ? "bg-green-50 text-green-600 border-green-200" : ""}
                      >
                        {task.completed ? "انجام شده" : "در انتظار"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-3">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{note.title}</h4>
                        <span className="text-xs text-muted-foreground">{note.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full">
                <FileText size={16} className="ml-2" />
                افزودن یادداشت جدید
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppCourseDetail;