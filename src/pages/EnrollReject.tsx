import React from 'react';
import EnrollHeader from '@/components/Layout/EnrollHeader';

const EnrollReject: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <EnrollHeader showBackButton={false} title="پرداخت ناموفق" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">پرداخت ناموفق</h1>
          <p className="text-muted-foreground mb-6">
            پرداخت شما با مشکل مواجه شد. لطفا دوباره تلاش کنید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnrollReject;