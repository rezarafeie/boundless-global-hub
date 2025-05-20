
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Award, BookOpen, Globe, Star, Target, Trophy } from "lucide-react";

interface InstructorProfileProps {
  compact?: boolean;
}

const InstructorProfile = ({ compact = false }: InstructorProfileProps) => {
  return (
    <Card className="border-black/5 shadow-sm overflow-hidden">
      <CardContent className={`p-6 ${compact ? "" : "md:p-8"}`}>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
            <Award size={32} className="text-black/70" />
          </div>

          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-center md:text-right">رضا رفیعی</h3>

            <p className="text-sm md:text-base text-muted-foreground mb-4">
              رضا رفیعی بنیان‌گذار آکادمی رفیعی، مشاور توسعه کسب‌وکارهای بدون مرز و مدرس دوره‌های تخصصی در حوزه رشد فردی، درآمد دلاری و مهارت‌های قرن ۲۱ است. او با بیش از یک دهه تجربه، به هزاران نفر در مسیر راه‌اندازی کسب‌وکارهای بین‌المللی کمک کرده است.
            </p>

            {!compact && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
                <div className="flex flex-col items-center p-3 bg-black/5 rounded-lg">
                  <BookOpen size={20} className="mb-2" />
                  <span className="text-sm font-medium">+20 دوره</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-black/5 rounded-lg">
                  <Trophy size={20} className="mb-2" />
                  <span className="text-sm font-medium">+10 سال تجربه</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-black/5 rounded-lg">
                  <Star size={20} className="mb-2" />
                  <span className="text-sm font-medium">+5000 دانشجو</span>
                </div>
              </div>
            )}

            {compact ? (
              <Button asChild variant="link" className="p-0 h-auto font-medium text-black">
                <Link to="/instructor/reza-rafiei">
                  اطلاعات بیشتر
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstructorProfile;
