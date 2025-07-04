
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import { motion } from "framer-motion";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Contact form submitted:", formData);
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              تماس با 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                آکادمی رفیعی
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ما همیشه آماده پاسخگویی به سوالات شما هستیم. با ما در تماس باشید
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Contact Form */}
              <motion.div 
                className="lg:col-span-2"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="border-border shadow-xl bg-card">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold flex items-center text-card-foreground">
                      <Send className="mr-3 text-blue-600" size={28} />
                      ارسال پیام
                    </CardTitle>
                    <p className="text-muted-foreground">
                      فرم زیر را تکمیل کنید تا در کوتاه‌ترین زمان با شما تماس بگیریم
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            نام و نام خانوادگی *
                          </label>
                          <Input
                            name="name"
                            placeholder="نام کامل خود را وارد کنید"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            شماره تماس
                          </label>
                          <Input
                            name="phone"
                            type="tel"
                            placeholder="09xxxxxxxxx"
                            value={formData.phone}
                            onChange={handleChange}
                            className="h-12"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ایمیل *
                        </label>
                        <Input
                          name="email"
                          type="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          موضوع *
                        </label>
                        <Input
                          name="subject"
                          placeholder="موضوع پیام خود را بنویسید"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          متن پیام *
                        </label>
                        <Textarea
                          name="message"
                          placeholder="پیام خود را به تفصیل بنویسید..."
                          value={formData.message}
                          onChange={handleChange}
                          rows={6}
                          required
                          className="resize-none"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold"
                      >
                        <Send className="mr-2" size={20} />
                        ارسال پیام
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Information */}
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">تلفن تماس</h3>
                        <p className="text-gray-600 mb-2">پاسخگویی در ساعات اداری</p>
                        <a href="tel:02128427131" className="text-blue-600 hover:text-blue-700 font-medium">
                          021-28427131
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">ایمیل</h3>
                        <p className="text-gray-600 mb-2">پاسخ در کمتر از ۲۴ ساعت</p>
                        <a href="mailto:hi@rafeie.com" className="text-green-600 hover:text-green-700 font-medium">
                          hi@rafeie.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">تلگرام</h3>
                        <p className="text-gray-600 mb-2">پشتیبانی آنلاین</p>
                        <a href="https://t.me/rafieiacademy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-medium">
                          @rafieiacademy
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">آدرس</h3>
                        <p className="text-gray-600">
                          تهران. محمودیه. خیابان سالار. آکادمی رفیعی
                        </p>
                        <p className="text-sm text-red-500 mt-1">مراجعه با هماهنگی قبلی</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">ساعات کاری</h3>
                        <div className="text-gray-600 space-y-1">
                          <p>شنبه تا چهارشنبه: ۹:۰۰ - ۱۹:۰۰</p>
                          <p>پنج‌شنبه: ۹:۰۰ - ۱۹:۰۰</p>
                          <p className="text-sm text-red-500">جمعه: تعطیل</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Google Maps */}
                <Card className="border-0 shadow-lg bg-card">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">موقعیت ما</h3>
                    <div className="w-full h-64 rounded-lg overflow-hidden">
                      <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3235.770488452337!2d51.46880197579324!3d35.80556737254741!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8e05a7bee90e59%3A0xd2ef2989def31fd1!2z2KLaqdin2K_ZhduMINix2YHbjNi524w!5e0!3m2!1sen!2sus!4v1748501351831!5m2!1sen!2sus" 
                        width="100%" 
                        height="100%" 
                        style={{border:0}} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        className="rounded-lg"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              نیاز به کمک فوری دارید؟
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              تیم پشتیبانی ما آماده کمک به شما است
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8"
                asChild
              >
                <a href="https://t.me/rafieiacademy" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2" size={20} />
                  چت با پشتیبانی
                </a>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 rounded-full px-8"
                asChild
              >
                <a href="tel:02128427131">
                  <Phone className="mr-2" size={20} />
                  تماس فوری
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Contact;
