import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';

const EnrollReject: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">پرداخت ناموفق</h1>
          <p className="text-muted-foreground mb-6">
            پرداخت شما با مشکل مواجه شد. لطفا دوباره تلاش کنید.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default EnrollReject;