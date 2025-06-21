
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';

const HubCTABanner: React.FC = () => {
  return (
    <div className="hub-cta-banner" dir="rtl">
      <h3 className="flex items-center justify-center gap-2">
        <MessageCircle className="w-6 h-6" />
        📢 مرکز بدون مرز فعال شد
      </h3>
      <p>
        برای دسترسی به اطلاعیه‌ها، گفت‌وگوهای گروهی، و پخش زنده وارد شوید.
      </p>
      <Link to="/hub" className="btn-primary">
        ورود به مرکز بدون مرز
        <ArrowLeft className="w-5 h-5 mr-2 inline" />
      </Link>
    </div>
  );
};

export default HubCTABanner;
