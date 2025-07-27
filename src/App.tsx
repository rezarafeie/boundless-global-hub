import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ReplyProvider } from '@/contexts/ReplyContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import './App.css';

// Lazy load components
const Index = lazy(() => import('@/pages/Index'));
const EnrollmentAdmin = lazy(() => import('@/pages/EnrollmentAdmin'));
const AdminEnrollmentDetails = lazy(() => import('@/pages/AdminEnrollmentDetails'));
const Chat = lazy(() => import('@/pages/Chat'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const Course = lazy(() => import('@/pages/Course'));
const Courses = lazy(() => import('@/pages/Courses'));
const Category = lazy(() => import('@/pages/Category'));
const Article = lazy(() => import('@/pages/Article'));
const Articles = lazy(() => import('@/pages/Articles'));
const Support = lazy(() => import('@/pages/Support'));
const Enroll = lazy(() => import('@/pages/Enroll'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const VerifyPayment = lazy(() => import('@/pages/VerifyPayment'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminUserEdit = lazy(() => import('@/pages/AdminUserEdit'));
const AdminCourseCreate = lazy(() => import('@/pages/AdminCourseCreate'));
const AdminCourseEdit = lazy(() => import('@/pages/AdminCourseEdit'));
const ShortLinkLanding = lazy(() => import('@/pages/ShortLinkLanding'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NotificationProvider>
              <ReplyProvider>
                <TooltipProvider>
                  <BrowserRouter>
                    <div className="min-h-screen bg-background">
                      <ErrorBoundary>
                        <Suspense fallback={
                          <div className="flex items-center justify-center min-h-screen">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          </div>
                        }>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/course/:courseSlug" element={<Course />} />
                            <Route path="/courses" element={<Courses />} />
                            <Route path="/category/:categorySlug" element={<Category />} />
                            <Route path="/article/:articleSlug" element={<Article />} />
                            <Route path="/articles" element={<Articles />} />
                            <Route path="/support" element={<Support />} />
                            <Route path="/enroll" element={<Enroll />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/verify-payment" element={<VerifyPayment />} />
                            <Route path="/user/:userId" element={<UserProfile />} />

                            {/* Admin Routes */}
                            <Route path="/enroll/admin" element={<EnrollmentAdmin />} />
                            <Route path="/enroll/admin/users/:userId" element={<AdminUserEdit />} />
                            <Route path="/enroll/admin/users" element={<AdminUsers />} />
                            <Route path="/admin/course/create" element={<AdminCourseCreate />} />
                            <Route path="/admin/course/edit/:courseId" element={<AdminCourseEdit />} />
                            
                            {/* Add the new admin enrollment details route */}
                            <Route path="/admin/enrollment/:id" element={<AdminEnrollmentDetails />} />

                            {/* Short Link Landing */}
                            <Route path="/go/:shortLinkSlug" element={<ShortLinkLanding />} />

                            {/* Not Found */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                    <Toaster />
                  </BrowserRouter>
                </TooltipProvider>
              </ReplyProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
