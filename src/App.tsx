
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { BlackFridayProvider } from "./contexts/BlackFridayContext";
import { shouldShowMessengerOnly, shouldShowShortlinkOnly } from "./utils/subdomainDetection";
import AnalyticsTracker from "./components/Analytics/AnalyticsTracker";

// Eager-load only the landing page (LCP)
import Index from "./pages/Index";

// Lazy-load every other page to enable route-level code splitting
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const Magazine = lazy(() => import("./pages/Magazine"));
const CourseArchive = lazy(() => import("./pages/CourseArchive"));
const FreeCourses = lazy(() => import("./pages/FreeCourses"));
const PaidCourses = lazy(() => import("./pages/PaidCourses"));
const Support = lazy(() => import("./pages/Support"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentRequest = lazy(() => import("./pages/PaymentRequest"));
const Enroll = lazy(() => import("./pages/Enroll"));
const EnrollSuccess = lazy(() => import("./pages/EnrollSuccess"));
const EnrollPending = lazy(() => import("./pages/EnrollPending"));
const EnrollAdmin = lazy(() => import("./pages/EnrollAdmin"));
const EnrollReject = lazy(() => import("./pages/EnrollReject"));
const EnrollmentAdmin = lazy(() => import("./pages/EnrollmentAdmin"));
const EnrollmentEmailAdmin = lazy(() => import("./pages/EnrollmentEmailAdmin"));
const EnrollmentDetails = lazy(() => import("./pages/EnrollmentDetails"));
const AdminEnrollmentDetails = lazy(() => import("./pages/AdminEnrollmentDetails"));
const CourseManagement = lazy(() => import("./pages/Course/CourseManagement"));
const CourseAccess = lazy(() => import("./pages/CourseAccess"));
const SSOAccess = lazy(() => import("./pages/SSOAccess"));
const SSOLogin = lazy(() => import("./pages/SSOLogin"));
const MetaverseLanding = lazy(() => import("./pages/Courses/MetaverseLanding"));
const InstagramLanding = lazy(() => import("./pages/Courses/InstagramLanding"));
const InstagramEssentialsLanding = lazy(() => import("./pages/Courses/InstagramEssentialsLanding"));
const BoundlessLanding = lazy(() => import("./pages/Courses/BoundlessLanding"));
const FreeCourseLanding = lazy(() => import("./pages/Courses/FreeCourseLanding"));
const SmartPackLanding = lazy(() => import("./pages/Courses/SmartPackLanding"));
const ServitLanding = lazy(() => import("./pages/Courses/ServitLanding"));
const RescueProjectLanding = lazy(() => import("./pages/Courses/RescueProjectLanding"));
const IranLanding = lazy(() => import("./pages/Courses/IranLanding"));
const IranCCLanding = lazy(() => import("./pages/Courses/IranCCLanding"));
const BoundlessCCLanding = lazy(() => import("./pages/Courses/BoundlessCCLanding"));
const IRClassLanding = lazy(() => import("./pages/Courses/IRClassLanding"));
const FreeCourseStart = lazy(() => import("./pages/Course/FreeCourseStart"));
const FreeCourseView = lazy(() => import("./pages/Course/FreeCourseView"));
const PaidCourseStart = lazy(() => import("./pages/Course/PaidCourseStart"));
const PaidCourseView = lazy(() => import("./pages/Course/PaidCourseView"));
const MetaverseFreePage = lazy(() => import("./pages/Course/MetaverseFreePage"));
const ChangeCoursePage = lazy(() => import("./pages/Course/ChangeCoursePage"));
const AmericanBusinessPage = lazy(() => import("./pages/Course/AmericanBusinessPage"));
const BoundlessTastePage = lazy(() => import("./pages/Course/BoundlessTastePage"));
const PassiveIncomePage = lazy(() => import("./pages/Course/PassiveIncomePage"));
const SmartLifePage = lazy(() => import("./pages/Course/SmartLifePage"));
const CrisisProjectPage = lazy(() => import("./pages/Course/CrisisProjectPage"));
const CrisisSlidesPage = lazy(() => import("./pages/Course/CrisisSlidesPage"));
const TaghirAccess = lazy(() => import("./pages/Course/Access/TaghirAccess"));
const BoundlessTasteAccess = lazy(() => import("./pages/Course/Access/BoundlessTasteAccess"));
const AmericanBusinessAccess = lazy(() => import("./pages/Course/Access/AmericanBusinessAccess"));
const PassiveIncomeAccess = lazy(() => import("./pages/Course/Access/PassiveIncomeAccess"));
const BorderlessHub = lazy(() => import("./pages/BorderlessHub"));
const BorderlessHubChat = lazy(() => import("./pages/BorderlessHubChat"));
const BorderlessHubAdmin = lazy(() => import("./pages/BorderlessHubAdmin"));
const BorderlessHubMessengerAdmin = lazy(() => import("./pages/BorderlessHubMessengerAdmin"));
const BorderlessHubSupportDashboard = lazy(() => import("./pages/BorderlessHubSupportDashboard"));
const MessengerPending = lazy(() => import("./pages/MessengerPending"));
const AssessmentCenter = lazy(() => import("./pages/AssessmentCenter"));
const TestLanding = lazy(() => import("./pages/Assessment/TestLanding"));
const UserDashboard = lazy(() => import("./pages/Dashboard"));
const InstructorProfile = lazy(() => import("./pages/InstructorProfile"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const SolidarityLanding = lazy(() => import("./pages/Solidarity/SolidarityLanding"));
const TelegramRedirect = lazy(() => import("./pages/Redirect/TelegramRedirect"));
const Start = lazy(() => import("./pages/Start"));
const RezaRafiei = lazy(() => import("./pages/RezaRafiei"));
const EnIndex = lazy(() => import("./pages/en/Index"));
const EnFreeCourses = lazy(() => import("./pages/en/FreeCourses"));
const EnPaidCourses = lazy(() => import("./pages/en/PaidCourses"));
const EnCourseArchive = lazy(() => import("./pages/en/CourseArchive"));
const EnAssessmentCenter = lazy(() => import("./pages/en/AssessmentCenter"));
const UserHub = lazy(() => import("./pages/UserHub"));
const BioLinks = lazy(() => import("./pages/BioLinks"));
const BoundlessDeposit = lazy(() => import("./pages/BoundlessDeposit"));
const MessengerApp = lazy(() => import("./pages/MessengerApp"));
const MessengerProfile = lazy(() => import("./pages/MessengerProfile"));
const ShortLinkRedirect = lazy(() => import("./pages/ShortLinkRedirect"));
const SmartTest = lazy(() => import("./pages/SmartTest"));
const SmartTestResults = lazy(() => import("./pages/SmartTestResults"));
const CourseContentManagement = lazy(() => import("./pages/Course/CourseContentManagement"));
const CourseCreate = lazy(() => import("./pages/Admin/CourseCreate"));
const CourseEdit = lazy(() => import("./pages/Admin/CourseEdit"));
const WebinarLogin = lazy(() => import("./pages/WebinarLogin"));
const WebinarRegistration = lazy(() => import("./pages/WebinarRegistration"));
const WebinarAdmin = lazy(() => import("./pages/WebinarAdmin"));
const WebinarWatch = lazy(() => import("./pages/WebinarWatch"));
const WebinarHostPanel = lazy(() => import("./pages/WebinarHostPanel"));
const WebinarEdit = lazy(() => import("./pages/WebinarEdit"));
const UsersOverview = lazy(() => import("./pages/UsersOverview"));
const UserDetail = lazy(() => import("./pages/UserDetail"));
const EnrollAdminTests = lazy(() => import("./pages/EnrollAdminTests"));
const TestEnrollmentAdminDetails = lazy(() => import("./pages/TestEnrollmentAdminDetails"));
const Tests = lazy(() => import("./pages/Tests"));
const TestAccess = lazy(() => import("./pages/TestAccess"));
const TestResult = lazy(() => import("./pages/TestResult"));
const TestEnrollmentSuccessPage = lazy(() => import("./pages/TestEnrollmentSuccessPage"));
const AppDashboard = lazy(() => import("./pages/App/AppDashboard"));
const AppMyCourses = lazy(() => import("./pages/App/AppMyCourses"));
const AppCourseDetail = lazy(() => import("./pages/App/AppCourseDetail"));
const AppLessonView = lazy(() => import("./pages/App/AppLessonView"));
const AppTests = lazy(() => import("./pages/App/AppTests"));
const AppLearning = lazy(() => import("./pages/App/AppLearning"));
const AppProfile = lazy(() => import("./pages/App/AppProfile"));
const JobApplication = lazy(() => import("./pages/JobApplication"));
const Internship = lazy(() => import("./pages/Internship"));
const DailyReport = lazy(() => import("./pages/DailyReport"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const InvoiceAdmin = lazy(() => import("./pages/InvoiceAdmin"));
const InvoicePaymentCallback = lazy(() => import("./pages/InvoicePaymentCallback"));
const ConsultationBooking = lazy(() => import("./pages/ConsultationBooking"));
const LeadRequest = lazy(() => import("./pages/LeadRequest"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
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
                    <AnalyticsTracker />
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/:slug" element={<ShortLinkRedirect />} />
                        <Route path="/" element={<ShortLinkRedirect />} />
                      </Routes>
                    </Suspense>
                  </TooltipProvider>
                </AuthProvider>
              </NotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

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
                    <AnalyticsTracker />
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/hub/messenger" element={<MessengerApp />} />
                        <Route path="*" element={<MessengerApp />} />
                      </Routes>
                    </Suspense>
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
                <BlackFridayProvider>
                  <TooltipProvider>
                    <Toaster />
                    <AnalyticsTracker />
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/start" element={<Start />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/magazine" element={<Magazine />} />
                        <Route path="/courses" element={<CourseArchive />} />
                        <Route path="/course" element={<CourseArchive />} />
                        <Route path="/free-courses" element={<FreeCourses />} />
                        <Route path="/paid-courses" element={<PaidCourses />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/payment-request" element={<PaymentRequest />} />

                        <Route path="/enroll" element={<Enroll />} />
                        <Route path="/enroll/success" element={<EnrollSuccess />} />
                        <Route path="/test-enrollment-success" element={<TestEnrollmentSuccessPage />} />
                        <Route path="/enroll/details" element={<EnrollmentDetails />} />
                        <Route path="/admin-enrollment-details" element={<AdminEnrollmentDetails />} />
                        <Route path="/enroll/admin/enrollment/:id" element={<AdminEnrollmentDetails />} />
                        <Route path="/enroll/pending" element={<EnrollPending />} />
                        <Route path="/enroll/admin" element={<EnrollmentAdmin />} />
                        <Route path="/enroll/admin/tests" element={<EnrollAdminTests />} />
                        <Route path="/test-enrollment/admin/:id" element={<TestEnrollmentAdminDetails />} />
                        <Route path="/enroll/admin/email" element={<EnrollmentEmailAdmin />} />
                        <Route path="/admin/course/create" element={<CourseCreate />} />
                        <Route path="/admin/course/edit/:courseId" element={<CourseEdit />} />
                        <Route path="/enroll/admin/course/:courseId" element={<CourseManagement />} />
                        <Route path="/enroll/admin/course/:courseId/lessons" element={<CourseContentManagement />} />
                        <Route path="/enroll/reject" element={<EnrollReject />} />

                        <Route path="/smart-test" element={<SmartTest />} />
                        <Route path="/smart-test/results" element={<SmartTestResults />} />

                        <Route path="/enroll/admin/users" element={<UsersOverview />} />
                        <Route path="/enroll/admin/users/:userId" element={<UserDetail />} />
                        <Route path="/user/detail/:userId" element={<UserDetail />} />
                        <Route path="/user-detail/:userId" element={<UserDetail />} />

                        <Route path="/sso-access" element={<SSOAccess />} />
                        <Route path="/sso-login" element={<SSOLogin />} />

                        <Route path="/course-access" element={<CourseAccess />} />

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
                        <Route path="/course/smart-life" element={<SmartLifePage />} />
                        <Route path="/course/crisis-project" element={<CrisisProjectPage />} />
                        <Route path="/crisis" element={<CrisisProjectPage />} />
                        <Route path="/crisis/slides" element={<CrisisSlidesPage />} />
                        <Route path="/daramad" element={<PassiveIncomePage />} />
                        <Route path="/rescue" element={<RescueProjectLanding />} />
                        <Route path="/courses/iran" element={<IranLanding />} />
                        <Route path="/iran" element={<IranLanding />} />
                        <Route path="/iran/cc" element={<IranCCLanding />} />
                        <Route path="/courses/iran/cc" element={<IranCCLanding />} />
                        <Route path="/boundless/cc" element={<BoundlessCCLanding />} />
                        <Route path="/courses/boundless/cc" element={<BoundlessCCLanding />} />
                        <Route path="/ir-class" element={<IRClassLanding />} />
                        <Route path="/courses/ir-class" element={<IRClassLanding />} />

                        <Route path="/course/access/taghir" element={<TaghirAccess />} />
                        <Route path="/course/access/boundless-taste" element={<BoundlessTasteAccess />} />
                        <Route path="/course/access/american-business" element={<AmericanBusinessAccess />} />
                        <Route path="/course/access/passive-income" element={<PassiveIncomeAccess />} />

                        <Route path="/dashboard" element={<UserDashboard />} />

                        <Route path="/hub/*" element={<BorderlessHub />} />
                        <Route path="/hub/chat" element={<BorderlessHubChat />} />
                        <Route path="/hub/messenger" element={<MessengerApp />} />
                        <Route path="/hub/messenger/pending" element={<MessengerPending />} />
                        <Route path="/hub/admin" element={<BorderlessHubAdmin />} />
                        <Route path="/hub/support" element={<BorderlessHubSupportDashboard />} />
                        <Route path="/hub/messenger-admin" element={<BorderlessHubMessengerAdmin />} />
                        <Route path="/messenger-pending" element={<MessengerPending />} />
                        <Route path="/profile" element={<MessengerProfile />} />

                        <Route path="/assessment" element={<AssessmentCenter />} />
                        <Route path="/assessment/:slug" element={<TestLanding />} />
                        <Route path="/tests" element={<Tests />} />
                        <Route path="/access" element={<TestAccess />} />
                        <Route path="/test-result" element={<TestResult />} />

                        <Route path="/instructor" element={<InstructorProfile />} />
                        <Route path="/reza-rafiei" element={<RezaRafiei />} />
                        <Route path="/ai-assistant" element={<AIAssistant />} />
                        <Route path="/solidarity" element={<SolidarityLanding />} />
                        <Route path="/telegram" element={<TelegramRedirect />} />

                        <Route path="/en" element={<EnIndex />} />
                        <Route path="/en/free-courses" element={<EnFreeCourses />} />
                        <Route path="/en/paid-courses" element={<EnPaidCourses />} />
                        <Route path="/en/courses" element={<EnCourseArchive />} />
                        <Route path="/en/assessment" element={<EnAssessmentCenter />} />

                        <Route path="/user-hub" element={<UserHub />} />
                        <Route path="/bio" element={<BioLinks />} />
                        <Route path="/boundless-deposit" element={<BoundlessDeposit />} />

                        <Route path="/app/dashboard" element={<AppDashboard />} />
                        <Route path="/app/my-courses" element={<AppMyCourses />} />
                        <Route path="/app/course/:slug" element={<AppCourseDetail />} />
                        <Route path="/app/course/:courseSlug/lesson/:lessonNumber" element={<AppLessonView />} />
                        <Route path="/app/lesson/:lessonNumber" element={<AppLessonView />} />
                        <Route path="/app/tests" element={<AppTests />} />
                        <Route path="/app/learning" element={<AppLearning />} />
                        <Route path="/app/profile" element={<AppProfile />} />

                        <Route path="/enroll/admin/webinar" element={<WebinarAdmin />} />
                        <Route path="/enroll/admin/webinar/:webinarId/edit" element={<WebinarEdit />} />
                        <Route path="/webinar/:slug" element={<WebinarRegistration />} />
                        <Route path="/webinar/:slug/login" element={<WebinarLogin />} />
                        <Route path="/webinar/:slug/live" element={<WebinarWatch />} />
                        <Route path="/webinar/:slug/host" element={<WebinarHostPanel />} />

                        <Route path="/job" element={<JobApplication />} />
                        <Route path="/internship" element={<Internship />} />
                        <Route path="/report" element={<DailyReport />} />

                        <Route path="/invoice/:invoiceId" element={<InvoiceView />} />
                        <Route path="/invoice/:invoiceId/callback" element={<InvoicePaymentCallback />} />
                        <Route path="/enroll/admin/invoice/:invoiceId" element={<InvoiceAdmin />} />

                        <Route path="/consultations" element={<ConsultationBooking />} />
                        <Route path="/request" element={<LeadRequest />} />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </TooltipProvider>
                </BlackFridayProvider>
              </AuthProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
