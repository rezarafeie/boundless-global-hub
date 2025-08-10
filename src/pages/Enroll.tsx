import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, User, Mail, Phone, BookOpen, Star, Shield, Clock, Zap, DollarSign, AlertTriangle, Wifi, Rocket } from 'lucide-react';
import { getCountryCodeOptions } from '@/lib/countryCodeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentAuthService, EnrollmentAuthData } from '@/lib/enrollmentAuthService';
import MainLayout from '@/components/Layout/MainLayout';
import ManualPaymentSection from '@/components/ManualPaymentSection';
import { TetherlandService } from '@/lib/tetherlandService';
import DiscountSection from '@/components/DiscountSection';
import { IPDetectionService } from '@/lib/ipDetectionService';
import EnrollmentCountdown from '@/components/EnrollmentCountdown';
import SaleBadge from '@/components/SaleBadge';
import PrelaunchBadge from '@/components/PrelaunchBadge';
import SaleCountdownTimer from '@/components/SaleCountdownTimer';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  use_dollar_price: boolean;
  usd_price: number | null;
  is_sale_enabled: boolean;
  sale_price: number | null;
  sale_expires_at: string | null;
  is_pre_launch_enabled?: boolean;
  pre_launch_price?: number | null;
  pre_launch_ends_at?: string | null;
  launch_date?: string | null;
  redirect_url: string;
  is_spotplayer_enabled: boolean;
  spotplayer_course_id: string | null;
}

interface Test {
  id: string;
  test_id: number;
  title: string;
  description?: string;
  price: number;
  slug: string;
  count_ready: number;
  count_used: number;
  is_active: boolean;
}

const Enroll: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, login } = useAuth();
  const courseSlug = searchParams.get('course');
  const testSlug = searchParams.get('test');

  const [course, setCourse] = useState<Course | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'zarinpal' | 'manual'>('zarinpal');
  const [finalRialPrice, setFinalRialPrice] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isIranianIP, setIsIranianIP] = useState<boolean | null>(null);
  const [showVPNWarning, setShowVPNWarning] = useState(false);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const [isOnSale, setIsOnSale] = useState(false);
  const [prelaunchPrice, setPrelaunchPrice] = useState<number | null>(null);
  const [isOnPrelaunch, setIsOnPrelaunch] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+98'
  });

  // Calculate if the course is free (either original price is 0 or 100% discount)
  const isFree = course?.price === 0 || test?.price === 0 || discountedPrice === 0 || salePrice === 0 || prelaunchPrice === 0;

  useEffect(() => {
    if (courseSlug) {
      fetchCourse();
    } else if (testSlug) {
      fetchTest();
    } else {
      setLoading(false);
    }
  }, [courseSlug, testSlug]);

  // Auto-fill form data when user is authenticated and has required data
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Auto-filling enrollment form for logged in user:', user.name);
      
      // Clean phone number - remove country code prefixes
      let cleanPhone = '';
      if (user.phone) {
        cleanPhone = user.phone
          .replace(/^(\+98|98|0)/, '') // Remove +98, 98, or 0 prefix
          .replace(/\D/g, ''); // Remove any non-digit characters
      }
      
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || user.name?.split(' ')[0] || prev.firstName,
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || prev.lastName,
        email: user.email || prev.email,
        phone: cleanPhone || prev.phone,
        countryCode: user.countryCode || '+98'
      }));

      // Show success message when auto-filling
      if (user.firstName || user.lastName || user.email || user.phone) {
        toast({
          title: "✅ اطلاعات تکمیل شد",
          description: `خوش آمدید ${user.name}! فرم با اطلاعات حساب کاربری شما تکمیل شد.`,
        });
      }
    }
  }, [isAuthenticated, user, toast]);

  // Fetch exchange rate when course has dollar pricing
  useEffect(() => {
    if (course?.use_dollar_price && course?.usd_price) {
      fetchExchangeRateForCourse(course.usd_price);
    }
  }, [course]);

  // Check if course is on sale or pre-launch and calculate pricing
  useEffect(() => {
    if (course) {
      const now = new Date();
      
      // Check pre-launch first (higher priority)
      const prelaunchExpiry = (course as any).pre_launch_ends_at ? new Date((course as any).pre_launch_ends_at) : null;
      const isPrelaunchActive = (course as any).is_pre_launch_enabled && 
                               (course as any).pre_launch_price !== null && 
                               prelaunchExpiry && 
                               now < prelaunchExpiry;
      
      setIsOnPrelaunch(isPrelaunchActive);
      
      if (isPrelaunchActive) {
        if (course.use_dollar_price && (course as any).pre_launch_price) {
          // For dollar courses, convert pre-launch price to rial
          fetchPrelaunchExchangeRate((course as any).pre_launch_price);
        } else {
          setPrelaunchPrice((course as any).pre_launch_price);
        }
        // If pre-launch is active, don't check regular sale
        setIsOnSale(false);
        setSalePrice(null);
        return;
      } else {
        setPrelaunchPrice(null);
      }
      
      // Check regular sale if no pre-launch
      const saleExpiry = course.sale_expires_at ? new Date(course.sale_expires_at) : null;
      const isSaleActive = course.is_sale_enabled && 
                          course.sale_price !== null && 
                          saleExpiry && 
                          now < saleExpiry;
      
      setIsOnSale(isSaleActive);
      
      if (isSaleActive) {
        if (course.use_dollar_price && course.sale_price) {
          // For dollar courses, convert sale price to rial
          fetchSaleExchangeRate(course.sale_price);
        } else {
          setSalePrice(course.sale_price);
        }
      } else {
        setSalePrice(null);
      }
    }
  }, [course]);

  const fetchSaleExchangeRate = async (salePriceUSD: number) => {
    try {
      const rialAmount = await TetherlandService.convertUSDToIRR(salePriceUSD);
      setSalePrice(rialAmount);
    } catch (error) {
      console.error('Error fetching sale exchange rate:', error);
      setSalePrice(course?.sale_price || null);
    }
  };

  const fetchPrelaunchExchangeRate = async (prelaunchPriceUSD: number) => {
    try {
      const rialAmount = await TetherlandService.convertUSDToIRR(prelaunchPriceUSD);
      setPrelaunchPrice(rialAmount);
    } catch (error) {
      console.error('Error fetching pre-launch exchange rate:', error);
      setPrelaunchPrice((course as any)?.pre_launch_price || null);
    }
  };

  // Check user's IP location for VPN warning
  useEffect(() => {
    const checkIPLocation = async () => {
      try {
        const isIranian = await IPDetectionService.isIranianIP();
        setIsIranianIP(isIranian);
        setShowVPNWarning(!isIranian && paymentMethod === 'zarinpal');
      } catch (error) {
        console.error('Failed to detect IP location:', error);
        // Default to showing warning for safety
        setIsIranianIP(false);
        setShowVPNWarning(paymentMethod === 'zarinpal');
      }
    };

    checkIPLocation();
  }, [paymentMethod]);

  const fetchExchangeRateForCourse = async (usdAmount: number) => {
    setLoadingExchangeRate(true);
    try {
      const rialAmount = await TetherlandService.convertUSDToIRR(usdAmount);
      const rate = await TetherlandService.getUSDTToIRRRate();
      
      setExchangeRate(rate);
      setFinalRialPrice(rialAmount);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت نرخ ارز. قیمت نمایش داده شده ممکن است به‌روز نباشد.",
        variant: "destructive"
      });
      // Fallback to course price if exchange rate fails
      setFinalRialPrice(course?.price || 0);
    } finally {
      setLoadingExchangeRate(false);
    }
  };

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
        title: "خطا",
        description: "دوره مورد نظر یافت نشد",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTest = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('slug', testSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setTest(data);
    } catch (error) {
      console.error('Error fetching test:', error);
      toast({
        title: "خطا",
        description: "آزمون مورد نظر یافت نشد",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        title: "خطا",
        description: "لطفا نام خود را وارد کنید",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.lastName.trim()) {
      toast({
        title: "خطا",
        description: "لطفا نام خانوادگی خود را وارد کنید",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "خطا", 
        description: "لطفا ایمیل معتبر وارد کنید",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast({
        title: "خطا",
        description: "لطفا شماره تلفن خود را وارد کنید", 
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔥 Enroll button clicked!');
    console.log('📋 Form data:', formData);
    console.log('📚 Course:', course);
    console.log('🧪 Test:', test);
    console.log('💰 Is free course?', isFree);
    console.log('🔑 Payment method:', paymentMethod);
    
    if (!validateForm() || (!course && !test)) {
      console.log('❌ Form validation failed or no course/test');
      return;
    }
    
    // Manual payment is handled in ManualPaymentSection component
    if (paymentMethod === 'manual') {
      console.log('💳 Manual payment - handled in component');
      return;
    }

    console.log('✅ Starting submission process...');
    setSubmitting(true);
    
    try {
      // Handle test enrollment
      if (test) {
        // Calculate final payment amount for test (considering discounts)
        const finalTestPrice = discountedPrice !== null ? discountedPrice : test.price;
        
        const testEnrollmentData = {
          test_id: test.id,
          user_id: user?.id ? parseInt(user.id) : null,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          payment_amount: finalTestPrice,
          enrollment_status: finalTestPrice === 0 ? 'ready' : 'pending',
          payment_status: finalTestPrice === 0 ? 'completed' : 'pending'
        };

        console.log('Creating test enrollment:', testEnrollmentData);

        const { data: testResult, error: testError } = await supabase
          .from('test_enrollments')
          .insert(testEnrollmentData)
          .select()
          .single();

        if (testError) {
          throw testError;
        }

        console.log('Test enrollment created:', testResult);
        
        // Redirect to success page for free test (including 100% discounted tests)
        if (finalTestPrice === 0) {
          const successUrl = `/enroll/success?test=${test.slug}&phone=${formData.phone}&enrollment=${testResult.id}&status=OK&Authority=FREE_TEST`;
          window.location.href = successUrl;
        } else {
          // For paid tests, proceed with Zarinpal payment
          const response = await supabase.functions.invoke('zarinpal-request', {
            body: {
              testSlug: test.slug,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              countryCode: formData.countryCode,
              customAmount: finalTestPrice, // Use discounted price if available
              enrollmentType: 'test'
            }
          });

          if (response.error) throw response.error;

          const { data } = response;
          
          if (data.success) {
            // Redirect to Zarinpal payment
            window.location.href = data.paymentUrl;
          } else {
            throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت');
          }
        }
        return;
      }

      // If course is free (price is 0 or 100% discount), create enrollment directly without payment
      if (isFree && course) {
        const enrollmentData = {
          course_id: course.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          country_code: formData.countryCode,
          payment_amount: 0,
          payment_method: 'free',
          payment_status: 'completed', // Set as completed for free courses
          chat_user_id: user?.id ? parseInt(user.id) : null
        };

        console.log('Creating free enrollment:', enrollmentData);

        const { data: edgeResult, error: edgeError } = await supabase.functions
          .invoke('create-enrollment', {
            body: enrollmentData
          });

        if (edgeError) {
          console.warn('Edge function failed for free course, trying direct insert:', edgeError);
          
          // Fallback to direct insert
          const { data: directResult, error: directError } = await supabase
            .from('enrollments')
            .insert(enrollmentData)
            .select()
            .single();

          if (directError) {
            throw directError;
          }

          console.log('Free enrollment created via direct insert:', directResult);
          
          // Redirect to success page for free course
          const successUrl = `/enroll/success?course=${course.slug}&email=${formData.email}&enrollment=${directResult.id}&status=OK&Authority=FREE_COURSE`;
          window.location.href = successUrl;
          return;
        } else {
          console.log('Free enrollment created via edge function:', edgeResult.enrollment);
          
          // Redirect to success page for free course
          const enrollmentId = edgeResult.enrollment?.id;
          if (enrollmentId) {
            const successUrl = `/enroll/success?course=${course.slug}&email=${formData.email}&enrollment=${enrollmentId}&status=OK&Authority=FREE_COURSE`;
            window.location.href = successUrl;
            return;
          }
        }
      } else if (course) {
        // Paid course - proceed with Zarinpal payment
        // CRITICAL: Always prioritize sale price when active
        let basePrice = course.use_dollar_price && finalRialPrice 
          ? finalRialPrice 
          : course.price;
        
        let paymentAmount = basePrice;
        
        // PRIORITY ORDER: Pre-launch FIRST, then Sale price, then discount, then base
        if (isOnPrelaunch && prelaunchPrice !== null) {
          paymentAmount = prelaunchPrice;
          console.log('🚀 PRE-LAUNCH ACTIVE - Using pre-launch price for payment:', prelaunchPrice);
        } else if (isOnSale && salePrice !== null) {
          paymentAmount = salePrice;
          console.log('🏷️ SALE ACTIVE - Using sale price for payment:', salePrice);
        } else if (discountedPrice !== null) {
          paymentAmount = discountedPrice;
          console.log('🎯 Using discount price for payment:', discountedPrice);
        } else {
          console.log('💰 Using base price for payment:', basePrice);
        }
          
        const response = await supabase.functions.invoke('zarinpal-request', {
          body: {
            courseSlug: course.slug,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.countryCode,
            customAmount: paymentAmount // Pass the calculated amount
          }
        });

        if (response.error) throw response.error;

        const { data } = response;
        
        if (data.success) {
          // Redirect to Zarinpal payment
          window.location.href = data.paymentUrl;
        } else {
          throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت');
        }
      }
    } catch (error) {
      console.error('Payment request error:', error);
      toast({
        title: "خطا در پرداخت",
        description: "خطا در ایجاد درخواست پرداخت. لطفا مجددا تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!course && !test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">{courseSlug ? 'دوره' : 'آزمون'} یافت نشد</h2>
              <p className="text-muted-foreground">
                {courseSlug ? 'دوره' : 'آزمون'} مورد نظر شما یافت نشد یا غیرفعال است.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Course Info */}
            <Card className="order-2 lg:order-1 bg-card/60 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                  {/* Desktop badges */}
                  <div className="hidden md:flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      دوره آنلاین
                    </Badge>
                    {course?.is_spotplayer_enabled && (
                      <Badge variant="default" className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg">
                        <Zap className="h-3 w-3 ml-1" />
                        Rafiei Player Support
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-3xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {test ? test.title : course?.title}
                </CardTitle>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {test ? test.description : course?.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl blur-xl"></div>
                  <div className="relative p-4 md:p-6 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-xl border border-primary/20">
                     <div className="space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <span className="text-base md:text-lg font-medium">{test ? 'قیمت آزمون:' : 'قیمت دوره:'}</span>
                         <div className="text-right md:text-left">
                            {/* Pre-launch Badge */}
                            {isOnPrelaunch && prelaunchPrice !== null && !isFree && (course as any).launch_date && (
                              <div className="mb-3">
                                <PrelaunchBadge
                                  originalPrice={course.use_dollar_price && finalRialPrice ? finalRialPrice : course.price}
                                  prelaunchPrice={prelaunchPrice}
                                  launchDate={(course as any).launch_date}
                                  className="mb-1"
                                />
                              </div>
                            )}
                            
                            {/* Sale Badge */}
                            {!isOnPrelaunch && isOnSale && salePrice !== null && !isFree && (
                              <div className="mb-2">
                                <SaleBadge
                                  originalPrice={course.use_dollar_price && finalRialPrice ? finalRialPrice : course.price}
                                  salePrice={salePrice}
                                  className="mb-1"
                                />
                              </div>
                            )}
                            
                             {isFree ? (
                               <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                                 رایگان
                               </span>
                             ) : (
                               <>
                                  <span className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                     {test 
                                       ? (discountedPrice !== null ? formatPrice(discountedPrice) : formatPrice(test.price))
                                      : isOnPrelaunch && prelaunchPrice !== null
                                        ? formatPrice(prelaunchPrice)
                                        : isOnSale && salePrice !== null
                                          ? formatPrice(salePrice)
                                          : discountedPrice !== null 
                                            ? formatPrice(discountedPrice)
                                            : course?.use_dollar_price && finalRialPrice 
                                              ? TetherlandService.formatIRRAmount(finalRialPrice) + ' تومان'
                                              : formatPrice(course?.price || 0)
                                    }
                                 </span>
                                  {/* Show original price if discounted */}
                                  {((test && discountAmount > 0) || (!test && (isOnPrelaunch && prelaunchPrice !== null || isOnSale && salePrice !== null || discountAmount > 0))) && (
                                     <div className="text-sm text-muted-foreground line-through mt-1">
                                       {test 
                                         ? formatPrice(test.price)
                                         : course?.use_dollar_price && finalRialPrice 
                                           ? TetherlandService.formatIRRAmount(finalRialPrice) + ' تومان'
                                           : formatPrice(course?.price || 0)
                                       }
                                     </div>
                                  )}
                                
                                {/* Pre-launch Price in USD if applicable */}
                                {isOnPrelaunch && course.use_dollar_price && (course as any).pre_launch_price && (
                                  <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                    قیمت پیش‌فروش: {TetherlandService.formatUSDAmount((course as any).pre_launch_price)}
                                  </div>
                                )}
                                
                                {/* Sale Price in USD if applicable */}
                                {!isOnPrelaunch && isOnSale && course.use_dollar_price && course.sale_price && (
                                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    قیمت حراج: {TetherlandService.formatUSDAmount(course.sale_price)}
                                  </div>
                                )}
                             </>
                           )}
                         </div>
                       </div>
                      
                       {/* Dollar Price Information - Only show for paid courses */}
                       {!isFree && course?.use_dollar_price && course?.usd_price && (
                        <div className="border-t border-border/30 pt-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              <span className="text-muted-foreground">قیمت اصلی (دلار):</span>
                            </div>
                             <span className="font-medium text-blue-600">
                               {TetherlandService.formatUSDAmount(course?.usd_price || 0)}
                             </span>
                          </div>
                          
                          {exchangeRate && (
                             <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                               <span>نرخ تبدیل:</span>
                               <span>{TetherlandService.formatIRRAmount(exchangeRate)} تومان</span>
                             </div>
                          )}
                          
                          {loadingExchangeRate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              در حال محاسبه قیمت نهایی...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                 </div>

                 {/* Pre-launch Countdown Timer */}
                 {isOnPrelaunch && (course as any).pre_launch_ends_at && (
                   <div className="relative">
                     <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl blur-xl"></div>
                     <div className="relative p-6 bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                       <div className="text-center space-y-3">
                         <div className="flex items-center justify-center gap-2">
                           <Rocket className="h-5 w-5 text-orange-600" />
                           <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                             پیش‌فروش تا زمان لانچ
                           </h3>
                         </div>
                         <SaleCountdownTimer 
                           endDate={new Date((course as any).pre_launch_ends_at)}
                         />
                         {(course as any).launch_date && (
                           <p className="text-sm text-orange-700 dark:text-orange-300">
                             لانچ رسمی: {new Date((course as any).launch_date).toLocaleDateString('fa-IR', {
                               year: 'numeric',
                               month: 'long', 
                               day: 'numeric'
                             })}
                           </p>
                         )}
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Sale Countdown Timer */}
                 {!isOnPrelaunch && isOnSale && course.sale_expires_at && (
                   <SaleCountdownTimer 
                     endDate={new Date(course.sale_expires_at)}
                   />
                 )}
                 
                 {/* Rafiei Player Special Feature - only for courses */}
                 {course?.is_spotplayer_enabled && (
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                        Rafiei Player Support
                      </h3>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm leading-relaxed">
                      این دوره در پلتفرم Rafiei Player قابل دسترسی است. شما می‌توانید ویدیوها را دانلود کرده و بدون نیاز به اینترنت تماشا کنید. دسترسی شما هرگز منقضی نمی‌شود.
                    </p>
                  </div>
                )}
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">دسترسی مادام‌العمر</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">پرداخت امن</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">۲۴/۷ پشتیبانی</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">شروع فوری</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Form */}
            <Card className="order-1 lg:order-2 bg-card/60 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  {test ? 'ثبت‌نام در آزمون' : 'ثبت‌نام در دوره'}
                  {isAuthenticated && user && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                      <User className="h-3 w-3 ml-1" />
                      وارد شده
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  {isAuthenticated && user ? (
                    <>اطلاعات شما از حساب کاربری تکمیل شد. در صورت نیاز می‌توانید ویرایش کنید.</>
                  ) : (
                    <>اطلاعات خود را وارد کنید و روش پرداخت را انتخاب کنید</>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* User Login Status */}
                  {!isAuthenticated && (
                    <Card className="bg-gradient-to-r from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-950/20 border-primary/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-primary">حساب کاربری دارید؟</h4>
                              <p className="text-xs text-muted-foreground">برای تکمیل سریع‌تر فرم وارد شوید</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => {
                              const currentUrl = window.location.pathname + window.location.search;
                              window.location.href = `/auth?redirect=${encodeURIComponent(currentUrl)}`;
                            }}
                          >
                            ورود
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">
                          نام
                          {isAuthenticated && user?.firstName && (
                            <span className="text-green-600 text-xs mr-1">(تکمیل شده)</span>
                          )}
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="علی"
                          className={`h-12 text-base ${isAuthenticated && user?.firstName ? 'bg-green-50 dark:bg-green-900/10 border-green-300' : ''}`}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">
                          نام خانوادگی
                          {isAuthenticated && user?.lastName && (
                            <span className="text-green-600 text-xs mr-1">(تکمیل شده)</span>
                          )}
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="احمدی"
                          className={`h-12 text-base ${isAuthenticated && user?.lastName ? 'bg-green-50 dark:bg-green-900/10 border-green-300' : ''}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        ایمیل
                        {isAuthenticated && user?.email && (
                          <span className="text-green-600 text-xs mr-1">(تکمیل شده)</span>
                        )}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="example@email.com"
                        className={`h-12 text-base ${isAuthenticated && user?.email ? 'bg-green-50 dark:bg-green-900/10 border-green-300' : ''}`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        شماره تلفن
                        {isAuthenticated && user?.phone && (
                          <span className="text-green-600 text-xs mr-1">(تکمیل شده)</span>
                        )}
                      </Label>
                      <div className="flex border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background" dir="ltr">
                        <Select 
                          value={formData.countryCode} 
                          onValueChange={(value) => handleInputChange('countryCode', value)}
                        >
                          <SelectTrigger className="w-24 border-0 border-l border-input rounded-none bg-transparent focus:ring-0 px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getCountryCodeOptions().map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            // Remove any non-digit characters and prevent starting with 0 or +
                            let cleanValue = e.target.value.replace(/[^0-9]/g, '');
                            cleanValue = cleanValue.replace(/^[0+]+/, '');
                            handleInputChange('phone', cleanValue);
                          }}
                          placeholder="912345678"
                          className={`flex-1 h-12 text-base border-0 rounded-none focus-visible:ring-0 ${isAuthenticated && user?.phone ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods or Free Enrollment */}
                  {isFree ? (
                    /* Free Course Enrollment Button */
                    <div className="space-y-4">
                      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                            <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                          </div>
                           <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                             {test ? 'آزمون رایگان' : 'دوره رایگان'}
                           </h3>
                           <p className="text-sm text-green-700 dark:text-green-300">
                             {test 
                               ? 'این آزمون کاملاً رایگان است. بدون نیاز به پرداخت در آزمون ثبت‌نام کنید.'
                               : 'این دوره کاملاً رایگان است. بدون نیاز به پرداخت در دوره ثبت‌نام کنید.'
                             }
                           </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-6 w-6 animate-spin ml-2" />
                            در حال ثبت‌نام...
                          </>
                         ) : (
                           <>
                             <BookOpen className="h-6 w-6 ml-2" />
                             {test ? 'ثبت‌نام رایگان در آزمون' : 'ثبت‌نام رایگان در دوره'}
                           </>
                         )}
                      </Button>
                    </div>
                    ) : (
                       /* Payment Methods - For both courses and tests */
                       <>
                         {/* ManualPaymentSection - Show for both courses and tests */}
                         <ManualPaymentSection
                           course={course || undefined}
                           test={test || undefined}
                           formData={formData}
                           onPaymentMethodChange={setPaymentMethod}
                           selectedMethod={paymentMethod}
                           finalRialPrice={finalRialPrice}
                           discountedPrice={discountedPrice}
                           salePrice={salePrice}
                           isOnSale={isOnSale}
                         />

                          {/* Discount Section - Show for both paid courses and tests */}
                          {(course || test) && !isFree && (
                            <DiscountSection
                              courseId={course?.id}
                              testId={test?.id}
                              originalPrice={test ? test.price : (finalRialPrice || course?.price || 0)}
                              onDiscountApplied={(discountAmount, finalPrice) => {
                                setDiscountAmount(discountAmount);
                                setDiscountedPrice(finalPrice);
                              }}
                            />
                          )}
                       </>
                     )}

                   {/* VPN Warning for non-Iranian IPs */}
                   {showVPNWarning && paymentMethod === 'zarinpal' && isIranianIP === false && (
                     <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                       <div className="flex items-start gap-3">
                         <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                         <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <Wifi className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                             <h4 className="font-medium text-orange-800 dark:text-orange-200">توجه به کاربران VPN</h4>
                           </div>
                           <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                             درگاه شاپرک (زرین‌پال) با VPN کار نمی‌کند. لطفا قبل از پرداخت، VPN خود را خاموش کنید.
                           </p>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Submit Button - Only for Zarinpal and paid tests/courses */}
                   {paymentMethod === 'zarinpal' && (test || course) && !isFree && (
                     <Button
                       type="submit"
                       className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                       disabled={submitting}
                     >
                       {submitting ? (
                         <>
                           <Loader2 className="h-6 w-6 animate-spin ml-2" />
                           در حال پردازش...
                         </>
                       ) : (
                          <>
                              <CreditCard className="h-6 w-6 ml-2" />
                              پرداخت آنلاین {test 
                                ? (discountedPrice !== null ? formatPrice(discountedPrice) : formatPrice(test.price))
                               : isOnPrelaunch && prelaunchPrice !== null
                                 ? formatPrice(prelaunchPrice)
                                 : isOnSale && salePrice !== null
                                   ? formatPrice(salePrice)
                                   : discountedPrice !== null 
                                     ? formatPrice(discountedPrice)
                                     : course?.use_dollar_price && finalRialPrice 
                                       ? TetherlandService.formatIRRAmount(finalRialPrice) + ' تومان'
                                       : formatPrice(course?.price || 0)
                             }
                          </>
                        )}
                     </Button>
                   )}
                 </form>

                 {/* Security Note */}
                 <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                   <div className="flex items-center gap-2 mb-2">
                     <Shield className="h-5 w-5 text-primary" />
                     <span className="font-medium text-primary">پرداخت امن</span>
                   </div>
                   <p className="text-sm text-muted-foreground">
                     تمامی پرداخت‌ها از طریق درگاه‌های امن و معتبر انجام می‌شود. اطلاعات شما محفوظ است.
                   </p>
                 </div>

                 {/* Enrollment Countdown */}
                 <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                   <div className="flex items-center justify-center">
                     <EnrollmentCountdown 
                       onTimeUp={() => {
                         toast({
                           title: "⏰ زمان ثبت‌نام به پایان رسید",
                           description: "لطفا صفحه را بروزرسانی کنید و مجددا تلاش کنید",
                           variant: "destructive"
                         });
                       }}
                     />
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Enroll;