
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { rafieiAuth, RafieiUser } from '@/lib/rafieiAuth';
import { toast } from 'sonner';
import { farsiToEnglishNumbers } from '@/utils/farsiUtils';

interface RafieiAuthProps {
  onSuccess?: (user: RafieiUser, token: string) => void;
  onCancel?: () => void;
  enrollmentMode?: boolean;
  redirectAfterAuth?: string;
}

type AuthFlow = 'initial' | 'login' | 'register' | 'otp';

interface AuthState {
  flow: AuthFlow;
  identifier: string;
  identifierType: 'email' | 'phone';
  existingUser?: RafieiUser;
  registrationData: {
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    password: string;
  };
}

const RafieiAuth: React.FC<RafieiAuthProps> = ({
  onSuccess,
  onCancel,
  enrollmentMode = false,
  redirectAfterAuth
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    flow: 'initial',
    identifier: '',
    identifierType: 'email',
    registrationData: {
      firstName: '',
      lastName: '',
      password: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  // Check initial identifier and determine flow
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.identifier.trim()) return;

    setLoading(true);
    try {
      const result = await rafieiAuth.checkUserExists(authState.identifier);
      
      if (result.exists && result.user) {
        // User exists - go to login
        setAuthState(prev => ({
          ...prev,
          flow: 'login',
          identifierType: result.type,
          existingUser: result.user
        }));
      } else {
        // New user - go to registration
        const identifierType = rafieiAuth.detectInputType(authState.identifier);
        setAuthState(prev => ({
          ...prev,
          flow: 'register',
          identifierType,
          registrationData: {
            ...prev.registrationData,
            [identifierType]: authState.identifier
          }
        }));
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('خطا در بررسی کاربر');
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      const result = await rafieiAuth.loginUser(authState.identifier, password);
      rafieiAuth.setSession(result.session_token, result.user);
      
      toast.success('با موفقیت وارد شدید');
      onSuccess?.(result.user, result.session_token);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP login
  const handleOTPLogin = async () => {
    setLoading(true);
    try {
      if (authState.identifierType === 'email') {
        await rafieiAuth.sendEmailOTP(authState.identifier);
        toast.success('لینک ورود به ایمیل شما ارسال شد');
      } else {
        await rafieiAuth.sendSMSOTP(authState.identifier);
        toast.success('کد تأیید به شماره همراه شما ارسال شد');
      }
      
      setAuthState(prev => ({ ...prev, flow: 'otp' }));
    } catch (error: any) {
      console.error('OTP error:', error);
      toast.error(error.message || 'خطا در ارسال کد تأیید');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { registrationData } = authState;
    if (!registrationData.firstName || !registrationData.lastName || !registrationData.password) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    // Validate email format if provided
    if (registrationData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registrationData.email)) {
        toast.error('لطفاً ایمیل معتبری وارد کنید');
        return;
      }
    }

    // Validate phone for Iranian numbers if country detection is needed
    if (registrationData.phone) {
      try {
        const isIranian = await rafieiAuth.isIranianPhone(registrationData.phone);
        if (!isIranian) {
          const countryCode = await rafieiAuth.detectCountryCode(registrationData.phone);
          if (countryCode !== '+98') {
            toast.error('در حال حاضر فقط شماره‌های ایرانی پشتیبانی می‌شوند');
            return;
          }
        }
      } catch (error) {
        console.error('Phone validation error:', error);
      }
    }

    setLoading(true);
    try {
      const result = await rafieiAuth.registerUser({
        email: registrationData.email,
        phone: registrationData.phone || authState.identifier,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        password: registrationData.password,
        signupSource: enrollmentMode ? 'course_enrollment' : 'website'
      });
      
      rafieiAuth.setSession(result.session_token, result.user);
      
      toast.success('حساب کاربری شما با موفقیت ایجاد شد');
      onSuccess?.(result.user, result.session_token);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message?.includes('ایمیل قبلاً استفاده شده')) {
        toast.error('این ایمیل قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید');
      } else {
        toast.error(error.message || 'خطا در ثبت‌نام');
      }
    } finally {
      setLoading(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (authState.flow === 'login' || authState.flow === 'register') {
      setAuthState(prev => ({ ...prev, flow: 'initial' }));
      setPassword('');
    } else if (authState.flow === 'otp') {
      setAuthState(prev => ({ ...prev, flow: 'login' }));
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {enrollmentMode ? 'ثبت‌نام در دوره' : 'ورود به آکادمی رفیعی'}
          </CardTitle>
          <CardDescription>
            {authState.flow === 'initial' && 'ایمیل یا شماره همراه خود را وارد کنید'}
            {authState.flow === 'login' && 'رمز عبور خود را وارد کنید'}
            {authState.flow === 'register' && 'اطلاعات خود را تکمیل کنید'}
            {authState.flow === 'otp' && 'کد تأیید ارسال شد'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {/* Initial Entry Step */}
            {authState.flow === 'initial' && (
              <motion.form
                key="initial"
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                onSubmit={handleInitialSubmit}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="identifier">ایمیل یا شماره موبایل</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="example@email.com یا 09123456789"
                    value={authState.identifier}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Convert Farsi numbers to English for phone inputs
                      const convertedValue = value.includes('@') ? value : farsiToEnglishNumbers(value);
                      setAuthState(prev => ({ ...prev, identifier: convertedValue }));
                    }}
                    required
                    className="text-right"
                    dir="ltr"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  ادامه
                </Button>
                
                {onCancel && (
                  <Button type="button" variant="ghost" onClick={onCancel} className="w-full">
                    انصراف
                  </Button>
                )}
              </motion.form>
            )}

            {/* Login Step */}
            {authState.flow === 'login' && (
              <motion.div
                key="login"
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                className="space-y-4"
              >
                <div className="text-sm text-gray-600 mb-4">
                  ورود برای: <span className="font-medium">{authState.identifier}</span>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-right"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    ورود
                  </Button>
                </form>
                
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={handleOTPLogin}
                    disabled={loading}
                    className="text-sm"
                  >
                    ورود بدون رمز عبور (کد تأیید)
                  </Button>
                </div>
                
                <Button type="button" variant="ghost" onClick={goBack} className="w-full">
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  بازگشت
                </Button>
              </motion.div>
            )}

            {/* Registration Step */}
            {authState.flow === 'register' && (
              <motion.div
                key="register"
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                className="space-y-4"
              >
                <form onSubmit={handleRegistration} className="space-y-4">
                  {/* Show secondary field (email if phone was entered first, vice versa) */}
                  {authState.identifierType === 'phone' && (
                    <div>
                      <Label htmlFor="email">ایمیل</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={authState.registrationData.email || ''}
                        onChange={(e) => setAuthState(prev => ({
                          ...prev,
                          registrationData: { ...prev.registrationData, email: e.target.value }
                        }))}
                        className="text-right"
                        dir="ltr"
                      />
                    </div>
                  )}
                  
                  {authState.identifierType === 'email' && (
                    <div>
                      <Label htmlFor="phone">شماره موبایل</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="09123456789"
                        value={authState.registrationData.phone || ''}
                        onChange={(e) => {
                          const convertedValue = farsiToEnglishNumbers(e.target.value);
                          setAuthState(prev => ({
                            ...prev,
                            registrationData: { ...prev.registrationData, phone: convertedValue }
                          }));
                        }}
                        required
                        className="text-right"
                        dir="ltr"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">نام</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={authState.registrationData.firstName}
                        onChange={(e) => setAuthState(prev => ({
                          ...prev,
                          registrationData: { ...prev.registrationData, firstName: e.target.value }
                        }))}
                        required
                        className="text-right"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">نام خانوادگی</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={authState.registrationData.lastName}
                        onChange={(e) => setAuthState(prev => ({
                          ...prev,
                          registrationData: { ...prev.registrationData, lastName: e.target.value }
                        }))}
                        required
                        className="text-right"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="regPassword">رمز عبور</Label>
                    <Input
                      id="regPassword"
                      type="password"
                      value={authState.registrationData.password}
                      onChange={(e) => setAuthState(prev => ({
                        ...prev,
                        registrationData: { ...prev.registrationData, password: e.target.value }
                      }))}
                      required
                      className="text-right"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    ثبت‌نام
                  </Button>
                </form>
                
                <Button type="button" variant="ghost" onClick={goBack} className="w-full">
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  بازگشت
                </Button>
              </motion.div>
            )}

            {/* OTP Verification Step */}
            {authState.flow === 'otp' && (
              <motion.div
                key="otp"
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                className="space-y-4 text-center"
              >
                <div className="text-sm text-gray-600">
                  {authState.identifierType === 'email' 
                    ? 'لینک ورود به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.'
                    : 'کد تأیید به شماره همراه شما ارسال شد.'
                  }
                </div>
                
                <Button type="button" variant="ghost" onClick={goBack} className="w-full">
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  بازگشت
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default RafieiAuth;
