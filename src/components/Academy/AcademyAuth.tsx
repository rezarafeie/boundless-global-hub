
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAcademyAuth } from '@/contexts/AcademyAuthContext';
import { academyAuth } from '@/lib/academyAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Phone, User, Lock } from 'lucide-react';

interface AcademyAuthProps {
  courseSlug?: string;
  onSuccess?: () => void;
}

type AuthStep = 'identifier' | 'missing-field' | 'user-details' | 'password' | 'login-password';

const AcademyAuth: React.FC<AcademyAuthProps> = ({ courseSlug, onSuccess }) => {
  const [step, setStep] = useState<AuthStep>('identifier');
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [existingUser, setExistingUser] = useState<any>(null);
  
  const { login, signup } = useAcademyAuth();
  const { toast } = useToast();

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    try {
      const { exists, user } = await academyAuth.checkUserExists(identifier);
      
      if (exists && user) {
        setExistingUser(user);
        if (identifier.includes('@')) {
          setEmail(identifier);
        } else {
          setPhone(identifier);
        }
        setStep('login-password');
      } else {
        // New user - check what field they provided
        if (identifier.includes('@')) {
          setEmail(identifier);
          setStep('missing-field'); // Need phone
        } else {
          setPhone(identifier);
          setStep('missing-field'); // Need email
        }
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بررسی کاربر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMissingFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('user-details');
  };

  const handleUserDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      const result = await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password
      });

      if (result.success) {
        toast({
          title: 'موفقیت',
          description: 'حساب کاربری شما با موفقیت ایجاد شد',
        });
        
        // Auto-enroll in course if specified
        if (courseSlug) {
          await handleCourseEnrollment();
        }
        
        onSuccess?.();
      } else {
        toast({
          title: 'خطا',
          description: result.error || 'خطا در ایجاد حساب کاربری',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد حساب کاربری',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      const result = await login(identifier, password);
      
      if (result.success) {
        toast({
          title: 'موفقیت',
          description: 'با موفقیت وارد شدید',
        });
        
        // Auto-enroll in course if specified
        if (courseSlug) {
          await handleCourseEnrollment();
        }
        
        onSuccess?.();
      } else {
        toast({
          title: 'خطا',
          description: result.error || 'خطا در ورود',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ورود',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseEnrollment = async () => {
    if (!courseSlug) return;
    
    try {
      // Get course by slug
      const { data: course } = await supabase
        .from('academy_courses')
        .select('id')
        .eq('slug', courseSlug)
        .single();

      if (course) {
        const user = await academyAuth.getCurrentUser();
        if (user) {
          await academyAuth.enrollUserInCourse(user.id, course.id);
        }
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'identifier':
        return (
          <form onSubmit={handleIdentifierSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">ایمیل یا شماره تلفن</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="example@email.com یا 09123456789"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ادامه
            </Button>
          </form>
        );

      case 'missing-field':
        return (
          <form onSubmit={handleMissingFieldSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="missing-field">
                {email ? 'شماره تلفن' : 'ایمیل'}
              </Label>
              <div className="relative">
                {email ? (
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="missing-field"
                  type={email ? 'tel' : 'email'}
                  placeholder={email ? '09123456789' : 'example@email.com'}
                  value={email ? phone : email}
                  onChange={(e) => email ? setPhone(e.target.value) : setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              ادامه
            </Button>
          </form>
        );

      case 'user-details':
        return (
          <form onSubmit={handleUserDetailsSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">نام</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="نام"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">نام خانوادگی</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="نام خانوادگی"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full">
              ادامه
            </Button>
          </form>
        );

      case 'password':
      case 'login-password':
        return (
          <form onSubmit={step === 'password' ? handlePasswordSubmit : handleLoginSubmit} className="space-y-4">
            {step === 'login-password' && existingUser && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  خوش آمدید، {existingUser.first_name} {existingUser.last_name}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">
                {step === 'password' ? 'رمز عبور (حداقل 6 کاراکتر)' : 'رمز عبور'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="رمز عبور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={step === 'password' ? 6 : undefined}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === 'password' ? 'ایجاد حساب کاربری' : 'ورود'}
            </Button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {step === 'login-password' ? 'ورود' : 'ورود / ثبت‌نام'}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 'identifier' && 'لطفا ایمیل یا شماره تلفن خود را وارد کنید'}
          {step === 'missing-field' && 'لطفا اطلاعات تکمیلی خود را وارد کنید'}
          {step === 'user-details' && 'لطفا نام و نام خانوادگی خود را وارد کنید'}
          {step === 'password' && 'لطفا رمز عبور خود را انتخاب کنید'}
          {step === 'login-password' && 'لطفا رمز عبور خود را وارد کنید'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  );
};

export default AcademyAuth;
