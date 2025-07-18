
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check } from 'lucide-react';
import { privateMessageService } from '@/lib/privateMessageService';

interface UsernameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
  sessionToken: string;
  userId: number;
  currentUsername?: string;
}

const UsernameSetupModal: React.FC<UsernameSetupModalProps> = ({
  isOpen,
  onClose,
  onUsernameSet,
  sessionToken,
  userId,
  currentUsername
}) => {
  const [username, setUsername] = useState(currentUsername || '');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const validateUsername = (value: string) => {
    const regex = /^[a-z0-9_]{3,20}$/;
    if (!regex.test(value)) {
      return 'نام کاربری باید بین ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی کوچک، اعداد و _ باشد';
    }
    return '';
  };

  const checkAvailability = async (value: string) => {
    if (value === currentUsername) {
      setAvailable(true);
      return;
    }

    const validationError = validateUsername(value);
    if (validationError) {
      setError(validationError);
      setAvailable(false);
      return;
    }

    setChecking(true);
    setError('');
    
    try {
      const isAvailable = await privateMessageService.checkUsernameAvailability(value);
      setAvailable(isAvailable);
      if (!isAvailable) {
        setError('این نام کاربری قبلاً انتخاب شده است');
      }
    } catch (error) {
      setError('خطا در بررسی نام کاربری');
      setAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const lowerValue = value.toLowerCase();
    setUsername(lowerValue);
    setAvailable(null);
    setError('');

    if (lowerValue.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkAvailability(lowerValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSave = async () => {
    if (!username || !available || saving) return;

    setSaving(true);
    try {
      await privateMessageService.updateUsername(userId, username);
      onUsernameSet(username);
      onClose();
    } catch (error) {
      setError('خطا در ذخیره نام کاربری');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تنظیم نام کاربری</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                className="pl-8"
                dir="ltr"
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                {checking ? (
                  <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                ) : available === true ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : available === false ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              نام کاربری شما منحصر به فرد است و دیگران می‌توانند با استفاده از آن شما را پیدا کنند
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSave}
              disabled={!username || !available || saving}
              className="flex-1"
            >
              {saving ? 'در حال ذخیره...' : 'ذخ�ره'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              لغو
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameSetupModal;
