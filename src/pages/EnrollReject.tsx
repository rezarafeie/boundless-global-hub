import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Enrollment {
  id: string;
  admin_notes: string | null;
  manual_payment_status: string | null;
  course_id: string;
}

const EnrollReject: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select('id, admin_notes, manual_payment_status, course_id')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setEnrollment(data);
      } catch (error) {
        console.error('Error fetching enrollment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollment();
  }, [orderId]);

  const handleRetry = () => {
    if (enrollment?.course_id) {
      navigate(`/enroll?course=${enrollment.course_id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">درخواست رد شد</h1>
          
          {loading ? (
            <p className="text-muted-foreground mb-6">در حال بارگذاری...</p>
          ) : (
            <>
              {enrollment?.admin_notes ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium mb-2">دلیل رد درخواست:</p>
                  <p className="text-destructive">{enrollment.admin_notes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground mb-6">
                  درخواست ثبت‌نام شما توسط ادمین رد شده است.
                </p>
              )}
              
              <Button onClick={handleRetry} className="w-full">
                تلاش مجدد
              </Button>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default EnrollReject;