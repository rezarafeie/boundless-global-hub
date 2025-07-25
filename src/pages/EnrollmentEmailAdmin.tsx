import React from 'react';
import EmailSettings from '@/components/Admin/EmailSettings';

const EnrollmentEmailAdmin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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