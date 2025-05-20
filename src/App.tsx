
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
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
import UserProfile from "./pages/Dashboard/UserProfile";
import AIAssistant from "./pages/AIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
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
              <Route path="/ai-assistant" element={<AIAssistant />} />
              
              {/* User Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<UserProfile />} />
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
              <Route path="/courses/:slug" element={<FreeCourseView />} />
              
              {/* English Routes */}
              <Route path="/en" element={<EnglishHome />} />
              <Route path="/en/courses" element={<EnglishCourseArchive />} />
              <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />
              <Route path="/en/course/:courseType/:courseTitle" element={<PaidCourseView language="en" />} />
              <Route path="/en/ai-assistant" element={<AIAssistant language="en" />} />
              <Route path="/en/courses/boundless" element={<BoundlessLanding />} />
              <Route path="/en/courses/instagram" element={<InstagramLanding />} />
              <Route path="/en/courses/metaverse" element={<MetaverseLanding />} />
              <Route path="/en/support" element={<Support />} />
              <Route path="/en/blog" element={<Blog />} />
              <Route path="/en/dashboard" element={<Dashboard />} />
              <Route path="/en/profile" element={<UserProfile />} />
              <Route path="/en/courses/:slug" element={<FreeCourseView language="en" />} />
              
              {/* Legacy redirects */}
              <Route path="/paid-courses" element={<Navigate to="/courses" replace />} />
              <Route path="/free-courses" element={<Navigate to="/courses" replace />} />
              <Route path="/en/paid-courses" element={<Navigate to="/en/courses" replace />} />
              <Route path="/en/free-courses" element={<Navigate to="/en/courses" replace />} />
              
              {/* Redirects and Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
