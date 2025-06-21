import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from './components/ui/theme-provider';
import { LanguageProvider } from './contexts/LanguageContext';
import IndexPage from './pages';
import ContactPage from './pages/ContactPage';
import AboutUsPage from './pages/AboutUsPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import SupportPage from './pages/SupportPage';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from '@/components/ui/toaster';
import BorderlessHub from './pages/BorderlessHub';
import BorderlessHubChat from './pages/BorderlessHubChat';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/" element={<IndexPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/hub" element={<BorderlessHub />} />
              <Route path="/hub/chat" element={<BorderlessHubChat />} />
            </Routes>
            <Toaster />
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
