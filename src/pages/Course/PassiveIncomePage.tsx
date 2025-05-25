
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import FreeCourseRegistration from "@/components/FreeCourseRegistration";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Download, Users } from "lucide-react";

const PassiveIncomePage = () => {
  return (
    <MainLayout>
      <div className="container py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Course Info */}
            <div>
              <h1 className="text-4xl font-bold mb-4">درآمد غیرفعال با هوش مصنوعی</h1>
              <p className="text-xl text-gray-600 mb-6">
                Passive Income with AI - کسب درآمد بدون حضور فعال
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 ml-3">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p>آشنایی با ابزارهای هوش مصنوعی برای کسب درآمد</p>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 ml-3">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p>روش‌های ایجاد منابع درآمد غیرفعال</p>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1 ml-3">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p>اتوماسیون فرآیندهای کسب و کار</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Play className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">۲ ساعت ویدیو</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Download className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">ابزارها و منابع</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">پشتیبانی آنلاین</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Registration Form */}
            <div>
              <FreeCourseRegistration 
                courseSlug="passive-income"
                courseTitle="درآمد غیرفعال با هوش مصنوعی"
                includeEmail={false}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PassiveIncomePage;
