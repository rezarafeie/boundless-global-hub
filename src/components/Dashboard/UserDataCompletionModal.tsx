import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

interface UserDataCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function UserDataCompletionModal({ isOpen, onClose, user }: UserDataCompletionModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('نام کاربری الزامی است');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('رمز عبور باید حداقل 6 کاراکتر باشد');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('chat_users')
        .select('id')
        .eq('username', formData.username.trim())
        .neq('id', user.id)
        .single();

      if (existingUser) {
        setError('این نام کاربری قبلاً استفاده شده است');
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(formData.password, 10);

      // Update user data
      const { error: updateError } = await supabase
        .from('chat_users')
        .update({
          username: formData.username.trim(),
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('اطلاعات شما با موفقیت تکمیل شد');
      onClose();
      
      // Optionally refresh the page or update context
      window.location.reload();
      
    } catch (err) {
      console.error('Error updating user data:', err);
      setError('خطا در به‌روزرسانی اطلاعات. لطفاً مجدداً تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">تکمیل اطلاعات کاربری</DialogTitle>
          <DialogDescription className="text-center">
            برای استفاده کامل از سیستم، لطفاً اطلاعات زیر را تکمیل کنید
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="نام کاربری دلخواه خود را وارد کنید"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="رمز عبور (حداقل 6 کاراکتر)"
                disabled={loading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="رمز عبور را مجدداً وارد کنید"
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="w-full"
            >
              بعداً
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}