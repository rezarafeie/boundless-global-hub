import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GMAIL_CLIENT_ID = "242349790411-gkb8upvjoo1rcmtiru50mb9tu32eqt4g.apps.googleusercontent.com";
const GMAIL_CLIENT_SECRET = "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";
const GMAIL_REDIRECT_URI = "https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/gmail-oauth";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle GET request (OAuth callback from Google)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        return new Response(`
          <html>
            <body>
              <h1>OAuth Error</h1>
              <p>Error: ${error}</p>
              <script>window.close();</script>
            </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 400
        });
      }

      if (!code) {
        return new Response(`
          <html>
            <body>
              <h1>OAuth Error</h1>
              <p>No authorization code received</p>
              <script>window.close();</script>
            </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 400
        });
      }

      // Exchange the code for tokens
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
        return new Response(`
          <html>
            <body>
              <h1>Token Exchange Failed</h1>
              <p>Error: ${tokenData.error_description || tokenData.error}</p>
              <script>window.close();</script>
            </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 400
        });
      }

      // Get user email from Google API
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok) {
        return new Response(`
          <html>
            <body>
              <h1>Profile Fetch Failed</h1>
              <p>Failed to get user profile</p>
              <script>window.close();</script>
            </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 400
        });
      }

      // Store credentials in database
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
      
      const { data, error: dbError } = await supabase
        .from('gmail_credentials')
        .upsert({
          email_address: profileData.email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'email_address'
        });

      if (dbError) {
        return new Response(`
          <html>
            <body>
              <h1>Database Error</h1>
              <p>Error: ${dbError.message}</p>
              <script>window.close();</script>
            </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 500
        });
      }

      // Success page that closes the window
      return new Response(`
        <html>
          <body>
            <h1>Gmail Connected Successfully!</h1>
            <p>Email: ${profileData.email}</p>
            <p>You can close this window now.</p>
            <script>
              // Post message to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'gmail_oauth_success',
                  email: '${profileData.email}'
                }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Handle POST request (API calls from frontend)
    if (req.method === 'POST') {
      const { action, code } = await req.json();

      if (action === 'get_auth_url') {
        // Generate OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
        authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', GMAIL_REDIRECT_URI);
        authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');

        return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'exchange_code') {
        // Legacy manual code exchange (still supported for backwards compatibility)
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
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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