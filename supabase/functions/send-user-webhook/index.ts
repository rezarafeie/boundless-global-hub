
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  event_type: string;
  is_active: boolean;
  headers: any;
  body_template: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 User webhook function called');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { user, eventType } = await req.json();
    
    console.log(`📥 Processing ${eventType} webhook for user:`, user.name);

    // Get active webhooks for this event type
    const { data: webhooks, error: webhookError } = await supabaseClient
      .from('webhook_configurations')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true);

    if (webhookError) {
      console.error('Error fetching webhook configurations:', webhookError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhook configurations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhooks || webhooks.length === 0) {
      console.log(`No active webhooks found for event type: ${eventType}`);
      return new Response(
        JSON.stringify({ message: `No active webhooks for ${eventType}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${webhooks.length} active webhook(s) for event: ${eventType}`);

    // Send webhooks
    const results = await Promise.allSettled(
      webhooks.map(webhook => sendWebhook(webhook, user, eventType, supabaseClient))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`📊 Webhook summary: ${successful} succeeded, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Webhooks processed: ${successful} succeeded, ${failed} failed`,
        eventType,
        user: { id: user.id, name: user.name }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendWebhook(webhook: WebhookConfig, user: any, eventType: string, supabaseClient: any) {
  try {
    // Create webhook payload
    const payload = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      data: { user }
    };

    // Merge with body template
    const body = mergeTemplate(webhook.body_template, payload);
    
    console.log(`📤 Sending webhook to ${webhook.name} (${webhook.url})`);
    
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...webhook.headers
      },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();

    // Log the webhook execution
    await supabaseClient.from('webhook_logs').insert({
      webhook_config_id: webhook.id,
      event_type: eventType,
      payload: payload,
      response_status: response.status,
      response_body: responseText,
      success: response.ok
    });

    if (response.ok) {
      console.log(`✅ Webhook sent successfully to ${webhook.name} (${webhook.url})`);
    } else {
      console.error(`❌ Webhook failed for ${webhook.name}: ${response.status} ${responseText}`);
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

  } catch (error) {
    console.error(`❌ Webhook execution failed for ${webhook.name}:`, error);
    
    // Log the error
    await supabaseClient.from('webhook_logs').insert({
      webhook_config_id: webhook.id,
      event_type: eventType,
      payload: { user },
      response_status: 0,
      response_body: '',
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

function mergeTemplate(template: Record<string, any>, payload: any): any {
  const result = { ...template };
  
  // Replace template variables with actual data
  const replaceVariables = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
        const value = getNestedValue(payload, path);
        return value !== undefined ? value : match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(replaceVariables);
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = replaceVariables(value);
      }
      return newObj;
    }
    return obj;
  };

  return replaceVariables(result);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
