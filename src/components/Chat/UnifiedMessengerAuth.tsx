
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Phone, User, Lock, AtSign, AlertCircle, Check, Loader2 } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';
import { detectCountryCode, formatPhoneWithCountryCode, getCountryCodeOptions } from '@/lib/countryCodeUtils';

interface UnifiedMessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: MessengerUser) => void;
}

type AuthStep = 'phone' | 'password' | 'name' | 'username' | 'pending';

const UnifiedMessengerAuth: React.FC<UnifiedMessengerAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+98');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isBoundlessStudent, setIsBoundlessStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [existingUser, setExistingUser] = useState<MessengerUser | null>(null);
  const [isLogin, setIsLogin] = useState(false);

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
    setUsername(lowerValue);
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
    
    if (!phoneNumber.trim()) {
      toast({
        title: 'خطا',
        description: 'شماره تلفن را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Format phone with country code
      const formattedPhone = countryCode + phoneNumber;
      
      // Check if user exists
      const user = await messengerService.getUserByPhone(formattedPhone);
      if (user) {
        setExistingUser(user);
        setIsLogin(true);
        setCurrentStep('password');
      } else {
        setIsLogin(false);
        setCurrentStep('password');
      }
    } catch (error) {
      console.error('Error checking phone:', error);
      // If error, assume new user
      setIsLogin(false);
      setCurrentStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: 'خطا',
        description: 'رمز عبور را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    if (isLogin) {
      // Login flow
      setLoading(true);
      try {
        const formattedPhone = countryCode + phoneNumber;
        const result = await messengerService.authenticateUser(formattedPhone, password);
        if (result && existingUser) {
          if (!existingUser.is_approved) {
            setCurrentStep('pending');
            return;
          }
          onAuthenticated(result.session_token, existingUser.name, existingUser);
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
    } else {
      // Continue to name step for registration
      setCurrentStep('name');
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    setCurrentStep('username');
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: 'خطا',
        description: 'نام کاربری را وارد کنید',
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
      // Format phone with country code
      const formattedPhone = countryCode + phoneNumber;
      
      // Register user
      const result = await messengerService.registerWithPassword({
        name: name.trim(),
        phone: formattedPhone,
        username: username,
        password: password,
        isBoundlessStudent: isBoundlessStudent
      });

      // Check if user needs approval
      if (!result.user.is_approved) {
        setCurrentStep('pending');
        return;
      }

      // User is auto-approved, proceed to login
      onAuthenticated(result.session_token, result.user.name, result.user);
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
      const formattedPhone = countryCode + phoneNumber;
      const user = await messengerService.getUserByPhone(formattedPhone);
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 'phone': return 'ورود به پیام‌رسان';
      case 'password': return isLogin ? 'ورود' : 'ایجاد رمز عبور';
      case 'name': return 'نام شما';
      case 'username': return 'انتخاب نام کاربری';
      case 'pending': return 'در انتظار تایید';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'phone': return 'شماره تلفن خود را وارد کنید';
      case 'password': return isLogin ? 'رمز عبور خود را وارد کنید' : 'رمز عبور خود را انتخاب کنید';
      case 'name': return 'نام کامل خود را وارد کنید';
      case 'username': return 'یک نام کاربری منحصر به فرد انتخاب کنید';
      case 'pending': return 'حساب شما ثبت شد و در انتظار تایید مدیریت است';
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
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
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
          <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  شماره تلفن
                </Label>
                <div className="flex" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-32 rounded-l-none border-l-0">
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
                    value={phoneNumber}
                    onChange={(e) => {
                      let cleanValue = e.target.value.replace(/[^0-9]/g, '');
                      // Remove leading zeros and plus signs
                      cleanValue = cleanValue.replace(/^[0+]+/, '');
                      setPhoneNumber(cleanValue);
                    }}
                    placeholder="9123456789"
                    required
                    dir="ltr"
                    className="flex-1 rounded-r-none"
                  />
                </div>
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

          {currentStep === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {isLogin && existingUser && (
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    ورود برای: <span className="font-medium">{existingUser.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{phoneNumber}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  رمز عبور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "رمز عبور خود را وارد کنید" : "رمز عبور خود را انتخاب کنید"}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isLogin ? 'در حال ورود...' : 'ادامه'}
                    </>
                  ) : (
                    isLogin ? 'ورود' : 'ادامه'
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

          {currentStep === 'name' && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  نام و نام خانوادگی
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام کامل خود را وارد کنید"
                  required
                  dir="rtl"
                />
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="boundless"
                  checked={isBoundlessStudent}
                  onCheckedChange={(checked) => setIsBoundlessStudent(checked as boolean)}
                />
                <Label htmlFor="boundless" className="text-sm">
                  من دانشجوی دوره بدون مرز هستم
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">ادامه</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('password')}
                >
                  برگشت
                </Button>
              </div>
            </form>
          )}

          {currentStep === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <AtSign className="w-4 h-4" />
                  نام کاربری منحصر به فرد
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={username}
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
                <p className="text-xs text-muted-foreground">
                  دیگران می‌توانند با نام کاربری شما پیدا کنند
                </p>
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
                    'تکمیل ثبت نام'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('name')}
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
