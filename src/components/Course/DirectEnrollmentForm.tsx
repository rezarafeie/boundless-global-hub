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
      // Create free enrollment directly
      const enrollmentData = {
        course_slug: courseSlug,
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
        
        // Fallback to direct insert - first get course ID
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', courseSlug)
          .single();

        if (courseError) {
          throw new Error('دوره مورد نظر یافت نشد');
        }

        const directEnrollmentData = {
          course_id: course.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          country_code: formData.countryCode,
          payment_amount: 0,
          payment_method: 'free',
          payment_status: 'completed'
        };

        const { data: directResult, error: directError } = await supabase
          .from('enrollments')
          .insert(directEnrollmentData)
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
    <Card className={className}>
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">دسترسی کامل و رایگان به:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>مدیریت بحران شخصی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>راهبردهای سرمایه‌گذاری</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>کسب‌وکارهای بدون مرز</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>پشتیبانی مادام‌العمر</span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">نام *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="نام"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="lastName">نام خانوادگی *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="نام خانوادگی"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">ایمیل *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ایمیل"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="countryCode">کد کشور</Label>
                <Select 
                  value={formData.countryCode} 
                  onValueChange={(value) => handleInputChange('countryCode', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
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
              <div className="col-span-2">
                <Label htmlFor="phone">شماره تلفن *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9123456789"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  در حال ثبت‌نام...
                </>
              ) : (
                children || `ثبت‌نام رایگان در ${courseName}`
              )}
            </Button>
          </form>
          
          <p className="text-sm text-muted-foreground">
            ✨ رایگان بدون نیاز به کارت بانکی
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DirectEnrollmentForm;