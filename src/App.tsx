
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Index from '@/pages/Index';
import AssessmentCenter from '@/pages/AssessmentCenter';
import Magazine from '@/pages/Magazine';
import Support from '@/pages/Support';
import PaidCourses from '@/pages/PaidCourses';
import FreeCourses from '@/pages/FreeCourses';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import BorderlessHub from '@/pages/BorderlessHub';
import BorderlessHubMessenger from '@/pages/BorderlessHubMessenger';  
import MessengerPending from '@/pages/MessengerPending';
import BorderlessHubMessengerAdmin from '@/pages/BorderlessHubMessengerAdmin';
import BorderlessHubAdmin from '@/pages/BorderlessHubAdmin';
import BorderlessHubUnifiedAdmin from '@/pages/BorderlessHubUnifiedAdmin';
import BorderlessHubSupportDashboard from '@/pages/BorderlessHubSupportDashboard';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout><Index /></MainLayout>} />
            <Route path="/courses" element={<MainLayout><Index /></MainLayout>} />
            <Route path="/paid-courses" element={<MainLayout><PaidCourses /></MainLayout>} />
            <Route path="/free-courses" element={<MainLayout><FreeCourses /></MainLayout>} />
            <Route path="/assessment-center" element={<MainLayout><AssessmentCenter /></MainLayout>} />
            <Route path="/mag" element={<MainLayout><Magazine /></MainLayout>} />
            <Route path="/support" element={<MainLayout><Support /></MainLayout>} />
            <Route path="/hub" element={<MainLayout><BorderlessHub /></MainLayout>} />
            <Route path="/hub/messenger" element={<MainLayout><BorderlessHubMessenger /></MainLayout>} />
            <Route path="/hub/messenger/pending" element={<MainLayout><MessengerPending /></MainLayout>} />
            <Route path="/hub/messenger/admin" element={<MainLayout><BorderlessHubMessengerAdmin /></MainLayout>} />
            <Route path="/hub/admin-panel" element={<MainLayout><BorderlessHubAdmin /></MainLayout>} />

            {/* Unified Admin Routes */}
            <Route path="/hub/admin" element={<BorderlessHubUnifiedAdmin />} />
            <Route path="/hub/support" element={<BorderlessHubSupportDashboard />} />
            
          </Routes>
          <Toaster />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
