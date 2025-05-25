
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CourseAccessSuccess = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
        <div className="container max-w-2xl mx-auto">
          <Card className="text-center border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg py-12">
              <CheckCircle className="w-20 h-20 mx-auto mb-6" />
              <CardTitle className="text-3xl mb-4">🎉 تبریک!</CardTitle>
              <p className="text-xl text-green-100">
                ثبت‌نام شما با موفقیت انجام شد
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">مراحل بعدی:</h3>
                <div className="space-y-4 text-right">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <p>اطلاعات دوره و لینک دسترسی از طریق ایمیل/پیامک ارسال می‌شود</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <p>تیم پشتیبانی ظرف 24 ساعت با شما تماس خواهد گرفت</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <p>به گروه تلگرام اختصاصی دوره اضافه خواهید شد</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">راه‌های تماس:</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>021-1234567</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>support@academy.rafeie.com</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={() => navigate('/')}
                  className="px-8 py-3"
                >
                  <Home className="w-4 h-4 mr-2" />
                  بازگشت به صفحه اصلی
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseAccessSuccess;
