import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Users, ArrowRight, Sparkles } from 'lucide-react';

const WebinarBanner = () => {
  return (
    <section className="relative -mt-20 pb-8">
      <div className="container">
        <Card className="overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-3">
                  <span className="text-xs font-semibold text-primary">دوره رایگان</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                  زندگی هوشمند با AI
                </h2>
                <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto md:mx-0">
                  ۲ جلسه رایگان برای شروع زندگی هوشمند با هوش مصنوعی
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Video className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">دسترسی فوری</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">بیش از ۳۰۰۰ دانشجو</span>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
                <Button 
                  asChild 
                  size="default"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Link to="/course/smart-life" className="flex items-center gap-2">
                    <span>شروع دوره</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WebinarBanner;
