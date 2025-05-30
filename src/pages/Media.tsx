
import React from 'react';
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent } from '@/components/ui/card';
import { Youtube, Instagram, Play } from 'lucide-react';

const Media = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-foreground">مدیا</h1>
            <p className="text-muted-foreground text-lg">مجموعه کامل محتوای آموزشی و الهام‌بخش آکادمی رفیعی</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* YouTube Shorts */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Youtube size={24} className="text-red-500" />
                  <h2 className="text-2xl font-bold text-foreground">YouTube Shorts</h2>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/videoseries?si=S2w1KThu5ANeLKwd&list=PLtjwHgjsPJQMmqR9IDsh6EjPL3PSNigBd" 
                    title="YouTube Shorts" 
                    frameBorder="0" 
                    allowFullScreen
                  />
                </div>
                <p className="text-muted-foreground mt-4">ویدیوهای کوتاه و مفید برای یادگیری سریع</p>
              </CardContent>
            </Card>

            {/* YouTube Videos */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Play size={24} className="text-red-500" />
                  <h2 className="text-2xl font-bold text-foreground">YouTube Videos</h2>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/videoseries?si=mBbCnArSLorvUZQM&list=PLtjwHgjsPJQOKHJJHrsNHL99uhj5lvy9d" 
                    title="YouTube Videos" 
                    frameBorder="0" 
                    allowFullScreen
                  />
                </div>
                <p className="text-muted-foreground mt-4">دوره‌های کامل و جامع آموزشی</p>
              </CardContent>
            </Card>

            {/* Aparat Videos */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Play size={24} className="text-blue-500" />
                  <h2 className="text-2xl font-bold text-foreground">ویدیوهای آپارات</h2>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <div id="88439123958">
                    <script type="text/JavaScript" src="https://www.aparat.com/embed/c47mjrd?data[rnddiv]=88439123958&data[responsive]=yes&recom=self"></script>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4">محتوای ویدیویی فارسی با کیفیت بالا</p>
              </CardContent>
            </Card>

            {/* Instagram Posts */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Instagram size={24} className="text-pink-500" />
                  <h2 className="text-2xl font-bold text-foreground">پست‌های اینستاگرام</h2>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="text-center">
                    <Instagram size={60} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">برای مشاهده آخرین پست‌ها به اینستاگرام مراجعه کنید</p>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4">آخرین پست‌ها، استوری‌ها و محتوای انگیزشی</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Media;
