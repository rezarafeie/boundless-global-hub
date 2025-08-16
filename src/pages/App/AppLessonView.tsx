import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CheckCircle,
  FileText,
  Download,
  Volume2
} from "lucide-react";

const AppLessonView = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Mock data - replace with real data from Supabase
  const lesson = {
    id: 1,
    title: "آشنایی با مفهوم درآمد پسیو",
    courseTitle: "دوره کسب درآمد پسیو",
    content: `
      <h2>مفهوم درآمد پسیو</h2>
      <p>درآمد پسیو به درآمدی اطلاق می‌شود که بدون حضور مستمر و فعال شما ایجاد می‌شود. این نوع درآمد یکی از مهم‌ترین راه‌های دستیابی به آزادی مالی محسوب می‌شود.</p>
      
      <h3>ویژگی‌های درآمد پسیو:</h3>
      <ul>
        <li>عدم نیاز به حضور فیزیکی مستمر</li>
        <li>قابلیت مقیاس‌پذیری</li>
        <li>ایجاد درآمد در طول زمان</li>
        <li>آزادی زمان بیشتر</li>
      </ul>

      <h3>انواع درآمد پسیو:</h3>
      <p>درآمد پسیو انواع مختلفی دارد که در ادامه دوره با هر کدام آشنا خواهید شد:</p>
      <ul>
        <li>سرمایه‌گذاری در بازارهای مالی</li>
        <li>ایجاد محصولات دیجیتال</li>
        <li>سرمایه‌گذاری در املاک</li>
        <li>ایجاد کسب و کارهای آنلاین</li>
      </ul>
    `,
    duration: 900, // 15 minutes in seconds
    videoUrl: "https://example.com/video.mp4", // Mock video URL
    hasDownloadableFiles: true,
    nextLessonId: 2,
    prevLessonId: null
  };

  const totalDuration = lesson.duration;
  const progressPercentage = (currentTime / totalDuration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    // Here you would call Supabase to mark lesson as completed
  };

  const handleNextLesson = () => {
    if (lesson.nextLessonId) {
      navigate(`/app/lesson/${lesson.nextLessonId}`);
    }
  };

  const handlePrevLesson = () => {
    if (lesson.prevLessonId) {
      navigate(`/app/lesson/${lesson.prevLessonId}`);
    }
  };

  const rightAction = (
    <div className="flex items-center gap-2">
      {lesson.hasDownloadableFiles && (
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download size={16} />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <FileText size={16} />
      </Button>
    </div>
  );

  return (
    <AppLayout title={lesson.title} rightAction={rightAction}>
      <div className="space-y-4">
        {/* Course Context */}
        <div className="px-4 pt-2">
          <Badge variant="outline" className="text-xs">
            {lesson.courseTitle}
          </Badge>
        </div>

        {/* Video Player */}
        <div className="px-4">
          <Card className="overflow-hidden">
            <div className="relative">
              {/* Video placeholder */}
              <div className="aspect-video bg-black flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-white"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </Button>
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="space-y-2">
                  <Progress value={progressPercentage} className="h-1" />
                  <div className="flex items-center justify-between text-white text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={handlePrevLesson}
                        disabled={!lesson.prevLessonId}
                      >
                        <SkipBack size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={handlePlayPause}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={handleNextLesson}
                        disabled={!lesson.nextLessonId}
                      >
                        <SkipForward size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                      >
                        <Volume2 size={16} />
                      </Button>
                    </div>
                    <span>{formatTime(totalDuration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Lesson Content */}
        <div className="px-4">
          <Card>
            <CardContent className="p-4">
              <div 
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-6">
          <div className="space-y-3">
            {!isCompleted ? (
              <Button 
                onClick={handleComplete}
                className="w-full"
                size="lg"
              >
                <CheckCircle size={18} className="ml-2" />
                علامت‌گذاری به عنوان تکمیل شده
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-green-600 font-medium">این درس تکمیل شده است</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={handlePrevLesson}
                disabled={!lesson.prevLessonId}
                className="w-full"
              >
                <SkipBack size={16} className="ml-2" />
                درس قبلی
              </Button>
              <Button 
                onClick={handleNextLesson}
                disabled={!lesson.nextLessonId}
                className="w-full"
              >
                درس بعدی
                <SkipForward size={16} className="mr-2" />
              </Button>
            </div>

            {lesson.hasDownloadableFiles && (
              <Button variant="outline" className="w-full">
                <Download size={16} className="ml-2" />
                دانلود فایل‌های درس
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppLessonView;