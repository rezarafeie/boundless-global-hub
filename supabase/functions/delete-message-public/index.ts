import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const messageId = url.searchParams.get('messageId');
    const table = url.searchParams.get('table') || 'messenger_messages';

    if (!messageId) {
      return new Response(
        JSON.stringify({ error: 'Message ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Attempting to delete message ${messageId} from table ${table}`);

    // Delete the message from the specified table
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete message' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully deleted message ${messageId}`);

    // Return a simple HTML page confirming deletion
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Message Deleted</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background-color: #f5f5f5;
            }
            .container { 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              max-width: 400px; 
              margin: 0 auto;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success { color: #28a745; }
            .icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h2 class="success">پیام حذف شد</h2>
            <p>پیام با موفقیت حذف شد.</p>
            <small>Message ID: ${messageId}</small>
          </div>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});