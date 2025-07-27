
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { shouldShowMessengerOnly, shouldShowShortlinkOnly } from "./utils/subdomainDetection";

// Import all pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import Magazine from "./pages/Magazine";
import CourseArchive from "./pages/CourseArchive";
import FreeCourses from "./pages/FreeCourses";
import PaidCourses from "./pages/PaidCourses";
import Support from "./pages/Support";
import Checkout from "./pages/Checkout";
import PaymentRequest from "./pages/PaymentRequest";
import Enroll from "./pages/Enroll";
import EnrollSuccess from "./pages/EnrollSuccess";
import EnrollPending from "./pages/EnrollPending";
import EnrollAdmin from "./pages/EnrollAdmin";
import EnrollReject from "./pages/EnrollReject";
import EnrollmentAdmin from "./pages/EnrollmentAdmin";
import EnrollmentEmailAdmin from "./pages/EnrollmentEmailAdmin";
import EnrollmentDetails from "./pages/EnrollmentDetails";
import AdminEnrollmentDetails from "./pages/AdminEnrollmentDetails";
import CourseManagement from "./pages/Course/CourseManagement";
import CourseAccess from "./pages/CourseAccess";

// SSO pages
import SSOAccess from "./pages/SSOAccess";
import SSOLogin from "./pages/SSOLogin";

// Course pages
import MetaverseLanding from "./pages/Courses/MetaverseLanding";
import InstagramLanding from "./pages/Courses/InstagramLanding";
import InstagramEssentialsLanding from "./pages/Courses/InstagramEssentialsLanding";
import BoundlessLanding from "./pages/Courses/BoundlessLanding";
import FreeCourseLanding from "./pages/Courses/FreeCourseLanding";
import SmartPackLanding from "./pages/Courses/SmartPackLanding";
import ServitLanding from "./pages/Courses/ServitLanding";

// Course access and view pages
import FreeCourseStart from "./pages/Course/FreeCourseStart";
import FreeCourseView from "./pages/Course/FreeCourseView";
import PaidCourseStart from "./pages/Course/PaidCourseStart";
import PaidCourseView from "./pages/Course/PaidCourseView";
import MetaverseFreePage from "./pages/Course/MetaverseFreePage";
import ChangeCoursePage from "./pages/Course/ChangeCoursePage";
import AmericanBusinessPage from "./pages/Course/AmericanBusinessPage";
import BoundlessTastePage from "./pages/Course/BoundlessTastePage";
import PassiveIncomePage from "./pages/Course/PassiveIncomePage";

// Course access pages
import TaghirAccess from "./pages/Course/Access/TaghirAccess";
import BoundlessTasteAccess from "./pages/Course/Access/BoundlessTasteAccess";
import AmericanBusinessAccess from "./pages/Course/Access/AmericanBusinessAccess";
import PassiveIncomeAccess from "./pages/Course/Access/PassiveIncomeAccess";

// Hub and admin pages
import BorderlessHub from "./pages/BorderlessHub";
import BorderlessHubChat from "./pages/BorderlessHubChat";
import BorderlessHubMessenger from "./pages/BorderlessHubMessenger";
import BorderlessHubAdmin from "./pages/BorderlessHubAdmin";
import BorderlessHubMessengerAdmin from "./pages/BorderlessHubMessengerAdmin";
import BorderlessHubUnifiedAdmin from "./pages/BorderlessHubUnifiedAdmin";
import BorderlessHubSupportDashboard from "./pages/BorderlessHubSupportDashboard";
import MessengerPending from "./pages/MessengerPending";

// Assessment and other pages
import AssessmentCenter from "./pages/AssessmentCenter";
import TestLanding from "./pages/Assessment/TestLanding";
import Dashboard from "./pages/Dashboard/Dashboard";
import UserDashboard from "./pages/Dashboard";
import InstructorProfile from "./pages/InstructorProfile";
import AIAssistant from "./pages/AIAssistant";
import SolidarityLanding from "./pages/Solidarity/SolidarityLanding";
import TelegramRedirect from "./pages/Redirect/TelegramRedirect";
import Start from "./pages/Start";

// English pages
import EnIndex from "./pages/en/Index";
import EnFreeCourses from "./pages/en/FreeCourses";
import EnPaidCourses from "./pages/en/PaidCourses";
import EnCourseArchive from "./pages/en/CourseArchive";
import EnAssessmentCenter from "./pages/en/AssessmentCenter";

// User Hub page
import UserHub from "./pages/UserHub";

// Messenger App (for subdomain)
import MessengerApp from "./pages/MessengerApp";
import MessengerProfile from "./pages/MessengerProfile";

// Short link redirect page
import ShortLinkRedirect from "./pages/ShortLinkRedirect";

// Import the new component
import CourseContentManagement from "./pages/Course/CourseContentManagement";
import CourseCreate from "./pages/Admin/CourseCreate";
import CourseEdit from "./pages/Admin/CourseEdit";

// User Management components
import UsersOverview from "./pages/UsersOverview";
import UserDetail from "./pages/UserDetail";

const queryClient = new QueryClient();

const App = () => {
  // Check if we're on the shortlink subdomain
  const isShortlinkOnly = shouldShowShortlinkOnly();
  
  if (isShortlinkOnly) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <NotificationProvider>
                <AuthProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Routes>
                      <Route path="/:slug" element={<ShortLinkRedirect />} />
                      <Route path="/" element={<ShortLinkRedirect />} />
                    </Routes>
                  </TooltipProvider>
                </AuthProvider>
              </NotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  // Check if we're on the messenger subdomain
  const isMessengerOnly = shouldShowMessengerOnly();
  
  if (isMessengerOnly) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <NotificationProvider>
                <AuthProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Routes>
                      <Route path="/hub/messenger" element={<MessengerApp />} />
                      <Route path="*" element={<MessengerApp />} />
                    </Routes>
                  </TooltipProvider>
                </AuthProvider>
              </NotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <NotificationProvider>
              <AuthProvider>
                <TooltipProvider>
                  <Toaster />
                  <Routes>
                    {/* Main pages */}
                    <Route path="/" element={<Index />} />
                    <Route path="/start" element={<Start />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/magazine" element={<Magazine />} />
                    <Route path="/mag" element={<Magazine />} />
                    <Route path="/courses" element={<CourseArchive />} />
                    <Route path="/course" element={<CourseArchive />} />
                    <Route path="/free-courses" element={<FreeCourses />} />
                    <Route path="/paid-courses" element={<PaidCourses />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment-request" element={<PaymentRequest />} />
                    
                    {/* Enrollment pages */}
                    <Route path="/enroll" element={<Enroll />} />
                    <Route path="/enroll/success" element={<EnrollSuccess />} />
                    <Route path="/enroll/details" element={<EnrollmentDetails />} />
                    <Route path="/admin-enrollment-details" element={<AdminEnrollmentDetails />} />
                    <Route path="/enroll/admin/enrollment/:id" element={<AdminEnrollmentDetails />} />
                    <Route path="/enroll/pending" element={<EnrollPending />} />
                    <Route path="/enroll/admin" element={<EnrollmentAdmin />} />
                    <Route path="/enroll/admin/email" element={<EnrollmentEmailAdmin />} />
                    <Route path="/admin/course/create" element={<CourseCreate />} />
                    <Route path="/admin/course/edit/:courseId" element={<CourseEdit />} />
                    <Route path="/enroll/admin/course/:courseId" element={<CourseManagement />} />
                    <Route path="/enroll/admin/course/:courseId/lessons" element={<CourseContentManagement />} />
                    <Route path="/enroll/reject" element={<EnrollReject />} />
                    
                    {/* User Management routes */}
                    <Route path="/enroll/admin/users" element={<UsersOverview />} />
                    <Route path="/enroll/admin/users/:userId" element={<UserDetail />} />
                    <Route path="/user/detail/:userId" element={<UserDetail />} />
                    <Route path="/user-detail/:userId" element={<UserDetail />} />
                    
                    {/* SSO Access routes */}
                    <Route path="/sso-access" element={<SSOAccess />} />
                    <Route path="/sso-login" element={<SSOLogin />} />
                    
                    {/* Course Access */}
                    <Route path="/access" element={<CourseAccess />} />

                    {/* Course landing pages */}
                    <Route path="/courses/metaverse" element={<MetaverseLanding />} />
                    <Route path="/courses/instagram" element={<InstagramLanding />} />
                    <Route path="/courses/instagram-essentials" element={<InstagramEssentialsLanding />} />
                    <Route path="/courses/boundless" element={<BoundlessLanding />} />
                    <Route path="/courses/free-course" element={
                      <FreeCourseLanding 
                        title="Free Course"
                        englishTitle="Free Course"
                        description="Start your learning journey with our free course"
                        benefitOne="Basic concepts"
                        benefitTwo="Practical exercises"
                        iconType="book"
                        iframeUrl="https://example.com/course-iframe"
                      />
                    } />
                    <Route path="/courses/smart-pack" element={<SmartPackLanding />} />
                    <Route path="/courses/servit" element={<ServitLanding />} />

                    {/* Course access pages */}
                    <Route path="/course/free-start" element={<FreeCourseStart />} />
                    <Route path="/course/free-view" element={<FreeCourseView />} />
                    <Route path="/course/paid-start" element={<PaidCourseStart />} />
                    <Route path="/course/paid-view" element={<PaidCourseView />} />
                    <Route path="/course/metaverse-free" element={<MetaverseFreePage />} />
                    <Route path="/course/change" element={<ChangeCoursePage />} />
                    <Route path="/taghir" element={<ChangeCoursePage />} />
                    <Route path="/course/american-business" element={<AmericanBusinessPage />} />
                    <Route path="/course/boundless-taste" element={<BoundlessTastePage />} />
                    <Route path="/course/passive-income" element={<PassiveIncomePage />} />
                    <Route path="/daramad" element={<PassiveIncomePage />} />

                    {/* Course access control */}
                    <Route path="/course/access/taghir" element={<TaghirAccess />} />
                    <Route path="/course/access/boundless-taste" element={<BoundlessTasteAccess />} />
                    <Route path="/course/access/american-business" element={<AmericanBusinessAccess />} />
                    <Route path="/course/access/passive-income" element={<PassiveIncomeAccess />} />

                    {/* Dashboard */}
                    <Route path="/dashboard" element={<UserDashboard />} />

                    {/* Hub pages */}
                    <Route path="/hub/*" element={<BorderlessHub />} />
                    <Route path="/hub/chat" element={<BorderlessHubChat />} />
                    <Route path="/hub/messenger" element={<MessengerApp />} />
                    <Route path="/hub/messenger/pending" element={<MessengerPending />} />
                    <Route path="/hub/admin" element={<BorderlessHubAdmin />} />
                    <Route path="/hub/support" element={<BorderlessHubSupportDashboard />} />
                    <Route path="/hub/messenger-admin" element={<BorderlessHubMessengerAdmin />} />
                    <Route path="/messenger-pending" element={<MessengerPending />} />
                    <Route path="/profile" element={<MessengerProfile />} />

                    {/* Assessment */}
                    <Route path="/assessment" element={<AssessmentCenter />} />
                    <Route path="/assessment/:slug" element={<TestLanding />} />

                    {/* Other pages */}
                    <Route path="/instructor" element={<InstructorProfile />} />
                    <Route path="/ai-assistant" element={<AIAssistant />} />
                    <Route path="/solidarity" element={<SolidarityLanding />} />
                    <Route path="/telegram" element={<TelegramRedirect />} />

                    {/* English routes */}
                    <Route path="/en" element={<EnIndex />} />
                    <Route path="/en/free-courses" element={<EnFreeCourses />} />
                    <Route path="/en/paid-courses" element={<EnPaidCourses />} />
                    <Route path="/en/courses" element={<EnCourseArchive />} />
                    <Route path="/en/assessment" element={<EnAssessmentCenter />} />

                    {/* User Hub Route */}
                    <Route path="/user-hub" element={<UserHub />} />

                    {/* 404 fallback */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </AuthProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
