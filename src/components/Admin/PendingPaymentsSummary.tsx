import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PendingPaymentsSummary: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('manual_payment_status', 'pending');

      if (error) throw error;
      setPendingCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">در انتظار تایید</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          در انتظار تایید
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              <AlertCircle className="h-3 w-3 mr-1" />
              نیاز به توجه
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">پرداخت در انتظار تایید</p>
      </CardContent>
    </Card>
  );
};

export default PendingPaymentsSummary;