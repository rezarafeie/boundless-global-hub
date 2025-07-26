import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail
} from 'lucide-react';
import PendingPaymentsSummary from './PendingPaymentsSummary';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          داشبورد مدیریت
        </h1>
        <p className="text-muted-foreground mt-2">
          خلاصه‌ای از وضعیت کلی سیستم و آمار مهم
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PendingPaymentsSummary />
        
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              کل فروش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ۱۲۵,۰۰۰,۰۰۰ تومان
            </div>
            <p className="text-sm text-muted-foreground">در این ماه</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              تعداد ثبت‌نام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">۴۲</div>
            <p className="text-sm text-muted-foreground">در این ماه</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              نرخ تبدیل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">۸۵٪</div>
            <p className="text-sm text-muted-foreground">بازدید به خرید</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">پرداخت تایید شد</p>
                <p className="text-xs text-muted-foreground">۲ دقیقه پیش</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">ثبت‌نام جدید</p>
                <p className="text-xs text-muted-foreground">۵ دقیقه پیش</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm">پرداخت در انتظار</p>
                <p className="text-xs text-muted-foreground">۱۰ دقیقه پیش</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              دوره‌های پرطرفدار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">دوره کسب و کار آمریکایی</p>
                <p className="text-xs text-muted-foreground">۲۵ ثبت‌نام</p>
              </div>
              <span className="text-lg font-bold text-purple-600">۱</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">دوره درآمد غیرفعال</p>
                <p className="text-xs text-muted-foreground">۱۸ ثبت‌نام</p>
              </div>
              <span className="text-lg font-bold text-blue-600">۲</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">دوره طعم بی‌مرز</p>
                <p className="text-xs text-muted-foreground">۱۲ ثبت‌نام</p>
              </div>
              <span className="text-lg font-bold text-green-600">۳</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>دسترسی سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">ثبت‌نام‌های جدید</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">تایید پرداخت‌ها</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <BookOpen className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">مدیریت دوره‌ها</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <Mail className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">ارسال ایمیل</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;