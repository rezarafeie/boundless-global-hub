import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import SmartTestRunner from '@/components/SmartTest/SmartTestRunner';

const BoundlessSmartTestPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] bg-background">
        <SmartTestRunner />
      </div>
    </MainLayout>
  );
};

export default BoundlessSmartTestPage;
