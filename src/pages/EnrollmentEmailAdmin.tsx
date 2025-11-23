import React from 'react';
import EmailSettings from '@/components/Admin/EmailSettings';

const EnrollmentEmailAdmin: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">
            تنظیمات ایمیل - آکادمی رفیعی
          </h1>
          <p className="text-muted-foreground">مدیریت ایمیل‌ها و تنظیمات Gmail</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <EmailSettings />
      </div>
    </div>
  );
};

export default EnrollmentEmailAdmin;