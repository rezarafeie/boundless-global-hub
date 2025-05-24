
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import EnglishIndex from "@/pages/en/Index";
import CourseArchive from "@/pages/CourseArchive";
import EnglishCourseArchive from "@/pages/en/CourseArchive";
import FreeCourses from "@/pages/FreeCourses";
import EnglishFreeCourses from "@/pages/en/FreeCourses";
import PaidCourses from "@/pages/PaidCourses";
import EnglishPaidCourses from "@/pages/en/PaidCourses";
import AssessmentCenter from "@/pages/AssessmentCenter";
import EnglishAssessmentCenter from "@/pages/en/AssessmentCenter";
import AIAssistant from "@/pages/AIAssistant";
import Support from "@/pages/Support";
import Blog from "@/pages/Blog";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard/Dashboard";
import UserProfile from "@/pages/Dashboard/UserProfile";
import InstructorProfile from "@/pages/InstructorProfile";

// Course-specific pages
import BoundlessLanding from "@/pages/Courses/BoundlessLanding";
import InstagramLanding from "@/pages/Courses/InstagramLanding";
import MetaverseLanding from "@/pages/Courses/MetaverseLanding";
import FreeCourseLanding from "@/pages/Courses/FreeCourseLanding";
import FreeCourseStart from "@/pages/Course/FreeCourseStart";
import FreeCourseView from "@/pages/Course/FreeCourseView";
import PaidCourseStart from "@/pages/Course/PaidCourseStart";
import PaidCourseView from "@/pages/Course/PaidCourseView";
import CourseDetail from "@/pages/Course/CourseDetail";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Persian Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<CourseArchive />} />
            <Route path="/courses/:courseSlug" element={<CourseDetail />} />
            <Route path="/courses/:courseSlug/free-view" element={
              <FreeCourseView 
                title="Sample Free Course"
                description="This is a sample free course description"
                benefitOne="Learn basic concepts"
                benefitTwo="Gain practical skills"
              />
            } />
            <Route path="/courses/:courseSlug/paid-view" element={<PaidCourseView />} />
            <Route path="/courses/:courseSlug/free-start" element={<FreeCourseStart />} />
            <Route path="/courses/:courseSlug/paid-start" element={<PaidCourseStart />} />
            <Route path="/free-courses" element={<FreeCourses />} />
            <Route path="/paid-courses" element={<PaidCourses />} />
            <Route path="/assessment-center" element={<AssessmentCenter />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/support" element={<Support />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/instructor/:instructorId" element={<InstructorProfile />} />
            
            {/* Course Landing Pages */}
            <Route path="/boundless" element={<BoundlessLanding />} />
            <Route path="/instagram" element={<InstagramLanding />} />
            <Route path="/metaverse" element={<MetaverseLanding />} />
            <Route path="/free-course-landing" element={<FreeCourseLanding />} />
            
            {/* English Routes */}
            <Route path="/en" element={<EnglishIndex />} />
            <Route path="/en/courses" element={<EnglishCourseArchive />} />
            <Route path="/en/courses/:courseSlug" element={<CourseDetail />} />
            <Route path="/en/courses/:courseSlug/free-view" element={
              <FreeCourseView 
                title="Sample Free Course"
                description="This is a sample free course description"
                benefitOne="Learn basic concepts"
                benefitTwo="Gain practical skills"
              />
            } />
            <Route path="/en/courses/:courseSlug/paid-view" element={<PaidCourseView />} />
            <Route path="/en/free-courses" element={<EnglishFreeCourses />} />
            <Route path="/en/paid-courses" element={<EnglishPaidCourses />} />
            <Route path="/en/assessment-center" element={<EnglishAssessmentCenter />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
