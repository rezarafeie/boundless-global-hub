import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiscountSectionProps {
  courseId: string;
  originalPrice: number;
  onDiscountApplied: (discountAmount: number, finalPrice: number) => void;
}

const DiscountSection: React.FC<DiscountSectionProps> = ({
  courseId,
  originalPrice,
  onDiscountApplied
}) => {
  const { toast } = useToast();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setError('لطفا کد تخفیف را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('کد تخفیف نامعتبر است');
        toast({
          title: "کد تخفیف نامعتبر",
          description: "کد تخفیف وارد شده یافت نشد یا منقضی شده است",
          variant: "destructive"
        });
        return;
      }

      // Check if discount is for specific course or all courses
      if (data.course_id && data.course_id !== courseId) {
        setError('این کد تخفیف برای این دوره معتبر نیست');
        toast({
          title: "کد تخفیف نامعتبر",
          description: "این کد تخفیف برای این دوره قابل استفاده نیست",
          variant: "destructive"
        });
        return;
      }

      // Check usage limits
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setError('این کد تخفیف به حداکثر تعداد استفاده رسیده است');
        toast({
          title: "کد تخفیف منقضی",
          description: "این کد تخفیف به حداکثر تعداد استفاده رسیده است",
          variant: "destructive"
        });
        return;
      }

      // Check validity dates
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        setError('این کد تخفیف هنوز فعال نشده است');
        toast({
          title: "کد تخفیف نامعتبر",
          description: "این کد تخفیف هنوز فعال نشده است",
          variant: "destructive"
        });
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < now) {
        setError('این کد تخفیف منقضی شده است');
        toast({
          title: "کد تخفیف منقضی",
          description: "این کد تخفیف منقضی شده است",
          variant: "destructive"
        });
        return;
      }

      // Calculate discount
      const discountAmount = Math.round((originalPrice * data.percentage) / 100);
      const finalPrice = originalPrice - discountAmount;

      setAppliedDiscount({
        ...data,
        discountAmount,
        finalPrice
      });

      onDiscountApplied(discountAmount, finalPrice);

      toast({
        title: "✅ کد تخفیف اعمال شد",
        description: `${data.percentage}% تخفیف اعمال شد`
      });

    } catch (error) {
      console.error('Error validating discount code:', error);
      setError('خطا در بررسی کد تخفیف');
      toast({
        title: "خطا",
        description: "خطا در بررسی کد تخفیف. لطفا مجددا تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setError('');
    onDiscountApplied(0, originalPrice);
    
    toast({
      title: "کد تخفیف حذف شد",
      description: "قیمت اصلی بازگردانده شد"
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/30 rounded-lg border">
        <Label className="text-base font-medium mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          کد تخفیف (اختیاری)
        </Label>
        
        {!appliedDiscount ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="کد تخفیف خود را وارد کنید"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="flex-1"
                disabled={loading}
              />
              <Button
                type="button"
                onClick={validateDiscountCode}
                disabled={loading || !discountCode.trim()}
                className="min-w-[100px]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'اعمال'
                )}
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                    {appliedDiscount.code}
                  </Badge>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {appliedDiscount.percentage}% تخفیف اعمال شد
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeDiscount}
                className="text-green-600 hover:text-green-700 dark:text-green-400"
              >
                حذف
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">قیمت اصلی:</span>
                <span className="line-through text-muted-foreground">
                  {formatPrice(originalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">مبلغ تخفیف:</span>
                <span className="text-green-600 dark:text-green-400">
                  -{formatPrice(appliedDiscount.discountAmount)}
                </span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>قیمت نهایی:</span>
                <span className="text-primary">
                  {formatPrice(appliedDiscount.finalPrice)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountSection;