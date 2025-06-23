
import React from 'react';

interface HubLayoutProps {
  children: React.ReactNode;
  currentUser: any;
}

const HubLayout: React.FC<HubLayoutProps> = ({ children, currentUser }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default HubLayout;
