import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing Gmail authentication...');
    
    // Get Gmail credentials
    const { data: credentials, error: credError } = await supabase
      .from('gmail_credentials')
      .select('*')
      .limit(1)
      .single();

    if (credError || !credentials) {
      return new Response(JSON.stringify({ 
        error: 'No Gmail credentials found',
        details: credError 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📧 Testing with Gmail account:', credentials.email_address);
    
    // Test the current access token
    const testResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
      },
    });

    if (testResponse.ok) {
      const profile = await testResponse.json();
      return new Response(JSON.stringify({
        success: true,
        message: 'Gmail authentication working!',
        email: profile.emailAddress,
        token_status: 'valid'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If token failed, try to refresh
    console.log('🔄 Access token failed, trying refresh...');
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: "242349790411-gkb8upvjoo1rcmtiru50mb9tu32eqt4g.apps.googleusercontent.com",
        client_secret: "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",
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const refreshData = await refreshResponse.json();
    console.log('🔄 Refresh response:', refreshResponse.status, refreshData);

    if (!refreshResponse.ok) {
      return new Response(JSON.stringify({
        error: 'Token refresh failed',
        details: refreshData,
        original_test_status: testResponse.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test with new token
    const newTestResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${refreshData.access_token}`,
      },
    });

    if (newTestResponse.ok) {
      // Update credentials with new token
      await supabase
        .from('gmail_credentials')
        .update({
          access_token: refreshData.access_token,
          token_expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString(),
        })
        .eq('id', credentials.id);

      const profile = await newTestResponse.json();
      return new Response(JSON.stringify({
        success: true,
        message: 'Gmail authentication working after refresh!',
        email: profile.emailAddress,
        token_status: 'refreshed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newTestError = await newTestResponse.json();
    return new Response(JSON.stringify({
      error: 'Both original and refreshed tokens failed',
      original_status: testResponse.status,
      refresh_status: refreshResponse.status,
      new_test_status: newTestResponse.status,
      new_test_error: newTestError
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Gmail test failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});