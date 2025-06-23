import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageCircle, Phone, User, Lock, AtSign, AlertCircle, Check, Loader2 } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';

interface UnifiedMessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: MessengerUser) => void;
}

type AuthStep = 'phone' | 'login' | 'signup' | 'pending';

const UnifiedMessengerAuth: React.FC<UnifiedMessengerAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    isBoundlessStudent: false
  });
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [existingUser, setExistingUser] = useState<MessengerUser | null>(null);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
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
    
    if (!validatePhone(phoneNumber)) {
      toast({
        title: 'خطا',
        description: 'شماره تلفن معتبر نیست. باید با ۰۹ شروع شده و ۱۱ رقم باشد',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user exists
      const user = await messengerService.getUserByPhone(phoneNumber);
      if (user) {
        setExistingUser(user);
        setCurrentStep('login');
      } else {
        setCurrentStep('signup');
      }
    } catch (error) {
      console.error('Error checking phone:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بررسی شماره تلفن',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً رمز عبور را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Authenticate user
      const result = await messengerService.authenticateUser(phoneNumber, formData.password);
      if (result && existingUser) {
        if (!existingUser.is_approved) {
          setCurrentStep('pending');
          return;
        }
        onAuthenticated(result.token, existingUser.name, existingUser);
      } else {
        toast({
          title: 'خطا',
          description: 'رمز عبور اشتباه است',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'خطا در ورود',
        description: error.message || 'رمز عبور اشتباه است',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    if (!usernameAvailable) {
      toast({
        title: 'خطا',
        description: 'نام کاربری انتخاب شده معتبر نیست',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Register user with password
      const result = await messengerService.registerWithPassword({
        name: formData.name.trim(),
        phone: phoneNumber,
        username: formData.username,
        password: formData.password,
        isBoundlessStudent: formData.isBoundlessStudent
      });

      // Check if user needs approval
      if (!result.user.is_approved) {
        setCurrentStep('pending');
        return;
      }

      // User is auto-approved, proceed to login
      onAuthenticated(result.token, result.user.name, result.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'خطا در ثبت نام',
        description: error.message || 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalStatus = async () => {
    setLoading(true);
    try {
      const user = await messengerService.getUserByPhone(phoneNumber);
      if (user && user.is_approved) {
        const session = await messengerService.createSession(user.id);
        onAuthenticated(session.session_token, user.name, user);
      } else {
        toast({
          title: 'هنوز تایید نشده',
          description: 'حساب شما هنوز توسط مدیریت تایید نشده است',
        });
      }
    } catch (error) {
      console.error('Error checking approval:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <CardTitle>در انتظار تایید</CardTitle>
            <CardDescription>
              حساب شما ثبت شد و در انتظار تایید مدیریت است
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkApprovalStatus}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                'بررسی وضعیت'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('phone')}
              className="w-full"
            >
              برگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MessageCircle className="w-12 h-12 text-blue-500" />
          </div>
          <CardTitle className="text-2xl">
            {currentStep === 'phone' && 'ورود به پیام‌رسان'}
            {currentStep === 'login' && 'ورود'}
            {currentStep === 'signup' && 'ثبت نام'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'phone' && 'شماره تلفن خود را وارد کنید'}
            {currentStep === 'login' && 'رمز عبور خود را وارد کنید'}
            {currentStep === 'signup' && 'اطلاعات خود را تکمیل کنید'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  شماره تلفن
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  required
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال بررسی...
                  </>
                ) : (
                  'ادامه'
                )}
              </Button>
            </form>
          )}

          {currentStep === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  ورود برای: <span className="font-medium">{existingUser?.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">{phoneNumber}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  رمز عبور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      در حال ورود...
                    </>
                  ) : (
                    'ورود'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('phone')}
                >
                  برگشت
                </Button>
              </div>
            </form>
          )}

          {currentStep === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground">{phoneNumber}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  نام و نام خانوادگی
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="نام کامل خود را وارد کنید"
                  required
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <AtSign className="w-4 h-4" />
                  نام کاربری
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="username"
                    className="pl-8"
                    dir="ltr"
                    required
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    {usernameChecking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : usernameAvailable === true ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-sm text-red-500">{usernameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  رمز عبور
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="boundless"
                  checked={formData.isBoundlessStudent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isBoundlessStudent: checked as boolean }))
                  }
                />
                <Label htmlFor="boundless" className="text-sm">
                  من دانشجوی دوره بدون مرز هستم
                </Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading || !usernameAvailable}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      در حال ثبت نام...
                    </>
                  ) : (
                    'ثبت نام'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('phone')}
                >
                  برگشت
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedMessengerAuth;
