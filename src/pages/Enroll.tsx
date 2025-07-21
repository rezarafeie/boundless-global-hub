
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, DollarSign, Users, BookOpen, Star } from 'lucide-react';
import SaleBadge from '@/components/SaleBadge';
import SaleCountdownTimer from '@/components/SaleCountdownTimer';
import { TetherlandService } from '@/lib/tetherlandService';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  use_dollar_price: boolean;
  usd_price: number | null;
  is_sale_enabled: boolean;
  sale_price: number | null;
  sale_expires_at: string | null;
  slug: string;
  redirect_url: string | null;
  is_active: boolean;
}

const Enroll: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseSlug = searchParams.get('course');
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+98'
  });

  useEffect(() => {
    if (courseSlug) {
      fetchCourse();
    }
  }, [courseSlug]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', courseSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: 'خطا',
        description: 'دوره مورد نظر یافت نشد',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const isSaleActive = course?.is_sale_enabled && 
                      course?.sale_price && 
                      course?.sale_expires_at && 
                      new Date(course.sale_expires_at) > new Date();

  const effectivePrice = isSaleActive ? course!.sale_price! : course?.price || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: course.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          country_code: formData.countryCode,
          payment_amount: effectivePrice,
          payment_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'ثبت نام شما با موفقیت انجام شد'
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        countryCode: '+98'
      });
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ثبت نام. لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">دوره یافت نشد</h1>
            <p className="text-muted-foreground">دوره مورد نظر شما یافت نشد یا غیرفعال است</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Course Information */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{course.title}</CardTitle>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          فعال
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">{course.description}</p>
                      
                      {/* Price Section */}
                      <div className="space-y-4">
                        {isSaleActive && (
                          <div className="flex justify-center mb-4">
                            <SaleBadge originalPrice={course.price} salePrice={course.sale_price!} />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                          <DollarSign className="h-8 w-8 text-green-600" />
                          <div className="text-center">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl font-bold text-green-600">
                                {formatPrice(effectivePrice)}
                              </span>
                              {isSaleActive && (
                                <span className="text-lg text-muted-foreground line-through">
                                  {formatPrice(course.price)}
                                </span>
                              )}
                            </div>
                            {course.use_dollar_price && course.usd_price && (
                              <p className="text-sm text-muted-foreground mt-1">
                                معادل {TetherlandService.formatUSDAmount(course.usd_price)} دلار
                              </p>
                            )}
                          </div>
                        </div>

                        {isSaleActive && (
                          <div className="flex justify-center">
                            <SaleCountdownTimer expiresAt={course.sale_expires_at!} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Course Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        ویژگی‌های دوره
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">دسترسی مادام‌العمر</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-green-600" />
                          <span className="text-sm">محتوای عملی</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">پشتیبانی ۲۴/۷</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">گواهینامه معتبر</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Enrollment Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>ثبت نام در دوره</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">نام و نام خانوادگی *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="نام کامل خود را وارد کنید"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">ایمیل *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="example@domain.com"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="countryCode">کد کشور</Label>
                          <Select 
                            value={formData.countryCode} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+98">+98</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                              <SelectItem value="+49">+49</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="phone">شماره تلفن *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="9123456789"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          disabled={submitting}
                        >
                          {submitting ? 'در حال ثبت نام...' : `ثبت نام - ${formatPrice(effectivePrice)}`}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Enroll;
