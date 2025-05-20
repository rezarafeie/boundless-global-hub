
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
      <div className="relative py-20 bg-white overflow-hidden">
        {/* Animated glow background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse-slow"></div>
          <div className="glow-circle glow-circle-2 animate-float"></div>
          <div className="glow-circle glow-circle-3 animate-pulse-slow animation-delay-1000"></div>
        </div>
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[20px] z-0"></div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">پشتیبانی</h1>
            <p className="text-lg text-muted-foreground">
              ما اینجا هستیم تا به سوالات شما پاسخ دهیم و در مسیر یادگیری همراه شما باشیم. لطفاً فرم زیر را تکمیل کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="border-black/5 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">فرم تماس</h2>
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
            <Card className="border-black/5 shadow-sm mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">ایمیل</h3>
                    <p className="text-muted-foreground">support@rafiei.academy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 shadow-sm mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">تلفن</h3>
                    <p className="text-muted-foreground">021-12345678</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">ساعات پاسخگویی</h3>
                    <p className="text-muted-foreground">شنبه تا چهارشنبه: 9 صبح تا 5 بعدازظهر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style>
        {`
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(0) translateX(20px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(20px) translateX(10px);
            opacity: 0.7;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(30px);
        }
        
        .glow-circle-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(147,112,219,0.25) 0%, rgba(147,112,219,0) 70%);
          top: -100px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(65,105,225,0.2) 0%, rgba(65,105,225,0) 70%);
          bottom: -150px;
          left: 10%;
        }
        
        .glow-circle-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(123,104,238,0.2) 0%, rgba(123,104,238,0) 70%);
          top: 30%;
          left: 25%;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default Support;
