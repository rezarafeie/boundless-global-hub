
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createWooCommerceOrder, getProductIdForCourse, type CheckoutData } from "@/utils/woocommerce";
import { useNavigate } from "react-router-dom";
import { CreditCard, Shield } from "lucide-react";

interface CheckoutFormProps {
  courseSlug: string;
  courseTitle: string;
  price: string;
}

const CheckoutForm = ({ courseSlug, courseTitle, price }: CheckoutFormProps) => {
  const [formData, setFormData] = useState<Omit<CheckoutData, 'product_id'>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productId = getProductIdForCourse(courseSlug);
      const checkoutData: CheckoutData = {
        ...formData,
        product_id: productId
      };
      
      const order = await createWooCommerceOrder(checkoutData);
      
      toast({
        title: "سفارش ایجاد شد!",
        description: "در حال انتقال به درگاه پرداخت...",
      });
      
      // Redirect to payment gateway or success page
      if (order.payment_url) {
        window.location.href = order.payment_url;
      } else {
        navigate(`/start/paid-course/${courseSlug}`);
      }
    } catch (error) {
      toast({
        title: "خطا در ایجاد سفارش",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <CreditCard className="mr-2" />
            تکمیل خرید
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{courseTitle}</h3>
            <div className="flex justify-between items-center">
              <span>قیمت:</span>
              <span className="text-2xl font-bold text-primary">{price}</span>
            </div>
          </div>

          {/* Billing Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="first_name"
                placeholder="نام"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <Input
                name="last_name"
                placeholder="نام خانوادگی"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <Input
              name="email"
              type="email"
              placeholder="ایمیل"
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <Input
              name="phone"
              placeholder="شماره تلفن"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            {/* Payment Method */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="ml-2 text-blue-600" />
                <span className="font-medium">روش پرداخت: زرین‌پال</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                پرداخت امن از طریق درگاه زرین‌پال
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "در حال پردازش..." : `پرداخت ${price}`}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <Shield className="inline w-4 h-4 ml-1" />
            تمامی اطلاعات شما محفوظ و امن نگهداری می‌شود
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutForm;
