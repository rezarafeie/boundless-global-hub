import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, ArrowLeft, Sparkles, Calendar } from 'lucide-react';

const IRAN_GREEN = '142 71% 35%';
const IRAN_RED = '356 75% 48%';

const IRClassBanner = () => {
  return (
    <section className="py-8 bg-background">
      <div className="container">
        <Card
          className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, hsl(${IRAN_GREEN} / 0.08), hsl(var(--background)), hsl(${IRAN_RED} / 0.08))`,
          }}
        >
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
            }}
          />
          <CardContent className="p-0">
            <div className="relative">
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-40"
                style={{ background: `hsl(${IRAN_GREEN} / 0.25)` }}
              />
              <div
                className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-40"
                style={{ background: `hsl(${IRAN_RED} / 0.25)` }}
              />

              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg rotate-3 transform hover:rotate-0 transition-transform duration-300"
                        style={{
                          background: `linear-gradient(135deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                        }}
                      >
                        <Gift className="w-10 h-10 text-white" />
                      </div>
                      <div
                        className="absolute -top-1 -right-1 px-2 h-6 rounded-full flex items-center justify-center animate-pulse"
                        style={{ background: `hsl(${IRAN_RED})` }}
                      >
                        <span className="text-white text-[10px] font-bold">رایگان</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-right">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ background: `hsl(${IRAN_GREEN})` }}
                      >
                        <Sparkles className="w-3 h-3" />
                        کلاس ویژه و رایگان
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          borderColor: `hsl(${IRAN_RED})`,
                          color: `hsl(${IRAN_RED})`,
                        }}
                      >
                        <Calendar className="w-3 h-3" />
                        ۱۴۰۵
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black mb-2">
                      <span
                        style={{
                          background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        کلاس رایگان ایران ۱۴۰۵
                      </span>
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-xl mx-auto md:mx-0 leading-relaxed">
                      راه‌اندازی بیزینس در شرایط فعلی ایران — دستورالعمل قدم‌به‌قدم،
                      فرصت‌های پولساز پلتفرم‌های داخلی، تبلیغات بله، باسلام، ترب،
                      پنل پیامکی و درگاه پرداخت.
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: `hsl(${IRAN_GREEN})` }}
                        />
                        <span>چک‌لیست اجرایی</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: `hsl(${IRAN_RED})` }}
                        />
                        <span>پلتفرم‌های داخلی</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: `hsl(${IRAN_GREEN})` }}
                        />
                        <span>پشتیبانی رایگان</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      asChild
                      size="lg"
                      className="text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{
                        background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                      }}
                    >
                      <Link to="/ir-class" className="flex items-center gap-2">
                        <span>ثبت‌نام رایگان</span>
                        <ArrowLeft className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default IRClassBanner;
