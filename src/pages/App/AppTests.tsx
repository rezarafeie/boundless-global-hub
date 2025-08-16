import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/Layout/AppLayout";
import { useTests } from "@/hooks/useTests";
import TestsTab from "@/components/Dashboard/TestsTab";
import { 
  ClipboardList,
  Trophy,
  Clock,
  Star,
  Play,
  CheckCircle,
  AlertCircle,
  Brain,
  Users,
  Target
} from "lucide-react";

const AppTests = () => {
  const navigate = useNavigate();
  const { tests, loading, error } = useTests();

  const handleStartTest = (testSlug: string) => {
    navigate(`/enroll?test=${testSlug}`);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'رایگان';
    return `${price.toLocaleString('fa-IR')} تومان`;
  };

  if (loading) {
    return (
      <AppLayout title="مرکز آزمون">
        <div className="p-4 space-y-6">
          {/* Stats skeleton */}
          <Card>
            <CardContent className="p-4">
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
          
          {/* Tests skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="مرکز آزمون">
        <div className="p-4">
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">خطا در بارگذاری آزمون‌ها</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="مرکز آزمون">
      <div className="p-4">
        <Tabs defaultValue="my-tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-tests">آزمون‌های من</TabsTrigger>
            <TabsTrigger value="available-tests">آزمون‌های موجود</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-tests">
            <TestsTab />
          </TabsContent>
          
          <TabsContent value="available-tests" className="space-y-6">
            {/* Stats Overview */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{tests.length}</div>
                    <div className="text-sm text-muted-foreground">آزمون موجود</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {tests.reduce((sum, test) => sum + test.count_used, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">آزمون انجام شده</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {tests.filter(test => test.price === 0).length}
                    </div>
                    <div className="text-sm text-muted-foreground">آزمون رایگان</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Tests */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="text-primary" size={20} />
                آزمون‌های موجود
              </h3>
              
              {tests.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">هیچ آزمونی موجود نیست</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      در حال حاضر آزمون جدیدی برای شرکت موجود نیست
                    </p>
                    <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
                      بازگشت به داشبورد
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tests.map((test) => (
                    <Card key={test.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base mb-1">{test.title}</CardTitle>
                            {test.description && (
                              <p className="text-sm text-muted-foreground">{test.description}</p>
                            )}
                          </div>
                          <Badge variant={test.price === 0 ? "default" : "secondary"}>
                            {formatPrice(test.price)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Test Info */}
                          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span>{test.count_ready} آزمون آماده</span>
                            </div>
                            {test.count_used > 0 && (
                              <div className="flex items-center gap-1">
                                <Target size={14} />
                                <span>{test.count_used} انجام شده</span>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <Button 
                            onClick={() => handleStartTest(test.slug)}
                            size="sm"
                            className="w-full"
                            disabled={test.count_ready === 0}
                          >
                            <Play size={14} className="ml-1" />
                            {test.count_ready === 0 ? 'آزمون ناموجود' : 'شروع آزمون'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Test Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">دسته‌بندی آزمون‌ها</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Brain size={24} className="mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium">شخصیت‌شناسی</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Trophy size={24} className="mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium">مهارت‌های شغلی</p>
                  </CardContent>
                </Card>
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AppTests;