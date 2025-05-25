
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Check, Clock, Play, BookOpen, Users, Award, Gift, Star } from 'lucide-react';
import { submitToGravityForm } from '@/services/wordpressApi';

interface CourseData {
  title: string;
  englishTitle?: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: 'book' | 'graduation' | 'file' | 'message';
  courseSlug: string;
}

const FreeCourseLanding: React.FC<CourseData> = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType,
  courseSlug
}) => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getIcon = () => {
    switch (iconType) {
      case 'book':
        return <BookOpen className="w-16 h-16" />;
      case 'graduation':
        return <Award className="w-16 h-16" />;
      case 'file':
        return <Star className="w-16 h-16" />;
      case 'message':
        return <Users className="w-16 h-16" />;
      default:
        return <BookOpen className="w-16 h-16" />;
    }
  };

  const needsEmail = courseSlug === 'boundless-taste';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: "خطا",
        description: "لطفا تمام فیلدهای الزامی را تکمیل کنید",
        variant: "destructive",
      });
      return;
    }

    if (needsEmail && !formData.email) {
      toast({
        title: "خطا",
        description: "لطفا ایمیل خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitToGravityForm(courseSlug, formData);
      
      toast({
        title: "ثبت‌نام موفق",
        description: "ثبت‌نام شما در دوره با موفقیت انجام شد. به زودی با شما تماس خواهیم گرفت.",
      });

      // Reset form
      setFormData({ firstName: '', lastName: '', email: '', phone: '' });
      setShowRegistrationForm(false);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت‌نام. لطفا دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showRegistrationForm) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
          <div className="container max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowRegistrationForm(false)}
                className="mb-4"
              >
                بازگشت به صفحه دوره
              </Button>
            </div>
            
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center text-2xl">ثبت‌نام رایگان</CardTitle>
                <p className="text-center text-gray-600">{title}</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">نام *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="نام"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">نام خانوادگی *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="نام خانوادگی"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">شماره موبایل *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="09123456789"
                      required
                    />
                  </div>

                  {needsEmail && (
                    <div>
                      <Label htmlFor="email">ایمیل *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full py-3 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "در حال پردازش..." : "شروع دوره رایگان"}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    با ثبت‌نام، شرایط استفاده و حریم خصوصی را می‌پذیرید
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 pt-24 pb-16 overflow-hidden">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-green-500 text-white px-6 py-3 text-lg">
              <Gift className="w-5 h-5 mr-2" />
              ۱۰۰٪ رایگان
            </Badge>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              {englishTitle && (
                <p className="text-xl text-gray-500 font-medium">
                  {englishTitle}
                </p>
              )}
            </div>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {description}
            </p>
            
            <div className="flex justify-center">
              <div className="text-green-600">
                {getIcon()}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => setShowRegistrationForm(true)}
              >
                <Play className="w-5 h-5 mr-2" />
                شروع دوره رایگان
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>بدون محدودیت زمانی - دسترسی مادام‌العمر</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              چه چیزی یاد خواهید گرفت؟
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <Check size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">مهارت اول</h3>
                      <p className="text-gray-600">{benefitOne}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Check size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">مهارت دوم</h3>
                      <p className="text-gray-600">{benefitTwo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              امکانات دوره رایگان
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Play className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">ویدیوهای آموزشی</h3>
                  <p className="text-gray-600 text-sm">
                    دسترسی به ویدیوهای با کیفیت HD
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">جزوه کامل</h3>
                  <p className="text-gray-600 text-sm">
                    دانلود فایل PDF محتوای دوره
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">انجمن دانشجویان</h3>
                  <p className="text-gray-600 text-sm">
                    عضویت در گروه تلگرام اختصاصی
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Instructor */}
      <section className="bg-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">درباره مدرس</h2>
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">رضا رفیعی</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                مربی کسب‌وکار و توسعه شخصی با بیش از ۱۰ سال تجربه در حوزه آموزش و کوچینگ. 
                بنیان‌گذار آکادمی رفیعی و مؤلف چندین کتاب در زمینه موفقیت و کارآفرینی.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold">
              آماده شروع یادگیری هستید؟
            </h2>
            <p className="text-xl text-green-100">
              همین الان ثبت‌نام کنید و فوراً به تمام محتوای دوره دسترسی پیدا کنید
            </p>
            
            <Button 
              size="lg" 
              className="bg-white text-green-600 hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowRegistrationForm(true)}
            >
              <Play className="w-5 h-5 mr-2" />
              شروع دوره رایگان
            </Button>
            
            <p className="text-sm text-green-200">
              ✅ بدون نیاز به کارت اعتباری | ✅ دسترسی فوری | ✅ ۱۰۰٪ رایگان
            </p>
          </div>
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 z-30 shadow-lg">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-green-600">{title} - رایگان</div>
              <div className="text-sm text-gray-600">دسترسی فوری و مادام‌العمر</div>
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full w-full sm:w-auto"
              onClick={() => setShowRegistrationForm(true)}
            >
              <Play className="w-4 h-4 mr-2" />
              شروع دوره
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FreeCourseLanding;
