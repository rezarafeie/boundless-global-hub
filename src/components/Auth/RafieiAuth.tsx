
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, User, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { rafieiAuth, type RafieiUser } from '@/lib/rafieiAuth';
import { toast } from 'sonner';

interface RafieiAuthProps {
  onSuccess: (user: RafieiUser, token: string) => void;
  onCancel?: () => void;
  enrollmentMode?: boolean;
}

type AuthStep = 'initial' | 'login' | 'register' | 'otp';

const RafieiAuth: React.FC<RafieiAuthProps> = ({
  onSuccess,
  onCancel,
  enrollmentMode = false
}) => {
  const [step, setStep] = useState<AuthStep>('initial');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const detectInputType = (input: string): 'email' | 'phone' => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input) ? 'email' : 'phone';
  };

  const handleInitialSubmit = async () => {
    if (!identifier.trim()) {
      setError('لطفاً ایمیل یا شماره موبایل خود را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await rafieiAuth.checkUserExists(identifier);
      
      if (result.exists) {
        setStep('login');
      } else {
        const inputType = detectInputType(identifier);
        if (inputType === 'email') {
          setUserData(prev => ({ ...prev, email: identifier }));
        } else {
          setUserData(prev => ({ ...prev, phone: identifier }));
        }
        setStep('register');
      }
    } catch (error: any) {
      setError(error.message || 'خطا در بررسی کاربر');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('لطفاً رمز عبور خود را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await rafieiAuth.loginUser(identifier, password);
      toast.success('با موفقیت وارد شدید');
      onSuccess(result.user, result.session_token);
    } catch (error: any) {
      setError(error.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!userData.firstName.trim() || !userData.lastName.trim() || !password.trim()) {
      setError('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const phone = userData.phone || identifier;
      const email = userData.email || (detectInputType(identifier) === 'email' ? identifier : undefined);

      const result = await rafieiAuth.registerUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone,
        email,
        password,
        signupSource: window.location.origin
      });

      toast.success('حساب کاربری با موفقیت ایجاد شد!');
      onSuccess(result.user, result.session_token);
    } catch (error: any) {
      setError(error.message || 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'login' || step === 'register') {
      setStep('initial');
      setPassword('');
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {step === 'initial' && 'خوش آمدید'}
                {step === 'login' && 'ورود به حساب'}
                {step === 'register' && 'ایجاد حساب جدید'}
              </h1>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {step === 'initial' && 'برای ادامه، ایمیل یا شماره موبایل خود را وارد کنید'}
                {step === 'login' && 'رمز عبور خود را وارد کنید'}
                {step === 'register' && 'اطلاعات خود را تکمیل کنید'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Initial Step */}
            {step === 'initial' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium">
                    ایمیل یا شماره موبایل
                  </Label>
                  <div className="relative">
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="example@email.com یا 09123456789"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      dir="ltr"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {detectInputType(identifier) === 'email' ? (
                        <Mail className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Phone className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleInitialSubmit}
                  disabled={loading || !identifier.trim()}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>ادامه</span>
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Login Step */}
            {step === 'login' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                  <p className="text-sm text-slate-600 dark:text-slate-400" dir="ltr">
                    {identifier}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    رمز عبور
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="رمز عبور خود را وارد کنید"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12 rounded-xl"
                  >
                    بازگشت
                  </Button>
                  <Button 
                    onClick={handleLogin}
                    disabled={loading || !password.trim()}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'ورود'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Register Step */}
            {step === 'register' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                  <p className="text-sm text-slate-600 dark:text-slate-400" dir="ltr">
                    {identifier}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      نام
                    </Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="نام"
                        value={userData.firstName}
                        onChange={(e) => setUserData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="pl-10 h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      نام خانوادگی
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="نام خانوادگی"
                      value={userData.lastName}
                      onChange={(e) => setUserData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    رمز عبور
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12 rounded-xl"
                  >
                    بازگشت
                  </Button>
                  <Button 
                    onClick={handleRegister}
                    disabled={loading || !userData.firstName.trim() || !userData.lastName.trim() || !password.trim()}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'ایجاد حساب'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {enrollmentMode && (
              <>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    برای ثبت‌نام در دوره، ابتدا باید وارد حساب کاربری خود شوید
                  </p>
                </div>
              </>
            )}

            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="w-full text-slate-600 dark:text-slate-400"
              >
                انصراف
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RafieiAuth;
