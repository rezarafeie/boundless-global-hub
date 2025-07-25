import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GMAIL_CLIENT_ID = "242349790411-gkb8upvjoo1rcmtiru50mb9tu32eqt4g.apps.googleusercontent.com";
const GMAIL_CLIENT_SECRET = "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";
const GMAIL_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();

    if (action === 'get_auth_url') {
      // Generate OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', GMAIL_REDIRECT_URI);
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.send');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange_code') {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GMAIL_CLIENT_ID,
          client_secret: GMAIL_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: GMAIL_REDIRECT_URI,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
      }

      // Get user email from Google API
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile');
      }

      // Store credentials in database
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
      
      const { data, error } = await supabase
        .from('gmail_credentials')
        .upsert({
          email_address: profileData.email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'email_address'
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        email: profileData.email 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Gmail OAuth error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Gmail OAuth failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});