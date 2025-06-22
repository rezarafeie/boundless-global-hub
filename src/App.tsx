import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import AssessmentCenter from '@/pages/AssessmentCenter';
import Mag from '@/pages/Mag';
import Support from '@/pages/Support';
import Boundless from '@/pages/Boundless';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import LanguageProvider from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import BorderlessHub from '@/pages/BorderlessHub';
import BorderlessHubMessenger from '@/pages/BorderlessHubMessenger';
import BorderlessHubMessengerPendingApproval from '@/pages/BorderlessHubMessengerPendingApproval';
import BorderlessHubMessengerAdmin from '@/pages/BorderlessHubMessengerAdmin';
import BorderlessHubAdmin from '@/pages/BorderlessHubAdmin';
import BorderlessHubUnifiedAdmin from '@/pages/BorderlessHubUnifiedAdmin';
import BorderlessHubSupportDashboard from '@/pages/BorderlessHubSupportDashboard';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Courses /></MainLayout>} />
          <Route path="/courses" element={<MainLayout><Courses /></MainLayout>} />
          <Route path="/courses/:courseId" element={<MainLayout><CourseDetail /></MainLayout>} />
          <Route path="/assessment-center" element={<MainLayout><AssessmentCenter /></MainLayout>} />
          <Route path="/mag" element={<MainLayout><Mag /></MainLayout>} />
          <Route path="/support" element={<MainLayout><Support /></MainLayout>} />
          <Route path="/boundless" element={<MainLayout><Boundless /></MainLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
          <Route path="/profile/edit" element={<MainLayout><EditProfile /></MainLayout>} />
          <Route path="/hub" element={<MainLayout><BorderlessHub /></MainLayout>} />
          <Route path="/hub/messenger" element={<MainLayout><BorderlessHubMessenger /></MainLayout>} />
          <Route path="/hub/messenger/pending" element={<MainLayout><BorderlessHubMessengerPendingApproval /></MainLayout>} />
          <Route path="/hub/messenger/admin" element={<MainLayout><BorderlessHubMessengerAdmin /></MainLayout>} />
          <Route path="/hub/admin-panel" element={<MainLayout><BorderlessHubAdmin /></MainLayout>} />

          {/* Unified Admin Routes */}
          <Route path="/hub/admin" element={<BorderlessHubUnifiedAdmin />} />
          <Route path="/hub/support" element={<BorderlessHubSupportDashboard />} />
          
        </Routes>
        <Toaster />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
