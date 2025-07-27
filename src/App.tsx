
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

// Import existing pages
const Landing = lazy(() => import("@/pages/Index"));
const Home = lazy(() => import("@/pages/Dashboard"));
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const EnrollmentAdmin = lazy(() => import("@/pages/EnrollmentAdmin"));

// Import existing components - only the ones that exist
import Support from "@/pages/Support";
import CRMAdmin from "@/pages/CRMAdmin";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <NotificationErrorBoundary>
            <NotificationProvider>
              <AuthProvider>
                <LanguageProvider>
                  <ReplyProvider>
                    <BrowserRouter>
                      <OfflineDetector>
                        <Suspense fallback={<PurpleLoader />}>
                          <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/support" element={<Support />} />
                            <Route path="/enroll/admin" element={<EnrollmentAdmin />} />
                            <Route path="/enroll/admin/crm" element={<CRMAdmin />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </OfflineDetector>
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
