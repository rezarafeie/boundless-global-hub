import React from 'react';
import WebinarManagement from '@/components/Admin/WebinarManagement';
import { useUserRole } from '@/hooks/useUserRole';
import { AlertCircle } from 'lucide-react';

const WebinarAdmin: React.FC = () => {
  const { role: userRole, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">دسترسی غیرمجاز</p>
        <p className="text-sm text-muted-foreground">شما به این بخش دسترسی ندارید.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WebinarManagement />
    </div>
  );
};

export default WebinarAdmin;