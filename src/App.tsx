
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import PaidCourses from "./pages/PaidCourses";
import FreeCourses from "./pages/FreeCourses";
import AssessmentCenter from "./pages/AssessmentCenter";
import TestLanding from "./pages/Assessment/TestLanding";
import Blog from "./pages/Blog";
import Support from "./pages/Support";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CourseArchive from "./pages/CourseArchive";
import AIAssistant from "./pages/AIAssistant";
import PaidCourseStart from "./pages/Course/PaidCourseStart";
import FreeCourseStart from "./pages/Course/FreeCourseStart";
import PaidCourseView from "./pages/Course/PaidCourseView";
import FreeCourseView from "./pages/Course/FreeCourseView";
import BoundlessLanding from "./pages/Courses/BoundlessLanding";
import InstagramLanding from "./pages/Courses/InstagramLanding";
import FreeCourseLanding from "./pages/Courses/FreeCourseLanding";
import MetaverseLanding from "./pages/Courses/MetaverseLanding";
import InstructorProfile from "./pages/InstructorProfile";

// English routes
import EnglishIndex from "./pages/en/Index";
import EnglishPaidCourses from "./pages/en/PaidCourses";
import EnglishFreeCourses from "./pages/en/FreeCourses";
import EnglishAssessmentCenter from "./pages/en/AssessmentCenter";
import EnglishCourseArchive from "./pages/en/CourseArchive";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Persian routes */}
              <Route path="/" element={<Index />} />
              <Route path="/paid-courses" element={<PaidCourses />} />
              <Route path="/free-courses" element={<FreeCourses />} />
              <Route path="/assessment-center" element={<AssessmentCenter />} />
              <Route path="/assessment/:slug" element={<TestLanding />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/support" element={<Support />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/course-archive" element={<CourseArchive />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/instructor" element={<InstructorProfile />} />
              
              {/* Course routes */}
              <Route path="/course/boundless" element={<BoundlessLanding />} />
              <Route path="/course/instagram" element={<InstagramLanding />} />
              <Route path="/course/metaverse" element={<MetaverseLanding />} />
              <Route path="/course/wealth" element={<BoundlessLanding />} />
              <Route 
                path="/course/boundless-taste" 
                element={
                  <FreeCourseLanding 
                    title="طعم بدون مرز"
                    englishTitle="Boundless Taste"
                    description="آشنایی اولیه با مفاهیم کلیدی کسب‌وکار بدون مرز"
                    benefitOne="یادگیری اصول پایه کسب‌وکار آنلاین"
                    benefitTwo="شناخت ابزارهای ضروری برای شروع"
                    iconType="graduation"
                  />
                } 
              />
              <Route 
                path="/course/passive-income-ai" 
                element={
                  <FreeCourseLanding 
                    title="درآمد غیرفعال با هوش مصنوعی"
                    englishTitle="Passive Income with AI"
                    description="راه‌های عملی کسب درآمد با استفاده از ابزارهای هوش مصنوعی"
                    benefitOne="آشنایی با ابزارهای AI پردرآمد"
                    benefitTwo="استراتژی‌های کسب درآمد غیرفعال"
                    iconType="message"
                  />
                } 
              />
              
              {/* Course start routes */}
              <Route path="/start/paid-course" element={<PaidCourseStart />} />
              <Route path="/start/free-course" element={<FreeCourseStart />} />
              <Route path="/paid/:slug" element={<PaidCourseView />} />
              <Route path="/free/:slug" element={<FreeCourseView />} />
              
              {/* English routes */}
              <Route path="/en" element={<EnglishIndex />} />
              <Route path="/en/paid-courses" element={<EnglishPaidCourses />} />
              <Route path="/en/free-courses" element={<EnglishFreeCourses />} />
              <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />
              <Route path="/en/course-archive" element={<EnglishCourseArchive />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
