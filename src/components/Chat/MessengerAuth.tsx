
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, User, Phone, AtSign, Check } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';
import { detectCountryCode, formatPhoneWithCountryCode, getCountryCodeOptions } from '@/lib/countryCodeUtils';

interface MessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: MessengerUser) => void;
}

const MessengerAuth: React.FC<MessengerAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+98',
    username: '',
    password: 'defaultpassword123',
    isBoundlessStudent: false
  });
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    if (formData.username && !usernameAvailable) {
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
      const formattedPhone = formData.countryCode + formData.phone;
      
      // Register user with password
      const result = await messengerService.registerWithPassword({
        name: formData.name.trim(),
        phone: formattedPhone,
        username: formData.username || undefined,
        password: formData.password,
        isBoundlessStudent: formData.isBoundlessStudent
      });

      // Update username if provided and different
      if (formData.username && result.user.username !== formData.username) {
        await privateMessageService.updateUsername(result.user.id, formData.username, result.session_token);
        result.user.username = formData.username;
      }

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MessageCircle className="w-12 h-12 text-blue-500" />
          </div>
          <CardTitle className="text-2xl">ورود به پیام‌رسان</CardTitle>
          <CardDescription>
            برای ورود به پیام‌رسان بدون مرز، اطلاعات خود را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                شماره تلفن
              </Label>
              <div className="flex">
                <Select value={formData.countryCode} onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}>
                  <SelectTrigger className="w-32 rounded-r-none border-r-0">
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
                    const cleanValue = e.target.value.replace(/[^0-9]/g, '');
                    setFormData(prev => ({ ...prev, phone: cleanValue }));
                  }}
                  placeholder="9123456789"
                  required
                  dir="ltr"
                  className="flex-1 rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                شماره تلفن از همه کشورها پذیرفته می‌شود
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                نام کاربری (اختیاری)
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
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                  {usernameChecking ? (
                    <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                  ) : usernameAvailable === true ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                نام کاربری منحصر به فرد است و دیگران می‌توانند با آن شما را پیدا کنند
              </p>
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (formData.username && !usernameAvailable)}
            >
              {loading ? 'در حال ثبت نام...' : 'ورود به پیام‌رسان'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessengerAuth;
