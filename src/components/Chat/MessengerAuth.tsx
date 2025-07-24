import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, User, Phone, AtSign, Check, ArrowRight } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { detectCountryCode, formatPhoneWithCountryCode, getCountryCodeOptions } from '@/lib/countryCodeUtils';

interface MessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: MessengerUser) => void;
}

type AuthStep = 'phone' | 'check-user' | 'login' | 'login-otp' | 'otp' | 'password' | 'user-info' | 'complete' | 'forgot-password' | 'forgot-otp' | 'reset-password';

const MessengerAuth: React.FC<MessengerAuthProps> = ({ onAuthenticated }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: '+98',
    email: '',
    username: '',
    password: '',
    isBoundlessStudent: false
  });
  
  const [otpCode, setOtpCode] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [existingUser, setExistingUser] = useState<MessengerUser | null>(null);
  
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');

  // Format phone number for API call
  const formatPhoneForAPI = (phone: string, countryCode: string) => {
    if (countryCode === '+98') {
      return `${countryCode}${phone}`;
    } else {
      return `00${countryCode.slice(1)}${phone}`;
    }
  };

  const validateUsername = (value: string) => {
    const regex = /^[a-z0-9_]{3,20}$/;
    if (!value) return '';
    if (!regex.test(value)) {
      return 'نام کاربری باید بین ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی کوچک، اعداد و _ باشد';
    }
    return '';
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameAvailable(false);
      return;
    }

    setUsernameChecking(true);
    setUsernameError('');
    
    try {
      const isAvailable = await privateMessageService.checkUsernameAvailability(username);
      setUsernameAvailable(isAvailable);
      if (!isAvailable) {
        setUsernameError('این نام کاربری قبلاً انتخاب شده است');
      }
    } catch (error) {
      setUsernameError('خطا در بررسی نام کاربری');
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const lowerValue = value.toLowerCase();
    setFormData(prev => ({ ...prev, username: lowerValue }));
    setUsernameAvailable(null);
    setUsernameError('');

    if (lowerValue.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(lowerValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone.trim()) {
      toast.error('خطا', {
        description: 'لطفاً شماره تلفن را وارد کنید'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Check if user already exists
      const formattedPhone = formatPhoneForAPI(formData.phone, formData.countryCode);
      console.log('Checking if user exists for phone:', formattedPhone);
      console.log('Original phone input:', formData.phone, 'Country code:', formData.countryCode);
      const userExists = await messengerService.getUserByPhone(formattedPhone);
      
      setFormattedPhoneNumber(formattedPhone);
      
      if (userExists) {
        setExistingUser(userExists);
        setCurrentStep('login');
      } else {
        // Send OTP for new user
        console.log('Sending OTP to:', formData.phone, 'with country code:', formData.countryCode);
        const { data, error } = await supabase.functions.invoke('send-otp', {
          body: {
            phone: formData.phone,
            countryCode: formData.countryCode
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }

        console.log('OTP Response:', data);
        if (data.success) {
          setFormattedPhoneNumber(data.formattedPhone);
          setCurrentStep('otp');
          toast.success('کد تأیید ارسال شد', {
            description: 'کد ۴ رقمی به شماره شما ارسال شد'
          });
        } else {
          throw new Error(data.error || 'خطا در ارسال کد تأیید');
        }
      }
    } catch (error: any) {
      console.error('Error in phone submit:', error);
      toast.error('خطا', {
        description: error.message || 'لطفاً دوباره تلاش کنید'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password.trim()) {
      toast.error('خطا', {
        description: 'لطفاً رمز عبور را وارد کنید'
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await messengerService.loginWithPassword(
        formattedPhoneNumber,
        formData.password
      );

      console.log('Login result:', result);

      if (result.error) {
        console.log('Login failed, showing error toast');
        toast.error('خطا در ورود', {
          description: 'رمز عبور اشتباه است'
        });
        return;
      }

      onAuthenticated(result.session_token || 'default_session', result.user?.name || '', result.user!);
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('خطا در ورود', {
        description: error.message || 'رمز عبور اشتباه است'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginByOTP = async () => {
    setOtpSending(true);
    
    try {
      console.log('Sending OTP for login to:', formattedPhoneNumber);
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          phone: formData.phone,
          countryCode: formData.countryCode
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('OTP Response for login:', data);
      if (data.success) {
        setCurrentStep('login-otp');
        toast.success('کد تأیید ارسال شد', {
          description: 'کد ۴ رقمی برای ورود به شماره شما ارسال شد'
        });
      } else {
        throw new Error(data.error || 'خطا در ارسال کد تأیید');
      }
    } catch (error: any) {
      console.error('Error sending OTP for login:', error);
      toast.error('خطا', {
        description: error.message || 'خطا در ارسال کد تأیید'
      });
    } finally {
      setOtpSending(false);
    }
  };

  const verifyLoginOTP = async (code: string) => {
    if (code.length !== 4) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone: formattedPhoneNumber,
          otpCode: code
        }
      });

      console.log('Login OTP verification response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data && data.success) {
        // OTP verified, log in the user
        if (existingUser) {
          const sessionToken = await messengerService.createSession(existingUser.id);
          onAuthenticated(sessionToken, existingUser.name, existingUser);
        }
      } else {
        console.log('Login OTP verification failed, showing error toast');
        toast.error('کد اشتباه است', {
          description: 'کد وارد شده صحیح نیست. لطفاً دوباره تلاش کنید'
        });
        setOtpCode('');
        return;
      }
    } catch (error: any) {
      console.error('Error verifying login OTP:', error);
      toast.error('خطا در تأیید کد', {
        description: error.message || 'کد وارد شده اشتباه است'
      });
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (code: string) => {
    if (code.length !== 4) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone: formattedPhoneNumber,
          otpCode: code
        }
      });

      console.log('OTP verification response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data && data.success) {
        setCurrentStep('password');
        toast.success('کد تأیید شد', {
          description: 'اکنون رمز عبور خود را تعیین کنید'
        });
      } else {
        console.log('OTP verification failed, showing error toast');
        toast.error('کد اشتباه است', {
          description: 'کد وارد شده صحیح نیست. لطفاً دوباره تلاش کنید'
        });
        setOtpCode('');
        return;
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error('خطا در تأیید کد', {
        description: error.message || 'کد وارد شده اشتباه است'
      });
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify OTP when 4 digits are entered
  useEffect(() => {
    if (otpCode.length === 4 && currentStep === 'otp') {
      verifyOTP(otpCode);
    } else if (otpCode.length === 4 && currentStep === 'login-otp') {
      verifyLoginOTP(otpCode);
    } else if (otpCode.length === 4 && currentStep === 'forgot-otp') {
      verifyForgotPasswordOTP(otpCode);
    }
  }, [otpCode, currentStep]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password.trim() || formData.password.length < 6) {
      toast.error('خطا', {
        description: 'رمز عبور باید حداقل ۶ کاراکتر باشد'
      });
      return;
    }

    setCurrentStep('user-info');
  };

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('خطا', {
        description: 'لطفاً نام و نام خانوادگی را وارد کنید'
      });
      return;
    }

    if (!formData.email.trim()) {
      toast.error('خطا', {
        description: 'لطفاً ایمیل را وارد کنید'
      });
      return;
    }

    if (!formData.username || !usernameAvailable) {
      toast.error('خطا', {
        description: 'لطفاً نام کاربری معتبری انتخاب کنید'
      });
      return;
    }

    setLoading(true);
    
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      
      // Register user with the formatted phone number
      const result = await messengerService.registerWithPassword({
        name: fullName,
        phone: formattedPhoneNumber,
        countryCode: '+98',
        password: formData.password,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      if (result.error) {
        throw new Error(result.error.message || 'خطا در ثبت نام');
      }

      // Update username since it's now required
      if (result.user) {
        await privateMessageService.updateUsername(result.user.id, formData.username);
        result.user.username = formData.username;
      }

      setCurrentStep('complete');
      
      setTimeout(() => {
        onAuthenticated(result.session_token || 'default_session', result.user?.name || '', result.user!);
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('خطا در ثبت نام', {
        description: error.message || 'لطفاً دوباره تلاش کنید'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'login' || currentStep === 'login-otp') {
      setCurrentStep('phone');
      setExistingUser(null);
      setFormData(prev => ({ ...prev, password: '' }));
      setOtpCode('');
    } else if (currentStep === 'otp') {
      setCurrentStep('phone');
      setOtpCode('');
    } else if (currentStep === 'password') {
      setCurrentStep('otp');
      setOtpCode('');
    } else if (currentStep === 'user-info') {
      setCurrentStep('password');
    } else if (currentStep === 'forgot-password' || currentStep === 'forgot-otp') {
      setCurrentStep('login');
      setOtpCode('');
    } else if (currentStep === 'reset-password') {
      setCurrentStep('forgot-otp');
    }
  };

  const handleForgotPassword = async () => {
    setOtpSending(true);
    
    try {
      console.log('Sending forgot password OTP to:', formattedPhoneNumber);
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          phone: formData.phone,
          countryCode: formData.countryCode
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Forgot password OTP Response:', data);
      if (data.success) {
        setCurrentStep('forgot-otp');
        toast.success('کد بازیابی ارسال شد', {
          description: 'کد ۴ رقمی برای بازیابی رمز عبور به شماره شما ارسال شد'
        });
      } else {
        throw new Error(data.error || 'خطا در ارسال کد بازیابی');
      }
    } catch (error: any) {
      console.error('Error sending forgot password OTP:', error);
      toast.error('خطا', {
        description: error.message || 'خطا در ارسال کد بازیابی'
      });
    } finally {
      setOtpSending(false);
    }
  };

  const verifyForgotPasswordOTP = async (code: string) => {
    if (code.length !== 4) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone: formattedPhoneNumber,
          otpCode: code
        }
      });

      console.log('Forgot password OTP verification response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data && data.success) {
        setCurrentStep('reset-password');
        toast.success('کد تأیید شد', {
          description: 'رمز عبور جدید خود را وارد کنید'
        });
        setOtpCode('');
      } else {
        console.log('Forgot password OTP verification failed, showing error toast');
        toast.error('کد اشتباه است', {
          description: 'کد وارد شده صحیح نیست. لطفاً دوباره تلاش کنید'
        });
        setOtpCode('');
        return;
      }
    } catch (error: any) {
      console.error('Error verifying forgot password OTP:', error);
      toast.error('خطا در تأیید کد', {
        description: error.message || 'کد وارد شده اشتباه است'
      });
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password.trim() || formData.password.length < 6) {
      toast.error('خطا', {
        description: 'رمز عبور باید حداقل ۶ کاراکتر باشد'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Update password for existing user
      if (existingUser) {
        const updateResult = await messengerService.updateUserPassword(existingUser.id, formData.password);
        
        if (updateResult.error) {
          throw new Error(updateResult.error.message || 'خطا در تغییر رمز عبور');
        }

        // Login with new password
        const loginResult = await messengerService.loginWithPassword(
          formattedPhoneNumber,
          formData.password
        );

        if (loginResult.error) {
          throw new Error('خطا در ورود با رمز عبور جدید');
        }

        toast.success('رمز عبور تغییر یافت', {
          description: 'با موفقیت وارد شدید'
        });
        
        onAuthenticated(loginResult.session_token || 'default_session', loginResult.user?.name || '', loginResult.user!);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error('خطا در تغییر رمز عبور', {
        description: error.message || 'لطفاً دوباره تلاش کنید'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex border-0 border-b border-border" dir="ltr">
                <Select value={formData.countryCode} onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}>
                  <SelectTrigger className="w-20 border-0 rounded-none bg-transparent focus:ring-0 px-0">
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
                    let cleanValue = e.target.value.replace(/[^0-9]/g, '');
                    cleanValue = cleanValue.replace(/^[0+]+/, '');
                    setFormData(prev => ({ ...prev, phone: cleanValue }));
                  }}
                  placeholder="9123456789"
                  required
                  dir="ltr"
                  className="flex-1 h-12 border-0 rounded-none bg-transparent px-2 focus-visible:ring-0 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
              disabled={loading}
            >
              {loading ? 'در حال بررسی...' : 'ادامه'}
            </Button>
          </form>
        );

      case 'login':
        return (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <p className="text-lg font-medium text-foreground">
                خوش آمدید {existingUser?.name}!
              </p>
              <p className="text-sm text-muted-foreground">
                برای ادامه رمز عبور خود را وارد کنید
              </p>
              <p className="font-mono text-primary text-sm mt-2" dir="ltr">{formattedPhoneNumber}</p>
            </div>

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="رمز عبور"
                required
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1 h-12 rounded-full"
                  disabled={loading}
                >
                  بازگشت
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                  disabled={loading}
                >
                  {loading ? 'در حال ورود...' : 'ورود'}
                </Button>
              </div>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleLoginByOTP}
                className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
                disabled={otpSending}
              >
                {otpSending ? 'در حال ارسال کد...' : 'ورود با کد یکبار مصرف'}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleForgotPassword}
                className="w-full h-10 text-sm text-red-600 hover:text-red-700"
                disabled={otpSending}
              >
                فراموشی رمز عبور
              </Button>
            </div>
          </form>
        );

      case 'otp':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                کد ۴ رقمی ارسال شده به شماره زیر را وارد کنید:
              </p>
              <p className="font-mono text-primary" dir="ltr">{formattedPhoneNumber}</p>
            </div>

            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={4}
                value={otpCode}
                onChange={setOtpCode}
                disabled={loading}
                className="gap-4"
              >
                <InputOTPGroup className="gap-4">
                  <InputOTPSlot 
                    index={0} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1 h-12 rounded-full"
                disabled={loading}
              >
                بازگشت
              </Button>
              <Button 
                type="button" 
                onClick={() => verifyOTP(otpCode)}
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading || otpCode.length !== 4}
              >
                {loading ? 'در حال تأیید...' : 'تأیید کد'}
              </Button>
            </div>
          </div>
         );

      case 'login-otp':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">
                خوش آمدید {existingUser?.name}!
              </p>
              <p className="text-sm text-muted-foreground">
                کد ۴ رقمی ارسال شده به شماره زیر را وارد کنید:
              </p>
              <p className="font-mono text-primary text-sm" dir="ltr">{formattedPhoneNumber}</p>
            </div>

            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={4}
                value={otpCode}
                onChange={setOtpCode}
                disabled={loading}
                className="gap-4"
              >
                <InputOTPGroup className="gap-4">
                  <InputOTPSlot 
                    index={0} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1 h-12 rounded-full"
                disabled={loading}
              >
                بازگشت
              </Button>
              <Button 
                type="button" 
                onClick={() => verifyLoginOTP(otpCode)}
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading || otpCode.length !== 4}
              >
                {loading ? 'در حال تأیید...' : 'تأیید کد'}
              </Button>
            </div>
          </div>
        );

      case 'password':
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                required
                minLength={6}
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1 h-12 rounded-full"
                disabled={loading}
              >
                بازگشت
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading}
              >
                {loading ? 'در حال پردازش...' : 'ادامه'}
              </Button>
            </div>
          </form>
        );

      case 'user-info':
        return (
          <form onSubmit={handleUserInfoSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="نام"
                required
                dir="rtl"
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
              
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="نام خانوادگی"
                required
                dir="rtl"
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
              
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ایمیل"
                required
                dir="ltr"
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="نام کاربری"
                  required
                  className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 pl-8 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                  dir="ltr"
                />
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  {usernameChecking ? (
                    <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                  ) : usernameAvailable === true ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>


            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1 h-12 rounded-full"
                disabled={loading}
              >
                بازگشت
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading || !usernameAvailable}
              >
                {loading ? 'در حال ثبت نام...' : 'تکمیل ثبت نام'}
              </Button>
            </div>
          </form>
        );

      case 'complete':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground">ثبت نام با موفقیت انجام شد!</h3>
            <p className="text-sm text-muted-foreground">در حال انتقال به پیام‌رسان...</p>
          </div>
        );

      case 'forgot-otp':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                کد بازیابی ۴ رقمی ارسال شده به شماره زیر را وارد کنید:
              </p>
              <p className="font-mono text-primary" dir="ltr">{formattedPhoneNumber}</p>
            </div>

            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={4}
                value={otpCode}
                onChange={setOtpCode}
                disabled={loading}
                className="gap-4"
              >
                <InputOTPGroup className="gap-4">
                  <InputOTPSlot 
                    index={0} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1 h-12 rounded-full"
                disabled={loading}
              >
                بازگشت
              </Button>
              <Button 
                type="button" 
                onClick={() => verifyForgotPasswordOTP(otpCode)}
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading || otpCode.length !== 4}
              >
                {loading ? 'در حال تأیید...' : 'تأیید کد'}
              </Button>
            </div>
          </div>
        );

      case 'reset-password':
        return (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <p className="text-lg font-medium text-foreground">
                رمز عبور جدید
              </p>
              <p className="text-sm text-muted-foreground">
                رمز عبور جدید خود را وارد کنید
              </p>
              <p className="font-mono text-primary text-sm mt-2" dir="ltr">{formattedPhoneNumber}</p>
            </div>

            <div className="space-y-2">
              <Input
                id="newPassword"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
                required
                minLength={6}
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1 h-12 rounded-full"
                disabled={loading}
              >
                بازگشت
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading}
              >
                {loading ? 'در حال تنظیم...' : 'تنظیم رمز عبور'}
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'phone': return 'شماره تلفن خود را وارد کنید';
      case 'login': return 'رمز عبور خود را وارد کنید';
      case 'login-otp': return 'کد تأیید را وارد کنید';
      case 'otp': return 'کد تأیید را وارد کنید';
      case 'password': return 'رمز عبور خود را تعیین کنید';
      case 'user-info': return 'اطلاعات خود را تکمیل کنید';
      case 'complete': return 'ثبت نام تکمیل شد';
      case 'forgot-otp': return 'کد بازیابی را وارد کنید';
      case 'reset-password': return 'رمز عبور جدید را تعیین کنید';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-none bg-background">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-normal text-foreground">پیام‌رسان بدون مرز</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {getStepTitle()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessengerAuth;