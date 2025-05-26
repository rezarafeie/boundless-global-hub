import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Headphones, Mail, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Support = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "پیام شما دریافت شد",
        description: "کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت.",
      });
      setName("");
      setEmail("");
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="relative py-20 bg-background overflow-hidden">
        {/* Animated glow background */}
        <div className="absolute inset-0 overflow-hidden hero-glow-support">
          <div className="glow-circle glow-circle-1"></div>
          <div className="glow-circle glow-circle-2"></div>
          <div className="glow-circle glow-circle-3"></div>
          <div className="glow-circle glow-circle-4"></div>
        </div>
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[20px] z-0"></div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">پشتیبانی</h1>
            <p className="text-lg text-muted-foreground">
              ما اینجا هستیم تا به سوالات شما پاسخ دهیم و در مسیر یادگیری همراه شما باشیم. لطفاً فرم زیر را تکمیل کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="border-border shadow-sm bg-card">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-card-foreground">فرم تماس</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      نام و نام خانوادگی
                    </label>
                    <Input 
                      id="name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="نام خود را وارد کنید"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      ایمیل یا شماره موبایل
                    </label>
                    <Input 
                      id="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ایمیل یا شماره موبایل خود را وارد کنید"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      پیام
                    </label>
                    <Textarea 
                      id="message" 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="پیام خود را وارد کنید"
                      className="min-h-[150px]"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-black hover:bg-black/90 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "در حال ارسال..." : "ارسال پیام"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="border-border shadow-sm mb-6 bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 text-card-foreground">ایمیل</h3>
                    <p className="text-muted-foreground">support@rafiei.academy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm mb-6 bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 text-card-foreground">تلفن</h3>
                    <p className="text-muted-foreground">021-12345678</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 text-card-foreground">ساعات پاسخگویی</h3>
                    <p className="text-muted-foreground">شنبه تا چهارشنبه: 9 صبح تا 5 بعدازظهر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Support;
