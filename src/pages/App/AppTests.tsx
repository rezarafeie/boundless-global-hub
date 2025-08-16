import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList,
  Trophy,
  Clock,
  Star,
  Play,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AppTests = () => {
  const navigate = useNavigate();

  // Mock data - replace with real Esanj test data
  const availableTests = [
    {
      id: 1,
      title: "آزمون شخصیت‌شناسی MBTI",
      description: "تشخیص تیپ شخصیتی بر اساس نظریه مایرز-بریگز",
      duration: "30 دقیقه",
      questionCount: 60,
      price: 15000,
      category: "شخصیت‌شناسی",
      difficulty: "متوسط",
      status: "available"
    },
    {
      id: 2,
      title: "آزمون استعداد شغلی",
      description: "تشخیص مناسب‌ترین حرفه براساس علایق و استعدادها",
      duration: "45 دقیقه",
      questionCount: 80,
      price: 25000,
      category: "مشاوره شغلی",
      difficulty: "پیشرفته",
      status: "available"
    },
    {
      id: 3,
      title: "آزمون هوش هیجانی EQ",
      description: "سنجش سطح هوش هیجانی و مهارت‌های اجتماعی",
      duration: "25 دقیقه",
      questionCount: 50,
      price: 20000,
      category: "روانشناسی",
      difficulty: "آسان",
      status: "completed"
    }
  ];

  const testResults = [
    {
      id: 3,
      title: "آزمون هوش هیجانی EQ",
      score: 85,
      maxScore: 100,
      completedAt: "۲ روز پیش",
      result: "سطح هوش هیجانی بالا"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "آسان":
        return "bg-green-100 text-green-700 border-green-200";
      case "متوسط":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "پیشرفته":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <AppLayout title="مرکز آزمون">
      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{availableTests.length}</div>
                <div className="text-sm text-muted-foreground">آزمون موجود</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{testResults.length}</div>
                <div className="text-sm text-muted-foreground">تکمیل شده</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.length > 0 ? Math.round(testResults.reduce((acc, test) => acc + test.score, 0) / testResults.length) : 0}
                </div>
                <div className="text-sm text-muted-foreground">میانگین نمره</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} />
              نتایج آزمون‌ها
            </h3>
            <div className="space-y-3">
              {testResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">{result.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{result.result}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="text-yellow-500" size={14} />
                            {result.score}/{result.maxScore}
                          </span>
                          <span className="text-muted-foreground">{result.completedAt}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/test-result/${result.id}`)}
                      >
                        مشاهده نتیجه
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Tests */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList className="text-primary" size={20} />
            آزمون‌های موجود
          </h3>
          <div className="space-y-4">
            {availableTests.filter(test => test.status === "available").map((test) => (
              <Card key={test.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">{test.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getDifficultyColor(test.difficulty)}`}
                    >
                      {test.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Test Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{test.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClipboardList size={14} />
                        <span>{test.questionCount} سوال</span>
                      </div>
                    </div>

                    {/* Category */}
                    <Badge variant="secondary" className="text-xs">
                      {test.category}
                    </Badge>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(test.price)}
                      </div>
                      <Button 
                        onClick={() => navigate(`/tests/${test.id}/enroll`)}
                        size="sm"
                        className="px-6"
                      >
                        <Play size={14} className="ml-1" />
                        شروع آزمون
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Test Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="text-blue-500" size={18} />
              نکات مهم آزمون
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>قبل از شروع آزمون، اطمینان حاصل کنید که اتصال اینترنت پایداری دارید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>پاسخ‌ها را با دقت و صداقت ارائه دهید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>نتایج آزمون در پروفایل شما ذخیره می‌شود</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>در صورت بروز مشکل، با پشتیبانی تماس بگیرید</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State for No Tests */}
        {availableTests.filter(test => test.status === "available").length === 0 && (
          <div className="text-center py-12">
            <ClipboardList size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">آزمونی موجود نیست</h3>
            <p className="text-muted-foreground mb-4">
              در حال حاضر آزمون جدیدی برای شرکت موجود نیست
            </p>
            <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
              بازگشت به داشبورد
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AppTests;