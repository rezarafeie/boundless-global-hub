
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, MessageCircle, Bell, Video } from 'lucide-react';
import { motion } from 'framer-motion';

const HubBanner = () => {
  return (
    <section className="py-8 bg-gradient-to-r from-muted via-muted/50 to-muted/30 dark:from-foreground/30 dark:via-foreground/30 dark:to-foreground/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-xl border-white/20 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 text-center lg:text-right">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-br from-foreground to-foreground text-white">
                      <Network className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground bg-clip-text text-transparent">
                      🤖 سامانه هوشمند آموزشی
                    </h2>
                  </div>
                  
                  <p className="text-lg text-muted-foreground dark:text-muted-foreground mb-6">
                    اولین سیستم مدیریت یادگیری هوشمند در جهان با قابلیت تولید دوره، مسیر یادگیری، درس‌ها، گفتگو و تماس با هوش مصنوعی، تست‌ها، ارزیابی‌ها، تکالیف و بیشتر
                  </p>
                  
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span>گفتگو با AI</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                      <Bell className="w-4 h-4" />
                      <span>تولید دوره</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                      <Video className="w-4 h-4" />
                      <span>مسیر یادگیری هوشمند</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <Button asChild size="lg" className="bg-gradient-to-r from-foreground to-foreground hover:from-foreground hover:to-foreground">
                      <a href="https://coach.rafiei.co" target="_blank" rel="noopener noreferrer">
                        <Network className="w-4 h-4 mr-2" />
                        ورود به سامانه
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/hub/messenger">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        پیام‌رسان
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted dark:from-foreground/50 dark:to-foreground/50 rounded-2xl flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-foreground dark:text-muted-foreground" />
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted dark:from-foreground/50 dark:to-foreground/50 rounded-2xl flex items-center justify-center">
                      <Bell className="w-8 h-8 text-foreground dark:text-muted-foreground" />
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted dark:from-foreground/50 dark:to-foreground/50 rounded-2xl flex items-center justify-center">
                      <Video className="w-8 h-8 text-foreground dark:text-muted-foreground" />
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted dark:from-foreground/50 dark:to-foreground/50 rounded-2xl flex items-center justify-center">
                      <Network className="w-8 h-8 text-foreground dark:text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default HubBanner;
