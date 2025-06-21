import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Import all pages and components
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Blog from "./pages/Magazine";
import FreeCourses from "./pages/FreeCourses";
import PaidCourses from "./pages/PaidCourses";
import CourseArchive from "./pages/CourseArchive";
import AssessmentCenter from "./pages/AssessmentCenter";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import BorderlessHub from "./pages/BorderlessHub";
import BorderlessHubChat from "./pages/BorderlessHubChat";
import BorderlessHubMessenger from "./pages/BorderlessHubMessenger";
import BorderlessHubAdmin from "./pages/BorderlessHubAdmin";
import Checkout from "./pages/Checkout";
import PaymentRequest from "./pages/PaymentRequest";

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
              {/* Main Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/magazine" element={<Navigate to="/blog" replace />} />

              {/* Course Routes */}
              <Route path="/courses/free" element={<FreeCourses />} />
              <Route path="/courses/paid" element={<PaidCourses />} />
              <Route path="/courses/archive" element={<CourseArchive />} />

              {/* Assessment Center */}
              <Route path="/assessment" element={<AssessmentCenter />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* AI Assistant */}
              <Route path="/ai-assistant" element={<AIAssistant />} />

              {/* Checkout and Payment */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-request" element={<PaymentRequest />} />

              {/* Hub Routes */}
              <Route path="/hub" element={<BorderlessHub />} />
              <Route path="/hub/chat" element={<BorderlessHubChat />} />
              <Route path="/hub/messenger" element={<BorderlessHubMessenger />} />
              <Route path="/hub/admin" element={<BorderlessHubAdmin />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
