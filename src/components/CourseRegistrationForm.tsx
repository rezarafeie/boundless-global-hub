
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { submitToGravityForm, createWooCommerceOrder, getCourseType } from '@/services/wordpressApi';

interface CourseRegistrationFormProps {
  courseSlug: string;
  courseTitle: string;
  className?: string;
}

const CourseRegistrationForm: React.FC<CourseRegistrationFormProps> = ({
  courseSlug,
  courseTitle,
  className = ""
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const courseType = getCourseType(courseSlug);
  const isFree = courseType === 'free';
  const needsEmail = courseSlug === 'boundless-taste'; // Form ID 1 needs email

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

    if (!isFree && !formData.email) {
      toast({
        title: "خطا",
        description: "لطفا ایمیل خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isFree) {
        // Submit to Gravity Forms
        await submitToGravityForm(courseSlug, formData);
        
        toast({
          title: "ثبت‌نام موفق",
          description: "ثبت‌نام شما در دوره رایگان با موفقیت انجام شد",
        });

        // Show success message or redirect to course content
        setTimeout(() => {
          window.location.href = '/course-access-success';
        }, 2000);
        
      } else {
        // Create WooCommerce order
        const order = await createWooCommerceOrder(courseSlug, formData);
        
        toast({
          title: "سفارش ایجاد شد",
          description: "در حال هدایت به صفحه پرداخت...",
        });

        // Redirect to payment page
        const paymentUrl = order.payment_url || `/checkout/order/${order.id}`;
        window.location.href = paymentUrl;
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "خطا",
        description: isFree ? "خطا در ثبت‌نام. لطفا دوباره تلاش کنید" : "خطا در ایجاد سفارش. لطفا دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {isFree ? "ثبت‌نام رایگان" : "خرید دوره"}
        </CardTitle>
        <p className="text-center text-gray-600">
          {courseTitle}
        </p>
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

          {(needsEmail || !isFree) && (
            <div>
              <Label htmlFor="email">ایمیل {needsEmail || !isFree ? '*' : ''}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
                required={needsEmail || !isFree}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-3 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "در حال پردازش..." : isFree ? "شروع دوره رایگان" : "خرید و شروع دوره"}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            با ثبت‌نام، شرایط استفاده و حریم خصوصی را می‌پذیرید
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseRegistrationForm;
