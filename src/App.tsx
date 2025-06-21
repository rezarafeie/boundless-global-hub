import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import MainLayout from "@/components/Layout/MainLayout";
import NotFound from "@/pages/NotFound";

// Lazy load components
const Index = lazy(() => import("@/pages/Index"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Support = lazy(() => import("@/pages/Support"));
const FreeCourses = lazy(() => import("@/pages/FreeCourses"));
const PaidCourses = lazy(() => import("@/pages/PaidCourses"));
const CourseArchive = lazy(() => import("@/pages/CourseArchive"));
const AssessmentCenter = lazy(() => import("@/pages/AssessmentCenter"));
const TestLanding = lazy(() => import("@/pages/Assessment/TestLanding"));
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));
const Blog = lazy(() => import("@/pages/Blog"));
const InstructorProfile = lazy(() => import("@/pages/InstructorProfile"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const PaymentRequest = lazy(() => import("@/pages/PaymentRequest"));
const Magazine = lazy(() => import("@/pages/Magazine"));
const AIAssistant = lazy(() => import("@/pages/AIAssistant"));
const BorderlessHub = lazy(() => import("@/pages/BorderlessHub"));
const BorderlessHubChat = lazy(() => import("@/pages/BorderlessHubChat"));
const BorderlessHubAdmin = lazy(() => import("@/pages/BorderlessHubAdmin"));
const BorderlessHubMessenger = lazy(() => import("@/pages/BorderlessHubMessenger"));
const BorderlessHubMessengerAdmin = lazy(() => import("@/pages/BorderlessHubMessengerAdmin"));
const MessengerPending = lazy(() => import("@/pages/MessengerPending"));
const CoursePage = lazy(() => import("@/pages/CoursePage"));
const ModulePage = lazy(() => import("@/pages/ModulePage"));
const AccessDenied = lazy(() => import("@/pages/AccessDenied"));
const AccessGranted = lazy(() => import("@/pages/AccessGranted"));
const RedirectTo = lazy(() => import("@/pages/RedirectTo"));

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
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Index />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/about"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <About />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/contact"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Contact />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/support"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Support />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/free-courses"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <FreeCourses />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/paid-courses"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <PaidCourses />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/courses"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <CourseArchive />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/assessment-center"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AssessmentCenter />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/test/:testId"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <TestLanding />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Dashboard />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/blog"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Blog />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/instructor/:instructorId"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <InstructorProfile />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/checkout"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Checkout />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/payreq"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <PaymentRequest />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/mag"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Magazine />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/ai"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AIAssistant />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route path="/course/:courseId" element={
                <MainLayout>
                  <Suspense fallback={<div>Loading Course...</div>}>
                    <CoursePage />
                  </Suspense>
                </MainLayout>
              } />
              <Route path="/module/:moduleId" element={
                <MainLayout>
                  <Suspense fallback={<div>Loading Module...</div>}>
                    <ModulePage />
                  </Suspense>
                </MainLayout>
              } />
              <Route path="/access/denied" element={
                <Suspense fallback={<div>Access Denied...</div>}>
                  <AccessDenied />
                </Suspense>
              } />
              <Route path="/access/granted" element={
                <Suspense fallback={<div>Access Granted...</div>}>
                  <AccessGranted />
                </Suspense>
              } />
              <Route path="/redirect/:url" element={
                <Suspense fallback={<div>Redirecting...</div>}>
                  <RedirectTo />
                </Suspense>
              } />
              
              <Route
                path="/hub"
                element={
                  <MainLayout>
                    <Suspense fallback={<div>Loading...</div>}>
                      <BorderlessHub />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/hub/chat"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <BorderlessHubChat />
                  </Suspense>
                }
              />
              <Route
                path="/hub/messenger"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <BorderlessHubMessenger />
                  </Suspense>
                }
              />
              <Route
                path="/hub/messenger/pending"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <MessengerPending />
                  </Suspense>
                }
              />
              <Route
                path="/hub/admin"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <BorderlessHubAdmin />
                  </Suspense>
                }
              />
              <Route
                path="/hub/messenger-admin"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <BorderlessHubMessengerAdmin />
                  </Suspense>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
