
import React from 'react';
import { Button } from '@/components/ui/button';
import { useZarinpalPayment } from '@/hooks/useZarinpalPayment';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  courseSlug: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ 
  courseSlug, 
  children, 
  className,
  variant = "default"
}) => {
  const { initiatePayment, loading, getCoursePrice } = useZarinpalPayment();
  
  const price = getCoursePrice(courseSlug);
  const formattedPrice = price ? (price / 1000000).toFixed(1) : '0';

  const handlePayment = async () => {
    await initiatePayment(courseSlug);
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          در حال پردازش...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children || `خرید دوره - ${formattedPrice} میلیون تومان`}
        </>
      )}
    </Button>
  );
};

export default PaymentButton;
