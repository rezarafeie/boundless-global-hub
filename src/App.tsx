import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";

// Existing imports
import Index from "./pages/Index";
import FreeCourses from "./pages/FreeCourses";
import PaidCourses from "./pages/PaidCourses";
import Checkout from "./pages/Checkout";
import CourseAccessSuccess from "./pages/CourseAccessSuccess";
import PaymentSuccess from "./pages/PaymentSuccess";
import Support from "./pages/Support";
import Blog from "./pages/Blog";
import Dashboard from "./pages/Dashboard";
import AllCourses from "./pages/AllCourses";
import AssessmentCenter from "./pages/AssessmentCenter";
import CourseArchive from "./pages/CourseArchive";
import InstructorProfile from "./pages/InstructorProfile";
import AIAssistant from "./pages/AIAssistant";
import NotFound from "./pages/NotFound";

// English pages
import EnglishIndex from "./pages/en/Index";
import EnglishFreeCourses from "./pages/en/FreeCourses";
import EnglishPaidCourses from "./pages/en/PaidCourses";
import EnglishAssessmentCenter from "./pages/en/AssessmentCenter";
import EnglishCourseArchive from "./pages/en/CourseArchive";

// Course pages
import FreeCourseView from "./pages/Course/FreeCourseView";
import PaidCourseView from "./pages/Course/PaidCourseView";
import FreeCourseStart from "./pages/Course/FreeCourseStart";
import PaidCourseStart from "./pages/Course/PaidCourseStart";

// Course Landing Pages - Paid
import BoundlessLanding from "./pages/Courses/BoundlessLanding";
import InstagramLanding from "./pages/Courses/InstagramLanding";
import MetaverseLanding from "./pages/Courses/MetaverseLanding";
import WealthLanding from "./pages/Courses/WealthLanding";

// Course Landing Pages - Free
import MazzeBedooneMarzLanding from "./pages/Courses/MazzeBedooneMarzLanding";
import PassiveIncomeLanding from "./pages/Courses/PassiveIncomeLanding";
import ChangeLanding from "./pages/Courses/ChangeLanding";
import AmericanBusinessLanding from "./pages/Courses/AmericanBusinessLanding";

// Assessment
import TestLanding from "./pages/Assessment/TestLanding";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen">
            <Routes>
              {/* Main Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/free-courses" element={<FreeCourses />} />
              <Route path="/paid-courses" element={<PaidCourses />} />
              <Route path="/checkout/:courseSlug" element={<Checkout />} />
              <Route path="/course-access-success" element={<CourseAccessSuccess />} />
              <Route path="/payment-success/:courseSlug" element={<PaymentSuccess />} />
              <Route path="/support" element={<Support />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<AllCourses />} />
              <Route path="/assessment" element={<AssessmentCenter />} />
              <Route path="/course-archive" element={<CourseArchive />} />
              <Route path="/instructor" element={<InstructorProfile />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />

              {/* English Routes */}
              <Route path="/en" element={<EnglishIndex />} />
              <Route path="/en/free-courses" element={<EnglishFreeCourses />} />
              <Route path="/en/paid-courses" element={<EnglishPaidCourses />} />
              <Route path="/en/assessment" element={<EnglishAssessmentCenter />} />
              <Route path="/en/course-archive" element={<EnglishCourseArchive />} />

              {/* Free Course Landing Pages */}
              <Route path="/free-course/boundless-taste" element={<MazzeBedooneMarzLanding />} />
              <Route path="/free-course/passive-income-ai" element={<PassiveIncomeLanding />} />
              <Route path="/free-course/change-project" element={<ChangeLanding />} />
              <Route path="/free-course/american-business" element={<AmericanBusinessLanding />} />

              {/* Paid Course Landing Pages */}
              <Route path="/course/boundless" element={<BoundlessLanding />} />
              <Route path="/course/instagram" element={<InstagramLanding />} />
              <Route path="/course/metaverse" element={<MetaverseLanding />} />
              <Route path="/course/wealth" element={<WealthLanding />} />

              {/* Course Content Pages */}
              <Route path="/course/free/:courseTitle" element={<FreeCourseView />} />
              <Route path="/course/paid/:courseTitle" element={<PaidCourseView />} />
              <Route path="/start/free/:courseSlug" element={<FreeCourseStart />} />
              <Route path="/start/paid/:courseSlug" element={<PaidCourseStart />} />

              {/* English Course Content */}
              <Route path="/en/course/free/:courseTitle" element={<FreeCourseView language="en" />} />
              <Route path="/en/course/paid/:courseTitle" element={<PaidCourseView language="en" />} />

              {/* Assessment Routes */}
              <Route path="/test/:testId" element={<TestLanding />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
