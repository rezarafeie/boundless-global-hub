
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import HubSection from '@/components/Chat/HubSection';

const BorderlessHub: React.FC = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:via-black dark:to-gray-800" style={{ paddingTop: '100px' }}>
        <HubSection />
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
