import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: string;
  courseTitle?: string;
}

const ReactivationDialog: React.FC<Props> = ({ open, onOpenChange, courseId, courseTitle }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [price, setPrice] = useState<{ usd: number; toman: number; days: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.functions
      .invoke('course-reactivation-payment', { body: { action: 'price', userId: Number(user?.id), courseId } })
      .then(({ data }) => {
        if (data?.success) setPrice({ usd: data.usd, toman: data.toman, days: data.days });
      });
  }, [open, courseId, user?.id]);

  const pay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('course-reactivation-payment', {
        body: {
          action: 'request',
          userId: Number(user?.id),
          courseId,
          origin: window.location.origin,
          returnPath: window.location.pathname,
        },
      });
      if (error || !data?.success) throw new Error(data?.error || 'خطا در اتصال به درگاه');
      window.location.href = data.paymentUrl;
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-destructive" /> تمدید دسترسی دوره
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            دسترسی شما به {courseTitle ?? 'این دوره'} به پایان رسیده است. پیشرفت شما کامل ذخیره شده و پس از پرداخت
            دقیقاً از همان‌جا ادامه می‌دهید.
          </p>
          <div className="rounded-lg border bg-muted/40 p-3">
            {price ? (
              <>
                <div className="text-lg font-bold">{price.toman.toLocaleString('fa-IR')} تومان</div>
                <div className="text-xs text-muted-foreground">
                  معادل {price.usd} دلار — {price.days} روز دسترسی مجدد
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">در حال محاسبه مبلغ...</span>
            )}
          </div>
          <Button className="w-full" disabled={!price || loading} onClick={pay}>
            {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            پرداخت و باز کردن دوره
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReactivationDialog;
