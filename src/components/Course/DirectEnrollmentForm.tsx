import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, ShieldCheck, TrendingUp, Globe, Headphones } from 'lucide-react';
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
        .maybeSingle();

      if (courseError || !course) {
        console.error('Course not found:', courseError);
        throw new Error('دوره مورد نظر یافت نشد');
      }

      // Create enrollment directly in database (bypass edge function issues)
      const enrollmentData = {
        course_id: course.id,
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        country_code: formData.countryCode,
        payment_amount: 0,
        payment_method: 'free',
        payment_status: 'completed'
      };

      console.log('Creating enrollment with data:', enrollmentData);

      const { data: result, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollmentData)
        .select()
        .single();

      if (enrollmentError) {
        console.error('Enrollment creation error:', enrollmentError);
        throw new Error(`خطا در ثبت‌نام: ${enrollmentError.message}`);
      }

      console.log('Enrollment created successfully:', result);
      
      // Show success message
      toast.success('ثبت‌نام با موفقیت انجام شد!');
      
      // Redirect to success page
      const successUrl = `/enroll/success?course=${courseSlug}&email=${formData.email}&enrollment=${result.id}&status=OK&Authority=FREE_COURSE`;
      window.location.href = successUrl;
      
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      toast.error(error.message || 'خطا در ثبت‌نام. لطفا دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-background/80 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-xl ${className}`}>
      <div className="text-center space-y-8">
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-foreground">🎯 دسترسی کامل و رایگان به:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">مدیریت بحران شخصی</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <TrendingUp className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">راهبردهای سرمایه‌گذاری</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <Globe className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">کسب‌وکارهای بدون مرز</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <Headphones className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">پشتیبانی مادام‌العمر</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-foreground">نام *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="نام خود را وارد کنید"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                disabled={submitting}
                className="h-14 text-lg border-2 border-border focus:border-primary rounded-xl transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-foreground">نام خانوادگی *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="نام خانوادگی خود را وارد کنید"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                disabled={submitting}
                className="h-14 text-lg border-2 border-border focus:border-primary rounded-xl transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">ایمیل *</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={submitting}
              className="h-14 text-lg border-2 border-border focus:border-primary rounded-xl transition-all duration-200"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="countryCode" className="text-sm font-semibold text-foreground">کد کشور</Label>
              <Select 
                value={formData.countryCode} 
                onValueChange={(value) => handleInputChange('countryCode', value)}
                disabled={submitting}
              >
                <SelectTrigger className="h-14 text-lg border-2 border-border rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option, index) => (
                    <SelectItem key={`${option.code}-${index}`} value={option.code}>
                      {option.flag} {option.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">شماره تلفن *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="912*******"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                disabled={submitting}
                className="h-14 text-lg border-2 border-border focus:border-primary rounded-xl transition-all duration-200"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="ml-2 h-6 w-6 animate-spin" />
                در حال ثبت‌نام...
              </>
            ) : (
              children || `🚀 ثبت‌نام رایگان در ${courseName}`
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-center gap-2 text-base text-muted-foreground font-medium">
          <span className="text-2xl">✨</span>
          <span>رایگان بدون نیاز به کارت بانکی</span>
          <span className="text-2xl">✨</span>
        </div>
      </div>
    </div>
  );
};

export default DirectEnrollmentForm;