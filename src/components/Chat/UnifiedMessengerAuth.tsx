
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
      // Check if user exists with separate country code and phone
      const user = await messengerService.getUserByPhone(phoneNumber, countryCode);
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
        const result = await messengerService.authenticateUser(phoneNumber, password, countryCode);
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
      // Register user with separate country code
      const result = await messengerService.registerWithPassword({
        name: name.trim(),
        phone: phoneNumber,
        countryCode: countryCode,
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
      const user = await messengerService.getUserByPhone(phoneNumber, countryCode);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-none bg-background">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-normal text-foreground">{getStepTitle()}</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={checkApprovalStatus}
              disabled={loading}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal"
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
              variant="ghost" 
              onClick={() => setCurrentStep('phone')}
              className="w-full h-12 rounded-full text-muted-foreground"
            >
              برگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-none bg-background">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-normal text-foreground">{getStepTitle()}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex border-0 border-b border-border" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
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
                    value={phoneNumber}
                    onChange={(e) => {
                      let cleanValue = e.target.value.replace(/[^0-9]/g, '');
                      // Remove leading zeros and plus signs
                      cleanValue = cleanValue.replace(/^[0+]+/, '');
                      setPhoneNumber(cleanValue);
                    }}
                    placeholder="شماره تلفن"
                    required
                    dir="ltr"
                    className="flex-1 h-12 border-0 rounded-none bg-transparent px-2 focus-visible:ring-0 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal mt-8" disabled={loading}>
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
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {isLogin && existingUser && (
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground">
                    ورود برای: <span className="font-medium text-foreground">{existingUser.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{countryCode}{phoneNumber}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "رمز عبور" : "رمز عبور جدید"}
                  required
                  className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                />
              </div>
              
              <div className="flex gap-3 mt-8">
                <Button type="submit" className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" disabled={loading}>
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
                  variant="ghost" 
                  onClick={() => setCurrentStep('phone')}
                  className="px-4 h-12 rounded-full text-muted-foreground"
                >
                  برگشت
                </Button>
              </div>
            </form>
          )}

          {currentStep === 'name' && (
            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  required
                  dir="rtl"
                  className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                />
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse pt-4">
                <Checkbox
                  id="boundless"
                  checked={isBoundlessStudent}
                  onCheckedChange={(checked) => setIsBoundlessStudent(checked as boolean)}
                />
                <Label htmlFor="boundless" className="text-sm text-muted-foreground">
                  من دانشجوی دوره بدون مرز هستم
                </Label>
              </div>

              <div className="flex gap-3 mt-8">
                <Button type="submit" className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal">ادامه</Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setCurrentStep('password')}
                  className="px-4 h-12 rounded-full text-muted-foreground"
                >
                  برگشت
                </Button>
              </div>
            </form>
          )}

          {currentStep === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="نام کاربری"
                    className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 pl-8 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                    dir="ltr"
                    required
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
                <p className="text-xs text-muted-foreground">
                  نام کاربری منحصر به فرد است و دیگران می‌توانند با آن شما را پیدا کنند
                </p>
              </div>

              <div className="flex gap-3 mt-8">
                <Button 
                  type="submit" 
                  className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
                  disabled={loading || (username && !usernameAvailable)}
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
                  variant="ghost" 
                  onClick={() => setCurrentStep('name')}
                  className="px-4 h-12 rounded-full text-muted-foreground"
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
