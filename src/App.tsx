import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import EnglishIndex from "./pages/en/Index";
import PaidCourses from "./pages/PaidCourses";
import FreeCourses from "./pages/FreeCourses";
import EnglishPaidCourses from "./pages/en/PaidCourses";
import EnglishFreeCourses from "./pages/en/FreeCourses";
import AssessmentCenter from "./pages/AssessmentCenter";
import EnglishAssessmentCenter from "./pages/en/AssessmentCenter";
import TestLanding from "./pages/Assessment/TestLanding";
import BoundlessLanding from "./pages/Courses/BoundlessLanding";
import InstagramLanding from "./pages/Courses/InstagramLanding";
import MetaverseLanding from "./pages/Courses/MetaverseLanding";
import ServitLanding from "./pages/Courses/ServitLanding";
import InstagramEssentialsLanding from "./pages/Courses/InstagramEssentialsLanding";
import CourseArchive from "./pages/CourseArchive";
import EnglishCourseArchive from "./pages/en/CourseArchive";
import Dashboard from "./pages/Dashboard/Dashboard";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Support from "./pages/Support";
import Blog from "./pages/Blog";
import Magazine from "./pages/Magazine";
import InstructorProfile from "./pages/InstructorProfile";
import Checkout from "./pages/Checkout";
import PaymentRequest from "./pages/PaymentRequest";
import AIAssistant from "./pages/AIAssistant";

// Course access pages
import BoundlessTasteAccess from "./pages/Course/Access/BoundlessTasteAccess";
import PassiveIncomeAccess from "./pages/Course/Access/PassiveIncomeAccess";
import TaghirAccess from "./pages/Course/Access/TaghirAccess";
import AmericanBusinessAccess from "./pages/Course/Access/AmericanBusinessAccess";

// Course pages
import BoundlessTastePage from "./pages/Course/BoundlessTastePage";
import PassiveIncomePage from "./pages/Course/PassiveIncomePage";
import ChangeCoursePage from "./pages/Course/ChangeCoursePage";
import AmericanBusinessPage from "./pages/Course/AmericanBusinessPage";
import MetaverseFreePage from "./pages/Course/MetaverseFreePage";
import PaidCourseView from "./pages/Course/PaidCourseView";
import FreeCourseView from "./pages/Course/FreeCourseView";
import PaidCourseStart from "./pages/Course/PaidCourseStart";
import FreeCourseStart from "./pages/Course/FreeCourseStart";

// New pages
import Live from "./pages/Live";
import Media from "./pages/Media";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Main routes */}
              <Route path="/" element={<Index />} />
              <Route path="/en" element={<EnglishIndex />} />
              
              {/* Course routes */}
              <Route path="/courses" element={<PaidCourses />} />
              <Route path="/free-courses" element={<FreeCourses />} />
              <Route path="/en/paid-courses" element={<EnglishPaidCourses />} />
              <Route path="/en/free-courses" element={<EnglishFreeCourses />} />
              <Route path="/course-archive" element={<CourseArchive />} />
              <Route path="/en/course-archive" element={<EnglishCourseArchive />} />
              
              {/* Assessment routes */}
              <Route path="/assessment-center" element={<AssessmentCenter />} />
              <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />
              <Route path="/test/:testType" element={<TestLanding />} />
              
              {/* Course landing pages */}
              <Route path="/courses/boundless" element={<BoundlessLanding />} />
              <Route path="/courses/instagram" element={<InstagramLanding />} />
              <Route path="/courses/metaverse" element={<MetaverseLanding />} />
              <Route path="/courses/servit" element={<ServitLanding />} />
              <Route path="/courses/instagram-essentials" element={<InstagramEssentialsLanding />} />
              
              {/* Course access pages */}
              <Route path="/access/maze" element={<BoundlessTasteAccess />} />
              <Route path="/access/passive-income" element={<PassiveIncomeAccess />} />
              <Route path="/access/taghir" element={<TaghirAccess />} />
              <Route path="/access/american-business" element={<AmericanBusinessAccess />} />
              
              {/* Individual course pages */}
              <Route path="/course/boundless-taste" element={<BoundlessTastePage />} />
              <Route path="/course/passive-income" element={<PassiveIncomePage />} />
              <Route path="/course/change" element={<ChangeCoursePage />} />
              <Route path="/course/american-business" element={<AmericanBusinessPage />} />
              <Route path="/course/metaverse-free" element={<MetaverseFreePage />} />
              
              {/* Course viewing routes */}
              <Route path="/view/course/:slug" element={<PaidCourseView />} />
              <Route path="/view/free-course/:slug" element={<FreeCourseView />} />
              <Route path="/start/course/:slug" element={<PaidCourseStart />} />
              <Route path="/start/free-course/:slug" element={<FreeCourseStart />} />
              
              {/* Media routes */}
              <Route path="/live" element={<Live />} />
              <Route path="/media" element={<Media />} />
              
              {/* Other routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/mag" element={<Magazine />} />
              <Route path="/magazine" element={<Magazine />} />
              <Route path="/instructor/:slug" element={<InstructorProfile />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<PaymentRequest />} />
              <Route path="/ai" element={<AIAssistant />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
