
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ReplyProvider } from "@/contexts/ReplyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import EnrollAdmin from "./pages/EnrollAdmin";
import UserDetail from "./pages/UserDetail";
import UserProfile from "./pages/UserProfile";
import Support from "./pages/Support";
import UserManagementPanel from "./components/Admin/UserManagementPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ReplyProvider>
            <LanguageProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/enroll/admin" element={<EnrollAdmin />} />
                    <Route path="/enroll/admin/users/:id" element={<UserDetail />} />
                    <Route path="/user-profile" element={<UserProfile />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/admin/users-panel" element={<UserManagementPanel />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </LanguageProvider>
          </ReplyProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
