
import React from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineDetectorProps {
  children: React.ReactNode;
  requiresConnection?: boolean;
}

const OfflineDetector: React.FC<OfflineDetectorProps> = ({ 
  children, 
  requiresConnection = false 
}) => {
  const { isOnline, isChecking, checkConnection } = useOfflineDetection();

  // Only show offline screen for messenger, not for hub
  if (requiresConnection && !isOnline) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-red-600 dark:text-red-400">
              حالت آفلاین فعال
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              اتصال با سرور برقرار نیست. لطفاً منتظر بمانید یا اتصال خود را بررسی کنید.
            </p>
            <Button 
              onClick={checkConnection} 
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تلاش مجدد
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default OfflineDetector;
