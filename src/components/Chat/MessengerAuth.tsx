
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
            شماره تلفن خود را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="نام و نام خانوادگی"
                required
                dir="rtl"
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
            </div>

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
                    // Remove leading zeros and plus signs
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

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="نام کاربری (اختیاری)"
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

            <div className="flex items-center space-x-2 space-x-reverse pt-4">
              <Checkbox
                id="boundless"
                checked={formData.isBoundlessStudent}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isBoundlessStudent: checked as boolean }))
                }
              />
              <Label htmlFor="boundless" className="text-sm text-muted-foreground">
                من دانشجوی دوره بدون مرز هستم
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal mt-8" 
              disabled={loading || (formData.username && !usernameAvailable)}
            >
              {loading ? 'در حال بررسی...' : 'ورود'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessengerAuth;
