
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import TrainingCenter from "./pages/TrainingCenter";
import CourseDetail from "./pages/CourseDetail";
import AssessmentCenter from "./pages/AssessmentCenter";
import Blog from "./pages/Blog";
import FreeCourses from "./pages/FreeCourses";
import PaidCourses from "./pages/PaidCourses";
import EnglishIndex from "./pages/en/Index";
import EnglishCourseArchive from "./pages/en/CourseArchive";
import EnglishPaidCourses from "./pages/en/PaidCourses";
import Dashboard from "./pages/Dashboard/Dashboard";
import BoundlessLanding from "./pages/Courses/BoundlessLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<TrainingCenter />} />
              <Route path="/course/:slug" element={<CourseDetail />} />
              <Route path="/assessment-center" element={<AssessmentCenter />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/free-courses" element={<FreeCourses />} />
              <Route path="/paid-courses" element={<PaidCourses />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/boundless" element={<BoundlessLanding />} />
              
              {/* English routes */}
              <Route path="/en" element={<EnglishIndex />} />
              <Route path="/en/courses" element={<EnglishCourseArchive />} />
              <Route path="/en/paid-courses" element={<EnglishPaidCourses />} />
              <Route path="/en/course/:slug" element={<CourseDetail />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
