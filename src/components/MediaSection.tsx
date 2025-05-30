
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Youtube, Instagram, Play } from 'lucide-react';
import SectionTitle from './SectionTitle';

const MediaSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <SectionTitle
          title="مدیا"
          subtitle="آخرین محتوای آموزشی و الهام‌بخش آکادمی رفیعی"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* YouTube Shorts */}
          <Card className="bg-card border-border hover:border-primary/20 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Youtube size={20} className="text-red-500" />
                <h3 className="font-semibold text-foreground">YouTube Shorts</h3>
              </div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/videoseries?si=S2w1KThu5ANeLKwd&list=PLtjwHgjsPJQMmqR9IDsh6EjPL3PSNigBd" 
                  title="YouTube Shorts" 
                  frameBorder="0" 
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-muted-foreground">ویدیوهای کوتاه آموزشی</p>
            </CardContent>
          </Card>

          {/* YouTube Videos */}
          <Card className="bg-card border-border hover:border-primary/20 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play size={20} className="text-red-500" />
                <h3 className="font-semibold text-foreground">YouTube Videos</h3>
              </div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/videoseries?si=mBbCnArSLorvUZQM&list=PLtjwHgjsPJQOKHJJHrsNHL99uhj5lvy9d" 
                  title="YouTube Videos" 
                  frameBorder="0" 
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-muted-foreground">دوره‌های کامل آموزشی</p>
            </CardContent>
          </Card>

          {/* Aparat Videos */}
          <Card className="bg-card border-border hover:border-primary/20 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play size={20} className="text-blue-500" />
                <h3 className="font-semibold text-foreground">آپارات</h3>
              </div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                <div id="88439123957">
                  <script type="text/JavaScript" src="https://www.aparat.com/embed/c47mjrd?data[rnddiv]=88439123957&data[responsive]=yes&recom=self"></script>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">محتوای ویدیویی فارسی</p>
            </CardContent>
          </Card>

          {/* Instagram Posts */}
          <Card className="bg-card border-border hover:border-primary/20 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Instagram size={20} className="text-pink-500" />
                <h3 className="font-semibold text-foreground">اینستاگرام</h3>
              </div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                <Instagram size={40} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">آخرین پست‌ها و استوری‌ها</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline">
            <Link to="/media">
              مشاهده همه محتواها
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MediaSection;
