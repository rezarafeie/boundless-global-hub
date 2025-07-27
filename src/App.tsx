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
import Chat from "./pages/Chat";
import Support from "./pages/Support";
import SupportAdmin from "./pages/SupportAdmin";
import SupportDetail from "./pages/SupportDetail";
import Settings from "./pages/Settings";
import Call from "./pages/Call";
import CallEnded from "./pages/CallEnded";
import CallQueue from "./pages/CallQueue";
import CallAnswer from "./pages/CallAnswer";
import Admin from "./pages/Admin";
import GoogleLogin from "./pages/GoogleLogin";
import AdminCall from "./pages/AdminCall";
import AdminCallAnswer from "./pages/AdminCallAnswer";
import AdminCallQueue from "./pages/AdminCallQueue";
import GoogleLoginSettings from "./pages/GoogleLoginSettings";
import UserManagement from "./pages/UserManagement";
import UserManagementPanel from "./components/Admin/UserManagementPanel";
import EditProfile from "./pages/EditProfile";
import Statistics from "./pages/Statistics";
import AdminStatistics from "./pages/AdminStatistics";
import CallStatistics from "./pages/CallStatistics";
import AdminCallStatistics from "./pages/AdminCallStatistics";
import Enroll from "./pages/Enroll";
import EnrollDetail from "./pages/EnrollDetail";
import EnrollEdit from "./pages/EnrollEdit";
import EnrollStatistics from "./pages/EnrollStatistics";
import EnrollCategory from "./pages/EnrollCategory";
import EnrollCategoryEdit from "./pages/EnrollCategoryEdit";
import EnrollNew from "./pages/EnrollNew";
import EnrollView from "./pages/EnrollView";
import EnrollChat from "./pages/EnrollChat";
import EnrollChatDetail from "./pages/EnrollChatDetail";
import EnrollChatCategory from "./pages/EnrollChatCategory";
import EnrollChatCategoryEdit from "./pages/EnrollChatCategoryEdit";
import EnrollChatNew from "./pages/EnrollChatNew";
import EnrollChatView from "./pages/EnrollChatView";
import EnrollChatStatistics from "./pages/EnrollChatStatistics";
import EnrollChatDetailStatistics from "./pages/EnrollChatDetailStatistics";
import EnrollChatUser from "./pages/EnrollChatUser";
import EnrollChatUserDetail from "./pages/EnrollChatUserDetail";
import EnrollChatUserStatistics from "./pages/EnrollChatUserStatistics";
import EnrollChatUserDetailStatistics from "./pages/EnrollChatUserDetailStatistics";
import EnrollChatUserNew from "./pages/EnrollChatUserNew";
import EnrollChatUserEdit from "./pages/EnrollChatUserEdit";
import EnrollChatUserView from "./pages/EnrollChatUserView";
import EnrollChatUserCategory from "./pages/EnrollChatUserCategory";
import EnrollChatUserCategoryEdit from "./pages/EnrollChatUserCategoryEdit";
import EnrollChatUserCategoryNew from "./pages/EnrollChatUserCategoryNew";
import EnrollChatUserCategoryView from "./pages/EnrollChatUserCategoryView";
import EnrollChatUserCategoryStatistics from "./pages/EnrollChatUserCategoryStatistics";
import EnrollChatUserCategoryDetailStatistics from "./pages/EnrollChatUserCategoryDetailStatistics";
import EnrollChatUserCategoryUser from "./pages/EnrollChatUserCategoryUser";
import EnrollChatUserCategoryUserDetail from "./pages/EnrollChatUserCategoryUserDetail";
import EnrollChatUserCategoryUserStatistics from "./pages/EnrollChatUserCategoryUserStatistics";
import EnrollChatUserCategoryUserDetailStatistics from "./pages/EnrollChatUserCategoryUserDetailStatistics";
import EnrollChatUserCategoryUserNew from "./pages/EnrollChatUserCategoryUserNew";
import EnrollChatUserCategoryUserEdit from "./pages/EnrollChatUserCategoryUserEdit";
import EnrollChatUserCategoryUserView from "./pages/EnrollChatUserCategoryUserView";
import EnrollChatUserCategoryUserCategory from "./pages/EnrollChatUserCategoryUserCategory";
import EnrollChatUserCategoryUserCategoryEdit from "./pages/EnrollChatUserCategoryUserCategoryEdit";
import EnrollChatUserCategoryUserCategoryNew from "./pages/EnrollChatUserCategoryUserCategoryNew";
import EnrollChatUserCategoryUserCategoryView from "./pages/EnrollChatUserCategoryUserCategoryView";
import EnrollChatUserCategoryUserCategoryStatistics from "./pages/EnrollChatUserCategoryUserCategoryStatistics";
import EnrollChatUserCategoryUserCategoryDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryDetailStatistics";
import EnrollChatUserCategoryUserCategoryUser from "./pages/EnrollChatUserCategoryUserCategoryUser";
import EnrollChatUserCategoryUserCategoryUserDetail from "./pages/EnrollChatUserCategoryUserCategoryUserDetail";
import EnrollChatUserCategoryUserCategoryUserStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserStatistics";
import EnrollChatUserCategoryUserCategoryUserDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserNew from "./pages/EnrollChatUserCategoryUserCategoryUserNew";
import EnrollChatUserCategoryUserCategoryUserEdit from "./pages/EnrollChatUserCategoryUserCategoryUserEdit";
import EnrollChatUserCategoryUserCategoryUserView from "./pages/EnrollChatUserCategoryUserCategoryUserView";
import EnrollChatUserCategoryUserCategoryUserCategory from "./pages/EnrollChatUserCategoryUserCategoryUserCategory";
import EnrollChatUserCategoryUserCategoryUserCategoryEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryNew";
import EnrollChatUserCategoryUserCategoryUserCategoryView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryView";
import EnrollChatUserCategoryUserCategoryUserCategoryStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUser from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUser";
import EnrollChatUserCategoryUserCategoryUserCategoryUserDetail from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserDetail";
import EnrollChatUserCategoryUserCategoryUserCategoryUserStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserNew";
import EnrollChatUserCategoryUserCategoryUserCategoryUserEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryUserView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserView";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategory from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategory";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryNew";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryView";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUser from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUser";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserDetail from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserDetail";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserNew";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserView";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategory from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategory";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryNew";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryView";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUser from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUser";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetail from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetail";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserNew";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserView";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategory from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategory";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryNew";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryView";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUser from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUser";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetail from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetail";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserNew from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserNew";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserEdit from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserEdit";
import EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserView from "./pages/EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserView";

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
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/support/admin" element={<SupportAdmin />} />
                    <Route path="/support/:id" element={<SupportDetail />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/call" element={<Call />} />
                    <Route path="/call/ended" element={<CallEnded />} />
                    <Route path="/call/queue" element={<CallQueue />} />
                    <Route path="/call/answer" element={<CallAnswer />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/google-login" element={<GoogleLogin />} />
                    <Route path="/admin/call" element={<AdminCall />} />
                    <Route path="/admin/call/answer" element={<AdminCallAnswer />} />
                    <Route path="/admin/call/queue" element={<AdminCallQueue />} />
                    <Route path="/admin/google-login" element={<GoogleLoginSettings />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/users-panel" element={<UserManagementPanel />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/admin/statistics" element={<AdminStatistics />} />
                    <Route path="/statistics/call" element={<CallStatistics />} />
                    <Route path="/admin/statistics/call" element={<AdminCallStatistics />} />
                    <Route path="/enroll" element={<Enroll />} />
                    <Route path="/enroll/:id" element={<EnrollDetail />} />
                    <Route path="/enroll/:id/edit" element={<EnrollEdit />} />
                    <Route path="/enroll/statistics" element={<EnrollStatistics />} />
                    <Route path="/enroll/category" element={<EnrollCategory />} />
                    <Route path="/enroll/category/:id/edit" element={<EnrollCategoryEdit />} />
                    <Route path="/enroll/new" element={<EnrollNew />} />
                    <Route path="/enroll/:id/view" element={<EnrollView />} />
                    <Route path="/enroll/:id/chat" element={<EnrollChat />} />
                    <Route path="/enroll/:id/chat/:chatId" element={<EnrollChatDetail />} />
                    <Route path="/enroll/:id/chat/category" element={<EnrollChatCategory />} />
                    <Route path="/enroll/:id/chat/category/:categoryId/edit" element={<EnrollChatCategoryEdit />} />
                    <Route path="/enroll/:id/chat/new" element={<EnrollChatNew />} />
                    <Route path="/enroll/:id/chat/:chatId/view" element={<EnrollChatView />} />
                    <Route path="/enroll/:id/chat/statistics" element={<EnrollChatStatistics />} />
                    <Route path="/enroll/:id/chat/:chatId/statistics" element={<EnrollChatDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user" element={<EnrollChatUser />} />
                    <Route path="/enroll/:id/chat/user/:userId" element={<EnrollChatUserDetail />} />
                    <Route path="/enroll/:id/chat/user/statistics" element={<EnrollChatUserStatistics />} />
                    <Route path="/enroll/:id/chat/user/:userId/statistics" element={<EnrollChatUserDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/new" element={<EnrollChatUserNew />} />
                    <Route path="/enroll/:id/chat/user/:userId/edit" element={<EnrollChatUserEdit />} />
                    <Route path="/enroll/:id/chat/user/:userId/view" element={<EnrollChatUserView />} />
                    <Route path="/enroll/:id/chat/user/category" element={<EnrollChatUserCategory />} />
                    <Route path="/enroll/:id/chat/user/category/:categoryId/edit" element={<EnrollChatUserCategoryEdit />} />
                    <Route path="/enroll/:id/chat/user/category/new" element={<EnrollChatUserCategoryNew />} />
                    <Route path="/enroll/:id/chat/user/category/:categoryId/view" element={<EnrollChatUserCategoryView />} />
                    <Route path="/enroll/:id/chat/user/category/statistics" element={<EnrollChatUserCategoryStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/:categoryId/statistics" element={<EnrollChatUserCategoryDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user" element={<EnrollChatUserCategoryUser />} />
                    <Route path="/enroll/:id/chat/user/category/user/:userId" element={<EnrollChatUserCategoryUserDetail />} />
                    <Route path="/enroll/:id/chat/user/category/user/statistics" element={<EnrollChatUserCategoryUserStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/:userId/statistics" element={<EnrollChatUserCategoryUserDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/new" element={<EnrollChatUserCategoryUserNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/:userId/edit" element={<EnrollChatUserCategoryUserEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/:userId/view" element={<EnrollChatUserCategoryUserView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category" element={<EnrollChatUserCategoryUserCategory />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/:categoryId/edit" element={<EnrollChatUserCategoryUserCategoryEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/new" element={<EnrollChatUserCategoryUserCategoryNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/:categoryId/view" element={<EnrollChatUserCategoryUserCategoryView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/statistics" element={<EnrollChatUserCategoryUserCategoryStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/:categoryId/statistics" element={<EnrollChatUserCategoryUserCategoryDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user" element={<EnrollChatUserCategoryUserCategoryUser />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/:userId" element={<EnrollChatUserCategoryUserCategoryUserDetail />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/statistics" element={<EnrollChatUserCategoryUserCategoryUserStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/:userId/statistics" element={<EnrollChatUserCategoryUserCategoryUserDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/new" element={<EnrollChatUserCategoryUserCategoryUserNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/:userId/edit" element={<EnrollChatUserCategoryUserCategoryUserEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/:userId/view" element={<EnrollChatUserCategoryUserCategoryUserView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category" element={<EnrollChatUserCategoryUserCategoryUserCategory />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/:categoryId/edit" element={<EnrollChatUserCategoryUserCategoryUserCategoryEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/new" element={<EnrollChatUserCategoryUserCategoryUserCategoryNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/:categoryId/view" element={<EnrollChatUserCategoryUserCategoryUserCategoryView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/:categoryId/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user" element={<EnrollChatUserCategoryUserCategoryUserCategoryUser />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/:userId" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserDetail />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/:userId/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/new" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/:userId/edit" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/:userId/view" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategory />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/:categoryId/edit" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/new" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/:categoryId/view" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/:categoryId/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUser />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/:userId" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserDetail />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/:userId/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/new" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/:userId/edit" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/:userId/view" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategory />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/:categoryId/edit" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/new" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/:categoryId/view" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryView />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/:categoryId/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/user" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUser />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/user/:userId" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetail />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/user/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/user/:userId/statistics" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserDetailStatistics />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/user/new" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserNew />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/user/:userId/edit" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserEdit />} />
                    <Route path="/enroll/:id/chat/user/category/user/category/user/category/user/category/user/category/user/:userId/view" element={<EnrollChatUserCategoryUserCategoryUserCategoryUserCategoryUserCategoryUserView />} />
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
