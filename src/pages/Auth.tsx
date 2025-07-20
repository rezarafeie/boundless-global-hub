import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import UnifiedMessengerAuth from '@/components/Chat/UnifiedMessengerAuth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { unifiedAuthService } from '@/lib/unifiedAuthService';
import { messengerService } from '@/lib/messengerService';

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

  // Check for URL linking parameter
  useEffect(() => {
    const linkParam = searchParams.get('link');
    if (linkParam) {
      console.log('🔗 Found linking parameter:', linkParam);
      setLinkingEmail(linkParam);
    }
  }, [searchParams]);

  // Check for Google auth session on mount
  useEffect(() => {
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
          console.log('✅ User exists, logging in...');
          // User exists, login through messenger service for unified session
          if (existingUser.isMessengerUser && existingUser.messengerData) {
            const sessionToken = await messengerService.createSession(existingUser.messengerData.id);
            login(existingUser, sessionToken);
          } else if (existingUser.isAcademyUser) {
            // For academy users, we'll create a session token
            const sessionToken = `academy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            login(existingUser, sessionToken);
          }
        } else {
          console.log('📝 User needs linking or registration');
          
          // If we don't have a linking parameter in URL, redirect to linking flow
          if (!linkingEmail && session.user.email) {
            console.log('🔗 Redirecting to linking flow for unlinked Google account');
            window.location.href = `/auth?link=${encodeURIComponent(session.user.email)}`;
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
  }, [login, linkingEmail]);

  // If user is already authenticated, redirect to home
  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
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
        />
      </div>
    </div>
  );
};

export default Auth;