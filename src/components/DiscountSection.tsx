import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Tag, CheckCircle, XCircle, Percent } from 'lucide-react';
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
  const [showDiscountField, setShowDiscountField] = useState(false);
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
        .ilike('code', discountCode.trim().toLowerCase())
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

  const handleCheckboxChange = (checked: boolean) => {
    setShowDiscountField(checked);
    if (!checked) {
      // Reset discount when unchecking
      if (appliedDiscount) {
        removeDiscount();
      }
      setDiscountCode('');
      setError('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact Checkbox Toggle */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox 
          id="discount-checkbox"
          checked={showDiscountField}
          onCheckedChange={handleCheckboxChange}
        />
        <Label 
          htmlFor="discount-checkbox" 
          className="text-sm font-medium cursor-pointer flex items-center gap-2"
        >
          <Tag className="h-4 w-4" />
          کد تخفیف دارم
        </Label>
      </div>

      {/* Compact Discount Field */}
      {showDiscountField && (
        <div className="p-3 bg-muted/20 rounded-lg border border-muted space-y-2">
          {!appliedDiscount ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="کد تخفیف"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="flex-1 h-8 text-sm"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={validateDiscountCode}
                  disabled={loading || !discountCode.trim()}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'اعمال'
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <XCircle className="h-3 w-3" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs">
                    {appliedDiscount.code}
                  </Badge>
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    {appliedDiscount.percentage}%
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeDiscount}
                  className="h-6 px-2 text-xs text-green-600 hover:text-green-700 dark:text-green-400"
                >
                  حذف
                </Button>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">قیمت اصلی:</span>
                  <span className="line-through text-muted-foreground">
                    {formatPrice(originalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تخفیف:</span>
                  <span className="text-green-600 dark:text-green-400">
                    -{formatPrice(appliedDiscount.discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-sm border-t pt-1">
                  <span>قیمت نهایی:</span>
                  <span className="text-primary">
                    {formatPrice(appliedDiscount.finalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountSection;