import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCountryCodeOptions } from '@/lib/countryCodeUtils';

interface DirectEnrollmentFormProps {
  courseSlug: string;
  courseName: string;
  className?: string;
  children?: React.ReactNode;
}

const DirectEnrollmentForm: React.FC<DirectEnrollmentFormProps> = ({
  courseSlug,
  courseName,
  className,
  children
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+98'
  });

  const countryOptions = getCountryCodeOptions();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('لطفا نام خود را وارد کنید');
      return false;
    }
    
    if (!formData.lastName.trim()) {
      toast.error('لطفا نام خانوادگی خود را وارد کنید');
      return false;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('لطفا ایمیل معتبر وارد کنید');
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast.error('لطفا شماره تلفن خود را وارد کنید');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      // First get course ID from slug
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', courseSlug)
        .single();

      if (courseError) {
        throw new Error('دوره مورد نظر یافت نشد');
      }

      // Create enrollment with course_id (edge function expects course_id not course_slug)
      const enrollmentData = {
        course_id: course.id,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        country_code: formData.countryCode,
        payment_amount: 0,
        payment_method: 'free',
        payment_status: 'completed'
      };

      console.log('Creating direct enrollment:', enrollmentData);

      const { data: result, error } = await supabase.functions
        .invoke('create-enrollment', {
          body: enrollmentData
        });

      if (error) {
        console.warn('Edge function failed, trying direct insert:', error);
        
        const { data: directResult, error: directError } = await supabase
          .from('enrollments')
          .insert(enrollmentData)
          .select()
          .single();

        if (directError) {
          throw directError;
        }

        console.log('Direct enrollment created:', directResult);
        
        // Redirect to success page
        const successUrl = `/enroll/success?course=${courseSlug}&email=${formData.email}&enrollment=${directResult.id}&status=OK&Authority=FREE_COURSE`;
        window.location.href = successUrl;
        return;
      }

      console.log('Enrollment created via edge function:', result.enrollment);
      
      // Redirect to success page
      const enrollmentId = result.enrollment?.id;
      if (enrollmentId) {
        const successUrl = `/enroll/success?course=${courseSlug}&email=${formData.email}&enrollment=${enrollmentId}&status=OK&Authority=FREE_COURSE`;
        window.location.href = successUrl;
      } else {
        throw new Error('خطا در ایجاد ثبت‌نام');
      }
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast.error('خطا در ثبت‌نام. لطفا دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-background border border-border rounded-2xl p-8 shadow-sm ${className}`}>
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">دسترسی کامل و رایگان به:</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">مدیریت بحران شخصی</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">راهبردهای سرمایه‌گذاری</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">کسب‌وکارهای بدون مرز</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">پشتیبانی مادام‌العمر</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-foreground">نام *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="نام خود را وارد کنید"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                disabled={submitting}
                className="h-12 border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-foreground">نام خانوادگی *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="نام خانوادگی خود را وارد کنید"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                disabled={submitting}
                className="h-12 border-border focus:border-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">ایمیل *</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={submitting}
              className="h-12 border-border focus:border-primary"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="countryCode" className="text-sm font-medium text-foreground">کد کشور</Label>
              <Select 
                value={formData.countryCode} 
                onValueChange={(value) => handleInputChange('countryCode', value)}
                disabled={submitting}
              >
                <SelectTrigger className="h-12 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.flag} {option.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">شماره تلفن *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="912*******"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                disabled={submitting}
                className="h-12 border-border focus:border-primary"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                در حال ثبت‌نام...
              </>
            ) : (
              children || `🚀 ثبت‌نام رایگان در ${courseName}`
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>✨</span>
          <span>رایگان بدون نیاز به کارت بانکی</span>
          <span>✨</span>
        </div>
      </div>
    </div>
  );
};

export default DirectEnrollmentForm;