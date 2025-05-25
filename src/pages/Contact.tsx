
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
      <div className="container py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">تماس با ما</h1>
            <p className="text-xl text-gray-600">
              ما همیشه آماده پاسخگویی به سوالات شما هستیم
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>ارسال پیام</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    name="name"
                    placeholder="نام و نام خانوادگی"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  
                  <Input
                    name="email"
                    type="email"
                    placeholder="ایمیل"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  
                  <Input
                    name="subject"
                    placeholder="موضوع"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                  
                  <Textarea
                    name="message"
                    placeholder="پیام شما..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                  />
                  
                  <Button type="submit" className="w-full bg-black hover:bg-gray-800">
                    ارسال پیام
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <Phone className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-bold mb-1">تلفن تماس</h3>
                      <p className="text-gray-600">۰۲۱-۱۲۳۴۵۶۷۸</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <Mail className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-bold mb-1">ایمیل</h3>
                      <p className="text-gray-600">info@rafeie.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <MapPin className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-bold mb-1">آدرس</h3>
                      <p className="text-gray-600">تهران، ایران</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <Clock className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-bold mb-1">ساعات کاری</h3>
                      <p className="text-gray-600">شنبه تا چهارشنبه: ۹:۰۰ - ۱۸:۰۰</p>
                      <p className="text-gray-600">پنج‌شنبه: ۹:۰۰ - ۱۴:۰۰</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
