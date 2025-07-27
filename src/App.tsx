import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ReplyProvider } from "@/contexts/ReplyContext";
import NotificationErrorBoundary from "@/components/NotificationErrorBoundary";
import OfflineDetector from "@/components/OfflineDetector";
import PurpleLoader from "@/components/PurpleLoader";
import { lazy, Suspense } from "react";
const Landing = lazy(() => import("@/pages/Index"));
const Home = lazy(() => import("@/pages/Dashboard"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Chat = lazy(() => import("@/pages/Chat"));
const Live = lazy(() => import("@/pages/Live"));
const Profile = lazy(() => import("@/pages/Profile"));
const Course = lazy(() => import("@/pages/Course"));
const Courses = lazy(() => import("@/pages/Courses"));
const Module = lazy(() => import("@/pages/Module"));
const Enrollment = lazy(() => import("@/pages/Enrollment"));
const EnrollmentAdmin = lazy(() => import("@/pages/EnrollmentAdmin"));
const Admin = lazy(() => import("@/pages/Admin"));
const EmailSettings = lazy(() => import("@/pages/EmailSettings"));
const ShortLinkLanding = lazy(() => import("@/pages/ShortLinkLanding"));
const Test = lazy(() => import("@/pages/Test"));
const CRMAdmin = lazy(() => import("@/pages/CRMAdmin"));
import PasswordReset from "@/pages/PasswordReset";
import PasswordUpdate from "@/pages/PasswordUpdate";
import VerifyEmail from "@/pages/VerifyEmail";
import Support from "@/pages/Support";
import SupportAdmin from "@/pages/SupportAdmin";
import AnnouncementPage from "@/pages/AnnouncementPage";
import NotificationSettings from "@/pages/NotificationSettings";
import RafieiPlayer from "@/pages/RafieiPlayer";
import Messenger from "@/pages/Messenger";
import MessengerHome from "@/pages/MessengerHome";
import MessengerSupport from "@/pages/MessengerSupport";
import MessengerAdmin from "@/pages/MessengerAdmin";
import MessengerUser from "@/pages/MessengerUser";
import MessengerRoom from "@/pages/MessengerRoom";
import MessengerSettings from "@/pages/MessengerSettings";
import MessengerProfile from "@/pages/MessengerProfile";
import MessengerChat from "@/pages/MessengerChat";
import MessengerChatSupport from "@/pages/MessengerChatSupport";
import MessengerChatAdmin from "@/pages/MessengerChatAdmin";
import MessengerChatUser from "@/pages/MessengerChatUser";
import MessengerChatRoom from "@/pages/MessengerChatRoom";
import MessengerChatSettings from "@/pages/MessengerChatSettings";
import MessengerChatProfile from "@/pages/MessengerChatProfile";
import MessengerChatHome from "@/pages/MessengerChatHome";
import MessengerChatNotFound from "@/pages/MessengerChatNotFound";
import MessengerChatUnauthorized from "@/pages/MessengerChatUnauthorized";
import MessengerChatForbidden from "@/pages/MessengerChatForbidden";
import MessengerChatError from "@/pages/MessengerChatError";
import MessengerChatLoading from "@/pages/MessengerChatLoading";
import MessengerChatOffline from "@/pages/MessengerChatOffline";
import MessengerChatTimeout from "@/pages/MessengerChatTimeout";
import MessengerChatServerError from "@/pages/MessengerChatServerError";
import MessengerChatServiceUnavailable from "@/pages/MessengerChatServiceUnavailable";
import MessengerChatGatewayTimeout from "@/pages/MessengerChatGatewayTimeout";
import MessengerChatBadGateway from "@/pages/MessengerChatBadGateway";
import MessengerChatNotFoundPage from "@/pages/MessengerChatNotFoundPage";
import MessengerChatUnauthorizedPage from "@/pages/MessengerChatUnauthorizedPage";
import MessengerChatForbiddenPage from "@/pages/MessengerChatForbiddenPage";
import MessengerChatErrorPage from "@/pages/MessengerChatErrorPage";
import MessengerChatLoadingPage from "@/pages/MessengerChatLoadingPage";
import MessengerChatOfflinePage from "@/pages/MessengerChatOfflinePage";
import MessengerChatTimeoutPage from "@/pages/MessengerChatTimeoutPage";
import MessengerChatServerErrorPage from "@/pages/MessengerChatServerErrorPage";
import MessengerChatServiceUnavailablePage from "@/pages/MessengerChatServiceUnavailablePage";
import MessengerChatGatewayTimeoutPage from "@/pages/MessengerChatGatewayTimeoutPage";
import MessengerChatBadGatewayPage from "@/pages/MessengerChatBadGatewayPage";
import MessengerChatNotFoundComponent from "@/components/Messenger/MessengerChatNotFound";
import MessengerChatUnauthorizedComponent from "@/components/Messenger/MessengerChatUnauthorized";
import MessengerChatForbiddenComponent from "@/components/Messenger/MessengerChatForbidden";
import MessengerChatErrorComponent from "@/components/Messenger/MessengerChatError";
import MessengerChatLoadingComponent from "@/components/Messenger/MessengerChatLoading";
import MessengerChatOfflineComponent from "@/components/Messenger/MessengerChatOffline";
import MessengerChatTimeoutComponent from "@/components/Messenger/MessengerChatTimeout";
import MessengerChatServerErrorComponent from "@/components/Messenger/MessengerChatServerError";
import MessengerChatServiceUnavailableComponent from "@/components/Messenger/MessengerChatServiceUnavailable";
import MessengerChatGatewayTimeoutComponent from "@/components/Messenger/MessengerChatGatewayTimeout";
import MessengerChatBadGatewayComponent from "@/components/Messenger/MessengerChatBadGateway";
import MessengerChatNotFoundLayout from "@/components/Messenger/MessengerChatNotFoundLayout";
import MessengerChatUnauthorizedLayout from "@/components/Messenger/MessengerChatUnauthorizedLayout";
import MessengerChatForbiddenLayout from "@/components/Messenger/MessengerChatForbiddenLayout";
import MessengerChatErrorLayout from "@/components/Messenger/MessengerChatErrorLayout";
import MessengerChatLoadingLayout from "@/components/Messenger/MessengerChatLoadingLayout";
import MessengerChatOfflineLayout from "@/components/Messenger/MessengerChatOfflineLayout";
import MessengerChatTimeoutLayout from "@/components/Messenger/MessengerChatTimeoutLayout";
import MessengerChatServerErrorLayout from "@/components/Messenger/MessengerChatServerErrorLayout";
import MessengerChatServiceUnavailableLayout from "@/components/Messenger/MessengerChatServiceUnavailableLayout";
import MessengerChatGatewayTimeoutLayout from "@/components/Messenger/MessengerChatGatewayTimeoutLayout";
import MessengerChatBadGatewayLayout from "@/components/Messenger/MessengerChatBadGatewayLayout";
import MessengerChatLayout from "@/components/Messenger/MessengerChatLayout";
import MessengerChatHomeLayout from "@/components/Messenger/MessengerChatHomeLayout";
import MessengerChatSettingsLayout from "@/components/Messenger/MessengerChatSettingsLayout";
import MessengerChatProfileLayout from "@/components/Messenger/MessengerChatProfileLayout";
import MessengerChatChatLayout from "@/components/Messenger/MessengerChatChatLayout";
import MessengerChatSupportLayout from "@/components/Messenger/MessengerChatSupportLayout";
import MessengerChatAdminLayout from "@/components/Messenger/MessengerChatAdminLayout";
import MessengerChatUserLayout from "@/components/Messenger/MessengerChatUserLayout";
import MessengerChatRoomLayout from "@/components/Messenger/MessengerChatRoomLayout";
import MessengerChatNotFoundPageLayout from "@/components/Messenger/MessengerChatNotFoundPageLayout";
import MessengerChatUnauthorizedPageLayout from "@/components/Messenger/MessengerChatUnauthorizedPageLayout";
import MessengerChatForbiddenPageLayout from "@/components/Messenger/MessengerChatForbiddenPageLayout";
import MessengerChatErrorPageLayout from "@/components/Messenger/MessengerChatErrorPageLayout";
import MessengerChatLoadingPageLayout from "@/components/Messenger/MessengerChatLoadingPageLayout";
import MessengerChatOfflinePageLayout from "@/components/Messenger/MessengerChatOfflinePageLayout";
import MessengerChatTimeoutPageLayout from "@/components/Messenger/MessengerChatTimeoutPageLayout";
import MessengerChatServerErrorPageLayout from "@/components/Messenger/MessengerChatServerErrorPageLayout";
import MessengerChatServiceUnavailablePageLayout from "@/components/Messenger/MessengerChatServiceUnavailablePageLayout";
import MessengerChatGatewayTimeoutPageLayout from "@/components/Messenger/MessengerChatGatewayTimeoutPageLayout";
import MessengerChatBadGatewayPageLayout from "@/components/Messenger/MessengerChatBadGatewayPageLayout";
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <NotificationErrorBoundary>
            <NotificationProvider>
              <AuthProvider>
                <LanguageProvider>
                  <ReplyProvider>
                    <BrowserRouter>
                      <OfflineDetector />
                      <Suspense fallback={<PurpleLoader />}>
                        <Routes>
                          <Route path="/" element={<Landing />} />
                          <Route path="/home" element={<Home />} />
                          <Route path="/pricing" element={<Pricing />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/password-reset" element={<PasswordReset />} />
                          <Route path="/password-update" element={<PasswordUpdate />} />
                          <Route path="/verify-email" element={<VerifyEmail />} />
                          <Route path="/support" element={<Support />} />
                          <Route path="/support/admin" element={<SupportAdmin />} />
                          <Route path="/announcement/:id" element={<AnnouncementPage />} />
                          <Route path="/notification-settings" element={<NotificationSettings />} />
                          <Route path="/rafiei-player" element={<RafieiPlayer />} />
                          <Route path="/chat" element={<Chat />} />
                          <Route path="/live" element={<Live />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/course/:slug" element={<Course />} />
                          <Route path="/courses" element={<Courses />} />
                          <Route path="/module/:courseSlug/:moduleId" element={<Module />} />
                          <Route path="/enroll/:courseSlug" element={<Enrollment />} />
                          <Route path="/enroll/admin" element={<EnrollmentAdmin />} />
                          <Route path="/admin" element={<Admin />} />
                          <Route path="/enroll/admin/email" element={<EmailSettings />} />
                          <Route path="/enroll/admin/crm" element={<CRMAdmin />} />
                          <Route path="/s/:slug" element={<ShortLinkLanding />} />
                          <Route path="/test" element={<Test />} />
                          <Route path="/messenger" element={<Messenger />}>
                            <Route element={<MessengerChatLayout />} >
                              <Route path="home" element={<MessengerHome />} />
                              <Route path="settings" element={<MessengerSettings />} />
                              <Route path="profile" element={<MessengerProfile />} />
                              <Route path="chat" element={<MessengerChat />} />
                              <Route path="support" element={<MessengerSupport />} />
                              <Route path="admin" element={<MessengerAdmin />} />
                              <Route path="user/:userId" element={<MessengerUser />} />
                              <Route path="room/:roomId" element={<MessengerRoom />} />
                              <Route path="not-found" element={<MessengerNotFound />} />
                              <Route path="unauthorized" element={<MessengerUnauthorized />} />
                              <Route path="forbidden" element={<MessengerForbidden />} />
                              <Route path="error" element={<MessengerError />} />
                              <Route path="loading" element={<MessengerLoading />} />
                              <Route path="offline" element={<MessengerOffline />} />
                              <Route path="timeout" element={<MessengerTimeout />} />
                              <Route path="server-error" element={<MessengerServerError />} />
                              <Route path="service-unavailable" element={<MessengerServiceUnavailable />} />
                              <Route path="gateway-timeout" element={<MessengerGatewayTimeout />} />
                              <Route path="bad-gateway" element={<MessengerBadGateway />} />
                            </Route>
                            <Route element={<MessengerChatHomeLayout />} >
                              <Route path="" element={<MessengerChatHome />} />
                            </Route>
                            <Route element={<MessengerChatSettingsLayout />} >
                              <Route path="settings" element={<MessengerChatSettings />} />
                            </Route>
                            <Route element={<MessengerChatProfileLayout />} >
                              <Route path="profile" element={<MessengerChatProfile />} />
                            </Route>
                            <Route element={<MessengerChatChatLayout />} >
                              <Route path="chat" element={<MessengerChatChat />} />
                            </Route>
                            <Route element={<MessengerChatSupportLayout />} >
                              <Route path="support" element={<MessengerChatSupport />} />
                            </Route>
                            <Route element={<MessengerChatAdminLayout />} >
                              <Route path="admin" element={<MessengerChatAdmin />} />
                            </Route>
                            <Route element={<MessengerChatUserLayout />} >
                              <Route path="user/:userId" element={<MessengerChatUser />} />
                            </Route>
                            <Route element={<MessengerChatRoomLayout />} >
                              <Route path="room/:roomId" element={<MessengerChatRoom />} />
                            </Route>
                            <Route element={<MessengerChatNotFoundLayout />} >
                              <Route path="not-found" element={<MessengerChatNotFoundPage />} />
                            </Route>
                            <Route element={<MessengerChatUnauthorizedLayout />} >
                              <Route path="unauthorized" element={<MessengerChatUnauthorizedPage />} />
                            </Route>
                            <Route element={<MessengerChatForbiddenLayout />} >
                              <Route path="forbidden" element={<MessengerChatForbiddenPage />} />
                            </Route>
                            <Route element={<MessengerChatErrorLayout />} >
                              <Route path="error" element={<MessengerChatErrorPage />} />
                            </Route>
                            <Route element={<MessengerChatLoadingLayout />} >
                              <Route path="loading" element={<MessengerChatLoadingPage />} />
                            </Route>
                            <Route element={<MessengerChatOfflineLayout />} >
                              <Route path="offline" element={<MessengerChatOfflinePage />} />
                            </Route>
                            <Route element={<MessengerChatTimeoutLayout />} >
                              <Route path="timeout" element={<MessengerChatTimeoutPage />} />
                            </Route>
                            <Route element={<MessengerChatServerErrorLayout />} >
                              <Route path="server-error" element={<MessengerChatServerErrorPage />} />
                            </Route>
                            <Route element={<MessengerChatServiceUnavailableLayout />} >
                              <Route path="service-unavailable" element={<MessengerChatServiceUnavailablePage />} />
                            </Route>
                            <Route element={<MessengerChatGatewayTimeoutLayout />} >
                              <Route path="gateway-timeout" element={<MessengerChatGatewayTimeoutPage />} />
                            </Route>
                            <Route element={<MessengerChatBadGatewayLayout />} >
                              <Route path="bad-gateway" element={<MessengerChatBadGatewayPage />} />
                            </Route>
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                      <Toaster />
                      <Sonner />
                    </BrowserRouter>
                  </ReplyProvider>
                </LanguageProvider>
              </AuthProvider>
            </NotificationProvider>
          </NotificationErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
