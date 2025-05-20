
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Index";
import PaidCourses from "./pages/PaidCourses";
import FreeCourses from "./pages/FreeCourses";
import AssessmentCenter from "./pages/AssessmentCenter";
import NotFound from "./pages/NotFound";
import EnglishHome from "./pages/en/Index";
import EnglishPaidCourses from "./pages/en/PaidCourses";
import EnglishFreeCourses from "./pages/en/FreeCourses";
import EnglishAssessmentCenter from "./pages/en/AssessmentCenter";
import PaidCourseView from "./pages/Course/PaidCourseView";
import FreeCourseView from "./pages/Course/FreeCourseView";
import AIAssistantView from "./pages/AIAssistant";

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
            <Route path="/paid-courses" element={<PaidCourses />} />
            <Route path="/free-courses" element={<FreeCourses />} />
            <Route path="/assessment-center" element={<AssessmentCenter />} />
            <Route path="/course/paid/:courseTitle" element={<PaidCourseView />} />
            <Route path="/course/free/:courseTitle" element={<FreeCourseView />} />
            <Route path="/ai-assistant" element={<AIAssistantView />} />
            
            {/* English Routes */}
            <Route path="/en" element={<EnglishHome />} />
            <Route path="/en/paid-courses" element={<EnglishPaidCourses />} />
            <Route path="/en/free-courses" element={<EnglishFreeCourses />} />
            <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />
            <Route path="/en/course/paid/:courseTitle" element={<PaidCourseView language="en" />} />
            <Route path="/en/course/free/:courseTitle" element={<FreeCourseView language="en" />} />
            <Route path="/en/ai-assistant" element={<AIAssistantView language="en" />} />
            
            {/* Redirects and Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </LanguageProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
