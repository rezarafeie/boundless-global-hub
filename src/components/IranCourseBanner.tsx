import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ArrowLeft, BookOpen, Award } from 'lucide-react';

const IRAN_GREEN = '142 71% 35%';
const IRAN_RED = '356 75% 48%';

const IranCourseBanner = () => {
  return (
    <section className="py-8 bg-background">
      <div className="container">
        <Card className="overflow-hidden border border-border/60 bg-card shadow-md hover:shadow-xl transition-all duration-300">
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, hsl(${IRAN_RED}), hsl(${IRAN_GREEN}))`,
            }}
          />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, hsl(${IRAN_RED}), hsl(${IRAN_GREEN}))`,
                  }}
                >
                  <Crown className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-right">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: `hsl(${IRAN_RED})` }}
                  >
                    <Award className="w-3 h-3" />
                    دوره پرمیوم
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      borderColor: `hsl(${IRAN_GREEN})`,
                      color: `hsl(${IRAN_GREEN})`,
                    }}
                  >
                    <BookOpen className="w-3 h-3" />
                    ۴ فاز • ۲۶ اپیزود
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black mb-2 text-foreground">
                  دوره جامع{' '}
                  <span
                    style={{
                      background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    ایران
                  </span>
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-xl mx-auto md:mx-0 leading-relaxed">
                  دوره کامل راه‌اندازی و توسعه بیزینس دیجیتال در ایران —
                  از انتخاب بازار تا اسکیل‌آپ، تبلیغات، فروش و درگاه‌های
                  پرداخت داخلی.
                </p>
              </div>

              <div className="flex-shrink-0">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 hover:text-white transition-all duration-300"
                  style={{
                    borderColor: `hsl(${IRAN_RED})`,
                    color: `hsl(${IRAN_RED})`,
                  }}
                >
                  <Link to="/courses/iran" className="flex items-center gap-2">
                    <span>مشاهده دوره ایران</span>
                    <ArrowLeft className="w-4 h-4" />
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

export default IranCourseBanner;
