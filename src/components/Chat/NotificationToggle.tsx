import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';

interface NotificationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
  disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  enabled,
  onToggle,
  disabled = false
}) => {
  const handleToggle = async (checked: boolean) => {
    await onToggle(checked);
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
      <div className="flex items-center gap-3">
        {enabled ? (
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <BellOff className="h-5 w-5 text-gray-400" />
        )}
        
        <div>
          <Label className="text-sm font-medium cursor-pointer">
            دریافت نوتیفیکیشن‌ها
          </Label>
          <p className="text-xs text-muted-foreground">
            اطلاع‌رسانی پیام‌های جدید در مرورگر
          </p>
        </div>
      </div>
      
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={disabled}
        aria-label="Toggle notifications"
      />
    </div>
  );
};

export default NotificationToggle;