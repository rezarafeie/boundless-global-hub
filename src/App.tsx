
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Index";
import CourseArchive from "./pages/CourseArchive";
import AssessmentCenter from "./pages/AssessmentCenter";
import NotFound from "./pages/NotFound";
import EnglishHome from "./pages/en/Index";
import EnglishCourseArchive from "./pages/en/CourseArchive";
import EnglishAssessmentCenter from "./pages/en/AssessmentCenter";
import PaidCourseView from "./pages/Course/PaidCourseView";
import FreeCourseView from "./pages/Course/FreeCourseView";
import BoundlessLanding from "./pages/Courses/BoundlessLanding";
import InstagramLanding from "./pages/Courses/InstagramLanding";
import MetaverseLanding from "./pages/Courses/MetaverseLanding";
import FreeCourseLanding from "./pages/Courses/FreeCourseLanding";
import InstructorProfilePage from "./pages/InstructorProfile";
import Support from "./pages/Support";
import FreeCourseStart from "./pages/Course/FreeCourseStart";
import PaidCourseStart from "./pages/Course/PaidCourseStart";
import Blog from "./pages/Blog";
import Dashboard from "./pages/Dashboard/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Persian (Default) Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<CourseArchive />} />
            <Route path="/assessment-center" element={<AssessmentCenter />} />
            <Route path="/course/:courseType/:courseTitle" element={<PaidCourseView />} />
            <Route path="/support" element={<Support />} />
            <Route path="/instructor/reza-rafiei" element={<InstructorProfilePage />} />
            <Route path="/blog" element={<Blog />} />
            
            {/* AI Assistant Redirect */}
            <Route path="/ai-assistant" element={<Navigate to="https://ai.rafiei.co/" replace />} />
            
            {/* User Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/panel" element={<Navigate to="/dashboard" replace />} />
            
            {/* Course Start Pages */}
            <Route path="/start/free-course" element={<FreeCourseStart />} />
            <Route path="/start/paid-course" element={<PaidCourseStart />} />
            
            {/* Course Landing Pages */}
            <Route path="/courses/boundless" element={<BoundlessLanding />} />
            <Route path="/courses/instagram" element={<InstagramLanding />} />
            <Route path="/courses/metaverse" element={<MetaverseLanding />} />
            
            {/* Boundless redirect */}
            <Route path="/boundless" element={<Navigate to="/courses/boundless" replace />} />
            
            {/* Free Courses Landing Pages */}
            <Route 
              path="/courses/boundless-taste" 
              element={
                <FreeCourseLanding 
                  title="دوره رایگان مزه بدون مرز" 
                  englishTitle="Boundless Taste"
                  description="یک پیش‌نمایش رایگان از دوره اصلی بدون مرز برای آشنایی با مفاهیم کسب درآمد بین‌المللی"
                  benefitOne="آشنایی با مفهوم کسب و کار بدون مرز و امکان‌سنجی آن"
                  benefitTwo="شناخت زیرساخت‌های لازم برای ورود به بازار جهانی"
                  iconType="graduation"
                />
              } 
            />
            <Route 
              path="/courses/passive-income" 
              element={
                <FreeCourseLanding 
                  title="دوره رایگان درآمد غیرفعال" 
                  englishTitle="Passive Income with AI"
                  description="آشنایی با روش‌های تولید محتوا و محصولات دیجیتالی با کمک هوش مصنوعی و کسب درآمد غیرفعال"
                  benefitOne="آشنایی با انواع محصولات دیجیتال پرفروش"
                  benefitTwo="یادگیری اصول استفاده از هوش مصنوعی برای تولید محتوا"
                  iconType="file"
                />
              } 
            />
            <Route 
              path="/courses/american-business" 
              element={
                <FreeCourseLanding 
                  title="دوره رایگان بیزینس آمریکایی" 
                  englishTitle="American Business Essentials"
                  description="آشنایی با اصول راه‌اندازی و مدیریت کسب و کار در آمریکا و استراتژی‌های ورود به بازار بین‌المللی"
                  benefitOne="شناخت ساختارهای قانونی کسب و کار در آمریکا"
                  benefitTwo="آشنایی با مراحل ثبت شرکت و اصول مالیاتی"
                  iconType="book"
                />
              } 
            />
            <Route 
              path="/courses/change-project" 
              element={
                <FreeCourseLanding 
                  title="دوره رایگان پروژه تغییر" 
                  englishTitle="Change Project"
                  description="آشنایی با اصول تغییر در زندگی شخصی و کاری و استراتژی‌های رسیدن به اهداف بزرگ"
                  benefitOne="یادگیری چارچوب‌های تغییر موفق در زندگی"
                  benefitTwo="آشنایی با ابزارهای مدیریت تغییر و غلبه بر مقاومت‌ها"
                  iconType="graduation"
                />
              } 
            />
            <Route 
              path="/courses/wealth" 
              element={
                <FreeCourseLanding 
                  title="دوره رایگان ثروت" 
                  englishTitle="Wealth Mindset"
                  description="آشنایی با اصول ذهنیت ثروت‌آفرین و استراتژی‌های مالی برای رسیدن به استقلال مالی"
                  benefitOne="شناخت باورهای محدودکننده درباره پول و نحوه تغییر آنها"
                  benefitTwo="آشنایی با اصول برنامه‌ریزی مالی و سرمایه‌گذاری"
                  iconType="message"
                />
              } 
            />
            <Route 
              path="/courses/instagram-free" 
              element={
                <FreeCourseLanding 
                  title="دوره رایگان مزه اینستاگرام" 
                  englishTitle="Instagram Taste"
                  description="یک پیش‌نمایش رایگان از دوره اصلی اسباب اینستاگرام برای آشنایی با مفاهیم پایه بازاریابی در اینستاگرام"
                  benefitOne="آشنایی با اصول پایه ساخت پروفایل حرفه‌ای"
                  benefitTwo="یادگیری نکات ساده اما موثر برای تولید محتوای جذاب"
                  iconType="file"
                />
              } 
            />
            <Route 
              path="/courses/future-seminar" 
              element={
                <FreeCourseLanding 
                  title="ویدیوی سمینار آینده" 
                  englishTitle="Future Seminar Video"
                  description="سمینار آموزشی رایگان درباره تغییرات بازار کار در آینده و فرصت‌های شغلی نوظهور"
                  benefitOne="آشنایی با مشاغل آینده و مهارت‌های مورد نیاز"
                  benefitTwo="استراتژی‌های آماده‌سازی برای تحولات بازار کار"
                  iconType="message"
                />
              } 
            />
            <Route 
              path="/courses/metaverse-free" 
              element={
                <FreeCourseLanding 
                  title="دوره رایگان آشنایی با متاورس" 
                  englishTitle="Metaverse Introduction"
                  description="آشنایی با مفاهیم پایه متاورس، ارزهای دیجیتال و فرصت‌های این فناوری نوظهور"
                  benefitOne="درک مفهوم متاورس و کاربردهای آن در زندگی روزمره"
                  benefitTwo="آشنایی با مفاهیم اولیه ارزهای دیجیتال و NFT"
                  iconType="graduation"
                />
              } 
            />
            <Route 
              path="/courses/business-intelligence" 
              element={
                <FreeCourseLanding 
                  title="دوره هوش تجاری" 
                  englishTitle="Business Intelligence"
                  description="آشنایی با اصول هوش تجاری و تحلیل داده‌ها برای تصمیم‌گیری‌های کسب‌وکار"
                  benefitOne="یادگیری تحلیل داده‌های کسب‌وکار و ساخت داشبوردهای مدیریتی"
                  benefitTwo="توانایی استفاده از هوش تجاری برای بهبود عملکرد کسب‌وکار"
                  iconType="book"
                />
              } 
            />
            <Route 
              path="/courses/marketplace-business" 
              element={
                <FreeCourseLanding 
                  title="کسب‌وکار در مارکت‌پلیس‌ها" 
                  englishTitle="Marketplace Business"
                  description="آموزش جامع کسب درآمد از طریق فروش محصولات دیجیتال در مارکت‌پلیس‌های بین‌المللی"
                  benefitOne="یادگیری اصول طراحی و فروش محصولات دیجیتال در پلتفرم‌های جهانی"
                  benefitTwo="راه‌اندازی کسب‌وکار دیجیتالی در مارکت‌پلیس‌های معتبر"
                  iconType="graduation"
                />
              } 
            />
            
            {/* English Routes */}
            <Route path="/en" element={<EnglishHome />} />
            <Route path="/en/courses" element={<EnglishCourseArchive />} />
            <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />
            <Route path="/en/course/:courseType/:courseTitle" element={<PaidCourseView language="en" />} />
            <Route path="/en/ai-assistant" element={<Navigate to="https://ai.rafiei.co/" replace />} />
            <Route path="/en/courses/boundless" element={<BoundlessLanding />} />
            <Route path="/en/courses/instagram" element={<InstagramLanding />} />
            <Route path="/en/courses/metaverse" element={<MetaverseLanding />} />
            <Route path="/en/support" element={<Support />} />
            <Route path="/en/blog" element={<Blog />} />
            <Route path="/en/dashboard" element={<Dashboard />} />
            
            {/* Legacy redirects */}
            <Route path="/paid-courses" element={<Navigate to="/courses" replace />} />
            <Route path="/free-courses" element={<Navigate to="/courses" replace />} />
            <Route path="/en/paid-courses" element={<Navigate to="/en/courses" replace />} />
            <Route path="/en/free-courses" element={<Navigate to="/en/courses" replace />} />
            
            {/* Redirects and Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </LanguageProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
