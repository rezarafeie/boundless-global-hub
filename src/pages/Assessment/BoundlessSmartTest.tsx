import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import SmartTestRunner from '@/components/SmartTest/SmartTestRunner';

const BoundlessSmartTestPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] bg-background">
        <div className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-2xl px-4 py-8 text-center" dir="rtl">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">تست هوشمند بدون مرز</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              با چند سؤال کوتاه، مسیر بدون مرز شما را پیدا می‌کنیم.
            </p>
          </div>
        </div>
        <SmartTestRunner />
      </div>
    </MainLayout>
  );
};

export default BoundlessSmartTestPage;
