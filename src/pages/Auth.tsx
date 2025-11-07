
import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { unifiedAuthService } from '@/lib/unifiedAuthService';
import { messengerService } from '@/lib/messengerService';
import useGoogleAuthSettings from '@/hooks/useGoogleAuthSettings';

const Auth: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth();
  const [searchParams] = useSearchParams();
  const [googleUserData, setGoogleUserData] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState<string | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const { isGoogleAuthEnabled } = useGoogleAuthSettings();

  // Check for URL linking parameter and redirect URL
  useEffect(() => {
    const linkParam = searchParams.get('link');
    const redirectParam = searchParams.get('redirect');
    
    if (linkParam) {
      console.log('🔗 Found linking parameter:', linkParam);
      setLinkingEmail(linkParam);
      setIsLinkingMode(true);
      // Clear any existing auth session when starting linking process
      supabase.auth.signOut();
    }
    
    if (redirectParam) {
      localStorage.setItem('auth_redirect', redirectParam);
    }
  }, [searchParams]);

  // Check for Google auth session on mount
  useEffect(() => {
    // Don't run auth check if we're in linking mode or if Google auth is disabled
    if (isLinkingMode || !isGoogleAuthEnabled) {
      return;
    }

    const checkGoogleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('🔐 Found Google auth session:', session.user.email);
        
        // Check if user exists in our unified system
        const existingUser = await unifiedAuthService.findUserByCredentials(
          '',
          session.user.email || '',
          '+98'
        );
        
        if (existingUser) {
          console.log('✅ User exists with email:', existingUser.email);
          
          // Check if Google email matches - if yes, user is already linked
          if (existingUser.email === session.user.email) {
            console.log('✅ User already linked, logging in...');
            // User exists and Gmail is already linked, login normally
            if (existingUser.isMessengerUser && existingUser.messengerData) {
              const sessionToken = await messengerService.createSession(existingUser.messengerData.id);
              login(existingUser, sessionToken);
            } else if (existingUser.isAcademyUser) {
              const sessionToken = `academy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              login(existingUser, sessionToken);
            }
          } else {
            console.log('🔗 User exists but Gmail not linked, redirecting to linking...');
            // User exists but Gmail is not linked - force redirect to linking
            const currentUrl = window.location.pathname + window.location.search;
            const targetUrl = `/auth?link=${encodeURIComponent(session.user.email || '')}`;
            
            // Prevent infinite redirect - only redirect if we're not already on the target URL
            if (currentUrl !== targetUrl) {
              window.location.href = targetUrl;
              return;
            }
          }
        } else {
          console.log('📝 User needs linking or registration');
          
          // If we don't have a linking parameter in URL, redirect to linking flow  
          const currentUrl = window.location.pathname + window.location.search;
          const targetUrl = `/auth?link=${encodeURIComponent(session.user.email || '')}`;
          
          // Prevent infinite redirect - only redirect if we're not already on the target URL
          if (session.user.email && currentUrl !== targetUrl) {
            console.log('🔗 Redirecting to linking flow for unlinked Google account');
            window.location.href = targetUrl;
            return;
          }
          
          // If we have a linking email from URL, use that for linking flow
          const emailToUse = linkingEmail || session.user.email || '';
          
          setGoogleUserData({
            email: emailToUse,
            firstName: session.user.user_metadata?.given_name || '',
            lastName: session.user.user_metadata?.family_name || ''
          });
          setShowRegistration(true);
        }
      }
    };

    checkGoogleAuth();
  }, [login, linkingEmail, isLinkingMode, isGoogleAuthEnabled]);

  // Modified redirect condition - don't redirect if we're in linking mode
  if (isAuthenticated && user && !isLinkingMode) {
    // Check if app is installed (PWA mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const hasSkippedInstaller = localStorage.getItem('pwa_installer_skipped') === 'true';
    
    // If app is not installed and user hasn't skipped, show installer first
    if (!isStandalone && !isInWebAppiOS && !hasSkippedInstaller) {
      return <Navigate to="/install-app" replace />;
    }
    
    const redirectUrl = localStorage.getItem('auth_redirect') || '/dashboard';
    localStorage.removeItem('auth_redirect');
    return <Navigate to={redirectUrl} replace />;
  }

  const handleAuthenticated = (sessionToken: string, userName: string, userData: any) => {
    console.log('🎉 Auth page: User authenticated successfully', { 
      sessionToken: sessionToken.substring(0, 10) + '...', 
      userName, 
      userId: userData.id 
    });
    
    // Use the login function from AuthContext to sync the session across all systems
    login(userData, sessionToken);
    
    console.log('🔄 Session synced, redirecting...');
    // Redirect will happen automatically due to the Navigate above
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <UnifiedMessengerAuth 
          onAuthenticated={handleAuthenticated} 
          prefillData={googleUserData || undefined}
          linkingEmail={linkingEmail}
          isAcademyAuth={true}
        />
      </div>
    </div>
  );
};

export default Auth;
