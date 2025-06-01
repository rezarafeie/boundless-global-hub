import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Index";
import CourseArchive from "./pages/CourseArchive";
import AssessmentCenter from "./pages/AssessmentCenter";
import TestLanding from "./pages/Assessment/TestLanding";
import NotFound from "./pages/NotFound";
import EnglishHome from "./pages/en/Index";
import EnglishCourseArchive from "./pages/en/CourseArchive";
import EnglishAssessmentCenter from "./pages/en/AssessmentCenter";
import PaidCourseView from "./pages/Course/PaidCourseView";
import FreeCourseView from "./pages/Course/FreeCourseView";
import BoundlessLanding from "./pages/Courses/BoundlessLanding";
import InstagramLanding from "./pages/Courses/InstagramLanding";
import MetaverseLanding from "./pages/Courses/MetaverseLanding";
import ServitLanding from "./pages/Courses/ServitLanding";
import FreeCourseLanding from "./pages/Courses/FreeCourseLanding";
import InstructorProfilePage from "./pages/InstructorProfile";
import Support from "./pages/Support";
import FreeCourseStart from "./pages/Course/FreeCourseStart";
import PaidCourseStart from "./pages/Course/PaidCourseStart";
import Blog from "./pages/Blog";
import Magazine from "./pages/Magazine";
import PaymentRequest from "./pages/PaymentRequest";
import Dashboard from "./pages/Dashboard/Dashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import ChangeCoursePage from "./pages/Course/ChangeCoursePage";
import BoundlessTastePage from "./pages/Course/BoundlessTastePage";
import PassiveIncomePage from "./pages/Course/PassiveIncomePage";
import AmericanBusinessPage from "./pages/Course/AmericanBusinessPage";
import MetaverseFreePage from "./pages/Course/MetaverseFreePage";
import BoundlessTasteAccess from "./pages/Course/Access/BoundlessTasteAccess";
import AmericanBusinessAccess from "./pages/Course/Access/AmericanBusinessAccess";
import TaghirAccess from "./pages/Course/Access/TaghirAccess";
import PassiveIncomeAccess from "./pages/Course/Access/PassiveIncomeAccess";
import TelegramRedirect from "./pages/Redirect/TelegramRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Persian (Default) Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/courses" element={<CourseArchive />} />
              <Route path="/assessment-center" element={<AssessmentCenter />} />
              
              {/* Assessment Test Routes - Enhanced with new test routes */}
              <Route path="/assessment/:slug" element={<TestLanding />} />
              <Route path="/assessment/personality" element={<TestLanding />} />
              <Route path="/assessment/mbti" element={<TestLanding />} />
              <Route path="/assessment/financial" element={<TestLanding />} />
              <Route path="/assessment/emotional" element={<TestLanding />} />
              <Route path="/assessment/future" element={<TestLanding />} />
              
              <Route path="/course/:courseType/:courseTitle" element={<PaidCourseView />} />
              <Route path="/support" element={<Support />} />
              <Route path="/instructor/reza-rafiei" element={<InstructorProfilePage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/mag" element={<Magazine />} />
              <Route path="/payreq" element={<PaymentRequest />} />
              
              {/* Redirect Routes */}
              <Route path="/redirect/telegram" element={<TelegramRedirect />} />
              
              {/* Free Course Pages */}
              <Route path="/course/change" element={<ChangeCoursePage />} />
              <Route path="/course/boundless-taste" element={<BoundlessTastePage />} />
              <Route path="/course/passive-income" element={<PassiveIncomePage />} />
              <Route path="/course/american-business" element={<AmericanBusinessPage />} />
              <Route path="/course/metaverse-free" element={<MetaverseFreePage />} />
              
              {/* Course Access Pages */}
              <Route path="/access/maze" element={<BoundlessTasteAccess />} />
              <Route path="/access/americanbusiness" element={<AmericanBusinessAccess />} />
              <Route path="/access/taghir" element={<TaghirAccess />} />
              <Route path="/access/daramad" element={<PassiveIncomeAccess />} />
              
              {/* Legacy free course routes - redirect to new format */}
              <Route path="/course/change-project" element={<Navigate to="/course/change" replace />} />
              
              {/* Checkout */}
              <Route path="/checkout/:courseSlug" element={<Checkout />} />
              
              {/* AI Assistant Redirect */}
              <Route path="/ai-assistant" element={<Navigate to="https://ai.rafiei.co/" replace />} />
              
              {/* User Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/panel" element={<Navigate to="/dashboard" replace />} />
              
              {/* Course Start Pages */}
              <Route path="/start/free-course" element={<FreeCourseStart />} />
              <Route path="/start/paid-course" element={<PaidCourseStart />} />
              <Route path="/start/paid-course/:slug" element={<PaidCourseStart />} />
              
              {/* Paid Course Landing Pages */}
              <Route path="/courses/boundless" element={<BoundlessLanding />} />
              <Route path="/courses/instagram" element={<InstagramLanding />} />
              <Route path="/courses/metaverse" element={<MetaverseLanding />} />
              <Route path="/courses/servit" element={<ServitLanding />} />
              
              {/* Boundless redirect */}
              <Route path="/boundless" element={<Navigate to="/courses/boundless" replace />} />
              
              {/* Free Courses Landing Pages */}
              <Route path="/courses/:slug" element={<FreeCourseView />} />
              
              {/* English Routes */}
              <Route path="/en" element={<EnglishHome />} />
              <Route path="/en/about" element={<About />} />
              <Route path="/en/contact" element={<Contact />} />
              <Route path="/en/courses" element={<EnglishCourseArchive />} />
              <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />
              <Route path="/en/assessment/:slug" element={<TestLanding />} />
              <Route path="/en/assessment/personality" element={<TestLanding />} />
              <Route path="/en/assessment/mbti" element={<TestLanding />} />
              <Route path="/en/assessment/financial" element={<TestLanding />} />
              <Route path="/en/assessment/emotional" element={<TestLanding />} />
              <Route path="/en/assessment/future" element={<TestLanding />} />
              <Route path="/en/course/:courseType/:courseTitle" element={<PaidCourseView language="en" />} />
              <Route path="/en/ai-assistant" element={<Navigate to="https://ai.rafiei.co/" replace />} />
              <Route path="/en/courses/boundless" element={<BoundlessLanding />} />
              <Route path="/en/courses/instagram" element={<InstagramLanding />} />
              <Route path="/en/courses/metaverse" element={<MetaverseLanding />} />
              <Route path="/en/courses/servit" element={<ServitLanding />} />
              <Route path="/en/support" element={<Support />} />
              <Route path="/en/blog" element={<Blog />} />
              <Route path="/en/mag" element={<Magazine />} />
              <Route path="/en/payreq" element={<PaymentRequest />} />
              <Route path="/en/dashboard" element={<Dashboard />} />
              <Route path="/en/courses/:slug" element={<FreeCourseView language="en" />} />
              <Route path="/en/checkout/:courseSlug" element={<Checkout />} />
              
              {/* Legacy redirects */}
              <Route path="/paid-courses" element={<Navigate to="/courses" replace />} />
              <Route path="/free-courses" element={<Navigate to="/courses" replace />} />
              <Route path="/en/paid-courses" element={<Navigate to="/en/courses" replace />} />
              <Route path="/en/free-courses" element={<Navigate to="/en/courses" replace />} />
              
              {/* Redirects and Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
