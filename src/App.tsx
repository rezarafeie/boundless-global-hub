
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/hooks/useAuth';
import MainLayout from '@/components/Layout/MainLayout';

// Pages
import Index from '@/pages/Index';
import FreeCourses from '@/pages/FreeCourses';
import PaidCourses from '@/pages/PaidCourses';
import CourseArchive from '@/pages/CourseArchive';
import AssessmentCenter from '@/pages/AssessmentCenter';
import Blog from '@/pages/Blog';
import Support from '@/pages/Support';
import Dashboard from '@/pages/Dashboard';
import InstructorProfile from '@/pages/InstructorProfile';
import AIAssistant from '@/pages/AIAssistant';
import NotFound from '@/pages/NotFound';
import PaymentSuccess from '@/pages/PaymentSuccess';

// Course pages
import BoundlessLanding from '@/pages/Courses/BoundlessLanding';
import InstagramLanding from '@/pages/Courses/InstagramLanding';
import MetaverseLanding from '@/pages/Courses/MetaverseLanding';
import WealthLanding from '@/pages/Courses/WealthLanding';
import FreeCourseStart from '@/pages/Course/FreeCourseStart';
import FreeCourseView from '@/pages/Course/FreeCourseView';
import PaidCourseStart from '@/pages/Course/PaidCourseStart';
import PaidCourseView from '@/pages/Course/PaidCourseView';

// Test pages
import TestLanding from '@/pages/Assessment/TestLanding';

// English pages
import EnIndex from '@/pages/en/Index';
import EnFreeCourses from '@/pages/en/FreeCourses';
import EnPaidCourses from '@/pages/en/PaidCourses';
import EnCourseArchive from '@/pages/en/CourseArchive';
import EnAssessmentCenter from '@/pages/en/AssessmentCenter';

// Free course wrapper component
import FreeCourseWrapper from '@/components/FreeCourseWrapper';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <MainLayout>
              <Routes>
                {/* Main pages */}
                <Route path="/" element={<Index />} />
                <Route path="/courses/free" element={<FreeCourses />} />
                <Route path="/courses/paid" element={<PaidCourses />} />
                <Route path="/courses/archive" element={<CourseArchive />} />
                <Route path="/assessment" element={<AssessmentCenter />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/support" element={<Support />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/instructor" element={<InstructorProfile />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />

                {/* Course landing pages */}
                <Route path="/course/boundless" element={<BoundlessLanding />} />
                <Route path="/course/instagram" element={<InstagramLanding />} />
                <Route path="/course/metaverse" element={<MetaverseLanding />} />
                <Route path="/course/wealth" element={<WealthLanding />} />
                <Route path="/course/free/:slug" element={<FreeCourseWrapper />} />

                {/* Course access pages */}
                <Route path="/course/free/start/:courseTitle" element={<FreeCourseStart />} />
                <Route path="/course/free/view/:courseTitle" element={<FreeCourseView />} />
                <Route path="/course/paid/start/:courseTitle" element={<PaidCourseStart />} />
                <Route path="/course/paid/view/:courseTitle" element={<PaidCourseView />} />

                {/* Test pages */}
                <Route path="/test/:slug" element={<TestLanding />} />

                {/* Payment */}
                <Route path="/payment-success/:courseSlug" element={<PaymentSuccess />} />

                {/* English pages */}
                <Route path="/en" element={<EnIndex />} />
                <Route path="/en/courses/free" element={<EnFreeCourses />} />
                <Route path="/en/courses/paid" element={<EnPaidCourses />} />
                <Route path="/en/courses/archive" element={<EnCourseArchive />} />
                <Route path="/en/assessment" element={<EnAssessmentCenter />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
