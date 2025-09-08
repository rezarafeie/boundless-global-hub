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
    console.log('Validating form with data:', formData);
    
    if (!formData.firstName.trim()) {
      console.log('First name validation failed');
      toast.error('لطفا نام خود را وارد کنید');
      return false;
    }
    
    if (!formData.lastName.trim()) {
      console.log('Last name validation failed');
      toast.error('لطفا نام خانوادگی خود را وارد کنید');
      return false;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      console.log('Email validation failed');
      toast.error('لطفا ایمیل معتبر وارد کنید');
      return false;
    }
    
    if (!formData.phone.trim()) {
      console.log('Phone validation failed');
      toast.error('لطفا شماره تلفن خود را وارد کنید');
      return false;
    }
    
    console.log('Form validation passed');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMITTED ===');
    console.log('Course slug:', courseSlug);
    console.log('Form valid?', validateForm());
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setSubmitting(true);
    
    try {
      console.log('Starting enrollment process...');
      
      // Directly try to find the course we know exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', 'crisis')
        .maybeSingle();

      console.log('Direct crisis course lookup:', { course, courseError });

      if (!course) {
        throw new Error('دوره مورد نظر یافت نشد');
      }

      // Create enrollment
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

      console.log('Creating enrollment:', enrollmentData);

      const { data: result, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollmentData)
        .select()
        .single();

      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError);
        throw new Error(`خطا در ثبت‌نام: ${enrollmentError.message}`);
      }

      console.log('Success:', result);
      toast.success('ثبت‌نام با موفقیت انجام شد!');
      
      // Redirect to success page
      const successUrl = `/enroll/success?course=crisis&email=${formData.email}&enrollment=${result.id}&status=OK&Authority=FREE_COURSE`;
      window.location.href = successUrl;
      
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error(error.message || 'خطا در ثبت‌نام. لطفا دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">✨ ثبت‌نام رایگان</h3>
        <p className="text-muted-foreground text-sm">فقط ۳۰ ثانیه وقت می‌برد</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="text"
            placeholder="نام"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
            disabled={submitting}
            className="h-11 text-sm"
          />
          <Input
            type="text"
            placeholder="نام خانوادگی"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            required
            disabled={submitting}
            className="h-11 text-sm"
          />
        </div>
        
        <Input
          type="email"
          placeholder="ایمیل شما"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          disabled={submitting}
          className="h-11 text-sm"
        />
        
        <div className="flex gap-2">
          <Select 
            value={formData.countryCode} 
            onValueChange={(value) => handleInputChange('countryCode', value)}
            disabled={submitting}
          >
            <SelectTrigger className="h-11 w-20 text-sm">
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
          <Input
            type="tel"
            placeholder="شماره تلفن"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            required
            disabled={submitting}
            className="h-11 text-sm flex-1"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200"
          disabled={submitting}
          onClick={() => console.log('Button clicked!')}
        >
          {submitting ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ثبت‌نام...
            </>
          ) : (
            children || `ثبت‌نام در ${courseName}`
          )}
        </Button>
      </form>
      
      <div className="text-center mt-4">
        <p className="text-xs text-muted-foreground">🔒 رایگان و بدون تعهد</p>
      </div>
    </div>
  );
};

export default DirectEnrollmentForm;