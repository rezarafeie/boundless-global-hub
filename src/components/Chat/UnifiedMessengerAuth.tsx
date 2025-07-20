// @ts-nocheck

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Phone, User, Lock, AtSign, AlertCircle, Check, Loader2 } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { detectCountryCode, formatPhoneWithCountryCode, getCountryCodeOptions } from '@/lib/countryCodeUtils';

interface UnifiedMessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: MessengerUser) => void;
  prefillData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

type AuthStep = 'phone' | 'password' | 'name' | 'username' | 'pending';

const UnifiedMessengerAuth: React.FC<UnifiedMessengerAuthProps> = ({ onAuthenticated, prefillData }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+98');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(prefillData?.firstName || '');
  const [lastName, setLastName] = useState(prefillData?.lastName || '');
  const [email, setEmail] = useState(prefillData?.email || '');
  const [username, setUsername] = useState('');
  const [isBoundlessStudent, setIsBoundlessStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [existingUser, setExistingUser] = useState<MessengerUser | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: 'خطا',
        description: 'نام و نام خانوادگی را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'خطا',
        description: 'ایمیل را وارد کنید',
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
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phoneNumber,
        countryCode: countryCode,
        username: username,
        password: password,
        email: email.trim(),
        isBoundlessStudent: isBoundlessStudent,
        firstName: firstName.trim(),
        lastName: lastName.trim()
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('🔐 Starting Google authentication...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        toast({
          title: "خطا در ورود",
          description: "خطا در ورود با Google. لطفا دوباره تلاش کنید.",
          variant: "destructive"
        });
      } else {
        console.log('✅ Google auth initiated successfully');
        // The redirect will handle the rest
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        title: "خطا در ورود",
        description: "خطا در ورود با Google. لطفا دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'phone': return 'ورود به آکادمی رفیعی';
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
      case 'name': return 'نام و نام خانوادگی خود را وارد کنید';
      case 'username': return 'یک نام کاربری منحصر به فرد انتخاب کنید';
      case 'pending': return 'حساب شما ثبت شد و در انتظار تایید مدیریت است';
    }
  };

  if (currentStep === 'pending') {
    return (
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
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none bg-background">
      <CardHeader className="text-center pb-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
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
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">یا</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="w-full h-12 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  ورود با Google
                </>
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="نام"
                    required
                    dir="rtl"
                    className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="نام خانوادگی"
                    required
                    dir="rtl"
                    className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ایمیل"
                  required
                  dir="ltr"
                  className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                />
              </div>
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
  );
};

export default UnifiedMessengerAuth;
