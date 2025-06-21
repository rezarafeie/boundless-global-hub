
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes,Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FreeCourses from "./pages/FreeCourses";
import PaidCourses from "./pages/PaidCourses";
import CourseArchive from "./pages/CourseArchive";
import Blog from "./pages/Blog";
import Magazine from "./pages/Magazine";
import Support from "./pages/Support";
import Checkout from "./pages/Checkout";
import PaymentRequest from "./pages/PaymentRequest";
import Dashboard from "./pages/Dashboard/Dashboard";
import NotFound from "./pages/NotFound";
import InstructorProfile from "./pages/InstructorProfile";
import AssessmentCenter from "./pages/AssessmentCenter";
import AIAssistant from "./pages/AIAssistant";
import TestLanding from "./pages/Assessment/TestLanding";
import TelegramRedirect from "./pages/Redirect/TelegramRedirect";
import SolidarityLanding from "./pages/Solidarity/SolidarityLanding";

// Course Pages
import MetaverseLanding from "./pages/Courses/MetaverseLanding";
import BoundlessLanding from "./pages/Courses/BoundlessLanding";
import InstagramLanding from "./pages/Courses/InstagramLanding";
import InstagramEssentialsLanding from "./pages/Courses/InstagramEssentialsLanding";
import FreeCourseLanding from "./pages/Courses/FreeCourseLanding";
import SmartPackLanding from "./pages/Courses/SmartPackLanding";
import ServitLanding from "./pages/Courses/ServitLanding";

// Course Access Pages
import AmericanBusinessAccess from "./pages/Course/Access/AmericanBusinessAccess";
import BoundlessTasteAccess from "./pages/Course/Access/BoundlessTasteAccess";
import PassiveIncomeAccess from "./pages/Course/Access/PassiveIncomeAccess";
import TaghirAccess from "./pages/Course/Access/TaghirAccess";

// Course Pages
import AmericanBusinessPage from "./pages/Course/AmericanBusinessPage";
import BoundlessTastePage from "./pages/Course/BoundlessTastePage";
import PassiveIncomePage from "./pages/Course/PassiveIncomePage";
import ChangeCoursePage from "./pages/Course/ChangeCoursePage";
import MetaverseFreePage from "./pages/Course/MetaverseFreePage";

// Course Start/View Pages
import FreeCourseStart from "./pages/Course/FreeCourseStart";
import FreeCourseView from "./pages/Course/FreeCourseView";
import PaidCourseStart from "./pages/Course/PaidCourseStart";
import PaidCourseView from "./pages/Course/PaidCourseView";

// Borderless Hub Pages
import BorderlessHub from "./pages/BorderlessHub";
import BorderlessHubChat from "./pages/BorderlessHubChat";
import BorderlessHubAdmin from "./pages/BorderlessHubAdmin";
import BorderlessHubMessenger from "./pages/BorderlessHubMessenger";
import BorderlessHubMessengerAdmin from "./pages/BorderlessHubMessengerAdmin";
import MessengerPending from "./pages/MessengerPending";

// English Pages
import EnglishIndex from "./pages/en/Index";
import EnglishFreeCourses from "./pages/en/FreeCourses";
import EnglishPaidCourses from "./pages/en/PaidCourses";
import EnglishCourseArchive from "./pages/en/CourseArchive";
import EnglishAssessmentCenter from "./pages/en/AssessmentCenter";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/free-courses" element={<FreeCourses />} />
                <Route path="/paid-courses" element={<PaidCourses />} />
                <Route path="/course-archive" element={<CourseArchive />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/magazine" element={<Magazine />} />
                <Route path="/support" element={<Support />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment-request" element={<PaymentRequest />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/instructor-profile" element={<InstructorProfile />} />
                <Route path="/assessment-center" element={<AssessmentCenter />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/assessment/test" element={<TestLanding />} />
                <Route path="/redirect/telegram" element={<TelegramRedirect />} />
                <Route path="/solidarity" element={<SolidarityLanding />} />

                {/* Course Landing Pages */}
                <Route path="/course/metaverse" element={<MetaverseLanding />} />
                <Route path="/course/boundless" element={<BoundlessLanding />} />
                <Route path="/course/instagram" element={<InstagramLanding />} />
                <Route path="/course/instagram-essentials" element={<InstagramEssentialsLanding />} />
                <Route path="/course/free" element={
                  <FreeCourseLanding 
                    title="دوره رایگان متاورس"
                    englishTitle="Free Metaverse Course"
                    description="دوره جامع و رایگان آموزش متاورس"
                    benefitOne="آموزش کامل و رایگان"
                    benefitTwo="دسترسی آسان و سریع"
                    iconType="book"
                    iframeUrl="https://example.com/course-iframe"
                  />
                } />
                <Route path="/course/smart-pack" element={<SmartPackLanding />} />
                <Route path="/course/servit" element={<ServitLanding />} />

                {/* Course Access Pages */}
                <Route path="/course/american-business/access" element={<AmericanBusinessAccess />} />
                <Route path="/course/boundless-taste/access" element={<BoundlessTasteAccess />} />
                <Route path="/course/passive-income/access" element={<PassiveIncomeAccess />} />
                <Route path="/course/taghir/access" element={<TaghirAccess />} />

                {/* Course Pages */}
                <Route path="/course/american-business" element={<AmericanBusinessPage />} />
                <Route path="/course/boundless-taste" element={<BoundlessTastePage />} />
                <Route path="/course/passive-income" element={<PassiveIncomePage />} />
                <Route path="/course/change" element={<ChangeCoursePage />} />
                <Route path="/course/metaverse-free" element={<MetaverseFreePage />} />

                {/* Course Start/View Pages */}
                <Route path="/course/start/free/:courseId" element={<FreeCourseStart />} />
                <Route path="/course/view/free/:courseId" element={<FreeCourseView />} />
                <Route path="/course/start/paid/:courseId" element={<PaidCourseStart />} />
                <Route path="/course/view/paid/:courseId" element={<PaidCourseView />} />

                {/* Borderless Hub */}
                <Route path="/hub" element={<BorderlessHub />} />
                <Route path="/hub/chat" element={<BorderlessHubChat />} />
                <Route path="/hub/admin" element={<BorderlessHubAdmin />} />
                <Route path="/hub/messenger" element={<BorderlessHubMessenger />} />
                <Route path="/hub/messenger/pending" element={<MessengerPending />} />
                <Route path="/hub/messenger/admin" element={<BorderlessHubMessengerAdmin />} />

                {/* English Routes */}
                <Route path="/en" element={<EnglishIndex />} />
                <Route path="/en/free-courses" element={<EnglishFreeCourses />} />
                <Route path="/en/paid-courses" element={<EnglishPaidCourses />} />
                <Route path="/en/course-archive" element={<EnglishCourseArchive />} />
                <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
