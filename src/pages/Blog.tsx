
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const Blog = () => {
  return (
    <MainLayout>
      <Hero
        title="مجله آکادمی رفیعی"
        subtitle="آخرین مقالات، اخبار و نکات آموزشی در زمینه کسب‌وکار، موفقیت و تحول دیجیتال"
        ctaText="مشاهده مقالات"
        ctaLink="#articles"
        backgroundType="glow"
      />
      
      <section id="articles" className="py-16 bg-white">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">محتوای مجله در حال به‌روزرسانی است</h2>
            <p className="text-lg text-muted-foreground">
              به زودی با مقالات و محتوای جدید در خدمت شما خواهیم بود. لطفاً مجدداً به این صفحه سر بزنید.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="border-black/5 opacity-50">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-4">
                    <BookOpen size={24} className="text-black/70" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded-md mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-md mb-2 w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-md mb-2 w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Blog;
