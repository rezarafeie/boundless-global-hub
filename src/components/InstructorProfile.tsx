
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Award, BookOpen, Globe, Star, Target, Trophy, ArrowLeft } from "lucide-react";

interface InstructorProfileProps {
  compact?: boolean;
}

const InstructorProfile = ({ compact = false }: InstructorProfileProps) => {
  return (
    <Link to="/instructor/reza-rafiei" className="block group">
      <Card className="border-border dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-primary/50 dark:hover:border-primary/50">
        <CardContent className={`p-6 ${compact ? "" : "md:p-8"}`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Award size={32} className="text-primary" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl md:text-2xl font-bold text-center md:text-right text-foreground dark:text-white">رضا رفیعی</h3>
                <ArrowLeft size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all duration-300 rtl:rotate-180" />
              </div>

              <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300 mb-4">
                رضا رفیعی بنیان‌گذار آکادمی رفیعی، مشاور توسعه کسب‌وکارهای بدون مرز و مدرس دوره‌های تخصصی در حوزه رشد فردی، درآمد دلاری و مهارت‌های قرن ۲۱ است. او با بیش از یک دهه تجربه، به هزاران نفر در مسیر راه‌اندازی کسب‌وکارهای بین‌المللی کمک کرده است.
              </p>

              {!compact && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
                  <div className="flex flex-col items-center p-3 bg-primary/5 dark:bg-primary/10 rounded-lg group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors duration-300">
                    <BookOpen size={20} className="mb-2 text-primary" />
                    <span className="text-sm font-medium text-foreground dark:text-white">+20 دوره</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-primary/5 dark:bg-primary/10 rounded-lg group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors duration-300">
                    <Trophy size={20} className="mb-2 text-primary" />
                    <span className="text-sm font-medium text-foreground dark:text-white">+10 سال تجربه</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-primary/5 dark:bg-primary/10 rounded-lg group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors duration-300">
                    <Star size={20} className="mb-2 text-primary" />
                    <span className="text-sm font-medium text-foreground dark:text-white">+5000 دانشجو</span>
                  </div>
                </div>
              )}

              {compact && (
                <div className="text-sm font-medium text-primary group-hover:text-primary/80 transition-colors duration-300">
                  اطلاعات بیشتر ←
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default InstructorProfile;
