import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData, event } = await req.json();
    console.log('Sending lead request webhook:', { event, leadData });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Map event to webhook event types
    const eventTypeMap: Record<string, string> = {
      'created': 'lead_request_created',
      'name_added': 'lead_request_updated',
      'answers_added': 'lead_request_updated',
      'ai_completed': 'lead_request_ai_completed'
    };

    const webhookEventType = eventTypeMap[event] || 'lead_request_updated';

    // Fetch active webhooks for lead request events
    const { data: webhooks, error: webhookError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .in('event_type', ['lead_request_created', 'lead_request_updated', 'lead_request_ai_completed'])
      .eq('is_active', true);

    if (webhookError) {
      console.error('Error fetching webhooks:', webhookError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch webhooks' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${webhooks?.length || 0} active webhooks`);

    // Filter webhooks that match the current event
    const matchingWebhooks = (webhooks || []).filter(w => w.event_type === webhookEventType);

    if (matchingWebhooks.length === 0) {
      console.log('No matching webhooks found for event:', webhookEventType);
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send to each matching webhook
    const results = await Promise.allSettled(
      matchingWebhooks.map(async (webhook) => {
        const payload = {
          event_type: webhookEventType,
          timestamp: new Date().toISOString(),
          data: {
            lead_id: leadData.id,
            phone: leadData.phone,
            name: leadData.name || null,
            answers: leadData.answers || null,
            ai_recommendation: leadData.ai_recommendation || null,
            created_at: leadData.created_at || new Date().toISOString()
          }
        };

        console.log(`Sending webhook to ${webhook.url}`);

        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(webhook.headers || {})
            },
            body: JSON.stringify(payload)
          });

          const responseText = await response.text();

          // Log the webhook execution
          await supabase.from('webhook_logs').insert({
            webhook_config_id: webhook.id,
            event_type: webhookEventType,
            payload,
            response_status: response.status,
            response_body: responseText.slice(0, 1000),
            success: response.ok
          });

          return { success: response.ok, status: response.status };
        } catch (error) {
          console.error(`Error sending webhook to ${webhook.url}:`, error);
          
          await supabase.from('webhook_logs').insert({
            webhook_config_id: webhook.id,
            event_type: webhookEventType,
            payload,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            success: false
          });

          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    console.log(`Sent ${successCount}/${matchingWebhooks.length} webhooks successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      total: matchingWebhooks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-lead-request-webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
